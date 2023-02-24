export interface StatusIndicatorProps {
  status: 'online' | 'idle' | 'dnd' | 'offline';
  width?: number;
  indicator?: boolean;
  tailwind?: string;
}

export default function StatusIndicator(props: StatusIndicatorProps) {
  return (
    <div
      classList={{
        "w-3 h-3 rounded-full": true,
        "bg-success": props.status === 'online',
        "bg-warning": props.status === 'idle',
        "bg-error": props.status === 'dnd',
        "bg-gray-500": props.status === 'offline',
        "indicator-item indicator-bottom": props.indicator,
        [props.tailwind ?? ""]: props.tailwind !== undefined
      }}
    />
  )
}
