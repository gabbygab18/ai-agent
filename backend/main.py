# main.py — VectorShift backend
import re
from collections import defaultdict, deque
from typing import Any, Optional

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Allow requests from the React dev server, plus any Vercel deployment
# (production + preview deploys both use *.vercel.app subdomains with
# unpredictable hashes, so we match them with a regex instead of listing
# every URL by hand). Add a custom domain to allow_origins below if you
# attach one in Vercel's project settings.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_methods=["*"],
    allow_headers=["*"],
)


class Pipeline(BaseModel):
    nodes: list[Any]
    edges: list[Any]


class ChatTurn(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class RunRequest(BaseModel):
    nodes: list[Any]
    edges: list[Any]
    api_key: Optional[str] = None
    provider: Optional[str] = None  # "openai" | "anthropic" — auto-detected from model if omitted
    history: Optional[list[ChatTurn]] = None  # prior turns, oldest first, NOT including the current message


VAR_REGEX = re.compile(r"\{\{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}\}")


# ───────────────────────── DAG validation (existing) ─────────────────────────

def is_dag(nodes: list, edges: list) -> bool:
    """Return True if the node+edge set forms a directed acyclic graph."""
    node_ids = {n["id"] for n in nodes}

    adj = defaultdict(list)
    in_degree = defaultdict(int)
    for node_id in node_ids:
        in_degree[node_id] = 0

    for edge in edges:
        src = edge.get("source")
        tgt = edge.get("target")
        if src in node_ids and tgt in node_ids:
            adj[src].append(tgt)
            in_degree[tgt] += 1

    queue = deque([n for n in node_ids if in_degree[n] == 0])
    visited = 0
    while queue:
        node = queue.popleft()
        visited += 1
        for neighbour in adj[node]:
            in_degree[neighbour] -= 1
            if in_degree[neighbour] == 0:
                queue.append(neighbour)

    return visited == len(node_ids)


@app.get("/")
def read_root():
    return {"Ping": "Pong"}


@app.post("/pipelines/parse")
def parse_pipeline(pipeline: Pipeline):
    num_nodes = len(pipeline.nodes)
    num_edges = len(pipeline.edges)
    dag = is_dag(pipeline.nodes, pipeline.edges)
    return {"num_nodes": num_nodes, "num_edges": num_edges, "is_dag": dag}


# ───────────────────────── Execution engine ─────────────────────────

class GraphError(Exception):
    pass


def build_graph(nodes: list, edges: list):
    """Build helper lookups: node by id, incoming edges by (target, target_handle),
    topological order via Kahn's algorithm."""
    node_by_id = {n["id"]: n for n in nodes}
    node_ids = set(node_by_id.keys())

    # incoming[target_node_id][target_handle_suffix] = (source_node_id, source_handle_suffix)
    incoming = defaultdict(dict)
    adj = defaultdict(list)
    in_degree = defaultdict(int)
    for nid in node_ids:
        in_degree[nid] = 0

    for e in edges:
        src, tgt = e.get("source"), e.get("target")
        if src not in node_ids or tgt not in node_ids:
            continue
        src_handle = e.get("sourceHandle") or ""
        tgt_handle = e.get("targetHandle") or ""
        # Handle ids are formatted like "<nodeId>-<portName>" (or "<nodeId>-var-<name>" for Text vars)
        src_port = src_handle[len(src) + 1:] if src_handle.startswith(src + "-") else src_handle
        tgt_port = tgt_handle[len(tgt) + 1:] if tgt_handle.startswith(tgt + "-") else tgt_handle
        incoming[tgt][tgt_port] = (src, src_port)
        adj[src].append(tgt)
        in_degree[tgt] += 1

    queue = deque([n for n in node_ids if in_degree[n] == 0])
    order = []
    in_deg_copy = dict(in_degree)
    while queue:
        nid = queue.popleft()
        order.append(nid)
        for neighbour in adj[nid]:
            in_deg_copy[neighbour] -= 1
            if in_deg_copy[neighbour] == 0:
                queue.append(neighbour)

    if len(order) != len(node_ids):
        raise GraphError("Pipeline is not a valid DAG (cycle detected) — cannot execute.")

    return node_by_id, incoming, order


def get_input(incoming, node_id, port, outputs):
    """Resolve the value feeding into node_id's `port`, from a previously-computed output."""
    src = incoming.get(node_id, {}).get(port)
    if src is None:
        return None
    src_node, src_port = src
    return outputs.get(src_node, {}).get(src_port)


def coerce_num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def eval_condition(value, op, compare):
    if op == "equals":
        return str(value) == str(compare)
    if op == "not equals":
        return str(value) != str(compare)
    if op == "contains":
        return str(compare) in str(value)
    if op == "greater than":
        a, b = coerce_num(value), coerce_num(compare)
        return (a is not None and b is not None and a > b)
    if op == "less than":
        a, b = coerce_num(value), coerce_num(compare)
        return (a is not None and b is not None and a < b)
    return False


async def call_llm(prompt: str, system: Optional[str], model: str, temperature: float,
                    max_tokens: int, api_key: Optional[str], provider: Optional[str],
                    history: Optional[list] = None):
    if not api_key:
        raise GraphError("No API key provided — add one in the Run dialog to execute LLM nodes.")

    history = history or []  # list of {"role": "user"|"assistant", "content": str}, oldest first

    detected_provider = provider or ("anthropic" if model.startswith("claude") else
                                      "google" if model.startswith("gemini") else "openai")

    async with httpx.AsyncClient(timeout=60.0) as client:
        if detected_provider == "anthropic":
            messages = [{"role": h["role"], "content": h["content"]} for h in history]
            messages.append({"role": "user", "content": prompt})
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": model,
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                    "system": system or "",
                    "messages": messages,
                },
            )
            if resp.status_code >= 400:
                raise GraphError(f"Anthropic API error ({resp.status_code}): {resp.text[:300]}")
            data = resp.json()
            return "".join(b.get("text", "") for b in data.get("content", []) if b.get("type") == "text")

        elif detected_provider == "openai":
            messages = []
            if system:
                messages.append({"role": "system", "content": system})
            messages.extend({"role": h["role"], "content": h["content"]} for h in history)
            messages.append({"role": "user", "content": prompt})
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "content-type": "application/json"},
                json={
                    "model": model,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    "messages": messages,
                },
            )
            if resp.status_code >= 400:
                raise GraphError(f"OpenAI API error ({resp.status_code}): {resp.text[:300]}")
            data = resp.json()
            return data["choices"][0]["message"]["content"]

        elif detected_provider == "google":
            contents = [
                {"role": ("model" if h["role"] == "assistant" else "user"), "parts": [{"text": h["content"]}]}
                for h in history
            ]
            contents.append({"role": "user", "parts": [{"text": prompt}]})
            payload = {
                "contents": contents,
                "generationConfig": {
                    "temperature": temperature,
                    "maxOutputTokens": max_tokens,
                },
            }
            if system:
                payload["system_instruction"] = {"parts": [{"text": system}]}
            resp = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                headers={"x-goog-api-key": api_key, "content-type": "application/json"},
                json=payload,
            )
            if resp.status_code >= 400:
                raise GraphError(f"Gemini API error ({resp.status_code}): {resp.text[:300]}")
            data = resp.json()
            try:
                candidate = data["candidates"][0]
                parts = candidate.get("content", {}).get("parts", [])
                return "".join(p.get("text", "") for p in parts)
            except (KeyError, IndexError):
                finish_reason = data.get("candidates", [{}])[0].get("finishReason", "unknown")
                raise GraphError(f"Gemini returned no text (finishReason: {finish_reason}).")

        else:
            raise GraphError(f"Unsupported provider/model for execution: {model}")


