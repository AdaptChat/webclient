import {createMemo, createSignal, For, type JSX, ParentProps, Show, useContext} from "solid-js";
import {A, useNavigate} from "@solidjs/router";
import {getApi} from "../api/Api";
import StatusIndicator, {StatusIndicatorProps} from "../components/users/StatusIndicator";
import useNewGuildModalComponent from "../components/guilds/NewGuildModal";
import {
  displayChannel,
  displayName,
  filterIterator,
  filterMapIterator,
  humanizeStatus,
  mapIterator,
  noop,
  snowflakes
} from "../utils";
import Icon, {IconElement} from "../components/icons/Icon";
import UserGroup from "../components/icons/svg/UserGroup";
import ChevronRight from "../components/icons/svg/ChevronRight";
import UserTie from "../components/icons/svg/UserTie";
import Server from "../components/icons/svg/Server";
import GuildIcon from "../components/guilds/GuildIcon";
import {openDms} from "./friends/FriendsList";
import {GroupDmChannel, GuildChannel} from "../types/channel";
import {Message} from "../types/message";
import tooltip from "../directives/tooltip";
import {NewGuildModalContext} from "../Entrypoint";
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
  { title, icon, children, ...props }: (
    ParentProps<{ title: string, icon: IconElement }>
    & JSX.ButtonHTMLAttributes<HTMLButtonElement>
  )
) {
  return (
    <button
      class="flex justify-between gap-2 border-2 border-fg/10 transparent hover:bg-2 hover:border-bg-2 rounded-lg p-4
       w-full transition-colors cursor-pointer items-center"
      {...props}
    >
      <div class="flex gap-x-2 items-center">
        <Icon icon={icon} class="w-6 h-6 mx-1 fill-fg" />
        <div>
          <h3 class="text-left font-semibold font-title">{title}</h3>
          <p class="text-sm text-left text-fg/80">{children}</p>
        </div>
      </div>
      <div class="border-2 border-fg/10 rounded-full w-8 h-8 p-4">
      </div>
    </button>
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

function StatusSelectDropdown(props: { status: 'online' | 'idle' | 'dnd' | 'offline' }) {
  const [show, setShow] = createSignal(false)

  return (
    <>
      <label tabIndex="0" class="btn btn-sm text-[1rem]" onClick={() => setShow(prev => !prev)}>
        <StatusIndicator status={props.status} />
        <span class="ml-2">{humanizeStatus(props.status)}</span>
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

  const { setShow: setShowNewGuildModal } = useContext(NewGuildModalContext)!

  // onMount(() => api.pushNotifications.subscribe())

  const activeFriends = createMemo(() => [...mapIterator(
    filterIterator(
      api.cache!.relationships.entries(),
      ([userId, type]) => type === 'friend' && ['online', 'dnd'].includes(
        api.cache!.presences.get(userId)?.status ?? ''
      )
    ),
    ([userId, _]) => userId,
  )])
  const activeConversations = createMemo(() => [...filterMapIterator(
    api.cache!.channels.values(),
    (channel) => {
      let lastMessage = api.cache!.lastMessages.get(channel.id)
      if (!lastMessage || (lastMessage as Message).author_id === api.cache!.clientId) return null

      if (Date.now() - snowflakes.timestampMillis(lastMessage.id) > 1_800_000) // 30 minutes
        return null

      return { ...displayChannel(channel), lastMessage }
    }
  )].sort((a, b) => b.lastMessage.id - a.lastMessage.id))

  return (
    <div class="flex flex-wrap gap-2 mobile:flex-col my-2 px-2">
      <Show when={activeFriends().length}>
        <div class="p-5 bg-bg-0/60 backdrop-blur rounded-xl w-full">
          <div class="flex justify-between">
            <h1 class="font-title font-bold text-xl ml-1">Active Now</h1>
            <A href="/friends" class="btn btn-sm btn-neutral">All Friends</A>
          </div>
          <div class="flex gap-x-3 mt-2 overflow-x-auto pb-1">
            <For each={activeFriends()}>
              {(userId) => (
                <button
                  class="flex flex-col items-center rounded-lg
                    bg-gradient-to-bl from-accent/20 to-transparent hover:from-accent/50 px-3 py-2"
                  onClick={() => openDms(api, navigate, userId)}
                >
                  <div class="indicator">
                    <img src={api.cache!.avatarOf(userId)} alt="" class="w-16 h-16 rounded-full" />
                    <StatusIndicator
                      status={api.cache!.presences.get(userId)?.status}
                      indicator
                      tailwind="m-2 w-4 h-4"
                     />
                  </div>
                  <span class="mt-1 text-xs font-medium text-fg/80">
                    {displayName(api.cache!.users.get(userId)!)}
                  </span>
                </button>
              )}
            </For>
          </div>
        </div>
      </Show>
      <div class="p-5 bg-bg-0/60 backdrop-blur rounded-xl flex-grow xl:w-1/2">
        <h1 class="font-title font-bold text-xl ml-1 mb-3">Learn Adapt</h1> {/* add onboarding and hide if user has fully onboarded */}
        <div class="flex flex-col gap-y-2">
          <LearnAdaptSubcard
            title="Customize your profile"
            icon={UserTie}
            onClick={() => navigate('/settings')}
          >
            Let others on Adapt know who you are. Give yourself a display name, change your avatar, and write a bio.
          </LearnAdaptSubcard>
          <LearnAdaptSubcard
            title="Connect with friends"
            icon={UserGroup}
            onClick={() => navigate('/friends')}
          >
            Find your friends on Adapt, add them to your friends list, and start chatting with them.
          </LearnAdaptSubcard>
          <LearnAdaptSubcard
            title="Join a community"
            icon={Server}
            onClick={() => setShowNewGuildModal(true)}
          >
            Create, discover, join, and chat in communities that suit your interests. You may also join the official&nbsp;
            <A href="/invite/ozLGrKT9" class="font-medium underline underline-offset-2">Adapt Community</A>.
          </LearnAdaptSubcard>
        </div>
      </div>
      <Show when={activeConversations().length}>
        <div class="p-5 bg-bg-0/60 backdrop-blur rounded-xl flex-grow max-w-1/3">
          <h1 class="font-title font-bold text-xl ml-1 mb-3">Ongoing Conversations</h1>
          <div class="flex flex-col gap-y-2">
            <For each={activeConversations().slice(0, 5)}>
              {({ channel, user, guild, icon, lastMessage }) => (
                <A
                  href={'recipient_ids' in channel ? `/dms/${channel.id}` : `/guilds/${guild!.id}/${channel.id}`}
                  class="p-2 flex items-center border-2 border-fg/10 rounded-lg hover:bg-fg/10 transition-all duration-200"
                >
                  {guild ? (
                    <GuildIcon guild={guild} sizeClass="w-12 h-12" unread={false} pings={0} />
                  ) : (
                    <img src={icon!} alt="" class="w-12 h-12 rounded-full" />
                  )}
                  <div class="ml-2 mr-1 flex-grow">
                    <div class="font-medium flex items-center">
                      {guild ? (
                        <>
                          <span class="text-fg/60 font-title overflow-ellipsis overflow-hidden whitespace-nowrap">
                            {guild.name}
                          </span>
                          <Icon icon={ChevronRight} class="fill-fg/60 w-4 h-4 mx-1" />
                          #{(channel as GuildChannel).name}
                        </>
                      ) : (
                        user ? displayName(user) : (channel as GroupDmChannel).name
                      )}
                    </div>
                    <div class="text-fg/80 text-sm whitespace-break-spaces break-words">
                      {'author_id' in lastMessage && lastMessage.author_id ? (
                        <>
                          <span class="font-medium">
                            {displayName(lastMessage.author ?? api.cache!.users.get(lastMessage.author_id)!)}:
                          </span>&nbsp;
                          {lastMessage.content?.slice(0, 100)}{(lastMessage.content?.length ?? 0) > 100 && '...'}
                        </>
                      ) : (
                        'Message not loaded yet. (Message data will be provided in a future update)'
                      )}
                    </div>
                  </div>
                  <Icon icon={ChevronRight} class="fill-fg/60 w-4 h-4 mx-1" />
                </A>
              )}
            </For>
          </div>
        </div>
      </Show>
    </div>
  )
}
