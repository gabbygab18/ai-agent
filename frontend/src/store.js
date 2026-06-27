import { create } from "zustand";
import {
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
    MarkerType,
  } from 'reactflow';

/* ─────────────────────────────────────────────
   Sample Pipeline: "Customer Support AI Bot"

   [Input: user_question] ──┐
   [Input: customer_name] ──► [Text: prompt template] ──► [LLM] ──► [Filter] ──► [Output: reply]
                                                                              └──► [Output: escalate_to_human]
───────────────────────────────────────────── */

const PROMPT = `You are a helpful customer support agent.
Customer: {{customer_name}}
Question: {{user_question}}

Respond in a friendly and concise manner.`;

const sampleNodes = [
  {
    id: 'customInput-1',
    type: 'customInput',
    position: { x: 60, y: 100 },
    data: { id: 'customInput-1', nodeType: 'customInput', inputName: 'user_question', inputType: 'Text' },
  },
  {
    id: 'customInput-2',
    type: 'customInput',
    position: { x: 60, y: 280 },
    data: { id: 'customInput-2', nodeType: 'customInput', inputName: 'customer_name', inputType: 'Text' },
  },
  {
    id: 'text-1',
    type: 'text',
    position: { x: 320, y: 160 },
    // TextNode reads data?.text — must use exactly this key
    data: { id: 'text-1', nodeType: 'text', text: PROMPT },
  },
  {
    id: 'llm-1',
    type: 'llm',
    position: { x: 660, y: 180 },
    data: { id: 'llm-1', nodeType: 'llm' },
  },
  {
    id: 'filter-1',
    type: 'filter',
    position: { x: 920, y: 180 },
    // FilterNode reads data?.field, data?.op, data?.value
    data: { id: 'filter-1', nodeType: 'filter', field: 'confidence', op: 'greater than', value: '0.7' },
  },
  {
    id: 'customOutput-1',
    type: 'customOutput',
    position: { x: 1180, y: 80 },
    // OutputNode reads data?.outputName — must use exactly this key
    data: { id: 'customOutput-1', nodeType: 'customOutput', outputName: 'reply', outputType: 'Text' },
  },
  {
    id: 'customOutput-2',
    type: 'customOutput',
    position: { x: 1180, y: 300 },
    data: { id: 'customOutput-2', nodeType: 'customOutput', outputName: 'escalate_to_human', outputType: 'Text' },
  },
];

const edge = (id, source, sourceHandle, target, targetHandle) => ({
  id,
  source, sourceHandle,
  target, targetHandle,
  type: 'smoothstep',
  animated: true,
  markerEnd: { type: MarkerType.Arrow, height: '20px', width: '20px' },
});

const sampleEdges = [
  // Inputs → Text node variable handles (TextNode creates handle id: `${id}-var-${varName}`)
  edge('e1', 'customInput-1', 'customInput-1-value', 'text-1', 'text-1-var-user_question'),
  edge('e2', 'customInput-2', 'customInput-2-value', 'text-1', 'text-1-var-customer_name'),
  // Text → LLM prompt (BaseNode handle id: `${id}-${h.id}`)
  edge('e3', 'text-1', 'text-1-output', 'llm-1', 'llm-1-prompt'),
  // LLM → Filter
  edge('e4', 'llm-1', 'llm-1-response', 'filter-1', 'filter-1-data'),
  // Filter branches → Outputs
  edge('e5', 'filter-1', 'filter-1-pass', 'customOutput-1', 'customOutput-1-value'),
  edge('e6', 'filter-1', 'filter-1-fail', 'customOutput-2', 'customOutput-2-value'),
];

const nodeIDCounts = { customInput: 2, text: 1, llm: 1, filter: 1, customOutput: 2 };

export const useStore = create((set, get) => ({
    nodes: sampleNodes,
    edges: sampleEdges,
    nodeIDs: nodeIDCounts,

    getNodeID: (type) => {
        const newIDs = { ...get().nodeIDs };
        if (newIDs[type] === undefined) newIDs[type] = 0;
        newIDs[type] += 1;
        set({ nodeIDs: newIDs });
        return `${type}-${newIDs[type]}`;
    },
    addNode: (node) => {
        set({ nodes: [...get().nodes, node] });
    },
    onNodesChange: (changes) => {
        set({ nodes: applyNodeChanges(changes, get().nodes) });
    },
    onEdgesChange: (changes) => {
        set({ edges: applyEdgeChanges(changes, get().edges) });
    },
    onConnect: (connection) => {
        set({
            edges: addEdge({
                ...connection,
                type: 'smoothstep',
                animated: true,
                markerEnd: { type: MarkerType.Arrow, height: '20px', width: '20px' },
            }, get().edges),
        });
    },
    updateNodeField: (nodeId, fieldName, fieldValue) => {
        set({
            nodes: get().nodes.map((node) => {
                if (node.id === nodeId) node.data = { ...node.data, [fieldName]: fieldValue };
                return node;
            }),
        });
    },
}));
