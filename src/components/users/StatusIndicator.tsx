export interface StatusIndicatorProps {
  status?: 'online' | 'idle' | 'dnd' | 'offline';
  width?: number;
  indicator?: boolean;
  tailwind?: string;
}

export default function StatusIndicator(props: StatusIndicatorProps) {
  const status = props.status ?? 'offline'
  return (
    <div
      classList={{
        "w-3 h-3 rounded-full": true,
        "bg-success": status === 'online',
        "bg-warning": status === 'idle',
        "bg-error": status === 'dnd',
        "bg-gray-500": status === 'offline',
        "indicator-item indicator-bottom": props.indicator,
        [props.tailwind ?? ""]: props.tailwind !== undefined
      }}
    />
  )
}
