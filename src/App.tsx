import {
  createEffect,
  createMemo,
  createSignal,
  ErrorBoundary,
  For,
  JSX,
  lazy, Match, on,
  onMount, ParentProps,
  Show,
  Signal, Switch, useContext
} from "solid-js";
import {A, useLocation, useNavigate, useParams} from "@solidjs/router";
import {createMediaQuery} from "@solid-primitives/media";

import {getApi} from "./api/Api";
import {
  ChannelDisplayMetadata,
  displayChannel,
  displayName,
  flatMapIterator, humanizePings,
  humanizeTimeDeltaShort, mapIterator,
  snowflakes, sumIterator
} from "./utils";

import tooltip from "./directives/tooltip";
void tooltip

import GuildSideSelect, {GuildContextMenu} from "./components/guilds/GuildSideSelect";
import StatusIndicator from "./components/users/StatusIndicator";

import Icon, {IconElement} from "./components/icons/Icon";
import ChevronLeft from "./components/icons/svg/ChevronLeft";
import HomeIcon from "./components/icons/svg/Home";
import ServerIcon from "./components/icons/svg/Server";
import GearIcon from "./components/icons/svg/Gear";
import UserGroup from "./components/icons/svg/UserGroup";
import Compass from "./components/icons/svg/Compass";
import Messages from "./components/icons/svg/Messages";
import Bolt from "./components/icons/svg/Bolt";
import MagnifyingGlass from "./components/icons/svg/MagnifyingGlass";
import Xmark from "./components/icons/svg/Xmark";
import GuildIcon from "./components/guilds/GuildIcon";
import {DmChannel as DmChannelType, GroupDmChannel} from "./types/channel";
import GuildSidebar from "./components/guilds/GuildSidebar";
import {toast} from "solid-toast";
import useContextMenu from "./hooks/useContextMenu";
import ContextMenu, {ContextMenuButton, DangerContextMenuButton} from "./components/ui/ContextMenu";
import Code from "./components/icons/svg/Code";
import GuildMemberList from "./components/guilds/GuildMemberList";
import Plus from "./components/icons/svg/Plus";
import {NewGuildModalContext} from "./Entrypoint";
import {HeaderContext} from "./components/ui/Header";
import {relationshipFilterFactory} from "./pages/friends/Requests";

enum Tab { Quick, Conversations, Servers, Discover }

function SidebarNavButton(props: {
  isActive: () => boolean,
  onClick: () => any,
  icon: IconElement,
  label: string,
  unread?: boolean,
  pings?: number,
}) {
  return (
    <div class="flex-grow indicator">
      <Show when={props.unread && !props.pings}>
        <div class="indicator-item indicator-bottom rounded-full w-4 h-4 m-1 bg-accent" />
      </Show>
      <Show when={props.pings}>
        <span
          class="indicator-item indicator-bottom bg-red-600 inline-flex text-xs font-medium items-center rounded-full
               min-w-[18px] h-[18px] m-1.5 ring-bg-0/80 ring-[3px]"
        >
          <span class="min-w-[18px] text-center text-white px-1.5 py-2">
            {humanizePings(props.pings!)}
          </span>
        </span>
      </Show>
      <button
        classList={{
          "flex justify-center py-5 w-full rounded-lg bg-bg-2/80 hover:bg-bg-3/80 transition duration-200": true,
          "bg-fg/10": props.isActive(),
        }}
        onClick={props.onClick}
        use:tooltip={{ content: props.label, placement: 'bottom' }}
      >
        <Icon icon={props.icon} title={props.label} class="w-5 h-5 fill-fg" />
      </button>
    </div>
  )
}

function SidebarTopNavButton(props: {
  tab: Tab,
  icon: IconElement,
  label: string,
  signal: Signal<Tab>,
  unread?: boolean,
  pings?: number,
}) {
  let [tab, setTab] = props.signal

  return (
    <SidebarNavButton
      isActive={() => tab() === props.tab}
      onClick={() => setTab(props.tab)}
      icon={props.icon}
      label={props.label}
      unread={props.unread}
      pings={props.pings}
    />
  )
}

