import {useNavigate, useParams} from "@solidjs/router";
import {createMemo, createSignal, For, Match, Show, splitProps, Switch} from "solid-js";
import {getApi} from "../../api/Api";
import SidebarButton from "../ui/SidebarButton";
import {GuildChannel} from "../../types/channel";
import GuildInviteModal from "./GuildInviteModal";
import Modal from "../ui/Modal";
import ConfirmGuildLeaveModal from "./ConfirmGuildLeaveModal";
import Icon, {IconElement} from "../icons/Icon";
import ChevronDown from "../icons/svg/ChevronDown";
import UserPlus from "../icons/svg/UserPlus";
import Trash from "../icons/svg/Trash";
import RightFromBracket from "../icons/svg/RightFromBracket";
import HomeIcon from "../icons/svg/Home";
import Hashtag from "../icons/svg/Hashtag";
import useContextMenu from "../../hooks/useContextMenu";
import ContextMenu, {ContextMenuButton, DangerContextMenuButton} from "../ui/ContextMenu";
import ConfirmChannelDeleteModal from "../channels/ConfirmChannelDeleteModal";
import Code from "../icons/svg/Code";
import Plus from "../icons/svg/Plus";
import CreateChannelModal from "../channels/CreateChannelModal";
import Gear from "../icons/svg/Gear";
import FolderPlus from "../icons/svg/FolderPlus";
import CreateCategoryModal from "../channels/CreateCategoryModal";
import BookmarkEmpty from "../icons/svg/BookmarkEmpty";
import {ReactiveSet} from "@solid-primitives/set";
import ChevronRight from "../icons/svg/ChevronRight";
import tooltip from "../../directives/tooltip";
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
  const guildId = createMemo(() => BigInt(params.guildId))
  const contextMenu = useContextMenu()!

  const isUnread = createMemo(() => cache.isChannelUnread(props.channel.id))
  const mentionCount = createMemo(() => cache.countGuildMentionsIn(guildId(), props.channel.id))
  const permissions = createMemo(() => cache.getClientPermissions(guildId(), props.channel.id))

  const [confirmChannelDeleteModal, setConfirmChannelDeleteModal] = createSignal(false)

  const markRead = async () => {
    const lastMessageId = cache.lastMessages.get(props.channel.id)?.id
    if (lastMessageId) {
      await api.request('PUT', `/channels/${props.channel.id}/ack/${lastMessageId}`)
    }
  }

  return (
    <SidebarButton
      href={`/guilds/${guildId()}/${props.channel.id}`}
      svg={Hashtag}
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
          <Show when={permissions().has('MANAGE_CHANNELS')}>
            <DangerContextMenuButton
              icon={Trash}
              label="Delete Channel"
              onClick={() => setConfirmChannelDeleteModal(true)}
            />
          </Show>
        </ContextMenu>
      )}
    >
      <Modal get={confirmChannelDeleteModal} set={setConfirmChannelDeleteModal}>
        <ConfirmChannelDeleteModal
          channel={props.channel}
          setConfirmChannelDeleteModal={setConfirmChannelDeleteModal}
        />
      </Modal>
      <span class="flex justify-between items-center">
        <span classList={{ "text-fg": isUnread() || !!mentionCount() }}>
          {props.channel.name}
        </span>
        <Switch>
          <Match when={mentionCount()}>
            <div
              class="px-1.5 min-w-[1.25rem] h-5 bg-red-600 text-fg rounded-full flex items-center justify-center"
            >
              {mentionCount()?.toLocaleString()}
            </div>
          </Match>
          <Match when={isUnread()}>
            <span class="w-2 h-2 bg-fg rounded-lg" />
          </Match>
        </Switch>
      </span>
    </SidebarButton>
  )
}

