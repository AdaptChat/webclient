import type {Guild} from "../../types/guild";
import {createMemo, Show} from "solid-js";
import tooltip from "../../directives/tooltip";
import {acronym, humanizePings, mapIterator, noop, sumIterator} from "../../utils";
import {useParams} from "@solidjs/router";
import {getApi} from "../../api/Api";
noop(tooltip)

interface GuildIconProps {
  guild: Guild,
  unread?: boolean,
  pings?: number,
  sizeClass: string,
  tooltip?: boolean,
  ringIfActive?: boolean,
}

export default function GuildIcon(
  { guild, unread, pings, sizeClass, tooltip: showTooltip, ringIfActive }: GuildIconProps,
) {
  let api = getApi()

  const resolvedPings = createMemo(() => {
    return pings ?? sumIterator(
      mapIterator(api?.cache?.guildMentions.get(guild.id)?.values() ?? [], v => v.length)
    )
  })
  const resolvedUnread = createMemo(() => {
    return unread ?? api?.cache?.guildChannelReactor.get(guild.id)?.some(c => api?.cache?.isChannelUnread(c))
  })
  const indicator = () =>
    resolvedPings() > 0 ? (
      <span
        class="indicator-item indicator-bottom bg-red-600 inline-flex text-xs font-medium items-center rounded-full
               min-w-[18px] h-[18px] m-1.5 ring-bg-0 ring-[3px]"
      >
        <span class="min-w-[18px] text-center text-white px-1.5 py-2">
          {humanizePings(resolvedPings())}
        </span>
      </span>
    )
    : resolvedUnread()
    ? <span class="indicator-item indicator-bottom bg-accent w-3 h-3 rounded-full m-1" />
    : null

  let baseClass = "indicator group";
  if (showTooltip) baseClass += " cursor-pointer"

  const params = useParams()
  const extraClasses = createMemo(() => {
    const active = ringIfActive && params.guildId as any && guild.id === BigInt(params.guildId)
    return {
      "transition-all duration-200 overflow-hidden": true,
      "ring-accent ring-2 rounded-[30%]": active,
      "rounded-[50%] group-hover:rounded-[40%]": !active,
    }
  })

  const ttProps = showTooltip ? { content: guild.name, placement: 'right' } as const : undefined
  return (
    <Show when={guild.icon} fallback={
      <div class={"placeholder " + baseClass} use:tooltip={ttProps}>
        {indicator()}
        <div classList={{
          ["relative bg-neutral-hover text-neutral-content flex items-center justify-center " + sizeClass]: true,
          ...extraClasses(),
        }}>
          <span class="rounded-[inherit]">{acronym(guild.name)}</span>
        </div>
      </div>
    } keyed={false}>
      <div class={baseClass} use:tooltip={ttProps}>
        {indicator()}
        <div classList={{ [sizeClass]: true, ...extraClasses() }}>
          <img class="w-full h-full object-cover" src={guild.icon} alt={guild.name} width={48} height={48} />
        </div>
      </div>
    </Show>
  )
}