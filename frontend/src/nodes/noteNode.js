import { useState } from 'react';
import { BaseNode, FieldTextarea } from './BaseNode';
import { StickyNote } from 'lucide-react';

export const NoteNode = ({ id, data }) => {
  const [note, setNote] = useState(data?.note || '');

  return (
    <BaseNode id={id} title="Note" accentColor="#6b7280" Icon={StickyNote}>
      <FieldTextarea value={note} onChange={e => setNote(e.target.value)}
        placeholder="Add a comment…"
        style={{ height: 72, fontFamily: "'Inter', sans-serif", fontStyle: 'italic', color: 'var(--text-secondary)' }} />
    </BaseNode>
  );
};
