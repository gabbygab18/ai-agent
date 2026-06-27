import { useState } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { PipelineToolbar } from './toolbar';
import { PipelineUI }      from './ui';
import { SubmitButton }    from './submit';
import { Chat }            from './Chat';
import { useTheme }        from './ThemeContext';
import { Sun, Moon, MessageSquare, GitBranch } from 'lucide-react';

function App() {
  const { theme, toggle } = useTheme();
  const [mode, setMode] = useState('pipeline'); // 'chat' | 'pipeline'

  return (
    <ReactFlowProvider>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-base)', overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{
          height: 52, padding: '0 16px',
          background: 'var(--bg-elevated)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10,
          flexShrink: 0, boxShadow: 'var(--shadow-sm)',
        }}>
          {/* Logo */}
          <img
            src="/gabriel-mark.png"
            alt="Gabriel logo"
            width={22}
            height={22}
            style={{ display: 'block', objectFit: 'contain' }}
          />
          <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14, letterSpacing: -0.3 }}></span>
          <span style={{ color: 'var(--border)', fontSize: 16, fontWeight: 300 }}>|</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Pipeline Builder</span>

          <div style={{ flex: 1 }} />

          {/* Mode toggle */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 9, padding: 3, gap: 2,
          }}>
            {[
              { key: 'chat',     Icon: MessageSquare, label: 'Chat' },
              { key: 'pipeline', Icon: GitBranch,     label: 'Pipeline' },
            ].map(({ key, Icon, label }) => {
              const active = mode === key;
              return (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '4px 12px', borderRadius: 6, border: 'none',
                    background: active ? 'var(--bg-elevated)' : 'transparent',
                    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontSize: 12, fontWeight: active ? 600 : 400,
                    cursor: 'pointer',
                    boxShadow: active ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.15s',
                    fontFamily: "'Inter', system-ui, sans-serif",
                  }}
                >
                  <Icon size={13} strokeWidth={active ? 2.2 : 1.8} />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            style={{
              width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 8, cursor: 'pointer', color: 'var(--text-secondary)',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
          </button>

          <div style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '3px 10px' }}>
            Beta
          </div>
        </div>

        {/* Body */}
        {mode === 'chat' ? (
          /* ── Chat mode ── */
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Chat />
          </div>
        ) : (
          /* ── Pipeline mode ── */
          <>
            <PipelineToolbar />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <PipelineUI />
            </div>
            <SubmitButton />
          </>
        )}
      </div>
    </ReactFlowProvider>
  );
}

export default App;