/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // Enable RTL support
  future: {
    respectDefaultRingColorOpacity: true,
  },
  theme: {
    extend: {
      colors: {
        // Brand Colors from Fluff N' Woof Guidelines
        brand: {
          white: '#FDFEFF',
          dark: '#211E1F',
          mint: '#CEE8DC',
          pink: '#EAB8D5',
          gold: '#F5DF59',
        },
        // Primary - Mint Green palette (based on brand mint #CEE8DC)
        primary: {
          50: '#f5fbf8',
          100: '#e8f5ef',
          200: '#CEE8DC',  // Brand mint
          300: '#a8d4be',
          400: '#7dbf9e',
          500: '#5a9f7d',
          600: '#478066',
          700: '#3a6653',
          800: '#315244',
          900: '#2a4439',
        },
        // Secondary - Gold/Yellow palette (based on brand gold #F5DF59)
        secondary: {
          50: '#fffef5',
          100: '#fffce6',
          200: '#fef7c3',
          300: '#F5DF59',  // Brand gold
          400: '#e8ce3d',
          500: '#d4b82e',
          600: '#b89a24',
          700: '#947a1e',
          800: '#7a641d',
          900: '#67531e',
        },
        // Accent - Pink palette (based on brand pink #EAB8D5)
        accent: {
          50: '#fdf5f9',
          100: '#fceaf2',
          200: '#f9d5e6',
          300: '#EAB8D5',  // Brand pink
          400: '#e09dc2',
          500: '#d07ba9',
          600: '#bc5c8e',
          700: '#9d4873',
          800: '#823e60',
          900: '#6d3752',
        },
      },
      fontFamily: {
        sans: ['DIN Next', 'Inter', 'system-ui', 'sans-serif'],
        arabic: ['GE Dinar One', 'Cairo', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
