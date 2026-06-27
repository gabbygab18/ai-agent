import { useState, useRef, useEffect } from 'react';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';
import { Send, User, Loader, AlertCircle, Zap, Key } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const selector = (s) => ({ nodes: s.nodes, edges: s.edges });

const findInputNodes = (nodes) =>
  nodes.filter(n => n.type === 'customInput');

const findOutputNodes = (nodes) =>
  nodes.filter(n => n.type === 'customOutput');

export const Chat = () => {
  const { nodes, edges } = useStore(selector, shallow);
  const [messages, setMessages]   = useState([
    {
      role: 'assistant',
      content: "Hi! I'm powered by your pipeline. Ask me anything and I'll process it through your nodes.",
      id: 0,
    }
  ]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [apiKey, setApiKey]       = useState(() => sessionStorage.getItem('vs_api_key') || '');
  const [showKeyBar, setShowKeyBar] = useState(false);
  const [error, setError]         = useState(null);
  const bottomRef                 = useRef(null);
  const textareaRef               = useRef(null);
  const msgId                     = useRef(1);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [input]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    setError(null);

    // Add user message
    const uid = msgId.current++;
    setMessages(prev => [...prev, { role: 'user', content: text, id: uid }]);

    // Figure out which input node gets the message
    // Priority: node named 'user_question', 'message', 'input', or first input node
    const inputNodes = findInputNodes(nodes);
    const msgNode = inputNodes.find(n =>
      ['user_question','message','input','query','prompt'].includes(n.data?.inputName?.toLowerCase())
    ) || inputNodes[0];

    if (!msgNode) {
      setMessages(prev => [...prev, {
        role: 'assistant', content: '⚠️ No Input node found in your pipeline. Add an Input node to get started.',
        id: msgId.current++, isError: true,
      }]);
      return;
    }

    // Build nodes with the user's message injected into the primary input node
    const runtimeNodes = nodes.map(n => {
      if (n.id === msgNode.id) {
        return { ...n, data: { ...n.data, value: text } };
      }
      return n;
    });

    setLoading(true);
    try {
      const key = apiKey || sessionStorage.getItem('vs_api_key') || '';
      // NOTE: `messages` here is intentionally the closure value captured before the
      // setMessages() call above — i.e. it does NOT yet include the user message we just
      // added. That's correct: `history` should be everything that happened BEFORE this
      // turn, since the current turn's text is sent separately as the prompt.
      const history = messages
        .filter(m => !m.isError && m.id !== 0)
        .map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('http://localhost:8000/pipelines/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: runtimeNodes, edges, api_key: key || null, history }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();

      if (!data.success) throw new Error(data.error || 'Pipeline failed');

      // Pick the best output to show
      // Priority: node named 'reply', 'response', 'output', or first non-null, non-empty output
      const outputs = data.outputs || {};
      const outputNodes = findOutputNodes(nodes);
      let reply = null;

      const hasContent = (v) => v != null && String(v).trim() !== '';

      const preferred = ['reply', 'response', 'output', 'answer', 'result'];
      for (const name of preferred) {
        if (hasContent(outputs[name])) { reply = outputs[name]; break; }
      }
      // Fallback: first non-empty output
      if (reply == null) {
        for (const n of outputNodes) {
          const name = n.data?.outputName;
          if (name && hasContent(outputs[name])) { reply = outputs[name]; break; }
        }
      }
      // Last resort: show all outputs, or flag that everything came back empty
      if (reply == null) {
        const entries = Object.entries(outputs).filter(([, v]) => hasContent(v));
        reply = entries.length > 0
          ? entries.map(([k, v]) => `**${k}:** ${v}`).join('\n\n')
          : '⚠️ The pipeline ran successfully but every output was empty. Check your node logic (e.g. a filter or escalation branch may be intercepting this message before it reaches the reply output).';
      }

      setMessages(prev => [...prev, {
        role: 'assistant', content: String(reply), id: msgId.current++,
        isError: reply.toString().startsWith('⚠️ The pipeline ran successfully but every output was empty'),
      }]);
    } catch (err) {
      const msg = err.message?.includes('fetch') || err.message?.includes('Failed')
        ? 'Could not reach the backend. Make sure `uvicorn main:app --reload` is running.'
        : err.message;
      setError(msg);
      setMessages(prev => [...prev, { role: 'assistant', content: msg, id: msgId.current++, isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const inputNodeNames = findInputNodes(nodes).map(n => n.data?.inputName || n.id);
  const outputNodeNames = findOutputNodes(nodes).map(n => n.data?.outputName || n.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-base)' }}>

      {/* Pipeline info bar */}
      <div style={{
        padding: '8px 20px',
        background: 'var(--bg-elevated)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={12} color="var(--accent)" />
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>Pipeline</span>
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {inputNodeNames.map(n => (
            <span key={n} style={{ fontSize: 10, padding: '2px 7px', background: 'var(--accent-soft)', border: '1px solid rgba(201,100,66,0.2)', borderRadius: 20, color: 'var(--accent)', fontWeight: 600 }}>
              ↳ {n}
            </span>
          ))}
          {outputNodeNames.map(n => (
            <span key={n} style={{ fontSize: 10, padding: '2px 7px', background: 'var(--green-bg)', border: '1px solid var(--green-border)', borderRadius: 20, color: 'var(--green)', fontWeight: 600 }}>
              {n} ↴
            </span>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        {/* API key inline */}
        <button
          onClick={() => setShowKeyBar(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 11, color: apiKey ? 'var(--green)' : 'var(--text-muted)',
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: 6, padding: '3px 10px', cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <Key size={12} />
          {apiKey ? 'Key set' : 'Set API key'}
        </button>
      </div>

      {/* API key bar */}
      {showKeyBar && (
        <div style={{
          padding: '10px 20px', background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0,
        }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>API Key</span>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            onBlur={() => { sessionStorage.setItem('vs_api_key', apiKey); }}
            placeholder="AIza... (Gemini free) · sk-... (OpenAI) · sk-ant-... (Anthropic)"
            style={{
              flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 6, color: 'var(--text-primary)', fontSize: 12,
              padding: '5px 10px', outline: 'none', fontFamily: "'JetBrains Mono', monospace",
            }}
          />
          <button
            onClick={() => { sessionStorage.setItem('vs_api_key', apiKey); setShowKeyBar(false); }}
            style={{
              background: 'var(--accent)', color: '#fff', border: 'none',
              borderRadius: 6, padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Save
          </button>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 0' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {messages.map(msg => (
            <Message key={msg.id} msg={msg} />
          ))}
          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ padding: '8px 20px', background: 'var(--red-bg)', borderTop: '1px solid var(--red-border)', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <AlertCircle size={13} color="var(--red)" />
          <span style={{ fontSize: 12, color: 'var(--red)' }}>{error}</span>
        </div>
      )}

      {/* Input area */}
      <div style={{ padding: '16px 20px', background: 'var(--bg-base)', flexShrink: 0 }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--bg-elevated)',
            border: '1.5px solid var(--text-muted)',
            borderRadius: 14,
            padding: '10px 12px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05)',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
            onFocusCapture={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }}
            onBlurCapture={e => { e.currentTarget.style.borderColor = 'var(--text-muted)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05)'; }}
          >
            <textarea
              ref={textareaRef}
              className="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Message your pipeline… (Enter to send, Shift+Enter for newline)"
              rows={1}
              style={{
                flex: 1, resize: 'none', border: 'none', outline: 'none', boxShadow: 'none',
                background: 'transparent', color: 'var(--text-primary)',
                fontSize: 14, lineHeight: 1.6,
                fontFamily: "'Inter', system-ui, sans-serif",
                maxHeight: 160, overflowY: 'auto',
                padding: '4px 0', display: 'block', verticalAlign: 'middle',
              }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              style={{
                width: 34, height: 34, flexShrink: 0,
                background: input.trim() && !loading ? 'var(--accent)' : 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 9, cursor: input.trim() && !loading ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: input.trim() && !loading ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
            >
              {loading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
            Your message feeds into the pipeline's input nodes. Switch to Pipeline mode to edit the flow.
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const Message = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexDirection: isUser ? 'row-reverse' : 'row' }}>
      {/* Avatar */}
      <div style={{
        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
        background: isUser ? 'var(--accent)' : 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {isUser
          ? <User size={14} color="#fff" />
          : <img src="/gabriel-mark.png" alt="Gabriel" width={16} height={16} style={{ display: 'block', objectFit: 'contain' }} />
        }
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth: '78%',
        background: isUser ? 'var(--accent)' : 'var(--bg-elevated)',
        border: isUser ? 'none' : '1px solid var(--border)',
        borderRadius: isUser ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
        padding: '10px 14px',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div
          className="chat-markdown"
          style={{
            fontSize: 14, lineHeight: 1.7,
            color: isUser ? '#fff' : (msg.isError ? 'var(--red)' : 'var(--text-primary)'),
            wordBreak: 'break-word',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          <style>{`.chat-markdown > *:last-child { margin-bottom: 0 !important; }`}</style>
          {isUser ? (
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
          ) : (
            <ReactMarkdown
              components={{
                p: ({ node, ...props }) => <p style={{ margin: '0 0 8px 0' }} {...props} />,
                strong: ({ node, ...props }) => <strong style={{ fontWeight: 700 }} {...props} />,
                em: ({ node, ...props }) => <em style={{ fontStyle: 'italic' }} {...props} />,
                ul: ({ node, ...props }) => <ul style={{ margin: '4px 0 8px 0', paddingLeft: 20 }} {...props} />,
                ol: ({ node, ...props }) => <ol style={{ margin: '4px 0 8px 0', paddingLeft: 20 }} {...props} />,
                li: ({ node, ...props }) => <li style={{ margin: '2px 0' }} {...props} />,
                code: ({ node, ...props }) => (
                  <code style={{
                    background: 'var(--bg-surface)', padding: '1px 5px', borderRadius: 4,
                    fontSize: 13, fontFamily: "'JetBrains Mono', monospace",
                  }} {...props} />
                ),
                a: ({ node, children, ...props }) => (
                  <a style={{ color: 'var(--accent)' }} target="_blank" rel="noreferrer" {...props}>{children}</a>
                ),
              }}
            >
              {msg.content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
};

const TypingIndicator = () => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
    <div style={{
      width: 30, height: 30, borderRadius: '50%',
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <img src="/gabriel-mark.png" alt="Gabriel" width={16} height={16} style={{ display: 'block', objectFit: 'contain' }} />
    </div>
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: '4px 14px 14px 14px', padding: '12px 16px',
      display: 'flex', gap: 4, alignItems: 'center',
    }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--text-muted)',
          animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
    <style>{`
      @keyframes bounce {
        0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
        40% { transform: translateY(-5px); opacity: 1; }
      }
    `}</style>
  </div>
);