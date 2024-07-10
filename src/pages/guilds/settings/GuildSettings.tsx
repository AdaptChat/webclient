import SidebarButton from "../../../components/ui/SidebarButton";
import {generateSettingsComponents, SettingsSection} from "../../settings/SettingsLayout";
import {createMemo, createSignal, Show} from "solid-js";
import {useParams} from "@solidjs/router";
import {getApi} from "../../../api/Api";
import Trash from "../../../components/icons/svg/Trash";
import GuildIcon from "../../../components/guilds/GuildIcon";
import CircleInfo from "../../../components/icons/svg/CircleInfo";
import UserTag from "../../../components/icons/svg/UserTag";
import Envelope from "../../../components/icons/svg/Envelope";
import Modal from "../../../components/ui/Modal";
import ConfirmGuildDeleteModal from "../../../components/guilds/ConfirmGuildDeleteModal";
import FaceSmile from "../../../components/icons/svg/FaceSmile";

function GuildSettingsSidebar() {
  const params = useParams()
  const api = getApi()!

  const guildId = createMemo(() => BigInt(params.guildId))
  const guild = createMemo(() => api.cache!.guilds.get(guildId())!)
  const perms = createMemo(() => api.cache!.getClientPermissions(guildId()))
  const root = createMemo(() => `/guilds/${guildId()}/settings`)

  const [confirmGuildDeleteModal, setConfirmGuildDeleteModal] = createSignal(false)

  return (
    <>
      <Modal get={confirmGuildDeleteModal} set={setConfirmGuildDeleteModal}>
        <ConfirmGuildDeleteModal guild={guild()} setConfirmGuildLeaveModal={setConfirmGuildDeleteModal} />
      </Modal>
      <div class="flex px-1 py-2 text-fg/50 mobile:text-sm mobile:px-1 mobile:pt-0 items-center gap-x-1">
        <GuildIcon guild={guild()} sizeClass="w-8 h-8 mobile:w-7 mobile:h-7 text-xs" unread={false} pings={0} />
        <span class="font-title">{guild().name}</span>
      </div>
      <SidebarButton large href={root() + '/overview'} svg={CircleInfo} disabled={!perms().has('MANAGE_GUILD')}>
        Overview
      </SidebarButton>
      <SidebarButton
        large
        href={root() + '/roles'}
        active={(pathname) => pathname.startsWith(root() + '/roles')}
        svg={UserTag}
        disabled={!perms().has('MANAGE_ROLES')}
      >
        Roles
      </SidebarButton>
      <SidebarButton large href={root() + '/emojis'} svg={FaceSmile} disabled={!perms().has('MANAGE_EMOJIS')}>
        Emojis
      </SidebarButton>

      <SettingsSection>Management</SettingsSection>
      <SidebarButton large href={root() + '/invites'} svg={Envelope} disabled={!perms().has('MANAGE_INVITES')}>
        Invites
      </SidebarButton>

      <Show when={guild().owner_id == api.cache!.clientId}>
        <div class="bg-fg/10 h-[1px] mx-2 my-2"/>
        <SidebarButton
          large
          svg={Trash}
          danger
          onClick={() => setConfirmGuildDeleteModal(true)}
        >
          Delete Server
        </SidebarButton>
      </Show>
    </>
  )
}

export const [GuildSettingsRoot, GuildSettings] = generateSettingsComponents(
  {
    name: 'Server Settings',
    root: ({ guildId }) => `/guilds/${guildId}/settings`,
    init: '/overview',
  },
  GuildSettingsSidebar,
)
