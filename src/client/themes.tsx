import {Accessor, createContext, createSignal, ParentProps, Setter, useContext} from "solid-js";

export type Rgb = [number, number, number]

export interface AccentColors {
  default: Rgb,
  light: Rgb,
}

export interface ButtonColors {
  bg: Rgb,
  hover: Rgb,
  fg: Rgb,
}

export interface LinkColors {
  default: Rgb,
  hover: Rgb,
  visited: Rgb,
}

export interface Theme {
  id: number,
  bg: [Rgb, Rgb, Rgb, Rgb], // bg-0, bg-1, bg-2, bg-3
  fg: Rgb,
  accent: AccentColors,
  primary: ButtonColors,
  secondary: Rgb,
  success: ButtonColors,
  danger: ButtonColors,
  neutral: ButtonColors,
  link: LinkColors,
  css?: string,
}

export const presets: Record<string, Theme> = {
  light: {
    id: 0,
    bg: [
      [232, 232, 232], [245, 245, 245],
      [255, 255, 255], [224, 224, 224],
    ],
    fg: [0, 0, 0],
    accent: {
      "default": [87, 174, 255],
      light: [5, 134, 255]
    },
    primary: {
      bg: [71, 169, 255],
      hover: [102, 184, 255],
      fg: [0, 0, 0]
    },
    secondary: [190, 61, 255],
    success: {
      bg: [4, 251, 160],
      hover: [77, 255, 190],
      fg: [0, 0, 0]
    },
    danger: {
      bg: [255, 77, 77],
      hover: [255, 26, 26],
      fg: [0, 0, 0]
    },
    neutral: {
      bg: [209, 209, 209],
      hover: [194, 194, 194],
      fg: [0, 0, 0]
    },
    link: {
      "default": [75, 213, 255],
      hover: [155, 232, 255],
      visited: [75, 213, 255]
    }
  },
  dim: {
    id: 1,
    bg: [
      [17, 24, 39], [23, 32, 46],
      [29, 39, 52], [55, 65, 81],
    ],
    fg: [255, 255, 255],
    accent: {
      "default": [5, 134, 255],
      light: [87, 174, 255],
    },
    primary: {
      bg: [0, 120, 225],
      hover: [0, 95, 179],
      fg: [255, 255, 255]
    },
    secondary: [190, 61, 255],
    success: {
      bg: [19, 176, 118],
      hover: [12, 138, 91],
      fg: [255, 255, 255]
    },
    danger: {
      bg: [238, 52, 52],
      hover: [184, 28, 28],
      fg: [255, 255, 255]
    },
    neutral: {
      bg: [55, 60, 75],
      hover: [45, 50, 65],
      fg: [255, 255, 255]
    },
    link: {
      "default": [75, 213, 255],
      hover: [155, 232, 255],
      visited: [75, 213, 255]
    }
  },
  dark: {
    id: 2,
    bg: [
      [33, 35, 38], [22, 23, 24],
      [12, 12, 13], [35, 36, 41],
    ],
    fg: [255, 255, 255],
    accent: {
      "default": [5, 134, 255],
      light: [87, 174, 255]
    },
    primary: {
      bg: [0, 120, 225],
      hover: [0, 95, 179],
      fg: [255, 255, 255]
    },
    secondary: [190, 61, 255],
    success: {
      bg: [19, 176, 118],
      hover: [12, 138, 91],
      fg: [255, 255, 255]
    },
    danger: {
      bg: [238, 52, 52],
      hover: [184, 28, 28],
      fg: [255, 255, 255]
    },
    neutral: {
      bg: [55, 60, 75],
      hover: [45, 50, 65],
      fg: [255, 255, 255]
    },
    link: {
      "default": [75, 213, 255],
      hover: [155, 232, 255],
      visited: [75, 213, 255]
    }
  }
}

/**
 * Exports the current theme from CSS variables
 */
function exportTheme(): Theme {
  const root = document.querySelector(':root')!
  const get = (name: string) =>
    getComputedStyle(root).getPropertyValue(`--c-${name}`).split(' ').map(Number) as Rgb

  return {
    id: -1,
    bg: [get('bg-0'), get('bg-1'), get('bg-2'), get('bg-3')],
    fg: get('fg'),
    accent: {
      default: get('accent'),
      light: get('accent-light'),
    },
    primary: {
      bg: get('primary'),
      hover: get('primary-hover'),
      fg: get('primary-fg'),
    },
    secondary: get('secondary'),
    success: {
      bg: get('success'),
      hover: get('success-hover'),
      fg: get('success-fg'),
    },
    danger: {
      bg: get('danger'),
      hover: get('danger-hover'),
      fg: get('danger-fg'),
    },
    neutral: {
      bg: get('neutral'),
      hover: get('neutral-hover'),
      fg: get('neutral-fg'),
    },
    link: {
      default: get('link'),
      hover: get('link-hover'),
      visited: get('link-visited'),
    },
  }
}

/**
 * Applies a theme to the CSS variables
 */
function applyTheme(theme: Theme) {
  const root: HTMLHtmlElement = document.querySelector(':root')!
  const set = (name: string, value: Rgb) =>
    root.style.setProperty(`--c-${name}`, value.join(' '))

  set('bg-0', theme.bg[0])
  set('bg-1', theme.bg[1])
  set('bg-2', theme.bg[2])
  set('bg-3', theme.bg[3])
  set('fg', theme.fg)
  set('accent', theme.accent.default)
  set('accent-light', theme.accent.light)
  set('primary', theme.primary.bg)
  set('primary-hover', theme.primary.hover)
  set('primary-fg', theme.primary.fg)
  set('secondary', theme.secondary)
  set('success', theme.success.bg)
  set('success-hover', theme.success.hover)
  set('success-fg', theme.success.fg)
  set('danger', theme.danger.bg)
  set('danger-hover', theme.danger.hover)
  set('danger-fg', theme.danger.fg)
  set('neutral', theme.neutral.bg)
  set('neutral-hover', theme.neutral.hover)
  set('neutral-fg', theme.neutral.fg)
  set('link', theme.link.default)
  set('link-hover', theme.link.hover)
  set('link-visited', theme.link.visited)
}

type ExtendedSetter = <U extends Theme>(prev: Theme | ((prev: Theme) => U), saveNow?: boolean) => U
type Inner = [Accessor<Theme>, Setter<Theme> & ExtendedSetter]
const ThemeContext = createContext<Inner>()

const saveTheme = (theme: Theme) => localStorage.setItem('theme', JSON.stringify(theme))

export function ThemeProvider(props: ParentProps) {
  const stored = localStorage.getItem('theme')
  const current = stored ? JSON.parse(stored) : presets.dim

  applyTheme(current)
  const [theme, baseSetTheme] = createSignal<Theme>(current)
  const [_storeThemeTimeout, setStoreThemeTimeout] = createSignal<NodeJS.Timeout | null>(null)
  const setTheme: Setter<Theme> = <U extends Theme>(prev: Theme | ((prev: Theme) => U), saveNow: boolean = false): U => {
    const next = typeof prev === 'function' ? prev(theme()) : prev
    baseSetTheme(next)
    applyTheme(next)

    if (saveNow) {
      saveTheme(next)
    } else {
      setStoreThemeTimeout(prev => {
        if (prev) clearTimeout(prev)
        return setTimeout(() => saveTheme(next), 1000)
      })
    }
    return next as U
  }

  return (
    <ThemeContext.Provider value={[theme, setTheme]}>
      {props.children}
      <style innerText={theme /* editor bug fix */ ()?.css} />
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)!
}