function SidebarTopPageButton(props: {
  href: string,
  label: string,
  icon: IconElement,
  tooltip?: boolean,
  check?: (pathname: string) => boolean,
}) {
  const route = useLocation()
  const navigate = useNavigate()

  return (
    <button
      classList={{
        "flex items-center justify-center gap-2 flex-grow px-4 py-3 rounded-lg bg-bg-2/80 hover:bg-bg-3/80 transition duration-200": true,
        "bg-fg/10": props.check ? props.check(route.pathname) : route.pathname === props.href,
        "flex-grow": !props.tooltip,
        "flex-grow-0": props.tooltip,
      }}
      onClick={() => navigate(props.href)}
      use:tooltip={props.tooltip ? { content: props.label, placement: 'bottom' } : undefined}
    >
      <Icon icon={props.icon} title={props.label} class="w-4 h-4 fill-fg/80" />
      {!props.tooltip && <span class="font-bold font-title text-fg/80 text-sm">{props.label}</span>}
    </button>
  )
}

function DirectMessageButton({ channelId }: { channelId: bigint }) {
  const href = `/dms/${channelId}`
  const location = useLocation()
  const active = createMemo(() => location.pathname.startsWith(href))

  const api = getApi()!
  const channel = createMemo(() => api.cache!.channels.get(channelId)! as DmChannelType)
  const user = createMemo(() =>
    channel().type == 'dm'
      ? api.cache!.users.get(channel().recipient_ids.find(id => id != api.cache!.clientId)!)
      : undefined
  )
  const presence = createMemo(() => user() && api.cache!.presences.get(user()!.id!))
  const group = channel().type === 'group'
  const deleteMessage = () =>
    group
      ? (channel() as GroupDmChannel).owner_id == user()?.id
        ? 'Delete Group'
        : 'Leave Group'
      : 'Close DM'

  const hasUnread = createMemo(() => !!(
    api.cache?.isChannelUnread(channelId) || api.cache?.countDmMentionsIn(channelId)
  ))
  const lastMessage = createMemo(() => api.cache?.lastMessages.get(channelId))
  const deltaMs = createMemo(() => lastMessage() && Date.now() - snowflakes.timestampMillis(lastMessage()!.id))
  const contextMenu = useContextMenu()
  // const isFriend = createMemo(() => api.cache!.relationships.get(user()?.id!) === 'friend')

  return (
    <A
      href={href}
      classList={{
        "w-full group flex items-center justify-between px-1.5 h-12 rounded-lg transition-all duration-200 hover:bg-3": true,
        "bg-fg/10": active(),
      }}
      onClick={() => {
        if (window.innerWidth < 768) setShowSidebar(false)
      }}
      onContextMenu={contextMenu?.getHandler(
        <ContextMenu>
          <ContextMenuButton
            icon={Code} label="Copy User ID"
            onClick={() => navigator.clipboard.writeText(user()?.id?.toString() ?? '0')}
          />
          <ContextMenuButton
            icon={Code} label="Copy Channel ID"
            onClick={() => navigator.clipboard.writeText(channelId.toString())}
          />
          <DangerContextMenuButton
            icon={Xmark}
            label="Close DM"
            onClick={() => toast.error('Work in progress!')}
          />
        </ContextMenu>
      )}
    >
      <div class="flex items-center gap-x-1.5 flex-grow">
        {group ? (
          <img src={(channel() as GroupDmChannel).icon} alt="" class="w-9 h-9 rounded-full"/>
        ) : (
          <div class="indicator">
            <StatusIndicator status={presence()?.status} tailwind="m-[0.1rem] w-3 h-3" indicator />
            <img src={api.cache!.avatarOf(user()?.id!)} alt="" class="w-9 h-9 rounded-full"/>
          </div>
        )}
        <div class="ml-0.5 text-sm">
          <span classList={{
            "text-fg font-title font-medium transition-all duration-200": true,
            "text-opacity-100": active() || hasUnread(),
            "text-opacity-60 group-hover:text-opacity-80": !active() && !hasUnread(),
          }}>
            {group ? (channel() as GroupDmChannel).name : user() ? displayName(user()!) : 'Unknown User'}
          </span>
          <div class="relative">
            &nbsp;
            <div classList={{
              "absolute inset-0 text-xs text-fg truncate hover:w-48": true,
              [api.cache?.isChannelUnread(channelId) || api.cache?.countDmMentionsIn(channelId) ? 'w-48' : 'w-52']: true,
              "text-opacity-80": hasUnread(),
              "text-opacity-60": active() && !hasUnread(),
              "text-opacity-40": !active() && !hasUnread(),
            }}>
              {group
                ? channel().recipient_ids.length + ' members'
                : presence()?.custom_status ?? (
                  lastMessage() ? (
                    (deltaMs()! > 30_000 ? humanizeTimeDeltaShort(deltaMs()!) + ' ago' : 'Just now')
                    + ((lastMessage() as any)?.content
                      ? ': ' + (lastMessage() as any).content.slice(0, 100).replace(/\s/g, ' ')
                      : ''
                    )
                  ) : 'No messages'
                )
              }
            </div>
          </div>
        </div>
      </div>
      <Switch fallback={
        <Icon
          icon={Xmark}
          title={deleteMessage()}
          tooltip={deleteMessage()}
          class="fill-fg select-none w-4 h-4 opacity-0 hover:!opacity-80 group-hover:opacity-50 transition-opacity duration-200"
          onClick={(event) => {
            event.stopPropagation()
            event.preventDefault()

            toast.error('Work in progress!')
          }}
        />
      }>
        <Match when={api.cache?.countDmMentionsIn(channelId)}>
          <div
            class="p-1.5 text-sm min-w-[1.25rem] h-5 bg-red-600 text-fg rounded-full flex items-center justify-center"
          >
            {api.cache?.countDmMentionsIn(channelId)?.toLocaleString()}
          </div>
        </Match>
        <Match when={api.cache?.isChannelUnread(channelId)}>
          <span class="mx-1 w-2 h-2 bg-fg rounded-lg" />
        </Match>
      </Switch>
    </A>
  )
}

