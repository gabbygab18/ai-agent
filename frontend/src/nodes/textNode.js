import { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { BaseNode } from './BaseNode';
import { useStore } from '../store';
import { Type } from 'lucide-react';

const VAR_REGEX = /\{\{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}\}/g;
const extractVars = (text) => {
  const vars = [], seen = new Set();
  let m; VAR_REGEX.lastIndex = 0;
  while ((m = VAR_REGEX.exec(text)) !== null) {
    if (!seen.has(m[1])) { seen.add(m[1]); vars.push(m[1]); }
  }
  return vars;
};

const MIN_W = 240, CHAR_W = 7.5, LINE_H = 20, PAD = 48;

export const TextNode = ({ id, data }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const [text, setText] = useState(data?.text || '{{input}}');
  const [vars, setVars] = useState([]);
  const [width, setWidth] = useState(MIN_W);
  const [height, setHeight] = useState(80);

  useEffect(() => {
    const lines = text.split('\n');
    const w = Math.max(MIN_W, Math.max(...lines.map(l => l.length)) * CHAR_W + PAD);
    const h = Math.max(80, lines.length * LINE_H + 16);
    setWidth(w);
    setHeight(h);
    setVars(extractVars(text));
    updateNodeField(id, 'text', text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <div style={{ position: 'relative' }}>
      <BaseNode id={id} title="Text" accentColor="#b45309" Icon={Type}
        outputs={[{ id: 'output', label: 'output' }]}
        minWidth={width}
      >
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          className="nodrag"
          style={{
            width: '100%', height,
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            color: 'var(--text-primary)',
            fontSize: 12,
            padding: '5px 8px',
            outline: 'none',
            boxSizing: 'border-box',
            resize: 'none',
            lineHeight: 1.6,
            fontFamily: "'JetBrains Mono', monospace",
            transition: 'border-color 0.15s',
          }}
        />
        {vars.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
            {vars.map(v => (
              <span key={v} style={{
                fontSize: 10,
                background: 'rgba(180,83,9,0.08)',
                border: '1px solid rgba(180,83,9,0.25)',
                borderRadius: 4,
                padding: '2px 6px',
                color: '#b45309',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 500,
              }}>
                {`{{${v}}}`}
              </span>
            ))}
          </div>
        )}
      </BaseNode>

      {vars.map((v, i) => {
        const topPct = vars.length === 1 ? 50 : ((i + 1) / (vars.length + 1)) * 100;
        return (
          <div key={v} style={{ position: 'absolute', top: `${topPct}%`, left: 0, transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <Handle
              type="target"
              position={Position.Left}
              id={`${id}-var-${v}`}
              style={{
                position: 'absolute', top: 0, left: -5,
                width: 9, height: 9,
                background: 'var(--bg-elevated)',
                border: '2px solid #b45309',
                borderRadius: '50%',
                pointerEvents: 'all', cursor: 'crosshair', transform: 'none',
              }}
            />
            <span style={{
              position: 'absolute', top: '50%', transform: 'translateY(-50%)',
              right: '100%', marginRight: 14,
              fontSize: 10, color: 'var(--text-muted)',
              fontWeight: 500, whiteSpace: 'nowrap',
              userSelect: 'none', textAlign: 'right',
            }}>
              {v}
            </span>
          </div>
        );
      })}
    </div>
  );
};
