import type {Guild, Role} from "../../types/guild";
import {createEffect, createMemo, Match, Show, Switch} from "solid-js";
import tooltip from "../../directives/tooltip";
import {
  acronym,
  calculatePermissions,
  filterMapIterator,
  humanizePings,
  mapIterator,
  noop,
  sumIterator
} from "../../utils";
import {useParams} from "@solidjs/router";
import {getApi} from "../../api/Api";
import {memberKey} from "../../api/ApiCache";
import {ReactiveMap} from "@solid-primitives/map";
noop(tooltip)

interface GuildIconProps {
  guild: Guild,
  unread?: boolean,
  pings?: number,
  sizeClass: string,
  tooltip?: boolean,
  ringIfActive?: boolean,
}

export function UnreadIndicator(props: { unread?: boolean, mentionCount: number }) {
  return (
    <Switch>
      <Match when={props.mentionCount > 0}>
        <span
          class="indicator-item indicator-bottom bg-red-600 inline-flex text-xs font-medium items-center rounded-full
          min-w-[18px] h-[18px] m-1.5 ring-bg-0 ring-[3px]"
        >
          <span class="min-w-[18px] text-center text-white px-1.5 py-2">
            {humanizePings(props.mentionCount)}
          </span>
        </span>
      </Match>
      <Match when={props.unread}>
        <span class="indicator-item indicator-bottom bg-accent w-3 h-3 rounded-full m-1"/>
      </Match>
    </Switch>
  )
}

export default function GuildIcon(props: GuildIconProps) {
  let api = getApi()

  const memberData = new ReactiveMap<bigint, { basePermissions: bigint, roles: Role[] }>()
  createEffect(() => {
    const id = api?.cache?.clientId
    if (!id) return

    for (const guildId of api!.cache!.guildList) {
      const member = api?.cache?.members.get(memberKey(guildId, id))
      if (!member) continue

      memberData.set(guildId, {
        basePermissions: BigInt(member.permissions),
        roles: api!.cache!.getMemberRoles(guildId, id),
      })
    }
  })

  const readableChannels = createMemo(() => {
    const id = api?.cache?.clientId
    return new Set(filterMapIterator(
      api?.cache?.channels.values() ?? [],
      (c) => {
        if ('guild_id' in c) {
          const { basePermissions, roles } = memberData.get(c.guild_id) ?? { basePermissions: 0n, roles: [] }
          const perms = calculatePermissions(id!, basePermissions, roles, c.overwrites)
          if (!perms.has('VIEW_CHANNEL')) return null
        }
        return c.id
      }
    ))
  })
  const resolvedPings = createMemo(() => {
    return props.pings ?? sumIterator(mapIterator(
      api?.cache?.guildMentions.get(props.guild.id)?.entries() ?? [],
      ([channelId, pings]) => readableChannels().has(channelId) ? pings.length : 0
    ))
  })
  const resolvedUnread = createMemo(() => props.unread ?? (
    api?.cache?.guildChannelReactor
      .get(props.guild.id)
      ?.some(c => readableChannels().has(c) && api?.cache?.isChannelUnread(c))
  ))

  let baseClass = "indicator group";
  if (props.tooltip) baseClass += " cursor-pointer"

  const params = useParams()
  const extraClasses = createMemo(() => {
    const active = props.ringIfActive && params.guildId as any && props.guild.id === BigInt(params.guildId)
    return {
      "transition-all duration-200 overflow-hidden": true,
      "ring-accent ring-2 rounded-[30%]": active,
      "rounded-[50%] group-hover:rounded-[40%]": !active,
    }
  })

  const ttProps = props.tooltip ? { content: props.guild.name, placement: 'right' } as const : undefined
  return (
    <Show when={props.guild.icon} fallback={
      <div class={"placeholder " + baseClass} use:tooltip={ttProps}>
        <UnreadIndicator unread={resolvedUnread()} mentionCount={resolvedPings()} />
        <div classList={{
          ["relative bg-neutral-hover text-neutral-content flex items-center justify-center " + props.sizeClass]: true,
          ...extraClasses(),
        }}>
          <span class="rounded-[inherit]">{acronym(props.guild.name)}</span>
        </div>
      </div>
    } keyed={false}>
      <div class={baseClass} use:tooltip={ttProps}>
        <UnreadIndicator unread={resolvedUnread()} mentionCount={resolvedPings()} />
        <div classList={{ [props.sizeClass]: true, ...extraClasses() }}>
          <img class="w-full h-full object-cover" src={props.guild.icon} alt={props.guild.name} width={48} height={48} />
        </div>
      </div>
    </Show>
  )
}