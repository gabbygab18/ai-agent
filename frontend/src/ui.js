import { useState, useRef, useCallback } from 'react';
import ReactFlow, { Controls, Background, MiniMap, BackgroundVariant } from 'reactflow';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';
import {
  InputNode, LLMNode, OutputNode, TextNode,
  FilterNode, TransformNode, MergeNode, NoteNode, ApiNode,
} from './nodes';
import 'reactflow/dist/style.css';

const gridSize  = 20;
const proOptions = { hideAttribution: true };

const nodeTypes = {
  customInput:  InputNode,
  llm:          LLMNode,
  customOutput: OutputNode,
  text:         TextNode,
  filter:       FilterNode,
  transform:    TransformNode,
  merge:        MergeNode,
  note:         NoteNode,
  api:          ApiNode,
};

const selector = (s) => ({
  nodes: s.nodes, edges: s.edges, getNodeID: s.getNodeID, addNode: s.addNode,
  onNodesChange: s.onNodesChange, onEdgesChange: s.onEdgesChange, onConnect: s.onConnect,
});

export const PipelineUI = () => {
  const wrapper = useRef(null);
  const [rfInstance, setRfInstance] = useState(null);
  const { nodes, edges, getNodeID, addNode, onNodesChange, onEdgesChange, onConnect } =
    useStore(selector, shallow);

  const onDrop = useCallback((event) => {
    event.preventDefault();
    const bounds = wrapper.current.getBoundingClientRect();
    const raw    = event?.dataTransfer?.getData('application/reactflow');
    if (!raw) return;
    const { nodeType: type } = JSON.parse(raw);
    if (!type) return;
    const position = rfInstance.project({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    });
    const nodeID = getNodeID(type);
    addNode({ id: nodeID, type, position, data: { id: nodeID, nodeType: type } });
  }, [rfInstance, getNodeID, addNode]);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div ref={wrapper} style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onInit={setRfInstance}
        nodeTypes={nodeTypes}
        proOptions={proOptions}
        snapGrid={[gridSize, gridSize]}
        snapToGrid
        connectionLineType="smoothstep"
        defaultEdgeOptions={{ type: 'smoothstep', animated: true }}
        fitView
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={gridSize}
          size={1}
          color="#2a2a3a"
        />
        <Controls showInteractive={false} />
        <MiniMap nodeColor="#6366f1" maskColor="#0a0a0faa" pannable zoomable />
      </ReactFlow>
    </div>
  );
};