function GuildButton({ guildId }: { guildId: bigint }) {
  const href = `/guilds/${guildId}`
  const api = getApi()!
  const guild = createMemo(() => api.cache!.guilds.get(guildId)!)

  const resolvedPings = createMemo(() => {
    return sumIterator(
      mapIterator(api?.cache?.guildMentions.get(guildId)?.values() ?? [], v => v.length)
    )
  })
  const resolvedUnread = createMemo(() => {
    return api?.cache?.guildChannelReactor.get(guildId)?.some(c => api?.cache?.isChannelUnread(c))
  })

  const contextMenu = useContextMenu()

  return (
    <A
      href={href}
      classList={{
        "group flex items-center justify-between px-1 h-12 rounded-lg transition-all duration-200 hover:bg-3": true,
        "bg-fg/10": useLocation().pathname.startsWith(href),
      }}
      onContextMenu={contextMenu?.getHandler(<GuildContextMenu guild={guild()} />)}
    >
      <div class="flex items-center">
        <GuildIcon guild={guild()} pings={0} unread={false} sizeClass="w-10 h-10 rounded-full" />
        <span classList={{
          "ml-2 font-title": true,
          [resolvedPings() > 0 || resolvedUnread() ? 'text-fg/100' : 'text-fg/70']: true,
        }}>
          {guild().name}
        </span>
      </div>
      <Switch>
        <Match when={resolvedPings() > 0}>
          <div
            class="p-1.5 text-sm min-w-[1.25rem] h-5 bg-red-600 text-fg rounded-full flex items-center justify-center"
          >
            {resolvedPings().toLocaleString()}
          </div>
        </Match>
        <Match when={resolvedUnread()}>
          <span class="mx-1 w-2 h-2 bg-fg rounded-lg" />
        </Match>
      </Switch>
    </A>
  )
}

