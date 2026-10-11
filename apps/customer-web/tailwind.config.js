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
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        cream: {
          50: '#fdfcf7',
          100: '#faf6ea',
          200: '#f5edd3',
          300: '#ecddb0',
          400: '#dec484',
          500: '#caa357',
        },
        slate: {
          850: '#151e2e',
          950: '#090d16',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
        'soft-lg': '0 10px 25px -3px rgba(0, 0, 0, 0.07), 0 4px 10px -2px rgba(0, 0, 0, 0.04)',
        'soft-xl': '0 20px 35px -5px rgba(0, 0, 0, 0.08), 0 8px 16px -3px rgba(0, 0, 0, 0.04)',
        'emerald': '0 10px 25px -3px rgba(22, 163, 74, 0.25)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}
