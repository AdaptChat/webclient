import {ModalTemplate, useModal} from "../ui/Modal";
import {createMemo, createSignal, Show} from "solid-js";
import {Rgb} from "../../client/themes";
import PenToSquare from "../icons/svg/PenToSquare";
import Icon from "../icons/Icon";
import Plus from "../icons/svg/Plus";
import {getApi} from "../../api/Api";
import Palette from "../icons/svg/Palette";
import {useNavigate} from "@solidjs/router";

interface Props {
  guildId: bigint
}

export default function CreateRoleModal(props: Props) {
  const {hideModal} = useModal()
  const [currentName, setCurrentName] = createSignal<string>("")

  let actualColorInput: HTMLInputElement | null = null
  const [currentColor, setCurrentColor] = createSignal<Rgb>()

  const computeColor = (color: string): Rgb => {
    const [r, g, b] = color.match(/\w\w/g)!.map(c => parseInt(c, 16))
    return [r, g, b]
  }
  const fg = createMemo(() => {
    const color = currentColor()
    if (!color)
      return 'fill-fg'

    const [red, green, blue] = color
    return (red * 0.299 + green * 0.587 + blue * 0.114) > 186 ? 'fill-black' : 'fill-white'
  })
  const hex = createMemo(() => {
    const color = currentColor()
    return color
      ? `#${color.map(c => c.toString(16).padStart(2, '0')).join('')}`
      : '#000000'
  })

  const api = getApi()!
  const [error, setError] = createSignal<string>("")
  const [submitting, setSubmitting] = createSignal(false)

  const navigate = useNavigate()

  const onSubmit = async (e: Event) => {
    e.preventDefault()

    const color = currentColor()
    const name = currentName()!
    const json: Record<string, any> = { name }

    if (color != null)
      json.color = { type: 'solid', 'color': (color[0] << 16) + (color[1] << 8) + color[2] }

    setSubmitting(true)
    const response = await api.request('POST', `/guilds/${props.guildId}/roles`, { json })
    setSubmitting(false)

    if (response.ok) {
      hideModal()
      navigate(`/guilds/${props.guildId}/settings/roles/${response.jsonOrThrow().id}`)
    } else
      setError(response.errorJsonOrThrow().message)
  }

  return (
    <ModalTemplate title="Create Role">
      <form onSubmit={onSubmit} class="flex flex-col gap-y-2 pt-6">
        <div class="flex items-center gap-x-2">
          <div
            class="group/palette rounded-lg overflow-hidden w-14 h-14 relative hover:cursor-pointer outline outline-fg/20"
            style={{ "background-color": currentColor() ? `rgb(${currentColor()?.join(' ')})` : 'transparent' }}
            onClick={() => actualColorInput!.click()}
          >
            <input
              ref={actualColorInput!}
              type="color"
              class="absolute invisible inset-0 w-full h-full"
              value={hex()}
              onInput={e => setCurrentColor(computeColor(e.currentTarget.value))}
            />
            <div
              classList={{
                "absolute inset-0 transition flex items-center justify-center group-hover/palette:opacity-100": true,
                [currentColor() ? "opacity-0" : "opacity-60"]: true,
              }}
            >
              <Icon icon={currentColor() ? PenToSquare : Palette} class={`w-6 h-6 ${fg()}`} title="Edit Color" />
            </div>
          </div>
          <div class="flex flex-col flex-grow gap-y-1">
            <label class="text-fg/60 text-xs font-bold uppercase">Role Name</label>
            <input
              type="text"
              class="input flex-grow"
              placeholder="Role Name"
              minLength={2}
              maxLength={32}
              required={true}
              value={currentName()}
              onInput={(e) => {
                setCurrentName(e.currentTarget.value)
                setError('')
              }}
            />
          </div>
        </div>
        <button
          type="submit"
          class="btn btn-primary flex-grow disabled:bg-accent/50 disabled:text-opacity-50"
          disabled={!currentName() || submitting()}
        >
          <Icon icon={Plus} class="fill-fg w-4 h-4 mr-2" />
          <span>Create Role</span>
        </button>
      </form>
      <Show when={error()}>
        <div class="text-red-600 mt-2">{error()}</div>
      </Show>
    </ModalTemplate>
  )
}
