/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '4rem',
    },
    fontFamily: {
      primary: ['Poppins', 'sans-serif'],
    },
    extend: {
      colors: {
        white: '#FAFAFA',
        black: '#16141A',
        content: {
          primary: '#FAFAFA',
        },
        card: {
          primary: '#262229',
        },
        base: {
          50: '#37323D',
        },
      },
    },
  },
  // add daisyUI plugin
  // disable esline because it will give Error: Unexpected require()
  /* eslint-disable */
  plugins: [require('daisyui')],

  // daisyUI config (optional)
  daisyui: {
    styled: true,
    themes: [ {
      elio: {
          "primary": '#D82B2B',
          'primary-focus': '#781818',
          'primary-content': '#FAFAFA',
          "secondary": "#FF7A00",
          'secondary-focus': '#D26400',
          'secondary-content': '#1E1B21',
          "accent": "#A3E635",
          'accent-focus': '#87BB2B',
          'accent-content': '#1E1B21',
          'neutral': '#FAFAFA',
          'neutral-focus': '#ABABAB',
          'neutral-content': '#1E1B21',
          "base-100": "#1E1B21",
          'base-200': '#16141A',
          'base-300': '#0D0B0E',
          'base-content': '#FAFAFA',
          "info": "#22D3EE",
          'info-content': '#083B43',
          "success": "#34D399",
          'success-content': '#0E3B2B',
          "warning": "#FB923C",
          'warning-content': '#44182F',
          "error": "#FDA4AF",
          'error-content': '#3F0814'
        }
      },
      'night'
    ],
    base: true,
    utils: true,
    logs: true,
    rtl: false,
    prefix: '',
    darkTheme: 'elio',
  },
};
