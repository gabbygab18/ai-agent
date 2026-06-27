import { useState } from 'react';
import { BaseNode, FieldText, FieldSelect } from './BaseNode';
import { useStore } from '../store';
import { LogOut } from 'lucide-react';

export const OutputNode = ({ id, data }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const [currName,   setCurrName]   = useState(data?.outputName || id.replace('customOutput-', 'output_'));
  const [outputType, setOutputType] = useState(data?.outputType || 'Text');

  const onNameChange = (e) => { setCurrName(e.target.value); updateNodeField(id, 'outputName', e.target.value); };
  const onTypeChange = (e) => { setOutputType(e.target.value); updateNodeField(id, 'outputType', e.target.value); };

  return (
    <BaseNode id={id} title="Output" accentColor="#ec4899" Icon={LogOut}
      inputs={[{ id: 'value', label: 'value' }]}>
      <FieldText   label="Name" value={currName}   onChange={onNameChange}   placeholder="output_name" />
      <FieldSelect label="Type" value={outputType} onChange={onTypeChange}
        options={[{ value: 'Text', label: 'Text' }, { value: 'Image', label: 'Image' }]} />
    </BaseNode>
  );
};
