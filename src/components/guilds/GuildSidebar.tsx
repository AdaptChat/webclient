import {useParams} from "@solidjs/router";
import {createMemo, createSignal, For, Show} from "solid-js";
import {getApi} from "../../api/Api";
import SidebarButton from "../ui/SidebarButton";
import {GuildChannel} from "../../types/channel";
import GuildInviteModal from "./GuildInviteModal";
import Modal from "../ui/Modal";
import ConfirmGuildLeaveModal, {type Props} from "./ConfirmGuildLeaveModal";
import ConfirmGuildDeleteModal from "./ConfirmGuildDeleteModal";
import Icon, {IconElement} from "../icons/Icon";
import ChevronDown from "../icons/svg/ChevronDown";
import UserPlus from "../icons/svg/UserPlus";
import Trash from "../icons/svg/Trash";
import RightFromBracket from "../icons/svg/RightFromBracket";
import HomeIcon from "../icons/svg/Home";
import Hashtag from "../icons/svg/Hashtag";
import useContextMenu from "../../hooks/useContextMenu";
import ContextMenu, {ContextMenuButton, DangerContextMenuButton} from "../ui/ContextMenu";
import Clipboard from "../icons/svg/Clipboard";
import ConfirmChannelDeleteModal from "../channels/ConfirmChannelDeleteModal";

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
  const labelClasses = "ml-2 " + (props.labelClass ?? "")
  const groupHoverClass = props.groupHoverColor ? `hover:bg-danger` : "hover:bg-accent"

  return (
    <li class={`w-full group/gdb ${groupHoverClass} transition-all duration-300`}>
      <a class={`px-4 ${props.py ?? 'py-1.5'} text-sm flex items-center`} onClick={props.onClick}>
        <Icon icon={props.icon} class={svgClasses} />
        <span class={labelClasses}>{props.label}</span>
      </a>
    </li>
  )
}

export default function GuildSidebar() {
  const { guildId: guildIdString } = useParams()
  const guildId = parseInt(guildIdString)

  const channelId = createMemo(() => {
    const { channelId } = useParams()
    return parseInt(channelId)
  })
  const contextMenu = useContextMenu()!

  const api = getApi()!
  const guild = api.cache!.guilds.get(guildId)
  if (!guild) return

  const [dropdownExpanded, setDropdownExpanded] = createSignal(false)
  const [showInviteModal, setShowInviteModal] = createSignal(false)
  const [confirmGuildLeaveModal, setConfirmGuildLeaveModal] = createSignal(false)

  const [channelToDelete, setChannelToDelete] = createSignal<GuildChannel | null>(null)
  const [confirmChannelDeleteModal, setConfirmChannelDeleteModal] = createSignal(false)

  const isOwner = createMemo(() => guild.owner_id === api.cache?.clientUser?.id)
  const GuildRemoveComponent = (props: Props) => {
    return isOwner()
      ? <ConfirmGuildDeleteModal {...props} />
      : <ConfirmGuildLeaveModal {...props} />
  }

  return (
    <div class="flex flex-col items-center justify-center w-full">
      <Modal get={showInviteModal} set={setShowInviteModal}>
        <GuildInviteModal guild={guild} show={showInviteModal} />
      </Modal>
      <Modal get={confirmGuildLeaveModal} set={setConfirmGuildLeaveModal}>
        <GuildRemoveComponent guild={guild} setConfirmGuildLeaveModal={setConfirmGuildLeaveModal} />
      </Modal>
      <Modal get={confirmChannelDeleteModal} set={setConfirmChannelDeleteModal}>
        <Show when={channelToDelete()}>
          <ConfirmChannelDeleteModal channel={channelToDelete()!} setConfirmChannelDeleteModal={setConfirmChannelDeleteModal} />
        </Show>
      </Modal>
      <div
        class="w-[calc(100%-1rem)] rounded-xl mt-2 box-border overflow-hidden flex flex-col border-2 border-bg-3
          group hover:bg-2 transition-all duration-200 cursor-pointer"
        onClick={() => setDropdownExpanded(prev => !prev)}
      >
        {guild.banner && (
          <figure class="h-20 overflow-hidden flex items-center justify-center">
            <img src={guild.banner} alt="" class="w-full" width="100%" />
          </figure>
        )}
        <div classList={{
          "flex justify-between items-center px-4 pt-3": true,
          "pb-3": !guild.description,
        }}>
          <span class="inline-block font-title font-bold text-base text-ellipsis w-40 break-words">
            {guild.name}
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
        {guild.description && (
          <div class="card-body px-4 pt-1 pb-3">
            <p class="text-xs text-fg/50">{guild.description}</p>
          </div>
        )}
        <Show when={dropdownExpanded()}>
          <div class="bg-bg-3/50 mx-2 h-0.5 rounded-full flex" />
          <ul tabIndex={0} class="flex flex-col">
            <GuildDropdownButton
              icon={UserPlus}
              label="Invite People"
              svgClass="fill-fg"
              onClick={() => setShowInviteModal(true)}
              py="pt-2 pb-1.5"
            />
            <GuildDropdownButton
              icon={isOwner() ? Trash : RightFromBracket}
              label={isOwner() ? "Delete Server" : "Leave Server"}
              groupHoverColor="error"
              svgClass="fill-danger group-hover/gdb:fill-fg"
              labelClass="text-danger group-hover/gdb:text-fg"
              onClick={() => setConfirmGuildLeaveModal(true)}
              py="pt-1.5 pb-2"
            />
          </ul>
        </Show>
      </div>
      <div class="flex flex-col w-full p-2">
        <SidebarButton href={`/guilds/${guildId}`} svg={HomeIcon} active={!channelId()}>Home</SidebarButton>
        <For each={
          api.cache!.guildChannelReactor
            .get(guildId)
            ?.map(id => api.cache!.channels.get(id) as GuildChannel)
            .filter(c => c)
        }>
          {(channel: GuildChannel) => (
            <SidebarButton
              href={`/guilds/${guildId}/${channel.id}`}
              svg={Hashtag}
              onContextMenu={contextMenu.getHandler(
                <ContextMenu>
                  <ContextMenuButton
                    icon={Clipboard}
                    label="Copy Channel ID"
                    onClick={() => window.navigator.clipboard.writeText(channel.id.toString())}
                  />
                  <Show when={api.cache!.getClientPermissions(guildId, channel.id).has('MANAGE_CHANNELS')}>
                    <DangerContextMenuButton
                      icon={Trash}
                      label="Delete Channel"
                      onClick={() => {
                        setChannelToDelete(channel)
                        setConfirmChannelDeleteModal(true)
                      }}
                    />
                  </Show>
                </ContextMenu>
              )}
            >
              {channel.name}
            </SidebarButton>
          )}
        </For>
      </div>
    </div>
  )
}
