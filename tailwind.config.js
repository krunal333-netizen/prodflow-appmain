/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4318FF',
          hover: '#3311CC',
          light: '#F4F7FE',
        },
        accent: {
          DEFAULT: '#8B5CF6',
          hover: '#7C3AED',
        },
        success: {
          DEFAULT: '#05CD99',
          light: '#E6FFF5',
        },
        warning: {
          DEFAULT: '#FFB547',
          light: '#FFF8EB',
        },
        danger: {
          DEFAULT: '#EE5D50',
          light: '#FFF5F5',
        },
        neutral: {
          50: '#F8F9FD',
          100: '#F4F7FE',
          200: '#E9EDF7',
          300: '#D4D4D8',
          400: '#A3AED0',
          500: '#71717A',
          600: '#52525B',
          700: '#27272A',
          800: '#18181B',
          900: '#09090B',
        }
      },
      fontFamily: {
        display: ['Quicksand', 'sans-serif'],
        sans: ['Quicksand', 'sans-serif'],
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
      },
      borderRadius: {
        'sm': '6px',
        'md': '10px',
        'lg': '12px',
        'xl': '20px',
        'pill': '9999px',
      },
      boxShadow: {
        'cardLight': '0px 18px 40px rgba(0, 0, 0, 0.04)',
        'cardDark': '0px 18px 40px rgba(0, 0, 0, 0.2)',
        'primaryGlow': '0 0 20px rgba(67, 24, 255, 0.25)',
      },
      transitionDuration: {
        'micro': '180ms',
        'state': '220ms',
        'page': '260ms',
      },
      keyframes: {
        btnPress: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.96)' },
        },
        focusRingGrow: {
          '0%': { ringWidth: '0px', ringOpacity: '0.5' },
          '100%': { ringWidth: '4px', ringOpacity: '0' },
        },
        chipHalo: {
          '0%': { boxShadow: '0 0 0 0 rgba(67, 24, 255, 0.2)' },
          '100%': { boxShadow: '0 0 0 6px rgba(67, 24, 255, 0)' },
        },
        pillSlideIn: {
          '0%': { transform: 'translateX(-12px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pageInUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        eventDrop: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      },
      animation: {
        btnPress: 'btnPress 150ms ease-out',
        pillSlideIn: 'pillSlideIn 260ms ease-out forwards',
        pageInUp: 'pageInUp 300ms ease-out forwards',
        chipHalo: 'chipHalo 1.5s infinite',
        shimmer: 'shimmer 2s infinite',
        eventDrop: 'eventDrop 400ms cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      }
    },
  },
  plugins: [],
}