import {
  createEffect,
  createMemo,
  createSignal,
  on,
  ParentProps,
  Signal
} from "solid-js";
import {useNavigate, useParams} from "@solidjs/router";
import {getApi} from "../../../api/Api";
import {useSaveTask} from "../../settings/SettingsLayout";
import {t} from "../../../i18n";
import {RoleFlags} from "../../../api/Bitflags";
import {MessageHeader} from "../../../components/messaging/Chat";
import ColorPicker from "../../../components/ui/ColorPicker";

const PRESETS = [
  ['#EF4444', '#F97316', '#EAB308', '#84CC16', '#10B981', '#06B6D4', '#3B82F6', '#A855F7', '#EC4899'],
  ['#DC2626', '#EA580C', '#CA8A04', '#65A30D', '#059669', '#4F46E5', '#8B5CF6', '#9333EA', '#DB2777'],
]

export default function RoleOverview() {
  const params = useParams()
  const navigate = useNavigate()

  const api = getApi()!
  const cache = api.cache!

  const roleId = createMemo(() => BigInt(params.roleId as any))
  const role = createMemo(() => cache.roles.get(roleId())!)

  const [roleName, setRoleName] = createSignal<string>()
  createEffect(() => setRoleName(role().name))

  const [roleFlags, setRoleFlags] = createSignal(RoleFlags.empty())
  createEffect(on(role, (role) => {
    setRoleFlags(RoleFlags.fromValue(role.flags))
    if (roleFlags().has('DEFAULT')) navigate(`/guilds/${role.guild_id}/settings/roles/${role.id}/permissions`)
  }))

  const originalRoleColor = createMemo(() => {
    const color = role().color
    if (!color || color.type == 'gradient')
      return null

    return '#' + color.color.toString(16).padStart(6, '0')
  })
  const [roleColor, setRoleColor] = createSignal<string | null>(null)
  createEffect(() => setRoleColor(originalRoleColor()))

  const [setChanged, error] = useSaveTask(
    async () => {
      const json: Record<string, any> = {}
      if (roleName() !== role().name)
        json.name = roleName()

      if (roleColor() !== originalRoleColor())
        json.color = roleColor() ? { type: 'solid', color: parseInt(roleColor()?.slice(1) ?? '0', 16) } : null

      if (roleFlags().value !== BigInt(role().flags)) {
        if (roleFlags().has('HOISTED'))
          json.hoisted = true
        if (roleFlags().has('MENTIONABLE'))
          json.mentionable = true
      }

      const response = await api.request('PATCH', `/guilds/${role().guild_id}/roles/${role().id}`, { json })
      if (!response.ok) throw response.errorJsonOrThrow().message
    },
    () => {
      setRoleName(role().name)
      setRoleColor(originalRoleColor())
      setRoleFlags(RoleFlags.fromValue(role().flags))
    },
  )
  createEffect(() => setChanged(
    roleName() !== role().name
      || roleColor() !== originalRoleColor()
      || roleFlags().value !== BigInt(role().flags)
  ))

  return (
    <>
      <h2 class="font-bold uppercase text-fg/60 text-sm my-2">{t('settings.guild.roles.role.name_label')}</h2>
      <input
        class="input w-full disabled:opacity-50"
        placeholder="Member"
        onInput={(e) => setRoleName(e.currentTarget.value)}
        value={roleName() ?? ''}
        minLength={1}
        maxLength={32}
      />
      <h2 class="font-bold uppercase text-fg/60 text-sm mt-6 mb-2">{t('settings.guild.roles.role.color_label')}</h2>
      <div class="flex">
        <ColorPicker
          nullable
          color={roleColor()}
          onChange={setRoleColor}
          placement="right"
          swatchClass="w-16 h-16"
          title={t('settings.guild.roles.role.pick_color')}
          removeLabel={t('settings.guild.roles.role.remove_color')}
        />
        <div class="flex flex-col ml-2 gap-y-1">
          {PRESETS.map((row: string[]) => (
            <div class="flex gap-x-1">
              {row.map((color: string) => (
                <button
                  class="w-[30px] h-[30px] mobile:w-6 mobile:h-6 rounded-lg border-2 border-fg/20 hover:border-fg transition"
                  style={{"background-color": color}}
                  onClick={() => setRoleColor(color)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <h2 class="font-bold uppercase text-fg/60 text-sm mt-6 mb-2">{t('settings.guild.roles.role.preview_label')}</h2>
      <div class="rounded-xl overflow-hidden">
        <div class="bg-gray-800 text-white px-1 py-3">
          <MessageHeader
            authorAvatar={cache.clientAvatar}
            authorName={cache.clientUser!.username}
            authorColor={{type: 'solid', color: parseInt((roleColor() ?? '#ffffff')?.slice(1), 16)}}
            timestamp={Date.now()}
            class="[&_.timestamp]:!text-white/50"
            noHoverEffects
          >
            <span class="text-sm text-white">{t('settings.guild.roles.role.dark_theme')}</span>
          </MessageHeader>
        </div>
        <div class="bg-white text-black px-1 py-3">
          <MessageHeader
            authorAvatar={cache.clientAvatar}
            authorName={cache.clientUser!.username}
            authorColor={{type: 'solid', color: parseInt((roleColor() ?? '#000000')?.slice(1), 16)}}
            timestamp={Date.now()}
            class="[&_.timestamp]:!text-black/50"
            noHoverEffects
          >
            <span class="text-sm text-black">{t('settings.guild.roles.role.light_theme')}</span>
          </MessageHeader>
        </div>
      </div>
      <FlagSetting signal={[roleFlags, setRoleFlags]} label={t('settings.guild.roles.role.hoist.label')} flag="HOISTED">
        {t('settings.guild.roles.role.hoist.description')}
      </FlagSetting>
      <FlagSetting signal={[roleFlags, setRoleFlags]} label={t('settings.guild.roles.role.mentionable.label')} flag="MENTIONABLE">
        {t('settings.guild.roles.role.mentionable.description')}
      </FlagSetting>
    </>
  )
}

function FlagSetting(props: ParentProps<{ signal: Signal<RoleFlags>, label: string, flag: string }>) {
  let [roleFlags, setRoleFlags] = props.signal
  return (
    <div class="mt-6 flex justify-between items-center gap-x-2">
      <div>
        <h3 class="font-title text-lg">{props.label}</h3>
        <p class="text-sm font-light text-fg/70">{props.children}</p>
      </div>
      <input
        type="checkbox"
        class="flex-shrink-0 checkbox"
        checked={roleFlags().has(props.flag)}
        onInput={(e) => {
          setRoleFlags(p => p.update({ [props.flag]: e.currentTarget.checked }).copy())
        }}
      />
    </div>
  )
}