async def run_pipeline(nodes: list, edges: list, api_key: Optional[str], provider: Optional[str],
                        history: Optional[list] = None):
    node_by_id, incoming, order = build_graph(nodes, edges)
    outputs: dict[str, dict[str, Any]] = {}
    trace: list[dict[str, Any]] = []
    final_outputs: dict[str, Any] = {}

    for nid in order:
        node = node_by_id[nid]
        ntype = node.get("type")
        data = node.get("data", {}) or {}
        result: dict[str, Any] = {}
        step = {"id": nid, "type": ntype, "status": "ok"}

        try:
            if ntype == "customInput":
                value = data.get("value", "")
                result["value"] = value
                step["detail"] = f"value = {value!r}"

            elif ntype == "text":
                text = data.get("text", "") or ""
                # Resolve each {{var}} from its connected handle, else leave as literal text
                rendered = text
                for m in set(VAR_REGEX.findall(text)):
                    port = f"var-{m}"
                    val = get_input(incoming, nid, port, outputs)
                    rendered = rendered.replace("{{" + m + "}}", "" if val is None else str(val))
                result["output"] = rendered
                step["detail"] = rendered[:160]

            elif ntype == "llm":
                system = get_input(incoming, nid, "system", outputs)
                prompt = get_input(incoming, nid, "prompt", outputs)
                if prompt is None:
                    raise GraphError("LLM node has no prompt input connected.")
                model = data.get("model", "gpt-4o")
                temperature = float(data.get("temperature", 0.7))
                max_tokens = int(data.get("maxTokens", 1024))
                response = await call_llm(prompt, system, model, temperature, max_tokens, api_key, provider, history)
                result["response"] = response
                step["detail"] = response[:160]

            elif ntype == "filter":
                value = get_input(incoming, nid, "data", outputs)
                field = data.get("field", "")
                op = data.get("op", "equals")
                compare = data.get("value", "")
                check_value = value
                if isinstance(value, dict) and field in value:
                    check_value = value[field]
                passed = eval_condition(check_value, op, compare)
                if passed:
                    result["pass"] = value
                else:
                    result["fail"] = value
                step["detail"] = f"{check_value!r} {op} {compare!r} -> {'pass' if passed else 'fail'}"

            elif ntype == "transform":
                value = get_input(incoming, nid, "input", outputs)
                expr = data.get("expression", "") or ""
                out = value
                if isinstance(value, str):
                    if "toUpperCase" in expr:
                        out = value.upper()
                    elif "toLowerCase" in expr:
                        out = value.lower()
                    if "trim" in expr:
                        out = out.strip() if isinstance(out, str) else out
                result["output"] = out
                step["detail"] = f"applied {expr!r}"

            elif ntype == "merge":
                a = get_input(incoming, nid, "a", outputs)
                b = get_input(incoming, nid, "b", outputs)
                strategy = data.get("strategy", "concat")
                if strategy == "concat":
                    merged = f"{a or ''}{b or ''}"
                elif strategy == "zip":
                    merged = [a, b]
                elif strategy == "merge objects":
                    merged = {**(a or {}), **(b or {})} if isinstance(a, dict) and isinstance(b, dict) else [a, b]
                else:  # first non-null
                    merged = a if a is not None else b
                result["result"] = merged
                step["detail"] = f"{strategy} -> {str(merged)[:120]}"

            elif ntype == "api":
                body = get_input(incoming, nid, "body", outputs)
                url = data.get("url", "")
                method = data.get("method", "GET")
                auth = data.get("authKey", "")
                headers = {"Authorization": auth} if auth else {}
                async with httpx.AsyncClient(timeout=30.0) as client:
                    try:
                        resp = await client.request(
                            method, url, headers=headers,
                            json=body if isinstance(body, (dict, list)) else None,
                            content=body if isinstance(body, str) else None,
                        )
                        result["response"] = resp.text[:2000]
                        step["detail"] = f"{method} {url} -> {resp.status_code}"
                    except Exception as exc:
                        result["error"] = str(exc)
                        step["detail"] = f"{method} {url} -> error: {exc}"

            elif ntype == "customOutput":
                value = get_input(incoming, nid, "value", outputs)
                name = data.get("outputName", nid)
                final_outputs[name] = value
                step["detail"] = f"{name} = {str(value)[:160]}"

            elif ntype == "note":
                step["detail"] = "note (no-op)"

            else:
                step["detail"] = "unrecognized node type - skipped"

        except GraphError as exc:
            step["status"] = "error"
            step["detail"] = str(exc)
            outputs[nid] = result
            trace.append(step)
            raise

        outputs[nid] = result
        trace.append(step)

    return final_outputs, trace


@app.post("/pipelines/run")
async def run_pipeline_endpoint(req: RunRequest):
    try:
        history = [h.model_dump() for h in (req.history or [])]
        outputs, trace = await run_pipeline(req.nodes, req.edges, req.api_key, req.provider, history)
        return {"success": True, "outputs": outputs, "trace": trace}
    except GraphError as exc:
        return {"success": False, "error": str(exc), "trace": []}
    except Exception as exc:  # noqa: BLE001 - surface any unexpected error to the UI instead of failing silently
        return {"success": False, "error": f"Unexpected error: {exc}", "trace": []}