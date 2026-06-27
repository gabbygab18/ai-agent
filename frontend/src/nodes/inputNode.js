import { useState } from 'react';
import { BaseNode, FieldText, FieldSelect } from './BaseNode';
import { useStore } from '../store';
import { LogIn } from 'lucide-react';

export const InputNode = ({ id, data }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const [currName,  setCurrName]  = useState(data?.inputName  || id.replace('customInput-', 'input_'));
  const [inputType, setInputType] = useState(data?.inputType  || 'Text');
  const [runValue,  setRunValue]  = useState(data?.value      || '');

  const onNameChange = (e) => {
    setCurrName(e.target.value);
    updateNodeField(id, 'inputName', e.target.value);
  };
  const onTypeChange = (e) => {
    setInputType(e.target.value);
    updateNodeField(id, 'inputType', e.target.value);
  };
  const onValueChange = (e) => {
    setRunValue(e.target.value);
    updateNodeField(id, 'value', e.target.value);
  };

  return (
    <BaseNode id={id} title="Input" accentColor="#6366f1" Icon={LogIn}
      outputs={[{ id: 'value', label: 'value' }]}>
      <FieldText   label="Name" value={currName}  onChange={onNameChange}  placeholder="input_name" />
      <FieldSelect label="Type" value={inputType} onChange={onTypeChange}
        options={[{ value: 'Text', label: 'Text' }, { value: 'File', label: 'File' }]} />
      <FieldText   label="Run value" value={runValue} onChange={onValueChange} placeholder="value to use when running" />
    </BaseNode>
  );
};

