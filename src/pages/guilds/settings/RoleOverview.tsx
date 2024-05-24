import {createEffect, createMemo, createSignal, onCleanup, onMount, ParentProps, Setter, Show} from "solid-js";
import {useParams} from "@solidjs/router";
import {getApi} from "../../../api/Api";
import {useSaveTask} from "../../settings/SettingsLayout";
import iro from "@jaames/iro";
import Icon from "../../../components/icons/Icon";
import PenToSquare from "../../../components/icons/svg/PenToSquare";
import Palette from "../../../components/icons/svg/Palette";
import {RoleFlags} from "../../../api/Bitflags";

const PRESETS = [
  ['#EF4444', '#F97316', '#EAB308', '#84CC16', '#10B981', '#06B6D4', '#3B82F6', '#A855F7', '#EC4899'],
  ['#DC2626', '#EA580C', '#CA8A04', '#65A30D', '#059669', '#4F46E5', '#8B5CF6', '#9333EA', '#DB2777'],
]

export default function RoleOverview() {
  const params = useParams()

  const api = getApi()!
  const cache = api.cache!

  const roleId = createMemo(() => BigInt(params.roleId))
  const role = createMemo(() => cache.roles.get(roleId())!)

  const [roleName, setRoleName] = createSignal<string>()
  createEffect(() => setRoleName(role().name))

  const originalRoleColor = createMemo(() => {
    const color = role().color?.toString(16).padStart(6, '0')
    return color ? '#' + color : null
  })
  const [roleColor, setRoleColor] = createSignal<string | null>(null)
  createEffect(() => setRoleColor(originalRoleColor()))

  let colorPickerRef: HTMLDivElement | null = null
  const [colorPicker, setColorPicker] = createSignal<iro.ColorPicker>()
  onMount(() => {
    setColorPicker(iro.ColorPicker(colorPickerRef!, {
      width: 150,
      color: roleColor() ?? '#000000',
      layout: [
        {component: iro.ui.Box},
        {component: iro.ui.Slider, options: {sliderType: 'hue'}},
      ],
      sliderSize: 12,
      sliderMargin: 8,
    }))
  })
  createEffect(() => {
    const picker = colorPicker()
    if (picker) picker.setColors([roleColor() ?? '#000000'])
  })

  const colorPickerHandler = (color: iro.Color) => {
    setRoleColor(color.hexString)
  }
  createEffect(() => colorPicker()?.on('color:change', colorPickerHandler))
  onCleanup(() => colorPicker()?.off('color:change', colorPickerHandler))

  const fg = createMemo(() => {
    roleColor() // reactivity
    const picker = colorPicker()
    if (!picker) return 'fill-fg'

    const {r, g, b} = picker.color.rgb
    return (r * 0.299 + g * 0.587 + b * 0.114) > 186 ? 'fill-black' : 'fill-white'
  })

  let pickerAreaRef: HTMLDivElement | null = null
  const [showColorPicker, setShowColorPicker] = createSignal(false)
  const listener = (e: MouseEvent) => {
    if (pickerAreaRef && !pickerAreaRef.contains(e.target as Node)) setShowColorPicker(false)
  }
  onMount(() => document.addEventListener('click', listener))
  onCleanup(() => document.removeEventListener('click', listener))

  const [roleFlags, setRoleFlags] = createSignal(RoleFlags.empty())
  createEffect(() => setRoleFlags(RoleFlags.fromValue(role().flags)))

  const [setChanged, error] = useSaveTask(
    async () => {
      const json: Record<string, any> = {}
      if (roleName() !== role().name)
        json.name = roleName()

      if (roleColor() !== originalRoleColor())
        json.color = parseInt(roleColor()?.slice(1) ?? '0', 16)

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
      <h2 class="font-bold uppercase text-fg/60 text-sm my-2">Role Name</h2>
      <input
        class="input w-full disabled:opacity-50"
        placeholder="Member"
        onInput={(e) => setRoleName(e.currentTarget.value)}
        value={roleName() ?? ''}
        minLength={1}
        maxLength={32}
        disabled={roleFlags().has('DEFAULT')}
      />
      <h2 class="font-bold uppercase text-fg/60 text-sm mt-6 mb-2">Role Color</h2>
      <div class="flex">
        <div ref={pickerAreaRef!} class="flex flex-col items-center self-start relative">
          <button
            class="rounded-xl w-16 h-16 border-2 border-fg/20 group flex items-center justify-center"
            style={{ "background-color": roleColor() ?? 'transparent' }}
            onClick={() => setShowColorPicker(p => !p)}
          >
            <Icon
              icon={roleColor() ? PenToSquare : Palette}
              class="w-6 h-6 transition-opacity group-hover:opacity-100"
              classList={{ [fg()]: true, [roleColor() == null ? 'opacity-70' : 'opacity-25']: true }}
              title="Pick Color"
            />
          </button>
          <Show when={roleColor() != null}>
            <button class="text-sm text-fg/50 hover:text-fg/100 transition mt-1" onClick={() => setRoleColor(null)}>
              Remove
            </button>
          </Show>
          <div
            class="bg-bg-0/80 backdrop-blur rounded-xl p-4 absolute left-full top-0 mx-2 transition-opacity"
            classList={{
              "opacity-0 pointer-events-none": !showColorPicker(),
              "opacity-100": showColorPicker(),
            }}
          >
            <div ref={colorPickerRef!} />
            <input
              class="mt-2 w-full bg-0 rounded-lg text-sm font-light py-1 px-2 outline-none focus:ring-2 ring-accent"
              value={roleColor() ?? ""}
              placeholder="#abcdef"
              onInput={(e) => {
                let candidate = e.currentTarget.value
                if (!candidate.startsWith('#')) candidate = '#' + candidate

                if (/^#[0-9A-Fa-f]{3,6}$/.test(candidate)) setRoleColor(candidate)
              }}
              maxLength={7}
            />
          </div>
        </div>
        <div class="flex flex-col ml-2 gap-y-1">
          {PRESETS.map((preset) => (
            <div class="flex gap-x-1">
              {preset.map((color) => (
                <button
                  class="w-[30px] h-[30px] mobile:w-6 mobile:h-6 rounded-lg border-2 border-fg/20 hover:border-fg transition"
                  style={{ "background-color": color }}
                  onClick={() => setRoleColor(color)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <Show when={!roleFlags().has('DEFAULT')}>
        <FlagSetting roleFlags={roleFlags()} setRoleFlags={setRoleFlags} label="Hoist members with this role" flag="HOISTED">
          Display members with this role separately in the members list
        </FlagSetting>
        <FlagSetting roleFlags={roleFlags()} setRoleFlags={setRoleFlags} label="Allow everyone to mention this role" flag="MENTIONABLE">
          Allows all members, regardless of permission, to collectively mention all members in this role
        </FlagSetting>
      </Show>
    </>
  )
}

function FlagSetting(props: ParentProps<{ roleFlags: RoleFlags, setRoleFlags: Setter<RoleFlags>, label: string, flag: string }>) {
  return (
    <div class="mt-6 flex justify-between items-center gap-x-2">
      <div>
        <h3 class="font-title text-lg">{props.label}</h3>
        <p class="text-sm font-light text-fg/70">{props.children}</p>
      </div>
      <input
        type="checkbox"
        class="flex-shrink-0 checkbox"
        checked={props.roleFlags.has(props.flag)}
        onInput={(e) => {
          props.setRoleFlags(p => p.update({ [props.flag]: e.currentTarget.checked }).copy())
        }}
      />
    </div>
  )
}