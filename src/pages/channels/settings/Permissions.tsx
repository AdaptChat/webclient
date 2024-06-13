import {getApi} from "../../../api/Api";
import {useParams} from "@solidjs/router";
import {Accessor, createEffect, createMemo, createSignal, For, Match, onCleanup, Show, Switch} from "solid-js";
import {GuildChannel, PermissionOverwrite} from "../../../types/channel";
import {useSaveTask} from "../../settings/SettingsLayout";
import Header from "../../../components/ui/Header";
import {displayName, extendedColor, includesIterator, snowflakes} from "../../../utils";
import Icon from "../../../components/icons/Icon";
import MagnifyingGlass from "../../../components/icons/svg/MagnifyingGlass";
import Fuse from "fuse.js";
import {memberKey} from "../../../api/ApiCache";
import {Member, Role} from "../../../types/guild";
import {User} from "../../../types/user";
import Plus from "../../../components/icons/svg/Plus";
import {ReactiveMap} from "@solid-primitives/map";
import PermissionsView from "../../../components/settings/PermissionsView";
import {Permissions} from "../../../api/Bitflags";
import ModelType = snowflakes.ModelType;

export default function ChannelPermissions() {
  const api = getApi()!
  const cache = api.cache!

  const params = useParams()
  const channelId = createMemo(() => BigInt(params.channelId))
  const channel = createMemo(() => cache.channels.get(channelId())! as GuildChannel)
  const guild = createMemo(() => cache.guilds.get(channel().guild_id)!)

  const overwrites = new ReactiveMap<bigint, PermissionOverwrite>()
  const [current, setCurrent] = createSignal<bigint | null>(null)
  const resetOverwrites = () => {
    overwrites.clear()
    for (const overwrite of channel().overwrites)
      overwrites.set(overwrite.id, overwrite)
    setCurrent(channel().overwrites[0]?.id)
  }
  createEffect(resetOverwrites)

  const [setChanged] = useSaveTask(
    async () => {
      const json = { overwrites: [...overwrites.values()] }
      await api.request('PATCH', `/channels/${params.channelId}`, { json })
    },
    resetOverwrites,
  )
  createEffect(() => {
    const original = new Map(channel().overwrites.map(o => [o.id, o]))

    let changed = overwrites.size != original.size
    if (!changed) for (const [id, overwrite] of overwrites) {
      const originalOverwrite = original.get(id)
      if (!originalOverwrite) {
        changed = true
        break
      }
      if (overwrite.allow != originalOverwrite.allow || overwrite.deny != originalOverwrite.deny) {
        changed = true
        break
      }
    }

    setChanged(changed)
  })

  let [searching, setSearching] = createSignal(false)
  let [searchQuery, setSearchQuery] = createSignal('')
  let searchRef: HTMLInputElement | null = null

  const listener = (event: MouseEvent) => {
    if (searching() && !(event.target as Element).classList.contains('_ignore')) setSearching(false)
  }
  createEffect(() => {
    if (searching()) {
      searchRef?.focus()
      document.addEventListener('click', listener)
    } else {
      document.removeEventListener('click', listener)
    }
  })
  onCleanup(() => document.removeEventListener('click', listener))

  const roleIndex = createMemo(() => new Fuse(guild().roles ?? [], { keys: ['name'] }))
  const members = createMemo(() => {
    const m = cache.memberReactor
      .get(BigInt(params.guildId))
      ?.map(u => ({ ...cache.users.get(u)!, ...cache.members.get(memberKey(BigInt(params.guildId), u)) }))
      ?? []
    return m.filter((u): u is Member & User => !!u)
  })
  const memberIndex = createMemo(() => new Fuse(members()!, {
    keys: ['username', 'display_name'], // TODO: nickname
  }))
  const queryResults: Accessor<(Role | Member & User)[]> = createMemo(() => searchQuery()
    ? [
      ...roleIndex().search(searchQuery()).map(result => result.item),
      ...memberIndex().search(searchQuery()).map(result => result.item),
    ]
    : [...(guild().roles ?? []), ...members().slice(0, 25)]
  )

  const memberPermissions = createMemo(() => cache.getMemberPermissions(channel().guild_id, cache.clientId!, channel().id))

  return (
    <div class="flex px-2 pt-4 h-[calc(100%-2.25rem)] relative">
      <Header>Permissions</Header>
      <div class="pr-1 w-52 lg:flex-shrink-0 mobile:hidden border-r-[1px] border-fg/10 overflow-y-auto">
        <div class="flex justify-between items-center mx-1 mt-1 mb-2">
          <span class="uppercase font-bold text-sm text-fg/50">Overwrites</span>
          <button class="group _ignore" onClick={() => setSearching(true)}>
            <Icon icon={Plus} class="_ignore w-4 h-4 fill-fg/50 group-hover:fill-fg/100 transition" tooltip="New Overwrite" />
          </button>
        </div>
        <For each={[...overwrites.values()]}>
          {overwrite => (
            <button
              class="flex w-full items-center p-2 gap-x-2 rounded-lg text-sm hover:bg-fg/10 transition text-left"
              classList={{ [overwrite.id == current() ? "bg-fg/10 text-fg/100" : "text-fg/70"]: true }}
              onClick={() => setCurrent(overwrite.id)}
            >
              <Switch>
                <Match when={snowflakes.modelType(overwrite.id) === ModelType.Role}>
                  {(() => {
                    const role = cache.roles.get(overwrite.id)!
                    return (
                      <>
                        <div class="w-2 h-2 rounded-full" style={extendedColor.roleBg(role.color)} />
                        {role.name}
                      </>
                    )
                  })()}
                </Match>
                <Match when={snowflakes.modelType(overwrite.id) === ModelType.User}>
                  {(() => {
                    const member = cache.members.get(memberKey(guild().id, overwrite.id))!
                    return (
                      <>
                        <img src={cache.avatarOf(overwrite.id)} alt="" class="w-6 h-6 rounded-full" />
                        {displayName(member)}
                      </>
                    )
                  })()}
                </Match>
              </Switch>
            </button>
          )}
        </For>
        <div
          class="absolute _ignore left-2 w-[256px] rounded-xl overflow-hidden z-[100] transition-all"
          classList={{
            "opacity-100 top-12 pointer-events-auto": searching(),
            "opacity-0 top-8 pointer-events-none": !searching(),
          }}
        >
          <div class="flex flex-grow bg-bg-0/90 backdrop-blur items-center">
            <Icon icon={MagnifyingGlass} class="w-4 h-4 fill-fg/50 my-2.5 ml-2.5"/>
            <input
              ref={searchRef!}
              type="text"
              class="w-full p-1.5 outline-none font-medium bg-transparent text-sm"
              placeholder="Search..."
              value={searchQuery()}
              onInput={(event) => setSearchQuery(event.currentTarget.value)}
            />
          </div>
          <div class="bg-bg-1/50 backdrop-blur max-h-[256px] overflow-y-auto">
            <For
              each={queryResults().filter(o => !includesIterator(overwrites.keys(), o.id))}
              fallback={<div class="p-2 text-fg/50 text-center">No results</div>}
            >
              {entry => (
                <button
                  class="w-full flex items-center p-2 gap-x-2 bg-transparent hover:bg-fg/10 transition text-sm truncate"
                  onClick={() => {
                    overwrites.set(entry.id, { id: entry.id, allow: BigInt(0), deny: BigInt(0) })
                    setCurrent(entry.id)
                    setSearching(false)
                  }}
                >
                  <Switch>
                    <Match when={snowflakes.modelType(entry.id) === ModelType.Role}>
                      <div class="w-2 h-2 rounded-full" style={extendedColor.roleBg((entry as Role).color)} />
                      {(entry as Role).name}
                    </Match>
                    <Match when={snowflakes.modelType(entry.id) === ModelType.User}>
                      <img src={cache.avatarOf(entry.id)} alt="" class="w-6 h-6 rounded-full" />
                      <div class="flex flex-col items-start">
                        <span>{displayName(entry as User)}</span>
                        <Show when={displayName(entry as User) != (entry as User).username}>
                          <span class="text-xs text-fg/50">@{(entry as User).username}</span>
                        </Show>
                      </div>
                    </Match>
                  </Switch>
                </button>
              )}
            </For>
          </div>
        </div>
      </div>
      <Show when={current() != null && overwrites.has(current()!)} fallback={
        <div class="flex-grow flex flex-col items-center justify-center text-fg/50">
          No permission overwrite selected.
          <button class="btn btn-sm btn-ghost _ignore" onClick={() => setSearching(true)}>New Overwrite</button>
        </div>
      }>
        <div class="flex flex-col w-full py-4">
          <h3 class="px-4 font-title font-bold flex items-center justify-between w-full">
            {snowflakes.modelType(current()!) === ModelType.Role
              ? cache.roles.get(current()!)?.name
              : '@' + cache.users.get(current()!)?.username
            }
            <button class="btn btn-sm btn-danger _ignore" onClick={() => overwrites.delete(current()!)}>
              Delete Overwrite
            </button>
          </h3>
          <div class="flex flex-col overflow-y-auto pt-2 px-4">
            <PermissionsView
              enabledPermissions={memberPermissions()}
              allowSignal={[
                () => Permissions.fromValue(overwrites.get(current()!)?.allow!),
                (value) => overwrites.set(current()!, { ...overwrites.get(current()!)!, allow: value.value })
              ]}
              denySignal={[
                () => Permissions.fromValue(overwrites.get(current()!)?.deny!),
                (value) => overwrites.set(current()!, { ...overwrites.get(current()!)!, deny: value.value })
              ]}
              channelType={channel().type}
            />
          </div>
        </div>
      </Show>
    </div>
  )
}