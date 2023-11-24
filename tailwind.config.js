const defaultTheme = require('tailwindcss/defaultTheme')
const colors = require('tailwindcss/colors')
const plugin = require("tailwindcss/plugin")

const variable = (color) => `rgb(var(--c-${color}) / <alpha-value>)`

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          0: variable('bg-0'),
          1: variable('bg-1'),
          2: variable('bg-2'),
          3: variable('bg-3'),
        },
        fg: variable('fg'),
        accent: {
          DEFAULT: variable('accent'),
          light: variable('accent-light'),
        },
        primary: {
          DEFAULT: variable('primary'),
          hover: variable('primary-hover'),
          content: variable('primary-fg'),
        },
        secondary: variable('secondary'),
        success: {
          DEFAULT: variable('success'),
          hover: variable('success-hover'),
          content: variable('success-fg'),
        },
        danger: {
          DEFAULT: variable('danger'),
          hover: variable('danger-hover'),
          content: variable('danger-fg'),
        },
        neutral: {
          DEFAULT: variable('neutral'),
          hover: variable('neutral-hover'),
          content: variable('neutral-fg'),
        },
        link: {
          DEFAULT: variable('link'),
          hover: variable('link-hover'),
          visited: variable('link-visited'),
        },
        highlight: {
          DEFAULT: colors.yellow[400],
          content: colors.black,
        },
      },
      screens: {
        'mobile-xs': { max: '369px' },
        'mobile': { max: '767px' },
      },
    },
    fontFamily: {
      title: ['"Mona Sans"', "'Inter var'", ...defaultTheme.fontFamily.sans],
      sans: ["'Inter var'", ...defaultTheme.fontFamily.sans],
      mono: [
        'Menlo', 'Monaco', 'Lucida Console', 'Liberation Mono',
        'DejaVu Sans Mono', 'Bitstream Vera Sans Mono', 'Courier New', 'monospace',
      ],
    },
  },
  plugins: [
    plugin(({ addComponents, addVariant }) => {
      addComponents({
        '.hide-scrollbar': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          }
        }
      })
      addVariant('all', '&, *')
      addVariant('all-children', '& *')
    })
  ],
}