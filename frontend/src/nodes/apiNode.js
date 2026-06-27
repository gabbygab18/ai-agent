import { useState } from 'react';
import { BaseNode, FieldText, FieldSelect } from './BaseNode';
import { useStore } from '../store';
import { Globe } from 'lucide-react';

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

export const ApiNode = ({ id, data }) => {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const [url,    setUrl]    = useState(data?.url     || 'https://api.example.com/data');
  const [method, setMethod] = useState(data?.method  || 'GET');
  const [auth,   setAuth]   = useState(data?.authKey || '');

  const onUrlChange    = (e) => { setUrl(e.target.value); updateNodeField(id, 'url', e.target.value); };
  const onMethodChange = (e) => { setMethod(e.target.value); updateNodeField(id, 'method', e.target.value); };
  const onAuthChange   = (e) => { setAuth(e.target.value); updateNodeField(id, 'authKey', e.target.value); };

  return (
    <BaseNode id={id} title="API Request" accentColor="#14b8a6" Icon={Globe}
      inputs={[{ id: 'body', label: 'body' }]}
      outputs={[{ id: 'response', label: 'response' }, { id: 'error', label: 'error' }]}
      minWidth={250}>
      <FieldSelect label="Method"   value={method} onChange={onMethodChange} options={METHODS} />
      <FieldText   label="URL"      value={url}    onChange={onUrlChange}    placeholder="https://…" />
      <FieldText   label="Auth Key" value={auth}   onChange={onAuthChange}   placeholder="Bearer token…" />
    </BaseNode>
  );
};
