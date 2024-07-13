import SidebarButton from "../../../components/ui/SidebarButton";
import {generateSettingsComponents} from "../../settings/SettingsLayout";
import {createMemo, Show} from "solid-js";
import {useParams} from "@solidjs/router";
import {getApi} from "../../../api/Api";
import Trash from "../../../components/icons/svg/Trash";
import CircleInfo from "../../../components/icons/svg/CircleInfo";
import UserTag from "../../../components/icons/svg/UserTag";
import {GuildChannel} from "../../../types/channel";
import {ModalId, useModal} from "../../../components/ui/Modal";

function GuildChannelSettingsSidebar() {
  const params = useParams()
  const api = getApi()!

  const guildId = createMemo(() => BigInt(params.guildId))
  const channelId = createMemo(() => BigInt(params.channelId))
  const channel = createMemo(() => api.cache!.channels.get(channelId()) as GuildChannel | undefined)
  const root = createMemo(() => `/guilds/${guildId()}/${channelId()}/settings`)

  const perms = createMemo(() => api.cache!.getClientPermissions(guildId(), channelId()))
  const hasModifyChannels = () => perms().has('MODIFY_CHANNELS')

  const {showModal} = useModal()

  return (
    <>
      <div class="flex px-1 py-2 text-fg/50 mobile:text-sm mobile:px-1 mobile:pt-0 items-center gap-x-1">
        <span class="font-title">Channel: {channel()?.name}</span>
      </div>
      <SidebarButton large href={root() + '/overview'} svg={CircleInfo} disabled={!hasModifyChannels()}>
        Overview
      </SidebarButton>
      <SidebarButton
        large
        href={root() + '/permissions'}
        active={(pathname) => pathname.startsWith(root() + '/permissions')}
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
          onClick={() => channel() && showModal(ModalId.DeleteChannel, channel()!)}
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
