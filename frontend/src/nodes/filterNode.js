import { useState } from 'react';
import { BaseNode, FieldText, FieldSelect } from './BaseNode';
import { useStore } from '../store';
import { Filter } from 'lucide-react';

const OPS = ['equals', 'not equals', 'contains', 'greater than', 'less than'];

export const FilterNode = ({ id, data }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const [field, setField] = useState(data?.field || 'key');
  const [op,    setOp]    = useState(data?.op    || 'equals');
  const [value, setValue] = useState(data?.value || '');

  const onFieldChange = (e) => { setField(e.target.value); updateNodeField(id, 'field', e.target.value); };
  const onOpChange    = (e) => { setOp(e.target.value);    updateNodeField(id, 'op', e.target.value); };
  const onValueChange = (e) => { setValue(e.target.value); updateNodeField(id, 'value', e.target.value); };

  return (
    <BaseNode id={id} title="Filter" accentColor="#06b6d4" Icon={Filter}
      inputs={[{ id: 'data', label: 'data' }]}
      outputs={[{ id: 'pass', label: 'pass' }, { id: 'fail', label: 'fail' }]}>
      <FieldText   label="Field"     value={field} onChange={onFieldChange}  placeholder="field name" />
      <FieldSelect label="Condition" value={op}    onChange={onOpChange}     options={OPS} />
      <FieldText   label="Value"     value={value} onChange={onValueChange}  placeholder="compare value" />
    </BaseNode>
  );
};
