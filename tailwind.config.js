/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#008080',
          dark: '#006666',
          light: '#009999',
          50: '#E6F3F3',
          100: '#CCE7E7',
          500: '#008080',
          600: '#006B6B',
          700: '#005454',
        },
        accent: {
          DEFAULT: '#FFD166',
          hover: '#FFC84A',
          light: '#FFF5DC',
        },
        brandText: {
          DEFAULT: '#1F2937',
          muted: '#6B7280',
          light: '#9CA3AF',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F9FAFB',
          subtle: '#F3F4F6',
        }
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'tab-bar': '0 -2px 10px rgba(0, 0, 0, 0.05)',
        'card-soft': '0 2px 8px -2px rgba(0, 128, 128, 0.08), 0 1px 4px -1px rgba(0, 0, 0, 0.04)',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      }
    },
  },
  plugins: [],
}