function HomeSidebar(props: { tabSignal: Signal<Tab> }) {
  const [searchQuery, setSearchQuery] = createSignal('')
  const [tab, _] = props.tabSignal
  const cache = getApi()!.cache!

  const contextMenu = useContextMenu()!
  const { setShow: setShowNewGuildModal, NewGuildModalContextMenu } = useContext(NewGuildModalContext)!

  const recentlyViewed = createMemo(() => [...cache.lastAckedMessages.entries()]
    .filter((entry): entry is [bigint, bigint] => !!entry[1])
    .sort(([_0, a], [_1, b]) => Number(b - a))
    .filter(([id]) => cache.channels.has(id))
    .slice(0, 5)
    .map(([id, lastAcked]) => ({
      ...displayChannel(cache.channels.get(id)!),
      lastAcked: snowflakes.timestampMillis(lastAcked)
    }))
  )

  const mentions = createMemo(() => [
    ...cache.dmMentions.entries(),
    ...flatMapIterator(
      cache.guildMentions.values(),
      (channels) => channels.entries()
    )]
    .filter(([_, mentions]) => mentions.length > 0)
    .sort(([_0, a], [_1, b]) => b.length - a.length)
    .map(([id, mentions]) => ({
      ...displayChannel(cache.channels.get(id)!),
      mentionCount: mentions.length
    }))
  )
  const totalDmMentions = createMemo(() =>
    sumIterator(mapIterator(cache.dmMentions.values(), (mentions) => mentions.length))
  )
  const totalGuildMentions = createMemo(() =>
    sumIterator(flatMapIterator(cache.guildMentions.values(), (channels) =>
      mapIterator(channels.values(), (mentions) => mentions.length)
    ))
  )

  const allUnreadMessages = createMemo(() => [...cache.lastAckedMessages.entries()]
    .map(([id, lastAcked]) => [id, lastAcked, cache.lastMessages.get(id)?.id] as const)
    .filter(([id, lastAckedId, lastMessageId]) =>
      lastAckedId != null && lastMessageId && lastMessageId > lastAckedId && mentions().every(({ channel }) => channel.id !== id)
    )
    .sort(([_0, _1, a], [_2, _3, b]) => Number(b! - a!))
    .map(([id, _, lastMessageId]) => ({
      ...displayChannel(cache.channels.get(id)!),
      lastMessage: snowflakes.timestampMillis(lastMessageId!)
    }))
  )
  const unreadMessages = createMemo(() => allUnreadMessages().slice(0, 5)) // TODO: make this more efficient
  const anyUnreadFactory = (predicate: (metadata: ChannelDisplayMetadata) => boolean) => createMemo(() => allUnreadMessages().some(predicate))
  const anyDmsUnread = anyUnreadFactory((metadata) => metadata.guild == null)
  const anyGuildsUnread = anyUnreadFactory((metadata) => metadata.guild != null)

  const incomingFriends = relationshipFilterFactory(getApi()!, 'incoming_request')

  let searchRef: HTMLInputElement | null = null
  const Section = ({ children }: any) => <h2 class="font-title font-medium text-fg/50 text-sm mx-2 my-2">{children}</h2>
  const ChannelPreview = ({ metadata: { guild, user, icon, channel, mentionCount, lastMessage } }: {
    metadata: ChannelDisplayMetadata & { mentionCount?: number, lastMessage?: number }
  }) => {
    const params = useParams()
    return (
      <A
        classList={{
          "rounded-xl flex items-center justify-between overflow-hidden backdrop-blur transition": true,
          [params.channelId as any && channel.id === BigInt(params.channelId)
            ? "bg-fg/10"
            : "bg-bg-2/80 hover:bg-bg-3/80"]: true,
        }}
        href={guild ? `/guilds/${guild.id}/${channel.id}` : `/dms/${channel.id}`}
      >
        <div class="flex items-center">
          {guild ? (
            <GuildIcon guild={guild} sizeClass="w-10 h-10 rounded-none" unread={false} pings={0} />
          ) : (
            <img src={icon!} alt="" class="w-10 h-10" />
          )}
          <div class="pl-2">
            <h2 class="font-title text-sm font-semibold text-fg/80">
              {channel.type === 'text' ? '#' : ''}{'name' in channel ? channel.name : displayName(user!)}
            </h2>
            <p class="text-xs text-fg/40">
              {guild ? guild.name : user ? 'Direct Messages' : 'Group Messages'}
            </p>
          </div>
        </div>
        <Show when={lastMessage && !mentionCount}>
          <div class="bg-accent rounded-full mx-2 w-3 h-3">&nbsp;</div>
        </Show>
        <Show when={mentionCount}>
          <div class="px-1.5 min-w-[1.25rem] text-sm h-5 bg-red-600 text-fg rounded-full flex items-center justify-center mx-1">
            {humanizePings(mentionCount!)}
          </div>
        </Show>
      </A>
    )
  }

  return (
    <>
      <div classList={{
        "flex gap-2 transition-all": true,
        "h-0 opacity-0 p-1": searchQuery().length > 0,
        "h-14 opacity-100 p-2": searchQuery().length <= 0,
      }}>
        <SidebarTopPageButton href="/" label="Home" icon={HomeIcon} />
        <div class="indicator">
          <Show when={incomingFriends()?.length}>
            <span
              class="indicator-item indicator-bottom bg-red-600 inline-flex text-xs font-medium items-center rounded-full
                     min-w-[18px] h-[18px] m-1.5 ring-bg-0/80 ring-[3px]"
            >
              <span class="min-w-[18px] text-center text-white px-1.5 py-2">
                {humanizePings(incomingFriends()!.length)}
              </span>
            </span>
          </Show>
          <SidebarTopPageButton
            href="/friends" label="Friends" icon={UserGroup}
            check={(path) => path.startsWith('/friends')}
            tooltip
          />
        </div>
      </div>
      <div class="flex mx-2 bg-bg-2/80 rounded-lg">
        <Icon icon={MagnifyingGlass} class="w-4 h-4 fill-fg/50 my-3 ml-3" />
        <input
          ref={searchRef!}
          type="text"
          class="w-full text-sm p-2 outline-none font-medium bg-transparent"
          placeholder="Search Adapt..."
          value={searchQuery()}
          onInput={(event) => setSearchQuery(event.currentTarget.value)}
        />
        <Show when={searchQuery()}>
          <Icon
            icon={Xmark}
            class="w-4 h-4 fill-fg/50 my-3 mr-3 cursor-pointer hover:fill-fg/80 transition duration-200"
            onClick={() => {
              setSearchQuery('')
              searchRef!.focus()
            }}
          />
        </Show>
      </div>
      <div class="flex py-2 px-2 gap-2">
        <SidebarTopNavButton tab={Tab.Quick} icon={Bolt} label="Quick Access" signal={props.tabSignal} />
        <SidebarTopNavButton
          tab={Tab.Conversations} icon={Messages} label="Conversations" signal={props.tabSignal}
          unread={anyDmsUnread()} pings={totalDmMentions()}
        />
        <SidebarTopNavButton
          tab={Tab.Servers} icon={ServerIcon} label="All Servers" signal={props.tabSignal}
          unread={anyGuildsUnread()} pings={totalGuildMentions()}
        />
        <SidebarTopNavButton tab={Tab.Discover} icon={Compass} label="Discover" signal={props.tabSignal} />
      </div>
      <Switch>
        <Match when={tab() === Tab.Quick}>
          <Show when={mentions().length + unreadMessages().length}>
            <Section>New Messages</Section>
            <div class="px-2 flex flex-col gap-y-2">
              <For each={[...mentions(), ...unreadMessages()]}>
                {(metadata) => <ChannelPreview metadata={metadata} />}
              </For>
            </div>
          </Show>
          <Show when={recentlyViewed().length}>
            <Section>Recently Viewed</Section>
            <div class="px-2 flex flex-col gap-y-2">
              <For each={recentlyViewed()}>
                {(metadata) => <ChannelPreview metadata={metadata} />}
              </For>
            </div>
          </Show>
        </Match>

        <Match when={tab() === Tab.Conversations}>
          <h2 class="font-title font-medium text-fg/50 text-sm mx-3.5 mt-2 mb-1">Direct Messages</h2>
          <div class="px-2 mb-2 flex flex-col">
            <For each={cache.dmChannelOrder[0]()}>
              {(channelId) => <DirectMessageButton channelId={channelId} />}
            </For>
          </div>
        </Match>

        <Match when={tab() === Tab.Servers}>
          <h2 class="font-title font-medium text-fg/50 text-sm mx-3.5 mt-2 mb-1 flex items-center justify-between">
            <span>Servers ({cache.guildList.length})</span>
            <button class="group">
              <Icon
                icon={Plus}
                class="w-4 h-4 fill-fg/50 group-hover:fill-fg/100 transition"
                tooltip="New Server"
                onClick={() => setShowNewGuildModal(true)}
                onContextMenu={contextMenu.getHandler(<NewGuildModalContextMenu />)}
              />
            </button>
          </h2>
          <div class="px-2 mb-2 flex flex-col">
            <For each={cache.guildList}>
              {(guildId) => <GuildButton guildId={guildId} />}
            </For>
          </div>
        </Match>
      </Switch>
    </>
  )
}

