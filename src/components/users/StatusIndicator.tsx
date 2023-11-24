export interface StatusIndicatorProps {
  status?: 'online' | 'idle' | 'dnd' | 'offline';
  width?: number;
  indicator?: boolean;
  tailwind?: string;
}

export default function StatusIndicator(props: StatusIndicatorProps) {
  return (
    <div
      classList={{
        "w-3 h-3 rounded-full": true,
        "bg-[#36d399]": props.status === 'online',
        "bg-[#fbbe23]": props.status === 'idle',
        "bg-[#ef3434]": props.status === 'dnd',
        "bg-[#6b7280]": props.status === 'offline' || props.status == null,
        "indicator-item indicator-bottom": props.indicator,
        [props.tailwind ?? ""]: props.tailwind !== undefined
      }}
    />
  )
}
