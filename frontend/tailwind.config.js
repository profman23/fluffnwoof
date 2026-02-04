/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // Enable dark mode with class strategy
  darkMode: 'class',
  // Safelist to ensure portal colors are always generated
  safelist: [
    // Mint colors
    { pattern: /^(bg|text|border|ring|from|to|via|shadow)-mint-(50|100|200|300|400|500|600|700|800|900|950)/ },
    { pattern: /^(bg|text|border|ring|from|to|via|shadow)-mint-(50|100|200|300|400|500|600|700|800|900|950)/, variants: ['dark', 'hover', 'focus'] },
    // Pink colors
    { pattern: /^(bg|text|border|ring|from|to|via|shadow)-pink-(50|100|200|300|400|500|600|700|800|900|950)/ },
    { pattern: /^(bg|text|border|ring|from|to|via|shadow)-pink-(50|100|200|300|400|500|600|700|800|900|950)/, variants: ['dark', 'hover', 'focus'] },
    // Gold colors
    { pattern: /^(bg|text|border|ring|from|to|via|shadow)-gold-(50|100|200|300|400|500|600|700|800|900|950)/ },
    { pattern: /^(bg|text|border|ring|from|to|via|shadow)-gold-(50|100|200|300|400|500|600|700|800|900|950)/, variants: ['dark', 'hover', 'focus'] },
  ],
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
        // Mint Green palette (Portal Primary) - Based on brand #CEE8DC
        mint: {
          50: '#f5fbf8',
          100: '#e8f5ef',
          200: '#d7ede4',
          300: '#CEE8DC',  // Brand mint - PRIMARY
          400: '#a8d5c2',
          500: '#7fc2a8',
          600: '#56af8e',
          700: '#3d9b78',
          800: '#2d7a5e',
          900: '#1f5a45',
          950: '#123b2c',
        },
        // Pink palette (Portal Accent) - Based on brand #EAB8D5
        pink: {
          50: '#fdf5f9',
          100: '#faeaf3',
          200: '#f5d5e7',
          300: '#EAB8D5',  // Brand pink - PRIMARY
          400: '#e091c0',
          500: '#d66aab',
          600: '#c44896',
          700: '#a33579',
          800: '#82295e',
          900: '#611e45',
          950: '#401230',
        },
        // Gold/Yellow palette (Portal Highlight) - Based on brand #F5DF59
        gold: {
          50: '#fffdf5',
          100: '#fffbe6',
          200: '#fdf6cc',
          300: '#F5DF59',  // Brand gold - PRIMARY
          400: '#e8c840',
          500: '#d4b02e',
          600: '#b8951f',
          700: '#957717',
          800: '#725a11',
          900: '#4f3e0c',
          950: '#2c2207',
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