export function Sidebar({ signal }: { signal: Signal<Tab> }) {
  const api = getApi()!
  const cache = api.cache!
  const route = useLocation()
  const navigate = useNavigate()

  const clientUser = createMemo(() => cache.clientUser!)
  const status = createMemo(() => api.cache!.presences.get(clientUser().id)?.status ?? 'online')
  const showGuildBar = createMemo(() => route.pathname.startsWith('/guilds'))

  return (
    <div classList={{
      "flex flex-col w-full h-full justify-between backdrop-blur transition": true,
      "bg-bg-0/80": !showGuildBar(),
      "bg-bg-0": showGuildBar(),
    }}>
      <div class="flex flex-grow h-[calc(100%-56px)]">
        <div classList={{
          "flex flex-col items-center flex-grow overflow-x-hidden overflow-y-auto transition-all duration-500 h-full bg-0": true,
          "w-[4.5rem] opacity-1": showGuildBar(),
          "w-0 opacity-0": !showGuildBar(),
        }}>
          <GuildSideSelect />
        </div>
        <div classList={{
          "flex flex-col w-full overflow-y-auto hide-scrollbar transition duration-500": true,
          "rounded-bl-xl bg-bg-1": showGuildBar(),
          "bg-transparent rounded-none": !showGuildBar(),
        }}>
          <Show when={showGuildBar()} fallback={<HomeSidebar tabSignal={signal} />}>
            <GuildSidebar />
          </Show>
        </div>
      </div>
      <div class="bg-bg-0 p-2 flex justify-between">
        <div class="flex gap-2">
          <div class="indicator">
            <img src={cache.clientAvatar} alt="" class="w-10 h-10 rounded-xl"/>
            <StatusIndicator status={status()} tailwind="m-1 w-3 h-3" indicator />
          </div>
          <div class="flex flex-col justify-center">
            <h3 class="text-fg/80 font-title font-bold">{displayName(clientUser())}</h3>
            <Show when={clientUser().display_name}>
              <span class="text-fg/50 text-xs">@{clientUser().username}</span>
            </Show>
          </div>
        </div>
        <button
          onClick={() => navigate('/settings')}
          class="bg-1 hover:bg-3 transition rounded-full w-10 h-10 flex items-center justify-center"
          use:tooltip="Settings"
        >
          <Icon icon={GearIcon} class="w-4 h-4 fill-fg/80" />
        </button>
      </div>
    </div>
  )
}

