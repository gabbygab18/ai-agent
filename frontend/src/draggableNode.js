export const DraggableNode = ({ type, label, color, Icon }) => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, type)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 10px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        cursor: 'grab',
        flexShrink: 0,
        transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
        userSelect: 'none',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'var(--bg-hover)';
        e.currentTarget.style.borderColor = color + '66';
        e.currentTarget.style.boxShadow = `0 2px 8px ${color}22`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'var(--bg-surface)';
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {Icon && (
        <span style={{ color, display: 'flex', alignItems: 'center' }}>
          <Icon size={13} strokeWidth={2} />
        </span>
      )}
      <span style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }}>{label}</span>
    </div>
  );
};
