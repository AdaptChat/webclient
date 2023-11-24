import Layout, {setShowSidebar} from "./Layout";
import {getApi} from "../api/Api";
import StatusIndicator, {StatusIndicatorProps} from "../components/users/StatusIndicator";
import {createMemo, createSignal, For, type JSX, ParentProps, Show} from "solid-js";
import {A, useLocation, useNavigate} from "@solidjs/router";
import useNewGuildModalComponent from "../components/guilds/NewGuildModal";
import {displayName, humanizeStatus, noop} from "../utils";
import SidebarSection from "../components/ui/SidebarSection";
import SidebarButton from "../components/ui/SidebarButton";
import {DmChannel, GroupDmChannel} from "../types/channel";
import tooltip from "../directives/tooltip";
import {toast} from "solid-toast";
import Icon from "../components/icons/Icon";
import Xmark from "../components/icons/svg/Xmark";
import HomeIcon from "../components/icons/svg/Home";
import UserGroup from "../components/icons/svg/UserGroup";
import ChevronRight from "../components/icons/svg/ChevronRight";
noop(tooltip)

export function Card(props: ParentProps<{ title: string }>) {
  return (
    <div
      class="flex flex-col items-center bg-0 rounded-xl p-6 gap-2 flex-grow h-full"
    >
      <h2 class="font-bold text-2xl font-title text-center">{props.title}</h2>
      {props.children}
    </div>
  )
}

function LearnAdaptSubcard(
  { title, children, ...props }: ParentProps<{ title: string }> & JSX.ButtonHTMLAttributes<HTMLButtonElement>
) {
  return (
    <button
      class="flex justify-between gap-2 border-2 border-fg/10 transparent hover:bg-2 hover:border-bg-2 rounded-lg p-4
       w-full transition-colors cursor-pointer items-center"
      {...props}
    > {/* TODO */}
      <div>
        <h3 class="text-left font-medium font-title text-lg">{title}</h3>
        <p class="text-sm text-left">{children}</p>
      </div>
      <Icon icon={ChevronRight} title="Click to go" class="fill-fg select-none w-4 h-4"/>
    </button>
  )
}

function DirectMessageButton({ channelId }: { channelId: number }) {
  const href = `/dms/${channelId}`
  const location = useLocation()
  const active = createMemo(() => location.pathname.startsWith(href))

  const api = getApi()!
  const channel = createMemo(() => api.cache!.channels.get(channelId)! as DmChannel)
  const user = createMemo(() =>
    channel().type == 'dm'
      ? api.cache!.users.get(channel().recipient_ids.find(id => id != api.cache!.clientId)!)
      : undefined
  )
  const presence = createMemo(() => api.cache!.presences.get(user()!.id))
  const group = channel().type === 'group'
  const deleteMessage = () =>
    group
      ? (channel() as GroupDmChannel).owner_id == user()?.id
        ? 'Delete Group'
        : 'Leave Group'
      : 'Close DM'

  return (
    <A
      href={href}
      classList={{
        "w-full group flex items-center justify-between px-2 h-12 rounded-lg transition-all duration-200 hover:bg-3": true,
        "bg-0": active(),
      }}
      onClick={() => {
        if (window.innerWidth < 768) setShowSidebar(false)
      }}
    >
      <div class="flex items-center gap-x-2">
        {group ? (
          <img src={(channel() as GroupDmChannel).icon} alt="" class="w-8 h-8 rounded-full"/>
        ) : (
          <div class="indicator">
            <StatusIndicator status={presence()?.status} tailwind="m-[0.1rem]" indicator />
            <img src={api.cache!.avatarOf(user()!.id)} alt="" class="w-8 h-8 rounded-full"/>
          </div>
        )}
        <div class="ml-0.5 text-sm">
          <span classList={{
            "text-fg group-hover:text-opacity-80 transition-all duration-200": true,
            "text-opacity-100": active(),
            "text-opacity-60": !active(),
          }}>
            {group ? (channel() as GroupDmChannel).name : user()!.username}
          </span>
          <div class="text-xs text-fg/40">
            {group ? channel().recipient_ids.length + ' members' : presence()?.custom_status}
          </div>
        </div>
      </div>
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
    </A>
  )
}

