import { useState } from 'react';
import { BaseNode, FieldTextarea } from './BaseNode';
import { useStore } from '../store';
import { Wand2 } from 'lucide-react';

export const TransformNode = ({ id, data }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const [expr, setExpr] = useState(data?.expression || 'x => x.trim().toUpperCase()');

  const onExprChange = (e) => { setExpr(e.target.value); updateNodeField(id, 'expression', e.target.value); };

  return (
    <BaseNode id={id} title="Transform" accentColor="#a855f7" Icon={Wand2}
      inputs={[{ id: 'input', label: 'input' }]}
      outputs={[{ id: 'output', label: 'output' }]}>
      <FieldTextarea label="Expression" value={expr}
        onChange={onExprChange}
        placeholder="x => x"
        style={{ height: 58 }} />
    </BaseNode>
  );
};
