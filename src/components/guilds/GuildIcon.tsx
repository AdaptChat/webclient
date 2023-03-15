import type {Guild} from "../../types/guild";
import {createMemo, Show} from "solid-js";
import tooltip from "../../directives/tooltip";
import {noop} from "../../utils";
import {useParams} from "@solidjs/router";
noop(tooltip)

interface GuildIconProps {
  guild: Guild,
  unread: boolean,
  pings: number,
  sizeClass: string,
  tooltip?: boolean,
  ringIfActive?: boolean,
}

export default function GuildIcon(
  { guild, unread, pings, sizeClass, tooltip: showTooltip, ringIfActive }: GuildIconProps,
) {
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
    : unread
    ? <span class="indicator-item indicator-bottom badge badge-sm badge-accent m-1" />
    : null

  let baseClass = "avatar indicator group";
  if (showTooltip) baseClass += " cursor-pointer"

  const extraClasses = createMemo(() => {
    const active = ringIfActive && guild.id === parseInt(useParams().guildId)
    return {
      "transition-all duration-200": true,
      "ring-accent ring-2 rounded-[30%]": active,
      "rounded-[50%] group-hover:rounded-[40%]": !active,
    }
  })

  const ttProps = showTooltip ? { content: guild.name, placement: 'right' } as const : undefined
  return (
    <Show when={guild.icon} fallback={
      <div class={"placeholder " + baseClass} use:tooltip={ttProps}>
        {indicator}
        <div classList={{
          ["relative bg-neutral-focus text-neutral-content " + sizeClass]: true,
          ...extraClasses(),
        }}>
          <span class="rounded-[inherit]">{guild.name.split(/ +/).map(word => word[0] ?? '').join('')}</span>
        </div>
      </div>
    } keyed={false}>
      <div class={baseClass} use:tooltip={ttProps}>
        {indicator}
        <div classList={{ sizeClass: true, ...extraClasses() }}>
          <img src={guild.icon} alt={guild.name} />
        </div>
      </div>
    </Show>
  )
}