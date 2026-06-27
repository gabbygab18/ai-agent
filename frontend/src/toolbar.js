import { DraggableNode } from './draggableNode';
import { LogIn, BrainCircuit, LogOut, Type, Filter, Wand2, Merge, StickyNote, Globe } from 'lucide-react';

const NODE_DEFS = [
  { type: 'customInput',  label: 'Input',     color: '#7c6fcd', Icon: LogIn },
  { type: 'llm',          label: 'LLM',       color: '#2d7a4f', Icon: BrainCircuit },
  { type: 'customOutput', label: 'Output',    color: '#c96442', Icon: LogOut },
  { type: 'text',         label: 'Text',      color: '#b45309', Icon: Type },
  { type: 'filter',       label: 'Filter',    color: '#0e7490', Icon: Filter },
  { type: 'transform',    label: 'Transform', color: '#7c3aed', Icon: Wand2 },
  { type: 'merge',        label: 'Merge',     color: '#b45309', Icon: Merge },
  { type: 'note',         label: 'Note',      color: '#6b7280', Icon: StickyNote },
  { type: 'api',          label: 'API',       color: '#0f766e', Icon: Globe },
];

export const PipelineToolbar = () => (
  <div style={{
    padding: '0 16px',
    height: 50,
    background: 'var(--bg-elevated)',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    overflowX: 'auto',
    flexShrink: 0,
  }}>
    <span style={{
      fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
      letterSpacing: 0.8, textTransform: 'uppercase',
      marginRight: 10, flexShrink: 0,
    }}>
      Nodes
    </span>
    {NODE_DEFS.map(n => (
      <DraggableNode key={n.type} type={n.type} label={n.label} color={n.color} Icon={n.Icon} />
    ))}
  </div>
);
