import SidebarButton from "../../../components/ui/SidebarButton";
import {generateSettingsComponents, SettingsSection} from "../../settings/SettingsLayout";
import {createMemo, Show} from "solid-js";
import {useParams} from "@solidjs/router";
import {getApi} from "../../../api/Api";
import Trash from "../../../components/icons/svg/Trash";
import GuildIcon from "../../../components/guilds/GuildIcon";
import CircleInfo from "../../../components/icons/svg/CircleInfo";
import UserTag from "../../../components/icons/svg/UserTag";
import Envelope from "../../../components/icons/svg/Envelope";
import {ModalId, useModal} from "../../../components/ui/Modal";
import FaceSmile from "../../../components/icons/svg/FaceSmile";
import Users from "../../../components/icons/svg/Users";
import Gavel from "../../../components/icons/svg/Gavel";
import {t} from "../../../i18n";

function GuildSettingsSidebar() {
  const params = useParams()
  const api = getApi()!

  const guildId = createMemo(() => BigInt(params.guildId as any))
  const guild = createMemo(() => api.cache!.guilds.get(guildId())!)
  const perms = createMemo(() => api.cache!.getClientPermissions(guildId()))
  const root = createMemo(() => `/guilds/${guildId()}/settings`)
  const {showModal} = useModal()

  return (
    <>
      <div class="flex px-1 py-2 text-fg/50 mobile:text-sm mobile:px-1 mobile:pt-0 items-center gap-x-1">
        <GuildIcon guild={guild()} sizeClass="w-8 h-8 mobile:w-7 mobile:h-7 text-xs" unread={false} pings={0} />
        <span class="font-title">{guild().name}</span>
      </div>
      <SidebarButton large href={root() + '/overview'} svg={CircleInfo} disabled={!perms().has('MANAGE_GUILD')}>
        {t('settings.guild.overview.header')}
      </SidebarButton>
      <SidebarButton
        large
        href={root() + '/roles'}
        active={(pathname) => pathname.startsWith(root() + '/roles')}
        svg={UserTag}
        disabled={!perms().has('MANAGE_ROLES')}
      >
        {t('settings.guild.roles.header')}
      </SidebarButton>
      <SidebarButton large href={root() + '/emojis'} svg={FaceSmile} disabled={!perms().has('MANAGE_EMOJIS')}>
        {t('settings.guild.emojis.header')}
      </SidebarButton>

      <SettingsSection>{t('settings.guild.sections.management')}</SettingsSection>
      <SidebarButton large href={root() + '/invites'} svg={Envelope} disabled={!perms().has('MANAGE_INVITES')}>
        {t('settings.guild.invites.header')}
      </SidebarButton>
      <SidebarButton large href={root() + '/members'} svg={Users}>
        {t('settings.guild.members.header')}
      </SidebarButton>
      <SidebarButton large href={root() + '/bans'} svg={Gavel} disabled={!perms().has('BAN_MEMBERS')}>
        Bans
      </SidebarButton>

      <Show when={guild().owner_id == api.cache!.clientId}>
        <div class="bg-fg/10 h-[1px] mx-2 my-2"/>
        <SidebarButton
          large
          svg={Trash}
          danger
          onClick={() => showModal(ModalId.DeleteGuild, guild())}
        >
          {t('settings.guild.delete')}
        </SidebarButton>
      </Show>
    </>
  )
}

export const [GuildSettingsRoot, GuildSettings] = generateSettingsComponents(
  {
    name: t('settings.guild.header'),
    root: ({ guildId }) => `/guilds/${guildId}/settings`,
    init: '/overview',
  },
  GuildSettingsSidebar,
)
