const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#0586ff',
        secondary: '#be3dff',
        link: '#4bd5ff',
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
  plugins: [require('daisyui')],
  daisyui: {
    themes: [{
      default: {
        primary: '#0078e1',
        secondary: '#be3dff',
        accent: '#0586ff',
        neutral: '#3a3a41',
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