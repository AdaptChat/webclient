import {A, useNavigate, useParams} from "@solidjs/router";
import {createMemo, createSignal, For, Match, Show, Switch} from "solid-js";
import {getApi} from "../../api/Api";
import {GuildChannel} from "../../types/channel";
import {ModalId, useModal} from "../ui/Modal";
import Icon, {IconElement} from "../icons/Icon";
import ChevronDown from "../icons/svg/ChevronDown";
import UserPlus from "../icons/svg/UserPlus";
import Trash from "../icons/svg/Trash";
import RightFromBracket from "../icons/svg/RightFromBracket";
import HomeIcon from "../icons/svg/Home";
import useContextMenu from "../../hooks/useContextMenu";
import ContextMenu, {ContextMenuButton, DangerContextMenuButton} from "../ui/ContextMenu";
import Code from "../icons/svg/Code";
import Plus from "../icons/svg/Plus";
import {getIcon} from "../channels/CreateChannelModal";
import Gear from "../icons/svg/Gear";
import FolderPlus from "../icons/svg/FolderPlus";
import BookmarkEmpty from "../icons/svg/BookmarkEmpty";
import {ReactiveSet} from "@solid-primitives/set";
import ChevronRight from "../icons/svg/ChevronRight";
import tooltip from "../../directives/tooltip";
import {setShowSidebar} from "../../App";

void tooltip

interface GuildDropdownButtonProps {
  icon: IconElement,
  label: string,
  groupHoverColor?: string,
  svgClass?: string,
  labelClass?: string,
  onClick?: () => any,
  py?: string,
}

function GuildDropdownButton(props: GuildDropdownButtonProps) {
  const svgClasses = "w-4 h-4 " + (props.svgClass ?? "")
  const labelClasses = "ml-2 font-medium " + (props.labelClass ?? "")
  const groupHoverClass = props.groupHoverColor
    ? `hover:bg-${props.groupHoverColor}`
    : "hover:bg-accent"

  return (
    <li class={`mx-1.5 rounded-lg group/gdb ${groupHoverClass} transition-all duration-300`}>
      <a class="px-2 py-1.5 text-sm flex items-center" onClick={props.onClick}>
        <Icon icon={props.icon} class={svgClasses} />
        <span class={labelClasses}>{props.label}</span>
      </a>
    </li>
  )
}

