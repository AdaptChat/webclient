export interface StatusIndicatorProps {
  status?: 'online' | 'idle' | 'dnd' | 'offline';
  indicator?: boolean;
  tailwind?: string;
}

export default function StatusIndicator(props: StatusIndicatorProps) {
  return (
    <div
      classList={{
        "rounded-full": true,
        "bg-[#36d399]": props.status === 'online',
        "bg-[#fbbe23]": props.status === 'idle',
        "bg-[#ef3434]": props.status === 'dnd',
        "bg-[#6b7280]": props.status === 'offline' || props.status == null,
        "indicator-item indicator-bottom": props.indicator,
        "w-3 h-3": props.tailwind === undefined,
        [props.tailwind ?? '']: props.tailwind !== undefined
      }}
    />
  )
}
