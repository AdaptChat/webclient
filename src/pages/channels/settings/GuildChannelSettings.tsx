import SidebarButton from "../../../components/ui/SidebarButton";
import {generateSettingsComponents} from "../../settings/SettingsLayout";
import {createMemo, createSignal, Show} from "solid-js";
import {useParams} from "@solidjs/router";
import {getApi} from "../../../api/Api";
import Trash from "../../../components/icons/svg/Trash";
import CircleInfo from "../../../components/icons/svg/CircleInfo";
import UserTag from "../../../components/icons/svg/UserTag";
import Modal from "../../../components/ui/Modal";
import ConfirmChannelDeleteModal from "../../../components/channels/ConfirmChannelDeleteModal";
import {GuildChannel} from "../../../types/channel";

function GuildChannelSettingsSidebar() {
  const params = useParams()
  const api = getApi()!

  const guildId = createMemo(() => BigInt(params.guildId))
  const channelId = createMemo(() => BigInt(params.channelId))
  const channel = createMemo(() => api.cache!.channels.get(channelId())! as GuildChannel)
  const root = createMemo(() => `/guilds/${guildId()}/${channelId()}/settings`)

  const perms = createMemo(() => api.cache!.getClientPermissions(guildId(), channelId()))
  const hasModifyChannels = () => perms().has('MODIFY_CHANNELS')

  const [confirmDelete, setConfirmDelete] = createSignal(false)

  return (
    <>
      <Modal get={confirmDelete} set={setConfirmDelete}>
        <ConfirmChannelDeleteModal channel={channel()} setConfirmChannelDeleteModal={setConfirmDelete} />
      </Modal>
      <div class="flex px-1 py-2 text-fg/50 mobile:text-sm mobile:px-1 mobile:pt-0 items-center gap-x-1">
        <span class="font-title">Channel: {channel().name}</span>
      </div>
      <SidebarButton large href={root() + '/overview'} svg={CircleInfo} disabled={!hasModifyChannels()}>
        Overview
      </SidebarButton>
      <SidebarButton
        large
        href={root() + '/roles'}
        active={(pathname) => pathname.startsWith(root() + '/roles')}
        svg={UserTag}
        disabled={!hasModifyChannels()}
      >
        Permissions
      </SidebarButton>

      <Show when={perms().has('MANAGE_CHANNELS')}>
        <div class="bg-fg/10 h-[1px] mx-2 my-2"/>
        <SidebarButton
          large
          svg={Trash}
          danger
          onClick={() => setConfirmDelete(true)}
        >
          Delete Channel
        </SidebarButton>
      </Show>
    </>
  )
}

export const [GuildChannelSettingsRoot, GuildChannelSettings] = generateSettingsComponents(
  {
    name: 'Channel Settings',
    root: ({ guildId, channelId }) => `/guilds/${guildId}/${channelId}/settings`,
    init: '/overview',
  },
  GuildChannelSettingsSidebar,
)
