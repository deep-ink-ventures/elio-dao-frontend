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
        black: '#1A1829',
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
          "base-100": "#201B32",
          'base-200': '#1A1829',
          'base-300': '#151321',
          'base-content': '#FAFAFA',
          'base-container': '#050215',
          "info": "#38BDF8",
          'info-content': '#002B3D',
          "success": "#A3E635",
          'success-content': '#233800',
          "warning": "#FB923C",
          'warning-content': '#3D1C00',
          "error": "#FDA4AF",
          'error-content': '#52000A'
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
