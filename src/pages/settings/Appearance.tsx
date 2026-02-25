import {presets, Rgb, Theme, useTheme} from "../../client/themes";
import ThemePreview from "../../components/settings/ThemePreview";
import {createMemo, ParentProps} from "solid-js";
import Icon from "../../components/icons/Icon";
import ChevronRight from "../../components/icons/svg/ChevronRight";
import Header from "../../components/ui/Header";
import {t} from "../../i18n";
import ColorPicker from "../../components/ui/ColorPicker";

function rgbToHex(rgb: Rgb): string {
  return '#' + rgb.map(c => c.toString(16).padStart(2, '0')).join('')
}

function hexToRgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}

function PaletteColor<Key extends keyof Theme>({
  key,
  label,
}: {
  key: Key | [Key, keyof Theme[Key]]
  label: string
}) {
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

  const hex = createMemo(() => rgbToHex(currentColor()))

  return (
    <div class="flex flex-col items-center gap-1">
      <ColorPicker
        color={hex()}
        onChange={(h) => set(hexToRgb(h))}
        placement="bottom"
        swatchClass="w-12 h-12"
        iconClass="opacity-0"
        title={label}
        width={160}
      />
      <span class="text-xs text-fg/60 text-center leading-tight max-w-[3.5rem]">{label}</span>
    </div>
  )
}

function PaletteGroup(props: ParentProps<{ title: string }>) {
  return (
    <div class="flex flex-col gap-2">
      <h3 class="text-xs font-bold uppercase text-fg/40 tracking-wide">{props.title}</h3>
      <div class="flex flex-wrap gap-3">
        {props.children}
      </div>
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
      <Header>{t('settings.user.themes.header')}</Header>
      <h2 class="font-bold px-4 pt-4 pb-2 text-fg/50 mobile:text-center">{t('settings.user.themes.preset.header')}</h2>
      <div>
        <div class="flex overflow-x-auto gap-4 mx-4 mobile:flex-col">
          <PresetTheme name={t('settings.user.themes.preset.light')} theme={presets.light} />
          <PresetTheme name={t('settings.user.themes.preset.dim')} theme={presets.dim} />
          <PresetTheme name={t('settings.user.themes.preset.dark')} theme={presets.dark} />
        </div>
      </div>

      <Details title={t('settings.user.themes.theme_colors')}>
        <div class="flex justify-center mx-4 mb-6 py-4 md:py-6 px-6 bg-bg-0/50 rounded-lg">
          <div
            class="rounded-xl border-2 border-fg/10 overflow-hidden"
            style="width: min(100%, 666px); height: calc(min(100%, 666px) * 3 / 5)"
          >
            <ThemePreview theme={theme()} />
          </div>
        </div>

        <div class="mx-4 mb-6 grid gap-6 grid-cols-1 sm:grid-cols-2">
          <PaletteGroup title="Accent">
            <PaletteColor key={["accent", "default"]} label="Accent" />
            <PaletteColor key={["accent", "light"]} label="Light" />
          </PaletteGroup>

          <PaletteGroup title="Background">
            <PaletteColor key={["bg", 0]} label="BG 0" />
            <PaletteColor key={["bg", 1]} label="BG 1" />
            <PaletteColor key={["bg", 2]} label="BG 2" />
            <PaletteColor key={["bg", 3]} label="BG 3" />
          </PaletteGroup>

          <PaletteGroup title="Foreground">
            <PaletteColor key="fg" label="Text" />
            <PaletteColor key={["link", "default"]} label="Link" />
            <PaletteColor key={["link", "hover"]} label="Link Hover" />
            <PaletteColor key={["link", "visited"]} label="Visited" />
          </PaletteGroup>

          <PaletteGroup title="Primary">
            <PaletteColor key={["primary", "bg"]} label="BG" />
            <PaletteColor key={["primary", "hover"]} label="Hover" />
            <PaletteColor key={["primary", "fg"]} label="Text" />
          </PaletteGroup>

          <PaletteGroup title="Secondary">
            <PaletteColor key="secondary" label="BG" />
          </PaletteGroup>

          <PaletteGroup title="Success">
            <PaletteColor key={["success", "bg"]} label="BG" />
            <PaletteColor key={["success", "hover"]} label="Hover" />
            <PaletteColor key={["success", "fg"]} label="Text" />
          </PaletteGroup>

          <PaletteGroup title="Danger">
            <PaletteColor key={["danger", "bg"]} label="BG" />
            <PaletteColor key={["danger", "hover"]} label="Hover" />
            <PaletteColor key={["danger", "fg"]} label="Text" />
          </PaletteGroup>

          <PaletteGroup title="Neutral">
            <PaletteColor key={["neutral", "bg"]} label="BG" />
            <PaletteColor key={["neutral", "hover"]} label="Hover" />
            <PaletteColor key={["neutral", "fg"]} label="Text" />
          </PaletteGroup>
        </div>
      </Details>

      <Details title={t('settings.user.themes.custom_css')}>
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
