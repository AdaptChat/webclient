import type {Guild} from "../../types/guild";
import {onMount, Show} from "solid-js";
import tippy from "tippy.js";
import {tippyBaseOptions} from "../../pages/Layout";

interface GuildIconProps {
  guild: Guild,
  unread: boolean,
  pings: number,
  sizeClass: string,
  tooltip?: boolean,
}

export default function GuildIcon({ guild, unread, pings, sizeClass, tooltip }: GuildIconProps) {
  const mx = pings.toString().length * 0.25 + 'rem'
  const indicator =
    pings > 0 ? (
        <span
          class="indicator-item indicator-bottom badge badge-error px-1 py-2 min-w-4 h-4 my-1"
          style={{
            'margin-left': mx,
            'margin-right': mx,
          }}
        >
        {pings}
      </span>
      )
      : unread ? <span class="indicator-item indicator-bottom badge badge-sm badge-accent m-1" />
        : null

  let baseClass = "avatar indicator group";
  if (tooltip) baseClass += " cursor-pointer"

  let anchor: HTMLDivElement | null = null

  onMount(() => {
    if (tooltip) tippy(anchor!, {
      content: guild.name,
      ...tippyBaseOptions,
    })
  })

  return (
    <Show when={guild.icon} fallback={
      <div class={"placeholder " + baseClass} ref={anchor!}>
        {indicator}
        <div class={"relative bg-neutral-focus text-neutral-content rounded-[50%] group-hover:rounded-[25%] transition-all " + sizeClass}>
          <span class="rounded-[inherit]">{guild.name.split(/ +/).map(word => word[0] ?? '').join('')}</span>
        </div>
      </div>
    } keyed={false}>
      <div class={baseClass} ref={anchor!}>
        {indicator}
        <div class={"rounded-full hover:rounded-lg " + sizeClass}>
          <img src={guild.icon} alt={guild.name} />
        </div>
      </div>
    </Show>
  )
}