export function Sidebar() {
  const api = getApi()!
  const dmChannelOrder = api.cache!.dmChannelOrder[0]

  return (
    <div class="flex flex-col items-center justify-center w-full">
      <div class="flex flex-col w-full p-2">
        <SidebarButton href="/" svg={HomeIcon}>Home</SidebarButton>
        <SidebarButton href={["/friends", "/friends/requests"]} svg={UserGroup}>Friends</SidebarButton>
        <Show when={dmChannelOrder().length > 0} keyed={false}>
          <SidebarSection plusAction={() => toast.error("Work in progress")} plusTooltip="New Direct Message">
            Direct Messages
          </SidebarSection>
          <For each={dmChannelOrder()}>
            {(channelId) => <DirectMessageButton channelId={channelId} />}
          </For>
        </Show>
      </div>
    </div>
  )
}

function StatusSelect(props: StatusIndicatorProps & { label: string }) {
  const api = getApi()!

  return (
    <li>
      <button
        onClick={() => api.ws?.updatePresence({ status: props.status })}
        class="flex items-center gap-x-2 font-medium text-sm p-2 hover:bg-3 rounded-lg w-full transition"
      >
        <StatusIndicator status={props.status} />
        {props.label}
      </button>
    </li>
  )
}

function StatusSelectDropdown({ status }: { status: 'online' | 'idle' | 'dnd' | 'offline' }) {
  const [show, setShow] = createSignal(false)

  return (
    <>
      <label tabIndex="0" class="btn btn-sm text-[1rem]" onClick={() => setShow(prev => !prev)}>
        <StatusIndicator status={status} />
        <span class="ml-2">{humanizeStatus(status)}</span>
      </label>
      <ul
        tabIndex="0"
        classList={{
          "absolute mt-2 menu p-2 shadow-xl bg-neutral-hover/80 backdrop-blur rounded-xl w-48 dropdown": true,
          "hidden": !show(),
        }}
      >
        <StatusSelect label="Online" status="online" />
        <StatusSelect label="Idle" status="idle" />
        <StatusSelect label="Do Not Disturb" status="dnd" />
        <StatusSelect label="Invisible" status="offline" />
      </ul>
    </>
  )
}

export default function Home() {
  const api = getApi()!
  const navigate = useNavigate()
  const clientUser = api.cache!.clientUser!
  const status = createMemo(() => api.cache!.presences.get(clientUser.id)?.status ?? 'online')

  const { NewGuildModal, setShow: setShowNewGuildModal } = useNewGuildModalComponent()

  // onMount(() => api.pushNotifications.subscribe())

  return (
    <Layout sidebar={Sidebar} title="Home" showBottomNav>
      <NewGuildModal />
      <div class="flex flex-col items-center w-full h-full p-8 mobile-xs:p-4 xl:p-12 2xl:p-16 overflow-auto">
        <div class="flex items-center mobile:justify-center px-8 bg-0 rounded-xl py-12 w-full mobile:flex-col">
          <img src={api.cache?.clientAvatar} alt="" class="w-24 h-24 rounded-xl mr-4" />
          <div class="flex flex-col mobile:items-center">
            <h1 class="text-4xl mobile:text-3xl text-center font-title font-bold">
              Welcome,{' '}
              <span class="bg-gradient-to-r bg-clip-text overflow-ellipsis text-transparent from-accent to-secondary">
                {displayName(clientUser)}
              </span>!
            </h1>
            <div class="mt-2 relative">
              <StatusSelectDropdown status={status()} />
            </div>
          </div>
        </div>
        <div class="flex items-center justify-center mt-4 gap-4 w-full mobile:flex-col">
          <Card title="Learn Adapt">
            <LearnAdaptSubcard title="Connect with friends" onClick={() => navigate('/friends')}>
              Find your friends on Adapt and add them to your friends list.
              <span class="block text-fg/60 mt-1">
                Your username is <code>@{clientUser.username}</code>!
              </span>
            </LearnAdaptSubcard>
            <LearnAdaptSubcard title="Create a community" onClick={() => setShowNewGuildModal(true)}>
              Create and develop a new server for you, your friends, or whoever you desire.
              You can also join an existing server as long as you have its invite link.
            </LearnAdaptSubcard>
            <LearnAdaptSubcard title="Discover communities">
              Find new servers to join that suit your interests. You can also join our{' '}
              <A class="underline" href="/invite/Sy0HSbiR">official server</A>.
            </LearnAdaptSubcard>
          </Card>
          <Card title="Recent Activity">
            <div class="w-full h-full flex items-center justify-center">
              <p class="text-center">This card is a <b>Work in Progress.</b></p> {/* TODO */}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
