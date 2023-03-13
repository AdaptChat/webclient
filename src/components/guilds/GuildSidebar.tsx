import {useParams} from "@solidjs/router";
import {createMemo, createSignal, For} from "solid-js";
import {getApi} from "../../api/Api";
import SidebarButton from "../ui/SidebarButton";
import {GuildChannel} from "../../types/channel";
import GuildInviteModal from "./GuildInviteModal";
import Modal from "../ui/Modal";
import ConfirmGuildLeaveModal, {type Props} from "./ConfirmGuildLeaveModal";
import ConfirmGuildDeleteModal from "./ConfirmGuildDelete";

interface GuildDropdownButtonProps {
  icon: string,
  label: string,
  groupHoverColor?: string,
  svgClass?: string,
  labelClass?: string,
  onClick?: () => any,
}

function GuildDropdownButton(props: GuildDropdownButtonProps) {
  const svgClasses = "w-4 h-4 invert " + (props.svgClass ?? "")
  const labelClasses = "ml-2 " + (props.labelClass ?? "")
  const groupHoverClass = props.groupHoverColor ? `hover:bg-error` : "hover:bg-accent"

  return (
    <li class={`w-full group/gdb ${groupHoverClass} transition-all duration-300`}>
      <a class="px-3 py-2 text-sm flex items-center" onClick={props.onClick}>
        <img src={props.icon} alt="" class={svgClasses} width={16}/>
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
        class="w-[calc(100%-2rem)] mt-4 card box-border overflow-hidden flex border-2 border-base-content/10
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
          <span class="inline-block font-title card-title text-base text-ellipsis w-36 break-words">
            {guild.name}
          </span>
          <label tabIndex={0} class="cursor-pointer">
            <img src="/icons/chevron-down.svg" alt="Server Options" class="w-3 invert opacity-50" width={12} />
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
            icon="/icons/user-plus.svg"
            label="Invite People"
            onClick={() => setShowInviteModal(true)}
          />
          <GuildDropdownButton
            icon={isOwner() ? "/icons/trash.svg" : "/icons/right-from-bracket.svg"}
            label={isOwner() ? "Delete Server" : "Leave Server"}
            groupHoverColor="error"
            svgClass="filter-error group-hover/gdb:invert"
            labelClass="text-error group-hover/gdb:text-base-content"
            onClick={() => setConfirmGuildLeaveModal(true)}
          />
        </ul>
      </div>
      <div class="flex flex-col w-full p-2">
        <SidebarButton href={`/guilds/${guildId}`} svg="/icons/home.svg" active={!channelId()}>Home</SidebarButton>
        <For each={guild.channels}>
          {(channel: GuildChannel) => (
            <SidebarButton
              href={`/guilds/${guildId}/${channel.id}`}
              svg="/icons/hashtag.svg"
            >
              {channel.name}
            </SidebarButton>
          )}
        </For>
      </div>
    </div>
  )
}
