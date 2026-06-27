import { useState } from 'react';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';
import { Play, X, CheckCircle, XCircle, GitBranch, Share2, Zap, KeyRound, ChevronDown, ChevronUp } from 'lucide-react';

const selector = (s) => ({ nodes: s.nodes, edges: s.edges });

const overlayStyle = {
  position: 'fixed', inset: 0,
  background: 'rgba(26,22,18,0.40)',
  backdropFilter: 'blur(6px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 9999,
  fontFamily: "'Inter', system-ui, sans-serif",
};

const modalBase = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 16,
  boxShadow: 'var(--shadow-lg)',
  overflow: 'hidden',
  animation: 'modalIn 0.18s ease',
};

const closeBtnStyle = {
  background: 'transparent', border: 'none',
  color: 'var(--text-muted)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6,
  transition: 'background 0.15s, color 0.15s',
};

const footerBtnStyle = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text-primary)',
  fontSize: 12,
  fontWeight: 600,
  padding: '7px 18px',
  cursor: 'pointer',
  fontFamily: "'Inter', system-ui, sans-serif",
  transition: 'background 0.15s',
};

/* ── DAG Result Modal ── */
const DagResultModal = ({ result, error, onClose }) => {
  if (!result && !error) return null;
  const isDAG  = result?.is_dag;
  const accent = error ? 'var(--red)' : isDAG ? 'var(--green)' : '#b45309';
  const accentBg = error ? 'var(--red-bg)' : isDAG ? 'var(--green-bg)' : '#fef9f0';
  const accentBorder = error ? '#f5c6c2' : isDAG ? '#c3e6d3' : '#fde4b3';

  return (
    <div onClick={onClose} style={overlayStyle}>
      <div onClick={e => e.stopPropagation()} style={{ ...modalBase, width: 360, borderTop: `3px solid ${accent}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {error
              ? <XCircle size={15} color="var(--red)" />
              : isDAG
                ? <CheckCircle size={15} color="var(--green)" />
                : <XCircle size={15} color="#b45309" />}
            <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14 }}>Pipeline Analysis</span>
          </div>
          <button onClick={onClose} style={closeBtnStyle}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: '16px 18px' }}>
          {error ? (
            <div>
              <p style={{ color: 'var(--red)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{error}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 10, lineHeight: 1.5 }}>
                Make sure the backend is running:<br />
                <code style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>
                  uvicorn main:app --reload
                </code>
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <StatCard icon={<Share2 size={13} />} label="Nodes" value={result.num_nodes} />
                <StatCard icon={<GitBranch size={13} />} label="Edges" value={result.num_edges} />
              </div>
              <div style={{ background: accentBg, border: `1px solid ${accentBorder}`, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                {isDAG
                  ? <CheckCircle size={14} color="var(--green)" style={{ flexShrink: 0, marginTop: 1 }} />
                  : <XCircle    size={14} color="#b45309"      style={{ flexShrink: 0, marginTop: 1 }} />}
                <div>
                  <p style={{ color: accent, fontWeight: 700, fontSize: 12, margin: '0 0 2px' }}>
                    {isDAG ? 'Valid DAG' : 'Cycle Detected'}
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 11, lineHeight: 1.5, margin: 0 }}>
                    {isDAG ? 'No cycles found. This pipeline can be executed safely.' : 'The pipeline contains a cycle and cannot be executed as-is.'}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <div style={{ padding: '10px 18px 14px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={footerBtnStyle}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-surface)'}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value }) => (
  <div style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)' }}>
      {icon}
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</span>
    </div>
    <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</span>
  </div>
);

/* ── API Key Modal ── */
const ApiKeyModal = ({ onRun, onClose }) => {
  const [key, setKey] = useState(() => sessionStorage.getItem('vs_api_key') || '');

  return (
    <div onClick={onClose} style={overlayStyle}>
      <div onClick={e => e.stopPropagation()} style={{ ...modalBase, width: 400, borderTop: '3px solid var(--accent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <KeyRound size={15} color="var(--accent)" />
            <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14 }}>Run Pipeline</span>
          </div>
          <button onClick={onClose} style={closeBtnStyle}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: '16px 18px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.7, margin: '0 0 12px' }}>
            Executing this pipeline will call a real LLM provider for any LLM node.
            Paste your key — it's sent directly to your local backend and never stored on a server.
          </p>
          <div style={{ background: 'var(--green-bg)', border: '1px solid #c3e6d3', borderRadius: 10, padding: '8px 12px', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Zap size={12} color="var(--green)" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ color: 'var(--green)', fontSize: 11, lineHeight: 1.5, margin: 0 }}>
              Pick a <strong>Gemini (free tier)</strong> model in the LLM node to run for free.
              Get a key at <span style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={() => window.open('https://aistudio.google.com', '_blank')}>aistudio.google.com</span> — no card required.
            </p>
          </div>
          <label style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>
            API Key
          </label>
          <input
            type="password"
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="AIza... (Gemini) · sk-... (OpenAI) · sk-ant-... (Anthropic)"
            style={{
              width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8,
              color: 'var(--text-primary)', fontSize: 12, padding: '8px 10px', outline: 'none', boxSizing: 'border-box',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          />
          <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 8, lineHeight: 1.5 }}>
            Provider is auto-detected from the model name in your LLM node.
          </p>
        </div>

        <div style={{ padding: '10px 18px 14px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={footerBtnStyle}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-surface)'}>
            Cancel
          </button>
          <button
            onClick={() => { sessionStorage.setItem('vs_api_key', key); onRun(key); }}
            style={{ ...footerBtnStyle, background: 'var(--accent)', border: 'none', color: '#fff' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}>
            Run Pipeline
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Run Result Modal ── */
const RunResultModal = ({ data, error, onClose }) => {
  const [traceOpen, setTraceOpen] = useState(false);
  if (!data && !error) return null;

  const success = data?.success;
  const hasError = error || (data && !success);
  const accent = hasError ? 'var(--red)' : 'var(--green)';
  const accentBg = hasError ? 'var(--red-bg)' : 'var(--green-bg)';
  const accentBorder = hasError ? '#f5c6c2' : '#c3e6d3';
  const outputs = data?.outputs || {};
  const trace = data?.trace || [];
  const outputEntries = Object.entries(outputs);

  return (
    <div onClick={onClose} style={overlayStyle}>
      <div onClick={e => e.stopPropagation()} style={{ ...modalBase, width: 460, maxHeight: '82vh', display: 'flex', flexDirection: 'column', borderTop: `3px solid ${accent}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 12px', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {hasError ? <XCircle size={15} color="var(--red)" /> : <CheckCircle size={15} color="var(--green)" />}
            <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14 }}>Run Result</span>
          </div>
          <button onClick={onClose} style={closeBtnStyle}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: '16px 18px', overflowY: 'auto', flex: 1 }}>
          <div style={{ background: accentBg, border: `1px solid ${accentBorder}`, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
            {hasError
              ? <XCircle size={14} color="var(--red)" style={{ flexShrink: 0, marginTop: 1 }} />
              : <CheckCircle size={14} color="var(--green)" style={{ flexShrink: 0, marginTop: 1 }} />}
            <p style={{ color: accent, fontSize: 12, lineHeight: 1.6, margin: 0, fontWeight: 600 }}>
              {hasError ? (error || data?.error) : 'Pipeline executed successfully.'}
            </p>
          </div>

          {outputEntries.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', margin: '0 0 8px' }}>
                Output values
              </p>
              {outputEntries.map(([name, value]) => (
                <div key={name} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.2 }}>{name}</span>
                  </div>
                  <p style={{ color: value === null ? 'var(--text-muted)' : 'var(--text-primary)', fontSize: 12, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', fontFamily: value === null ? 'inherit' : "'JetBrains Mono', monospace", wordBreak: 'break-word', fontStyle: value === null ? 'italic' : 'normal' }}>
                    {value === null ? 'null — this branch was not reached' : (typeof value === 'string' ? value : JSON.stringify(value, null, 2))}
                  </p>
                </div>
              ))}
            </div>
          )}

          {trace.length > 0 && (
            <div>
              <button
                onClick={() => setTraceOpen(v => !v)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 11, padding: '7px 12px', cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif", transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-surface)'}
              >
                <span style={{ fontWeight: 500 }}>Execution trace ({trace.length} steps)</span>
                {traceOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {traceOpen && (
                <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {trace.map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, fontSize: 11, padding: '6px 10px', background: 'var(--bg-surface)', borderRadius: 7, borderLeft: `2.5px solid ${step.status === 'error' ? 'var(--red)' : 'var(--green)'}` }}>
                      <span style={{ color: 'var(--text-muted)', flexShrink: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>{step.type}</span>
                      <span style={{ color: 'var(--text-secondary)', wordBreak: 'break-word' }}>{step.detail}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: '10px 18px 14px', display: 'flex', justifyContent: 'flex-end', flexShrink: 0, borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={onClose} style={footerBtnStyle}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-surface)'}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Bottom Bar ── */
export const SubmitButton = () => {
  const { nodes, edges } = useStore(selector, shallow);
  const [loading,      setLoading]      = useState(false);
  const [result,       setResult]       = useState(null);
  const [error,        setError]        = useState(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [runLoading,   setRunLoading]   = useState(false);
  const [runData,      setRunData]      = useState(null);
  const [runError,     setRunError]     = useState(null);

  const handleSubmit = async () => {
    setLoading(true); setResult(null); setError(null);
    try {
      const res = await fetch('http://localhost:8000/pipelines/parse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nodes, edges }) });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      setResult(await res.json());
    } catch (err) { setError(`Could not reach backend.\n\n${err.message}`); }
    finally { setLoading(false); }
  };

  const handleRun = async (apiKey) => {
    setShowKeyModal(false); setRunLoading(true); setRunData(null); setRunError(null);
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 75000);
    try {
      const res = await fetch('http://localhost:8000/pipelines/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nodes, edges, api_key: apiKey || null }), signal: controller.signal });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      setRunData(await res.json());
    } catch (err) {
      setRunError(err.name === 'AbortError' ? 'Request timed out after 75s. Check that the backend is running on http://localhost:8000.' : `Could not reach backend.\n\n${err.message}`);
    } finally { clearTimeout(tid); setRunLoading(false); }
  };

  const btnBase = {
    display: 'flex', alignItems: 'center', gap: 7,
    color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
    letterSpacing: -0.1, fontFamily: "'Inter', system-ui, sans-serif",
    transition: 'background 0.15s, box-shadow 0.15s',
  };

  return (
    <>
      <DagResultModal result={result} error={error} onClose={() => { setResult(null); setError(null); }} />
      {showKeyModal && <ApiKeyModal onRun={handleRun} onClose={() => setShowKeyModal(false)} />}
      <RunResultModal data={runData} error={runError} onClose={() => { setRunData(null); setRunError(null); }} />

      <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)', flexShrink: 0, boxShadow: '0 -1px 4px rgba(0,0,0,0.06)' }}>
        <button onClick={handleSubmit} disabled={loading} style={{ ...btnBase, background: loading ? '#9e9892' : '#6b6560', opacity: loading ? 0.8 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#4a4540'; }}
          onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#6b6560'; }}>
          {loading ? <span style={{ width: 13, height: 13, border: '2px solid #ffffff60', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> : <GitBranch size={13} strokeWidth={2.5} />}
          {loading ? 'Analyzing…' : 'Submit Pipeline'}
        </button>

        <button onClick={() => setShowKeyModal(true)} disabled={runLoading} style={{ ...btnBase, background: runLoading ? '#a8785e' : 'var(--accent)', opacity: runLoading ? 0.8 : 1, cursor: runLoading ? 'not-allowed' : 'pointer', boxShadow: '0 2px 10px var(--accent-glow)' }}
          onMouseEnter={e => { if (!runLoading) { e.currentTarget.style.background = 'var(--accent-hover)'; e.currentTarget.style.boxShadow = '0 4px 16px #c9644240'; } }}
          onMouseLeave={e => { if (!runLoading) { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 2px 10px var(--accent-glow)'; } }}>
          {runLoading ? <span style={{ width: 13, height: 13, border: '2px solid #ffffff60', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> : <Play size={13} strokeWidth={2.5} />}
          {runLoading ? 'Running…' : 'Run Pipeline'}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
};
