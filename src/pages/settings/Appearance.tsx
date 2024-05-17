import {presets, Rgb, Theme, useTheme} from "../../client/themes";
import ThemePreview from "../../components/settings/ThemePreview";
import {createMemo, createSignal, ParentProps} from "solid-js";
import Icon from "../../components/icons/Icon";
import PenToSquare from "../../components/icons/svg/PenToSquare";
import ChevronRight from "../../components/icons/svg/ChevronRight";
import Header from "../../components/ui/Header";

function PaletteColor<Key extends keyof Theme>({ key, label }: { key: Key | [Key, keyof Theme[Key]], label: string }) {
  function computeColor(color: string): Rgb {
    dummyElement!.style.color = color
    const computed = getComputedStyle(dummyElement!).color
    const [r, g, b] = computed.match(/\d+/g)!.map(Number)
    return [r, g, b]
  }

  const [theme, setTheme] = useTheme()
  const currentColor = createMemo<Rgb>(() => {
    if (typeof key === 'string') return theme()[key] as Rgb
    const [key1, key2] = key
    // @ts-ignore
    return theme()[key1][key2] as Rgb
  })
  const set = (color: Rgb) => {
    setTheme(theme => {
      theme = { ...theme }
      if (typeof key === 'string') {
        // @ts-ignore
        theme[key] = color
      } else {
        const [key1, key2] = key
        // @ts-ignore
        theme[key1] = { ...theme[key1], [key2]: color }
      }
      return theme
    })
  }

  let dummyElement: HTMLDivElement | null = null
  let actualColorInput: HTMLInputElement | null = null

  const fg = createMemo(() => {
    const [red, green, blue] = currentColor()
    return (red * 0.299 + green * 0.587 + blue * 0.114) > 186 ? 'fill-black' : 'fill-white'
  })
  const hex = createMemo(() => {
    return `#${currentColor().map(c => c.toString(16).padStart(2, '0')).join('')}`
  })
  const [inputValue, setInputValue] = createSignal()

  return (
    <>
      <div ref={dummyElement!} class="absolute" />
      <div class="flex flex-grow items-center justify-center p-4 rounded-lg bg-bg-3/50">
        <div
          class="group/palette rounded-lg overflow-hidden w-14 h-14 relative hover:cursor-pointer outline outline-fg/20"
          style={{ "background-color": `rgb(${currentColor().join(' ')})` }}
          onClick={() => actualColorInput!.click()}
        >
          <input
            ref={actualColorInput!}
            type="color"
            class="absolute invisible inset-0 w-full h-full"
            value={hex()}
            onInput={e => {
              set(computeColor(e.currentTarget.value))
              setInputValue(hex())
            }}
          />
          <div
            class="absolute inset-0 opacity-0 group-hover/palette:opacity-100 transition flex items-center justify-center">
            <Icon icon={PenToSquare} class={`w-6 h-6 ${fg()}`} title="Edit Color" />
          </div>
        </div>
        <div class="ml-4">
          <h2 class="font-title font-bold text-lg">{label}</h2>
          <input
            type="text"
            class="bg-2 rounded-lg p-2 focus:outline-none"
            value={(inputValue() ?? hex()) as any}
            onInput={(e) => {
              let value = e.currentTarget.value
              if (value.match(/^([0-9]{3,}|[0-9a-fA-F]{6})/)) value = '#' + value
              set(computeColor(value))
              setInputValue(value)
            }}
          />
        </div>
      </div>
    </>
  )
}

function PaletteGroup(props: ParentProps<{ title: string }>) {
  return (
    <div class="relative flex flex-wrap gap-2 rounded-xl border-2 border-fg/10 p-4 m-4">
      <div class="absolute -top-3.5 left-0 w-full flex justify-center">
        <h2 class="bg-2 px-2 font-medium text-center text-fg/30">
          {props.title}
        </h2>
      </div>
      {props.children}
    </div>
  )
}

function PresetTheme({ name, theme }: { name: string, theme: Theme }) {
  const [currentTheme, setTheme] = useTheme()
  const selected = createMemo(() => currentTheme().id === theme.id)

  return (
    <div
      class="flex flex-col mobile:w-full md:min-w-[256px] items-center cursor-pointer group"
      onClick={() => setTheme(theme, true)}
    >
      <div classList={{
        "border-2 transition rounded-lg overflow-hidden w-full": true,
        "border-fg/10 group-hover:border-accent-light": !selected(),
        "border-accent": selected(),
      }}>
        <ThemePreview theme={theme} />
      </div>
      <span classList={{
        "font-title font-bold p-1 transition-colors": true,
        "text-fg/70": !selected(),
        "text-fg/100": selected(),
      }}>
        {name}
      </span>
    </div>
  )
}

