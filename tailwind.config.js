const defaultTheme = require('tailwindcss/defaultTheme')
const plugin = require("tailwindcss/plugin");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#0586ff',
          50: '#bddfff',
          100: '#a8d5ff',
          200: '#7fc1ff',
          300: '#57adff',
          400: '#2e9aff',
          500: '#0586ff',
          600: '#0069cc',
          700: '#004c94',
          800: '#002f5c',
          900: '#001224',
        },
        secondary: '#be3dff',
        link: '#4bd5ff',
        base: {
          content: '#ffffff',
        },
        gray: {
          850: '#19222d',
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
    require('daisyui'),
    plugin(({ addComponents }) => {
      addComponents({
        '.hide-scrollbar': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          }
        }
      })
    })
  ],
  daisyui: {
    themes: [{
      default: {
        primary: '#0078e1',
        secondary: '#be3dff',
        accent: '#0586ff',
        neutral: '#3a3a41',
        error: '#ee3434',
        base: {
          content: '#ffffff',
        },
        '.btn': {
          'text-transform': 'initial',
        },
      },
    }],
  }
}