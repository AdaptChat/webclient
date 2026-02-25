import {createEffect, createSignal, onCleanup, onMount, Show} from "solid-js";
import iro from "@jaames/iro";
import Icon from "../icons/Icon";
import PenToSquare from "../icons/svg/PenToSquare";
import Palette from "../icons/svg/Palette";

interface BaseProps {
  width?: number
  placement?: 'right' | 'bottom'
  title?: string
  swatchClass?: string
  iconClass?: string
}

interface NullableProps extends BaseProps {
  nullable: true
  removeLabel?: string
  color: string | null
  onChange: (color: string | null) => void
}

interface NonNullableProps extends BaseProps {
  nullable?: false
  color: string
  onChange: (color: string) => void
}

type Props = NullableProps | NonNullableProps

export default function ColorPicker(props: Props) {
  const width = () => props.width ?? 150
  const placement = () => props.placement ?? 'right'

  const fg = (hexColor: string | null) => {
    if (!hexColor) return 'fill-fg'
    const r = parseInt(hexColor.slice(1, 3), 16)
    const g = parseInt(hexColor.slice(3, 5), 16)
    const b = parseInt(hexColor.slice(5, 7), 16)
    return (r * 0.299 + g * 0.587 + b * 0.114) > 186 ? 'fill-black' : 'fill-white'
  }

  let colorPickerRef: HTMLDivElement | null = null
  const [colorPicker, setColorPicker] = createSignal<iro.ColorPicker>()

  onMount(() => {
    setColorPicker(iro.ColorPicker(colorPickerRef!, {
      width: width(),
      color: props.color ?? '#000000',
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
    const hex = props.color ?? '#000000'
    if (picker && picker.color.hexString.toLowerCase() !== hex.toLowerCase())
      picker.setColors([hex])
  })

  const colorPickerHandler = (color: iro.Color) => {
    props.onChange(color.hexString as any)
  }
  createEffect(() => colorPicker()?.on('color:change', colorPickerHandler))
  onCleanup(() => colorPicker()?.off('color:change', colorPickerHandler))

  let pickerAreaRef: HTMLDivElement | null = null
  const [showColorPicker, setShowColorPicker] = createSignal(false)
  const outsideClickListener = (e: MouseEvent) => {
    if (pickerAreaRef && !(pickerAreaRef as any).contains(e.target as Node))
      setShowColorPicker(false)
  }
  onMount(() => document.addEventListener('click', outsideClickListener, true))
  onCleanup(() => document.removeEventListener('click', outsideClickListener, true))

  const [hexInput, setHexInput] = createSignal(props.color ?? '')
  createEffect(() => setHexInput(props.color ?? ''))

  const panelPositionClass = () =>
    placement() === 'right' ? 'left-full top-0 mx-2' : 'top-full left-0 mt-2'

  return (
    <div ref={pickerAreaRef!} class="flex flex-col items-center self-start relative">
      <button
        type="button"
        class={`rounded-xl border-2 border-fg/20 group/swatch flex items-center justify-center ${props.swatchClass ?? 'w-14 h-14'}`}
        style={{"background-color": props.color ?? 'transparent'}}
        onClick={() => setShowColorPicker(p => !p)}
      >
        <Icon
          icon={props.color ? PenToSquare : Palette}
          class="w-6 h-6 transition-opacity group-hover/swatch:opacity-100"
          classList={{
            [fg(props.color)]: true,
            [props.iconClass ?? (props.color == null ? 'opacity-70' : 'opacity-25')]: true,
          }}
          title={props.title}
        />
      </button>

      <Show when={props.nullable && props.color != null && props.removeLabel}>
        <button
          type="button"
          class="text-xs text-fg/50 hover:text-fg/100 transition mt-1"
          onClick={() => (props as NullableProps).onChange(null)}
        >
          {(props as NullableProps).removeLabel}
        </button>
      </Show>

      <div
        class={`bg-bg-0/80 backdrop-blur rounded-xl p-4 absolute z-[200] transition-opacity ${panelPositionClass()}`}
        classList={{
          'opacity-0 pointer-events-none': !showColorPicker(),
          'opacity-100': showColorPicker(),
        }}
      >
        <div ref={colorPickerRef!} />
        <input
          class="mt-2 w-full bg-0 rounded-lg text-sm font-light py-1 px-2 outline-none focus:ring-2 ring-accent"
          value={hexInput()}
          placeholder="#abcdef"
          onInput={(e) => {
            let candidate = e.currentTarget.value
            setHexInput(candidate)
            if (!candidate.startsWith('#')) candidate = '#' + candidate
            if (/^#[0-9A-Fa-f]{6}$/.test(candidate))
              props.onChange(candidate as any)
          }}
          maxLength={7}
        />
      </div>
    </div>
  )
}