export const [showSidebar, setShowSidebar] = createSignal(true)
export const [showRightSidebar, setShowRightSidebar] = createSignal(true)

type ActionButtonProps =
  { onClick: () => any, icon: IconElement, active?: boolean, label: string }
  & JSX.ButtonHTMLAttributes<HTMLButtonElement>
export function ActionButton(props: ActionButtonProps) {
  return (
    <button
      {...props}
      classList={{
        "flex items-center justify-center w-14 h-full rounded-xl hover:bg-3 transition": true,
        "bg-bg-3/70": props.active,
        "bg-bg-0/80": !props.active,
      }}
      onClick={props.onClick}
      use:tooltip={{ content: props.label, placement: 'bottom' }}
    >
      <Icon icon={props.icon} class="w-5 h-5 fill-fg/80" />
    </button>
  )
}

const FriendActions = lazy(() => import('./pages/friends/Friends').then(m => ({ default: m.FriendActions })))

export const [previousPage, setPreviousPage] = createSignal<string>('/')

export default function App(props: ParentProps) {
  const isMobile = createMediaQuery("(max-width: 768px)")
  const location = useLocation()

  onMount(() => {
    if (isMobile()) {
      setShowSidebar(false)
      setShowRightSidebar(false)
    }
  })

  createEffect(() => {
    if (isMobile()) {
      if (showSidebar()) setShowRightSidebar(false)
      if (showRightSidebar()) setShowSidebar(false)
    }
  })

  const [noRightSidebar, setNoRightSidebar] = createSignal(false)
  const actualShowRightSidebar = createMemo(() => showRightSidebar() && !noRightSidebar())

  createEffect(on(() => location.pathname, () => {
    setNoRightSidebar(false)
    if (!location.pathname.startsWith('/settings')) setPreviousPage(location.pathname)
  }))

  const sidebarSignal = createSignal(Tab.Quick)
  const [swipeStart, setSwipeStart] = createSignal(0)

  const { NewGuildModal } = useContext(NewGuildModalContext)!
  const [headers] = useContext(HeaderContext)!

  return (
    <div
      class="w-full mobile:w-[calc(100%+20rem)] h-full flex overflow-hidden"
      onTouchStart={(event) => setSwipeStart(event.touches[0].clientX)}
      onTouchEnd={(event) => {
        if (!isMobile()) return

        const swipeEnd = event.changedTouches[0].clientX
        const swipeDiff = swipeEnd - swipeStart()
        if (swipeDiff < -100) {
          if (showSidebar()) setShowSidebar(false)
          else setShowRightSidebar(true)
        }
        if (swipeDiff > 100) {
          if (actualShowRightSidebar()) setShowRightSidebar(false)
          else setShowSidebar(true)
        }
      }}
    >
      <NewGuildModal />
      <div
        classList={{
          "my-2 rounded-2xl transition-all duration-300 overflow-hidden": true,
          "opacity-0 w-0 ml-0": !showSidebar(),
          "opacity-100 w-72 ml-2": showSidebar(),
        }}
      >
        <div class="w-72 h-full">
          <Sidebar signal={sidebarSignal} />
        </div>
      </div>
      <div classList={{
        "flex flex-col md:flex-grow mobile:w-[100vw] h-full opacity-100 transition-opacity": true,
        "mobile:opacity-50 md:w-[calc(100%-20rem)]": showSidebar(),
      }}>
        <div class="flex flex-grow w-full gap-x-2 pt-2 px-2">
          <div class="flex flex-grow items-center bg-bg-0/80 backdrop-blur h-14 rounded-xl">
            <button
              use:tooltip={showSidebar() ? "Collapse Sidebar" : "Show Sidebar"}
              class="inline-flex py-2 mx-4 transition-transform duration-200 group"
              style={{"transform": showSidebar() ? "rotate(0deg)" : "rotate(180deg)"}}
              onClick={() => setShowSidebar(prev => !prev)}
            >
              <Icon
                icon={ChevronLeft}
                class="w-4 h-4 fill-fg/50 group-hover:fill-fg/80 transition duration-200"
              />
            </button>
            <span class="font-title font-bold">
              {headers()[headers().length - 1] ?? 'Unknown'}
            </span>
          </div>
          <Switch>
            <Match when={location.pathname.startsWith("/friends")}>
              <FriendActions />
            </Match>
            <Match when={location.pathname.startsWith('/guilds')}>
              <ActionButton
                onClick={() => setShowRightSidebar(prev => !prev)}
                icon={UserGroup}
                active={actualShowRightSidebar()}
                label={actualShowRightSidebar() ? "Hide Members" : "Show Members"}
              />
            </Match>
          </Switch>
        </div>
        <div class="flex flex-grow w-full h-[calc(100%-4rem)] relative">
          <div
            classList={{
              "flex flex-col flex-grow w-full h-full overflow-auto transition-opacity": true,
              "mobile:opacity-30": actualShowRightSidebar(),
            }}
            onClick={() => {
              if (isMobile()) {
                setShowSidebar(false)
                setShowRightSidebar(false)
              }
            }}
          >
            <ErrorBoundary fallback={(err) => (
              <div class="text-red-900 bg-red-300 rounded-lg p-4 m-2 flex flex-col">
                <p class="font-bold">Error: {err.message}</p>
                <p class="font-light text-sm">
                  If this error persists, please&nbsp;
                  <a class="underline underline-offset-2"
                     href="https://github.com/adaptchat/webclient/issues/new/choose">
                    open an issue
                  </a>
                  &nbsp;in the GitHub repository.
                </p>
                <pre class="whitespace-pre-wrap break-words mt-2">{err.stack}</pre>
              </div>
            )}>
              {props.children}
            </ErrorBoundary>
          </div>
          <div
            classList={{
              ["flex flex-col overflow-y-auto transition-all duration-300 h-full overflow-hidden mobile:absolute mobile:right-0"]: true,
              "opacity-0 w-0 p-0": !actualShowRightSidebar(),
              "opacity-100 w-80 py-2 pr-2": actualShowRightSidebar(),
            }}
          >
            <div class="bg-bg-0/70 rounded-xl flex flex-col flex-grow overflow-auto p-2 backdrop-blur-lg">
              <Switch>
                <Match when={location.pathname.startsWith('/guilds')}>
                  <GuildMemberList />
                </Match>
                <Match when={actualShowRightSidebar()}>
                  {setNoRightSidebar(true)}
                </Match>
              </Switch>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
