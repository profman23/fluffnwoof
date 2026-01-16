/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Sage Green - Primary brand color
        primary: {
          50: '#f0f5f3',
          100: '#dce8e2',
          200: '#b9d1c5',
          300: '#8fb8a3',
          400: '#6a9c82',
          500: '#5B7B6D',
          600: '#4a6459',
          700: '#3d5249',
          800: '#33443d',
          900: '#2b3833',
        },
        // Golden Yellow - Logo & accent
        secondary: {
          50: '#fffdf5',
          100: '#fef9e7',
          200: '#fdf3cf',
          300: '#fbe9a7',
          400: '#F4D03F',
          500: '#e6c02e',
          600: '#c9a526',
          700: '#a8891f',
          800: '#876e19',
          900: '#665314',
        },
        // Dusty Pink - Accent color
        accent: {
          50: '#fdf5f6',
          100: '#fce9eb',
          200: '#f9d3d8',
          300: '#f3b7bf',
          400: '#E8B4B8',
          500: '#d89da3',
          600: '#c4858c',
          700: '#a86b72',
          800: '#8c5a60',
          900: '#744d52',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
