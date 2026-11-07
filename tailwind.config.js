/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Hồng phấn nhẹ nhàng: màu chủ đạo cho giao diện khách
        blush: {
          50: '#FFF7F9',
          100: '#FFEEF2',
          200: '#FFDCE5',
          300: '#FDBACB',
          400: '#F795AE',
          500: '#EC7094',
          600: '#D9547B',
          700: '#B83F63',
          800: '#8F3049',
        },
        // Nâu ca cao: màu chữ, ấm hơn màu đen
        cocoa: {
          300: '#C9B5B1',
          400: '#A48A85',
          500: '#7D625D',
          700: '#4E3632',
          900: '#2F1F1C',
        },
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 8px 24px -8px rgba(236, 112, 148, 0.25)',
        card: '0 4px 16px -6px rgba(79, 54, 50, 0.12)',
      },
    },
  },
  plugins: [],
}
