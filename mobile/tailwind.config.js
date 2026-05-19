/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4CAF50',
        'primary-dark': '#388E3C',
        accent: '#FF6B35',
        'accent-dark': '#E64A19',
        background: '#F5F5F5',
        surface: '#FFFFFF',
        text: '#212121',
        'text-secondary': '#757575',
        'timer-bg': '#FF6B35',
        'bmi-underweight': '#64B5F6',
        'bmi-normal': '#4CAF50',
        'bmi-overweight': '#FFA726',
        'bmi-obese': '#EF5350',
        'habit-active': '#4CAF50',
        'habit-inactive': '#E0E0E0',
        'streak-badge': '#FF6B35',
        'difficulty-easy': '#4CAF50',
        'difficulty-medium': '#FFA726',
        'difficulty-hard': '#EF5350',
        'badge-unlocked-bg': '#E8F5E9',
        'badge-locked': '#BDBDBD',
        'badge-locked-bg': '#F5F5F5',
      }
    }
  },
  presets: [require('nativewind/preset')]
};
