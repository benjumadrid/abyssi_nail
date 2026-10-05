/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf8f6',
          100: '#f2e8e5',
          200: '#eaddd7',
          300: '#e0c8b3',
          400: '#d4a373',
          500: '#c17a5b',
          600: '#a3503f',
          700: '#853b30',
          800: '#6c2f27',
          900: '#4a1e19',
          gold: '#d4af37',
          rose: '#e8a598',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
