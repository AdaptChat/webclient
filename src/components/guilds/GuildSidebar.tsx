import {useParams} from "@solidjs/router";
import {createMemo, createSignal, For} from "solid-js";
import {getApi} from "../../api/Api";
import SidebarButton from "../ui/SidebarButton";
import {GuildChannel} from "../../types/channel";
import GuildInviteModal from "./GuildInviteModal";
import Modal from "../ui/Modal";
import ConfirmGuildLeaveModal, {type Props} from "./ConfirmGuildLeaveModal";
import ConfirmGuildDeleteModal from "./ConfirmGuildDelete";
import Icon, {IconElement} from "../icons/Icon";
import ChevronDown from "../icons/svg/ChevronDown";
import UserPlus from "../icons/svg/UserPlus";
import Trash from "../icons/svg/Trash";
import RightFromBracket from "../icons/svg/RightFromBracket";
import HomeIcon from "../icons/svg/Home";
import Hashtag from "../icons/svg/Hashtag";

interface GuildDropdownButtonProps {
  icon: IconElement,
  label: string,
  groupHoverColor?: string,
  svgClass?: string,
  labelClass?: string,
  onClick?: () => any,
}

function GuildDropdownButton(props: GuildDropdownButtonProps) {
  const svgClasses = "w-4 h-4 " + (props.svgClass ?? "")
  const labelClasses = "ml-2 " + (props.labelClass ?? "")
  const groupHoverClass = props.groupHoverColor ? `hover:bg-error` : "hover:bg-accent"

  return (
    <li class={`w-full group/gdb ${groupHoverClass} transition-all duration-300`}>
      <a class="px-3 py-2 text-sm flex items-center" onClick={props.onClick}>
        <Icon icon={props.icon} class={svgClasses} />
        <span class={labelClasses}>{props.label}</span>
      </a>
    </li>
  )
}

export default function GuildSidebar() {
  const { guildId } = useParams()
  const channelId = createMemo(() => {
    const { channelId } = useParams()
    return parseInt(channelId)
  })

  const api = getApi()!
  const guild = api.cache!.guilds.get(parseInt(guildId))
  if (!guild) return

  const [showInviteModal, setShowInviteModal] = createSignal(false)
  const [confirmGuildLeaveModal, setConfirmGuildLeaveModal] = createSignal(false)

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
      <div
        class="w-[calc(100%-1rem)] mt-2 card box-border overflow-hidden flex border-2 border-base-content/10
          group hover:bg-gray-800 transition-all duration-200 cursor-pointer"
      >
        {guild.banner && (
          <figure class="h-20 overflow-hidden flex items-center justify-center">
            <img src={guild.banner} alt="" class="w-full" width="100%" />
          </figure>
        )}
        <div classList={{
          "flex justify-between items-center px-4 pt-2": true,
          "pb-2": !guild.description,
        }}>
          <span class="inline-block font-title card-title text-base text-ellipsis w-40 break-words">
            {guild.name}
          </span>
          <label tabIndex={0} class="cursor-pointer">
            <Icon icon={ChevronDown} title="Server Options" class="w-3 fill-base-content opacity-50" />
          </label>
        </div>
        {guild.description && (
          <div class="card-body px-4 pt-1 pb-2">
            <p class="text-xs text-base-content/50">{guild.description}</p>
          </div>
        )}
        <div class="divider m-0 p-0 h-0 hidden group-hover:flex" />
        <ul tabIndex={0} class="hidden group-hover:flex flex-col">
          <GuildDropdownButton
            icon={UserPlus}
            label="Invite People"
            svgClass="fill-base-content"
            onClick={() => setShowInviteModal(true)}
          />
          <GuildDropdownButton
            icon={isOwner() ? Trash : RightFromBracket}
            label={isOwner() ? "Delete Server" : "Leave Server"}
            groupHoverColor="error"
            svgClass="fill-error group-hover/gdb:fill-base-content"
            labelClass="text-error group-hover/gdb:text-base-content"
            onClick={() => setConfirmGuildLeaveModal(true)}
          />
        </ul>
      </div>
      <div class="flex flex-col w-full p-2">
        <SidebarButton href={`/guilds/${guildId}`} svg={HomeIcon} active={!channelId()}>Home</SidebarButton>
        <For each={guild.channels}>
          {(channel: GuildChannel) => (
            <SidebarButton href={`/guilds/${guildId}/${channel.id}`} svg={Hashtag}>
              {channel.name}
            </SidebarButton>
          )}
        </For>
      </div>
    </div>
  )
}