interface ChannelProps {
  channel: GuildChannel
}
function Channel(props: ChannelProps) {
  const api = getApi()!
  const cache = api.cache!

  const params = useParams()
  const navigate = useNavigate()
  const guildId = createMemo(() => BigInt(params.guildId))
  const contextMenu = useContextMenu()!

  const isUnread = createMemo(() => cache.isChannelUnread(props.channel.id))
  const mentionCount = createMemo(() => cache.countGuildMentionsIn(guildId(), props.channel.id))
  const permissions = createMemo(() => cache.getClientPermissions(guildId(), props.channel.id))

  const markRead = async () => {
    const lastMessageId = cache.lastMessages.get(props.channel.id)?.id
    if (lastMessageId) {
      await api.request('PUT', `/channels/${props.channel.id}/ack/${lastMessageId}`)
    }
  }
  const active = () => params.channelId === props.channel.id.toString()
  const settings = () => `/guilds/${guildId()}/${props.channel.id}/settings`

  const [hovered, setHovered] = createSignal(false)
  const {showModal} = useModal()

  return (
    <A
      class="flex items-center gap-x-2 p-2 rounded-xl group transition hover:bg-3"
      classList={{ "bg-bg-3/50": active() }}
      href={`/guilds/${guildId()}/${props.channel.id}`}
      onContextMenu={contextMenu.getHandler(
        <ContextMenu>
          <Show when={isUnread()}>
            <ContextMenuButton icon={BookmarkEmpty} label="Mark as Read" onClick={markRead} />
          </Show>
          <ContextMenuButton
            icon={Code}
            label="Copy Channel ID"
            onClick={() => window.navigator.clipboard.writeText(props.channel.id.toString())}
          />
          <Show when={permissions().has('MODIFY_CHANNELS')}>
            <ContextMenuButton icon={Gear} label="Edit Channel" onClick={() => navigate(settings())}
            />
          </Show>
          <Show when={permissions().has('MANAGE_CHANNELS')}>
            <DangerContextMenuButton
              icon={Trash}
              label="Delete Channel"
              onClick={() => showModal(ModalId.DeleteChannel, props.channel)}
            />
          </Show>
        </ContextMenu>
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {
        if (window.innerWidth < 768) setShowSidebar(false)
      }}
    >
      <Icon
        icon={getIcon(props.channel.type)}
        class="w-4 h-4 transition-all"
        classList={{ [isUnread() || active() ? "fill-fg/100" : "fill-fg/60"]: true }}
      />
      <span class="flex justify-between items-center flex-grow">
        <span
          class="transition text-sm overflow-x-hidden"
          classList={{ [active() || isUnread() || !!mentionCount() ? "text-fg/100" : "text-fg/60"]: true }}
        >
          {props.channel.name}
        </span>
        <Switch>
          <Match when={permissions().has("MODIFY_CHANNELS") && hovered()}>
            <A href={settings()}>
              <Icon
                icon={Gear}
                class="w-3 h-3 fill-fg/50 transition hover:fill-fg/100"
                tooltip={{ content: "Edit Channel", placement: "right" }}
              />
            </A>
          </Match>
          <Match when={mentionCount()}>
            <div
              class="text-sm px-1.5 min-w-[1.25rem] h-5 bg-red-600 text-fg rounded-full flex items-center justify-center"
            >
              {mentionCount()?.toLocaleString()}
            </div>
          </Match>
          <Match when={isUnread()}>
            <span class="w-2 h-2 bg-fg rounded-lg" />
          </Match>
        </Switch>
      </span>
    </A>
  )
}

function GuildMajorLink(props: { icon: IconElement, label: string, href: string, active: boolean }) {
  return (
    <A href={props.href} class="rounded-xl flex items-center p-1 gap-x-2 group transition hover:bg-3">
      <div
        class="w-9 h-9 rounded-[10px] flex items-center justify-center transition"
        classList={{ [props.active ? "bg-accent" : "bg-fg/10"]: true }}
      >
        <Icon icon={props.icon} class="w-4 h-4 fill-fg" />
      </div>
      <span class="font-title transition" classList={{ [props.active ? "text-fg/100" : "text-fg/70"]: true }}>
        {props.label}
      </span>
    </A>
  )
}

export default function GuildSidebar() {
  const params = useParams()
  const navigate = useNavigate()
  const guildId = createMemo(() => BigInt(params.guildId))
  const channelId = createMemo(() => params.channelId && BigInt(params.channelId))
  const contextMenu = useContextMenu()!
  const {showModal} = useModal()

  const api = getApi()!
  const guild = createMemo(() => api.cache!.guilds.get(guildId())!)
  if (!guild()) return

  const [dropdownExpanded, setDropdownExpanded] = createSignal(false)
  const isOwner = createMemo(() => guild().owner_id === api.cache?.clientUser?.id)

  const BaseContextMenu = () => (
    <Show when={guildPermissions()?.has('CREATE_INVITES')}>
      <ContextMenuButton
        icon={UserPlus}
        label="Invite People"
        buttonClass="hover:bg-accent"
        onClick={() => showModal(ModalId.CreateInvite, guild())}
      />
    </Show>
  )
  const guildPermissions = createMemo(() => api.cache?.getClientPermissions(guildId()))

  const channels = createMemo(() => {
    const channels = api.cache?.guildChannelReactor
      ?.get(guildId())
      ?.map(id => api.cache!.channels.get(id) as GuildChannel)
      ?.filter(c => c && api.cache?.getClientPermissions(guildId(), c.id).has('VIEW_CHANNEL'))
    if (!channels) return

    const groups = new Map<bigint | null, { category: GuildChannel, children: GuildChannel[] }>([
      [null, { category: null, children: [] }] as any,
      ...channels
        ?.filter(c => c.type === 'category')
        ?.map(c => [c.id, { category: c, children: [] }])
    ])
    channels.forEach(c => groups.get(c.parent_id ? BigInt(c.parent_id) : null)?.children.push(c))
    groups.forEach(group => group.children.sort((a, b) => {
      const aIsCategory = a.type === 'category'
      const bIsCategory = b.type === 'category'

      if (aIsCategory && !bIsCategory) return 1
      if (!aIsCategory && bIsCategory) return -1
      return a.position - b.position
    }))
    return groups
  })
  const collapsed = new ReactiveSet<bigint>()

  const RenderChannel = (props: { channel: GuildChannel, collapsed?: boolean }) => (
    <Show when={props.channel.type === 'category'} fallback={
      <Show when={!props.collapsed || api.cache?.isChannelUnread(props.channel.id)}>
        <Channel channel={props.channel} />
      </Show>
    }>
      <RenderCategory id={props.channel.id} group={channels()?.get(props.channel.id)!} />
    </Show>
  )
  const RenderCategory = (props: {
    id: bigint, group: { category: GuildChannel, children: GuildChannel[] }
  }) => {
    return (
      <Show when={
        props.group.children.length > 0
        || (props.id ? api.cache!.getClientPermissions(guildId(), props.id) : guildPermissions())?.has('MANAGE_CHANNELS')
      }>
        <div
          class="flex justify-between items-center pb-1 pt-3 px-2"
          onContextMenu={contextMenu.getHandler(
            <ContextMenu>
              <ContextMenuButton
                icon={Code}
                label="Copy Category ID"
                onClick={() => window.navigator.clipboard.writeText(props.id.toString())}
              />
              <Show when={guildPermissions()?.has('MANAGE_CHANNELS')}>
                <DangerContextMenuButton
                  icon={Trash}
                  label="Delete Category"
                  onClick={() => showModal(ModalId.DeleteChannel, props.group.category)}
                />
              </Show>
            </ContextMenu>
          )}
        >
          <button
            class="group flex items-center gap-x-1.5"
            onClick={() => collapsed.has(props.id) ? collapsed.delete(props.id) : collapsed.add(props.id)}
          >
            <Icon
              icon={collapsed.has(props.id) ? ChevronRight : ChevronDown}
              class="w-3 h-3 fill-fg/50 group-hover:fill-fg/100 transition"
              tooltip={collapsed.has(props.id) ? "Expand" : "Collapse"}
            />
            <span class="font-medium text-sm text-fg/50 group-hover:text-fg/100 transition">
            {props.group.category?.name ?? "Channels"}
          </span>
          </button>
          <Show when={guildPermissions()?.has('MANAGE_CHANNELS')}>
            <button class="group" use:tooltip="Create Channel" onClick={() => {
              showModal(ModalId.CreateChannel, { guildId: guildId(), parentId: props.id })
            }}>
              <Icon icon={Plus} class="w-4 h-4 fill-fg/50 group-hover:fill-fg/100 transition" />
            </button>
          </Show>
        </div>
        <For each={props.group.children} fallback={
          <div class="rounded-lg p-2 w-full bg-2 text-center">
            <span class="font-title text-fg/50 text-sm">Empty Category</span>
          </div>
        }>
          {(channel) => <RenderChannel channel={channel} collapsed={collapsed.has(props.id)} />}
        </For>
      </Show>
    )
  }

  return (
    <div
      class="flex flex-col items-center flex-grow"
      onContextMenu={contextMenu.getHandler(
        <ContextMenu>
          <BaseContextMenu />
          <Show when={guildPermissions()?.has('MANAGE_CHANNELS')}>
            <ContextMenuButton
              icon={Plus}
              label="Create Channel"
              onClick={() => showModal(ModalId.CreateChannel, { guildId: guildId() })}
            />
            <ContextMenuButton
              icon={FolderPlus}
              label="Create Category"
              onClick={() => showModal(ModalId.CreateCategory, { guildId: guildId() })}
            />
          </Show>
        </ContextMenu>
      )}
    >
      <div
        class="box-border flex flex-col justify-end border-b-[1px] border-fg/5
          group hover:bg-2 transition-all duration-200 cursor-pointer relative w-full"
        classList={{ 'min-h-[150px]': !!guild().banner }}
        onClick={() => setDropdownExpanded(prev => !prev)}
      >
        <Show when={guild().banner}>
          <figure
            class="absolute inset-0 z-0"
            style={{
              "background-image": `url(${guild().banner})`,
              "background-size": "cover",
              "background-position": "center",
              "mask-image": "linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0))",
            }}
          />
        </Show>
        <div classList={{
          "flex justify-between items-center px-3 mt-3": true,
          "pb-3": !guild().description,
        }}>
          <span class="inline-block font-title font-bold text-base truncate min-w-0 pr-2">
            {guild().name}
          </span>
          <label tabIndex={0} classList={{
            "cursor-pointer transition-transform transform": true,
            "rotate-0": !dropdownExpanded(),
            "rotate-180": dropdownExpanded()
          }}>
            <Icon
              icon={ChevronDown}
              title="Server Options"
              class="w-3 fill-fg/50"
            />
          </label>
        </div>
        {guild().description && (
          <div class="card-body px-3 pt-1 pb-3">
            <p class="text-xs text-fg/50 truncate min-w-0">{guild().description}</p>
          </div>
        )}
        <Show when={dropdownExpanded()}>
          <ul tabIndex={0} class="flex flex-col py-1 absolute rounded-b-xl bg-bg-3/60 backdrop-blur inset-x-0 top-full z-[200]">
            <Show when={guildPermissions()?.has('CREATE_INVITES')}>
              <GuildDropdownButton
                icon={UserPlus}
                label="Invite People"
                svgClass="fill-fg"
                onClick={() => showModal(ModalId.CreateInvite, guild())}
              />
            </Show>
            <Show when={guildPermissions()?.has('MANAGE_CHANNELS')}>
              <GuildDropdownButton
                icon={Plus}
                label="Create Channel"
                svgClass="fill-fg"
                onClick={() => showModal(ModalId.CreateChannel, { guildId: guildId() })}
              />
              <GuildDropdownButton
                icon={FolderPlus}
                label="Create Category"
                svgClass="fill-fg"
                onClick={() => showModal(ModalId.CreateCategory, { guildId: guildId() })}
              />
            </Show>
            <Show when={guildPermissions()?.has('MANAGE_GUILD')}>
              <GuildDropdownButton
                icon={Gear}
                label="Server Settings"
                groupHoverColor="fg/10"
                svgClass="fill-fg"
                onClick={() => navigate(`/guilds/${guildId()}/settings`)}
              />
            </Show>
            <Show when={!isOwner()}>
              <GuildDropdownButton
                icon={RightFromBracket}
                label="Leave Server"
                groupHoverColor="danger"
                svgClass="fill-danger group-hover/gdb:fill-fg"
                labelClass="text-danger group-hover/gdb:text-fg"
                onClick={() => showModal(ModalId.LeaveGuild, guild())}
              />
            </Show>
          </ul>
        </Show>
      </div>
      <div class="flex flex-col w-full p-2">
        <GuildMajorLink label="Server Home" href={`/guilds/${guildId()}`} icon={HomeIcon} active={!channelId()} />
        <For each={[...channels()?.get(null)?.children ?? []]}>
          {(channel) => <RenderChannel channel={channel} />}
        </For>
      </div>
    </div>
  )
}
