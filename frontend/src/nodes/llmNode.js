import { useState } from 'react';
import { BaseNode, FieldSelect } from './BaseNode';
import { useStore } from '../store';
import { BrainCircuit, ChevronDown, ChevronUp } from 'lucide-react';

const MODELS = [
  { value: 'gemini-2.5-flash',  label: 'Gemini 2.5 Flash (free tier)' },
  { value: 'gemini-2.0-flash',  label: 'Gemini 2.0 Flash (free tier)' },
  { value: 'gpt-4o',            label: 'GPT-4o' },
  { value: 'gpt-4o-mini',       label: 'GPT-4o mini' },
  { value: 'gpt-4-turbo',       label: 'GPT-4 Turbo' },
  { value: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet' },
  { value: 'claude-3-haiku',    label: 'Claude 3 Haiku' },
];

const pill = (label, value) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
    <span style={{
      fontSize: 11, fontWeight: 600,
      color: 'var(--green)',
      background: 'var(--green-bg)',
      border: '1px solid var(--green-border)',
      borderRadius: 4, padding: '1px 7px',
    }}>{value}</span>
  </div>
);

export const LLMNode = ({ id, data }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const [model,       setModel]       = useState(data?.model       || 'gemini-2.5-flash');
  const [temperature, setTemperature] = useState(data?.temperature ?? 0.7);
  const [maxTokens,   setMaxTokens]   = useState(data?.maxTokens   ?? 1024);
  const [expanded,    setExpanded]    = useState(false);

  const onModelChange  = (e) => { setModel(e.target.value);           updateNodeField(id, 'model',       e.target.value); };
  const onTempChange   = (e) => { const v = parseFloat(e.target.value); setTemperature(v); updateNodeField(id, 'temperature', v); };
  const onTokensChange = (e) => { const v = parseInt(e.target.value);   setMaxTokens(v);   updateNodeField(id, 'maxTokens',   v); };

  return (
    <BaseNode
      id={id} title="LLM" accentColor="#2d7a4f" Icon={BrainCircuit}
      inputs={[{ id: 'system', label: 'system' }, { id: 'prompt', label: 'prompt' }]}
      outputs={[{ id: 'response', label: 'response' }]}
      minWidth={240}
    >
      <FieldSelect label="Model" value={model} onChange={onModelChange} options={MODELS} />

      <div style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <label style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>
            Temperature
          </label>
          <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>{temperature}</span>
        </div>
        <input
          type="range" min="0" max="2" step="0.1"
          value={temperature} onChange={onTempChange} className="nodrag"
          style={{ width: '100%', accentColor: 'var(--green)', cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Precise</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Creative</span>
        </div>
      </div>

      <button
        className="nodrag"
        onClick={() => setExpanded(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'transparent', border: '1px solid var(--border)', borderRadius: 6,
          color: 'var(--text-muted)', fontSize: 11, padding: '4px 8px', cursor: 'pointer',
          marginBottom: expanded ? 8 : 0, transition: 'border-color 0.15s, color 0.15s',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green)'; e.currentTarget.style.color = 'var(--green)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
      >
        <span>Advanced settings</span>
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {expanded && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px' }}>
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>Max tokens</label>
              <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>{maxTokens}</span>
            </div>
            <input
              type="range" min="64" max="4096" step="64"
              value={maxTokens} onChange={onTokensChange} className="nodrag"
              style={{ width: '100%', accentColor: 'var(--green)', cursor: 'pointer' }}
            />
          </div>
          {pill('Context window', model.startsWith('gpt-4') ? '128k' : model.startsWith('claude') ? '200k' : '1M')}
          {pill('Provider', model.startsWith('gpt') ? 'OpenAI' : model.startsWith('claude') ? 'Anthropic' : 'Google')}
        </div>
      )}
    </BaseNode>
  );
};
