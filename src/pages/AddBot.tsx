import {Bot, User} from "../types/user";
import {createEffect, createMemo, createSignal, For, on, onCleanup, Show} from "solid-js";
import {getApi} from "../api/Api";
import {Guild, Member} from "../types/guild";
import {calculatePermissions, humanizeDate, mapIterator, snowflakes} from "../utils";
import {defaultAvatar, memberKey} from "../api/ApiCache";
import {useLocation, useNavigate, useParams} from "@solidjs/router";
import {Permissions} from "../api/Bitflags";
import Icon from "../components/icons/Icon";
import ChevronDown from "../components/icons/svg/ChevronDown";
import GuildIcon from "../components/guilds/GuildIcon";
import MagnifyingGlass from "../components/icons/svg/MagnifyingGlass";
import Fuse from "fuse.js";
import Modal from "../components/ui/Modal";
import {SetRequestedBotPermissionsModal} from "../components/settings/SetBotPermissionsModal";
import RocketLaunch from "../components/icons/svg/RocketLaunch";
import UserTag from "../components/icons/svg/UserTag";
import CakeCandles from "../components/icons/svg/CakeCandles";
import Code from "../components/icons/svg/Code";

export default function AddBot() {
  const api = getApi()
  const params = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const [guilds, setGuilds] = createSignal<Guild[] | null>(null)
  const [basePermissions, setBasePermissions] = createSignal<Map<bigint, bigint> | null>(null)
  const [bot, setBot] = createSignal<Bot | null>(null)
  const [owner, setOwner] = createSignal<User | null>(null)

  createEffect(() => {
    if (!api) return

    if (bot() == null) {
      api.request<Bot>('GET', `/bots/${params.botId}`).then(r => setBot(r.jsonOrThrow()))
    }

    if (guilds() == null) {
      if (api.cache) {
        setGuilds([...api.cache.guilds.values()])
        setBasePermissions(new Map(mapIterator(
          api.cache.guilds.values(),
          guild => [guild.id, api.cache!.members.get(memberKey(guild.id, api.cache!.clientId!))!.permissions])
        ))
      } else
        api.request<Guild[]>('GET', '/guilds?roles=true&members=true').then(response => {
          if (response.ok) {
            const guilds = response.jsonOrThrow()
            setGuilds(guilds)
            setBasePermissions(new Map(guilds.map(guild => [
              guild.id,
              guild.members!.find(member => member.id === api.idFromToken)!.permissions
            ])))
          }
        })
    }

    if (owner() == null && bot() != null) {
      if (api.cache) {
        const owner = api.cache.users.get(bot()!.owner_id)
        if (owner) setOwner(owner)
      }

      if (owner() == null)
        api.request<User>('GET', `/users/${bot()!.owner_id}`).then(r => setOwner(r.jsonOrThrow()))
    }
  })

  const permissions = createMemo(() => {
    if (!api || guilds() == null || basePermissions() == null) return null

    const userId = api.cache ? api.cache.clientId! : api.idFromToken
    return new Map(
      guilds()!.map(guild => [
        guild.id,
        guild.owner_id == userId
          ? Permissions.all()
          : calculatePermissions(userId, basePermissions()!.get(guild.id)!, guild.roles!),
      ])
    )
  })

  const availableGuilds = createMemo(() => {
    if (!api || !permissions()) return null
    const perms = permissions()
    return guilds()!.filter(guild => perms?.get(guild.id)?.has('MANAGE_GUILD'))
  })

  let guildIdInit
  try {
    guildIdInit = BigInt(location.query.guild)
  } catch {
    guildIdInit = null
  }
  const [selectedGuildId, setSelectedGuildId] = createSignal<bigint | null>(guildIdInit)
  const selectedGuild = createMemo(() => availableGuilds() != null && selectedGuildId() != null
    ? availableGuilds()!.find(guild => guild.id === selectedGuildId())!
    : null
  )
  const [isSelecting, setIsSelecting] = createSignal(false)

  let [searchQuery, setSearchQuery] = createSignal('')
  let searchRef: HTMLInputElement | null = null

  const index = createMemo(() => new Fuse(availableGuilds() ?? [], { keys: ['name'] }))
  const queryResults = createMemo(() =>
    searchQuery() === '' ? availableGuilds() : index().search(searchQuery()).map(result => result.item)
  )

  const listener = (event: MouseEvent) => {
    if (isSelecting() && !(event.target as Element).classList.contains('_ignore')) setIsSelecting(false)
  }
  createEffect(() => {
    if (isSelecting()) {
      searchRef?.focus()
      document.addEventListener('click', listener)
    } else {
      document.removeEventListener('click', listener)
    }
  })
  onCleanup(() => document.removeEventListener('click', listener))

  let requested
  try {
    requested = Permissions.fromValue(BigInt(location.query.permissions))
  } catch {
    requested = Permissions.empty()
  }
  const [requestedPermissions, setRequestedPermissions] = createSignal<Permissions>(requested)
  const [showPermissionsModal, setShowPermissionsModal] = createSignal(false)

  createEffect(() => {
    if (bot() && !requestedPermissions())
      setRequestedPermissions(Permissions.fromValue(BigInt(bot()!.default_permissions)))
  })
  createEffect(on(selectedGuildId, guildId => {
    if (guildId == null || !bot() || !permissions()) return

    const perms = permissions()!.get(guildId)
    setRequestedPermissions(p => p.intersect(perms ?? Permissions.empty()))
  }))

  const [isAdding, setIsAdding] = createSignal(false)

  return (
    <div
      class="w-full h-full flex items-center justify-center pb-0 transition-all"
      classList={{ "md:pb-32": isSelecting() }}
    >
      <Modal get={showPermissionsModal} set={setShowPermissionsModal}>
        <SetRequestedBotPermissionsModal
          setShow={setShowPermissionsModal}
          permissionsSignal={[requestedPermissions, setRequestedPermissions]}
          name={bot()?.user.display_name ?? '???'}
          allowed={permissions()?.get(selectedGuildId() as any) ?? Permissions.empty()}
        />
      </Modal>
      <div class="flex flex-col rounded-xl bg-bg-0/70 p-8 items-center min-w-[420px] mobile:min-w-0 mobile:w-[90vw]">
        <Show when={bot()} fallback="Loading...">
          <img src={bot()!.user.avatar ?? defaultAvatar(bot()!.user.id)} alt="" class="rounded-full w-24 h-24" />
          <h1 class="text-2xl font-semibold mt-4 mb-2 font-title">{bot()!.user.display_name}</h1>
          <p class="text-fg/60 font-light mb-4 flex items-center">
            @
            <span class="text-fg/80 rounded-lg p-0.5 bg-fg/10 flex items-center">
              <img src={owner()?.avatar ?? defaultAvatar(bot()!.owner_id)} alt="" class="w-5 h-5 rounded-full" />
              <span class="ml-1">{owner()?.username}</span>
            </span>
            {bot()!.user.username.slice(bot()!.owner_id.toString().length)}
          </p>
        </Show>

        <Show when={bot() && availableGuilds() != null}>
          <p class="text-fg/60 text-sm text-light w-full pl-1 mb-1">
            Select a server to add {bot()!.user.display_name} to
          </p>
          <div class="relative w-full">
            <div
              class="absolute _ignore rounded-lg inset-x-0 top-full mobile:-top-full mt-2 overflow-hidden transition-all z-[500]"
              classList={{
                "opacity-100 top-full pointer-events-auto": isSelecting(),
                "opacity-0 top-[calc(100%-8px)] pointer-events-none": !isSelecting(),
              }}
            >
              <div class="flex flex-grow bg-bg-2 backdrop-blur items-center">
                <Icon icon={MagnifyingGlass} class="w-4 h-4 fill-fg/50 my-2.5 ml-2.5"/>
                <input
                  ref={searchRef!}
                  type="text"
                  class="w-full p-1.5 outline-none font-medium bg-transparent text-sm"
                  placeholder="Search Servers..."
                  value={searchQuery()}
                  onInput={(event) => setSearchQuery(event.currentTarget.value)}
                />
              </div>
              <div class="bg-bg-0/80 backdrop-blur max-h-[256px] overflow-y-auto">
                <For each={queryResults()} fallback={<div class="p-2 text-fg/50 text-center">No results</div>}>
                  {entry => (
                    <button
                      class="w-full flex items-center p-1.5 gap-x-2 bg-transparent hover:bg-fg/10 transition text-sm truncate"
                      onClick={() => {
                        setSelectedGuildId(entry.id)
                        setIsSelecting(false)
                      }}
                    >
                      <GuildIcon guild={entry} sizeClass="w-7 h-7" unread={false} pings={0} />
                      {entry.name}
                    </button>
                  )}
                </For>
              </div>
            </div>
            <button
              class="_ignore rounded-lg pr-4 h-12 w-full bg-2 hover:bg-3 transition flex items-center justify-between gap-x-2"
              classList={{ [selectedGuildId() ? 'pl-2' : 'pl-4']: true }}
              onClick={() => setIsSelecting(p => !p)}
            >
              <Show when={selectedGuild()} fallback="Select a server">
                <div class="flex gap-x-2 items-center">
                  <GuildIcon guild={selectedGuild()!} sizeClass="w-8 h-8" unread={false} pings={0} />
                  {selectedGuild()!.name}
                </div>
              </Show>
              <div
                class="transition-transform transform duration-200"
                classList={{ [isSelecting() ? "rotate-180" : "rotate-0"]: true }}
              >
                <Icon icon={ChevronDown} class="w-4 h-4 fill-fg/60" />
              </div>
            </button>
          </div>
        </Show>
        <Show when={selectedGuildId()}>
          <div class="grid mt-2 grid-cols-2 gap-2 mobile:grid-cols-1 w-full">
            <button
              class="btn"
              onClick={() => setShowPermissionsModal(true)}
            >
              <Icon icon={UserTag} class="w-4 h-4 mr-2 fill-fg" />
              Edit Permissions
            </button>
            <button
              class="btn btn-primary"
              disabled={isAdding()}
              onClick={async () => {
                setIsAdding(true)
                const endpoint = `/guilds/${selectedGuildId()}/bots/${bot()!.user.id}` as `/${string}`
                const response = await api!.request<Member>('PUT', endpoint, {
                  json: { permissions: requestedPermissions().value }
                })
                if (response.ok) {
                  const member = response.jsonOrThrow()
                  if (api?.cache) {
                    api.cache.updateMember(member)
                    api.cache.updateUser(member as User)
                    api.cache.trackMember(selectedGuildId()!, member.id)
                  }
                  navigate(`/guilds/${selectedGuildId()}`)
                }
              }}
            >
              <Icon icon={RocketLaunch} class="w-4 h-4 mr-2 fill-fg" />
              Add Bot
            </button>
          </div>
        </Show>
        <Show when={bot()}>
          <div class="font-light text-fg/60 text-sm text-left w-full mt-4 flex flex-col gap-y-1">
            <span class="flex items-center gap-x-1">
              <Icon icon={CakeCandles} class="w-4 h-4 fill-fg/60"/>
              <span>Created {humanizeDate(snowflakes.timestamp(bot()!.user.id))}</span>
            </span>
          </div>
        </Show>
      </div>
    </div>
  )
}