/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        suuqly: {
          green: '#064E3B',
          'green-dark': '#04392B',
          'green-light': '#ECFDF5',
          gold: '#D97706',
          'gold-light': '#FEF3C7',
          slate: '#F8FAFC',
        },
      },
    },
  },
  plugins: [],
};
