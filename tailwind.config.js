/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui'],
        display: ['"Fraunces"', 'Georgia', 'serif'],
      },
      colors: {
        ink: {
          50: '#f4f1ea',
          100: '#e8e2d4',
          800: '#2a261f',
          900: '#161410',
          950: '#0c0b09',
        },
        accent: {
          DEFAULT: '#c45c26',
          dim: '#9a4318',
        },
      },
      boxShadow: {
        lift: '0 20px 50px -20px rgba(12, 11, 9, 0.45)',
      },
    },
  },
  plugins: [],
};
