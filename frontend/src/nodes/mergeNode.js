import { useState } from 'react';
import { BaseNode, FieldSelect } from './BaseNode';
import { useStore } from '../store';
import { Merge } from 'lucide-react';

const STRATEGIES = ['concat', 'zip', 'merge objects', 'first non-null'];

export const MergeNode = ({ id, data }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const [strategy, setStrategy] = useState(data?.strategy || 'concat');

  const onStrategyChange = (e) => { setStrategy(e.target.value); updateNodeField(id, 'strategy', e.target.value); };

  return (
    <BaseNode id={id} title="Merge" accentColor="#eab308" Icon={Merge}
      inputs={[{ id: 'a', label: 'a' }, { id: 'b', label: 'b' }]}
      outputs={[{ id: 'result', label: 'result' }]}>
      <FieldSelect label="Strategy" value={strategy}
        onChange={onStrategyChange} options={STRATEGIES} />
    </BaseNode>
  );
};