export default function GuildSidebar() {
  const params = useParams()
  const navigate = useNavigate()
  const guildId = createMemo(() => BigInt(params.guildId))
  const channelId = createMemo(() => params.channelId && BigInt(params.channelId))
  const contextMenu = useContextMenu()!

  const api = getApi()!
  const guild = createMemo(() => api.cache!.guilds.get(guildId())!)
  if (!guild()) return

  const [dropdownExpanded, setDropdownExpanded] = createSignal(false)
  const [showInviteModal, setShowInviteModal] = createSignal(false)
  const [confirmGuildLeaveModal, setConfirmGuildLeaveModal] = createSignal(false)
  const [createChannelModal, setShowCreateChannelModal] = createSignal(false)
  const [createCategoryModal, setShowCreateCategoryModal] = createSignal(false)
  const [parentId, setParentId] = createSignal<bigint | null>(null)

  const isOwner = createMemo(() => guild().owner_id === api.cache?.clientUser?.id)

  const BaseContextMenu = () => (
    <Show when={guildPermissions()?.has('CREATE_INVITES')}>
      <ContextMenuButton
        icon={UserPlus}
        label="Invite People"
        buttonClass="hover:bg-accent"
        onClick={() => setShowInviteModal(true)}
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

  const RenderChannel = (props: { channel: GuildChannel }) => (
    <Show when={props.channel.type === 'category'} fallback={<Channel channel={props.channel} />}>
      <RenderCategory id={props.channel.id} group={channels()?.get(props.channel.id)!} />
    </Show>
  )
  const RenderCategory = (props: {
    id: bigint, group: { category: GuildChannel, children: GuildChannel[] }
  }) => {
    const [confirmDelete, setConfirmDelete] = createSignal(false)
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
                  onClick={() => setConfirmDelete(true)}
                />
              </Show>
            </ContextMenu>
          )}
        >
          <Modal get={confirmDelete} set={setConfirmDelete}>
            <ConfirmChannelDeleteModal
              channel={props.group.category}
              setConfirmChannelDeleteModal={setConfirmDelete}
            />
          </Modal>
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
              setParentId(props.id)
              setShowCreateChannelModal(true)
            }}>
              <Icon icon={Plus} class="w-4 h-4 fill-fg/50 group-hover:fill-fg/100 transition" />
            </button>
          </Show>
        </div>
        <Show when={!collapsed.has(props.id)}>
          <For each={props.group.children} fallback={
            <div class="rounded-lg p-2 w-full bg-2 text-center">
              <span class="font-title text-fg/50 text-sm">Empty Category</span>
            </div>
          }>
            {(channel) => <RenderChannel channel={channel} />}
          </For>
        </Show>
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
              onClick={() => setShowCreateChannelModal(true)}
            />
            <ContextMenuButton
              icon={FolderPlus}
              label="Create Category"
              onClick={() => setShowCreateCategoryModal(true)}
            />
          </Show>
        </ContextMenu>
      )}
    >
      <Modal get={showInviteModal} set={setShowInviteModal}>
        <GuildInviteModal guild={guild()} show={showInviteModal} />
      </Modal>
      <Modal get={confirmGuildLeaveModal} set={setConfirmGuildLeaveModal}>
        <ConfirmGuildLeaveModal guild={guild()} setConfirmGuildLeaveModal={setConfirmGuildLeaveModal} />
      </Modal>
      <Modal get={createChannelModal} set={setShowCreateChannelModal}>
        <CreateChannelModal setter={setShowCreateChannelModal} guildId={guildId()} parentId={parentId()} />
      </Modal>
      <Modal get={createCategoryModal} set={setShowCreateCategoryModal}>
        <CreateCategoryModal setter={setShowCreateCategoryModal} guildId={guildId()} />
      </Modal>
      <div
        class="w-[calc(100%-1rem)] rounded-xl mt-2 box-border overflow-hidden flex flex-col border-2 border-bg-3
          group hover:bg-2 transition-all duration-200 cursor-pointer"
        onClick={() => setDropdownExpanded(prev => !prev)}
      >
        {guild().banner && (
          <figure class="h-20 overflow-hidden flex items-center justify-center">
            <img src={guild().banner} alt="" class="w-full" width="100%" />
          </figure>
        )}
        <div classList={{
          "flex justify-between items-center px-4 pt-3": true,
          "pb-3": !guild().description,
        }}>
          <span class="inline-block font-title font-bold text-base text-ellipsis w-40 break-words">
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
          <div class="card-body px-4 pt-1 pb-3">
            <p class="text-xs text-fg/50">{guild().description}</p>
          </div>
        )}
        <Show when={dropdownExpanded()}>
          <div class="bg-bg-3/50 mx-2 h-0.5 rounded-full flex" />
          <ul tabIndex={0} class="flex flex-col my-1">
            <Show when={guildPermissions()?.has('CREATE_INVITES')}>
              <GuildDropdownButton
                icon={UserPlus}
                label="Invite People"
                svgClass="fill-fg"
                onClick={() => setShowInviteModal(true)}
              />
            </Show>
            <Show when={guildPermissions()?.has('MANAGE_CHANNELS')}>
              <GuildDropdownButton
                icon={Plus}
                label="Create Channel"
                svgClass="fill-fg"
                onClick={() => setShowCreateChannelModal(true)}
              />
              <GuildDropdownButton
                icon={FolderPlus}
                label="Create Category"
                svgClass="fill-fg"
                onClick={() => setShowCreateCategoryModal(true)}
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
                onClick={() => setConfirmGuildLeaveModal(true)}
              />
            </Show>
          </ul>
        </Show>
      </div>
      <div class="flex flex-col w-full p-2">
        <SidebarButton href={`/guilds/${guildId()}`} svg={HomeIcon} active={!channelId()}>Home</SidebarButton>
        <For each={[...channels()?.get(null)?.children ?? []]}>
          {(channel) => <RenderChannel channel={channel} />}
        </For>
      </div>
    </div>
  )
}
