/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  // Tell NativeWind where to scan for class usage
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Brand colors mirroring the PWA design system
        brand: {
          50: '#eef5ff',
          100: '#d9e8ff',
          200: '#bcd5ff',
          300: '#8eb8ff',
          400: '#5990fc',
          500: '#3470f9',
          600: '#1d50ee',
          700: '#163ddb',
          800: '#1833b0',
          900: '#192f8b',
          950: '#141f56',
        },
        // Dark mode surfaces
        surface: {
          DEFAULT: '#ffffff',
          dark: '#0f172a',
          'card-dark': '#1e293b',
          'muted-dark': '#334155',
        },
      },
      fontFamily: {
        sans: ['Inter_400Regular'],
        'sans-medium': ['Inter_500Medium'],
        'sans-semibold': ['Inter_600SemiBold'],
        'sans-bold': ['Inter_700Bold'],
      },
    },
  },
  plugins: [],
};
