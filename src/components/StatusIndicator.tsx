export interface StatusIndicatorProps {
  status: 'online' | 'idle' | 'dnd' | 'offline';
  width?: number;
}

export default function StatusIndicator(props: StatusIndicatorProps) {
  const { status, width = 3 } = props;
  const statusClass = status === 'online' ? 'bg-success'
    : status === 'idle' ? 'bg-warning'
    : status === 'dnd' ? 'bg-error'
    : 'bg-gray-400';

  return <div class={`w-3 h-3 rounded-full ${statusClass}`} />
}
