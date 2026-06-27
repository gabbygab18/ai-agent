import { useCallback } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';

export const BaseNode = ({
  id,
  title,
  accentColor = 'var(--accent)',
  Icon = null,
  inputs  = [],
  outputs = [],
  children,
  minWidth = 228,
  bodyStyle = {},
}) => {
  const { deleteElements } = useReactFlow();

  const handleDelete = useCallback(
    (e) => {
      e.stopPropagation();
      deleteElements({ nodes: [{ id }] });
    },
    [id, deleteElements],
  );

  const mkHandle = (h, index, total, type) => {
    const isLeft = type === 'target';
    const topPct = total === 1 ? 50 : ((index + 1) / (total + 1)) * 100;

    return (
      <div key={h.id} style={{ position: 'absolute', top: `${topPct}%`, [isLeft ? 'left' : 'right']: 0, transform: 'translateY(-50%)', pointerEvents: 'none' }}>
        <Handle
          type={type}
          position={isLeft ? Position.Left : Position.Right}
          id={`${id}-${h.id}`}
          style={{
            position: 'absolute',
            top: 0,
            [isLeft ? 'left' : 'right']: -5,
            width: 9,
            height: 9,
            background: 'var(--bg-elevated)',
            border: `2px solid ${accentColor}`,
            borderRadius: '50%',
            pointerEvents: 'all',
            cursor: 'crosshair',
            transform: 'none',
            boxShadow: 'var(--shadow-sm)',
            ...(h.style || {}),
          }}
        />
        {h.label && (
          <span style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            ...(isLeft
              ? { right: '100%', marginRight: 14, textAlign: 'right' }
              : { left: '100%',  marginLeft: 14,  textAlign: 'left'  }
            ),
            fontSize: 10,
            color: 'var(--text-muted)',
            fontWeight: 500,
            letterSpacing: 0.2,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            userSelect: 'none',
          }}>
            {h.label}
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        minWidth,
        background: 'var(--bg-node)',
        border: '1px solid var(--border)',
        borderTop: `2.5px solid ${accentColor}`,
        borderRadius: 12,
        boxShadow: 'var(--shadow-sm)',
        fontFamily: "'Inter', system-ui, sans-serif",
        position: 'relative',
        userSelect: 'none',
        transition: 'box-shadow 0.15s',
        overflow: 'visible',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 10px 8px 12px',
        borderBottom: '1px solid var(--border-subtle)',
        gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {Icon && (
            <span style={{ color: accentColor, display: 'flex', alignItems: 'center' }}>
              <Icon size={13} strokeWidth={2} />
            </span>
          )}
          <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 12, letterSpacing: -0.1 }}>
            {title}
          </span>
        </div>

        <button
          onClick={handleDelete}
          title="Remove node"
          className="nodrag"
          style={{
            width: 20, height: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent',
            border: '1px solid transparent',
            borderRadius: 5,
            color: 'var(--text-muted)',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'background 0.15s, color 0.15s, border-color 0.15s',
            padding: 0,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--red-bg)';
            e.currentTarget.style.color = 'var(--red)';
            e.currentTarget.style.borderColor = '#f5c6c2';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '10px 12px 12px', position: 'relative', ...bodyStyle }}>
        {children}
      </div>

      {inputs.map((h, i)  => mkHandle(h, i, inputs.length,  'target'))}
      {outputs.map((h, i) => mkHandle(h, i, outputs.length, 'source'))}
    </div>
  );
};

/* ── Shared field components ── */

const labelStyle = {
  display: 'block',
  fontSize: 10,
  color: 'var(--text-muted)',
  fontWeight: 600,
  letterSpacing: 0.4,
  textTransform: 'uppercase',
  marginBottom: 4,
};

const inputBase = {
  width: '100%',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  color: 'var(--text-primary)',
  fontSize: 12,
  padding: '5px 8px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: "'Inter', system-ui, sans-serif",
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

export const FieldText = ({ label, value, onChange, placeholder = '' }) => (
  <div style={{ marginBottom: 8 }}>
    {label && <label style={labelStyle}>{label}</label>}
    <input type="text" value={value} onChange={onChange} placeholder={placeholder} style={inputBase} className="nodrag" />
  </div>
);

export const FieldSelect = ({ label, value, onChange, options = [] }) => (
  <div style={{ marginBottom: 8 }}>
    {label && <label style={labelStyle}>{label}</label>}
    <select value={value} onChange={onChange} className="nodrag" style={{
      ...inputBase, cursor: 'pointer', appearance: 'none',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%239e9892'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
    }}>
      {options.map((o) => (
        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
      ))}
    </select>
  </div>
);

export const FieldTextarea = ({ label, value, onChange, placeholder = '', style = {} }) => (
  <div style={{ marginBottom: 8 }}>
    {label && <label style={labelStyle}>{label}</label>}
    <textarea
      value={value} onChange={onChange} placeholder={placeholder} className="nodrag"
      style={{ ...inputBase, resize: 'none', lineHeight: 1.6, fontFamily: "'JetBrains Mono', monospace", ...style }}
    />
  </div>
);

export const NodeInfo = ({ children }) => (
  <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, margin: '2px 0 0' }}>{children}</p>
);