function Details(props: ParentProps<{ title: string }>) {
  return (
    <details class="group">
      <summary class="flex items-center cursor-pointer text-fg/50 font-bold p-4">
        {props.title}
        <Icon icon={ChevronRight} class="fill-fg/50 w-4 h-4 ml-2 rotate-0 group-open:rotate-90 transition-transform" />
      </summary>
      {props.children}
    </details>
  )
}

export default function Appearance() {
  const [theme, setTheme] = useTheme()

  return (
    <div class="flex flex-col w-full h-full">
      <Header>Theme</Header>
      <h2 class="font-bold px-4 pt-4 pb-2 text-fg/50 mobile:text-center">Preset Themes</h2>
      <div>
        <div class="flex overflow-x-auto gap-4 mx-4 mobile:flex-col">
        <PresetTheme name="Light" theme={presets.light} />
        <PresetTheme name="Dim" theme={presets.dim} />
        <PresetTheme name="Dark" theme={presets.dark} />
        </div>
      </div>

      <Details title="Theme Colors">
        <div
          class="flex flex-col items-center justify-center h-[min(50vw,400px)] overflow-hidden mx-4 mb-8 py-4 md:py-6
            bg-bg-0/50 rounded-lg"
        >
          <div class="h-full rounded-xl border-2 border-fg/10 overflow-hidden">
            <ThemePreview theme={theme()} />
          </div>
        </div>

        <PaletteGroup title="Accent">
          <PaletteColor key={["accent", "default"]} label="Accent" />
          <PaletteColor key={["accent", "light"]} label="Light Accent" />
        </PaletteGroup>

        <PaletteGroup title="Background">
          <PaletteColor key={["bg", 0]} label="Background 0" />
          <PaletteColor key={["bg", 1]} label="Background 1" />
          <PaletteColor key={["bg", 2]} label="Background 2" />
          <PaletteColor key={["bg", 3]} label="Background 3" />
        </PaletteGroup>

        <PaletteGroup title="Foreground">
          <PaletteColor key="fg" label="Text" />
          <PaletteColor key={["link", "default"]} label="Link" />
          <PaletteColor key={["link", "hover"]} label="Link (Hover)" />
          <PaletteColor key={["link", "visited"]} label="Link (Visited)" />
        </PaletteGroup>

        <PaletteGroup title="Primary">
          <PaletteColor key={["primary", "bg"]} label="Primary Button" />
          <PaletteColor key={["primary", "hover"]} label="Primary Button (Hover)" />
          <PaletteColor key={["primary", "fg"]} label="Primary Button (Text)" />
        </PaletteGroup>

        <PaletteGroup title="Secondary">
          <PaletteColor key="secondary" label="Secondary Button" />
        </PaletteGroup>

        <PaletteGroup title="Success">
          <PaletteColor key={["success", "bg"]} label="Success Button" />
          <PaletteColor key={["success", "hover"]} label="Success Button (Hover)" />
          <PaletteColor key={["success", "fg"]} label="Success Button (Text)" />
        </PaletteGroup>

        <PaletteGroup title="Danger">
          <PaletteColor key={["danger", "bg"]} label="Danger Button" />
          <PaletteColor key={["danger", "hover"]} label="Danger Button (Hover)" />
          <PaletteColor key={["danger", "fg"]} label="Danger Button (Text)" />
        </PaletteGroup>

        <PaletteGroup title="Neutral">
          <PaletteColor key={["neutral", "bg"]} label="Neutral Button" />
          <PaletteColor key={["neutral", "hover"]} label="Neutral Button (Hover)" />
          <PaletteColor key={["neutral", "fg"]} label="Neutral Button (Text)" />
        </PaletteGroup>
      </Details>

      <Details title="Custom CSS">
        <div class="flex w-full mb-4">
          <textarea
            class="flex-grow resize-none outline-none bg-0 focus:ring-2 focus:ring-accent font-mono rounded-lg p-4 mx-4 h-64"
            placeholder={'* {\n  color: cyan;\n}'}
            value={theme().css ?? ""}
            onInput={e => setTheme(prev => ({ ...prev, css: e.currentTarget.value }))}
          />
        </div>
      </Details>
    </div>
  )
}
