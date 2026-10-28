/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        'pf-blue': '#1769FF',
        'pf-navy': '#101828',
        'pf-bg': '#F8FAFC',
        'pf-surface': '#FFFFFF',
        'pf-text-secondary': '#667085',
        'pf-border': '#E4E7EC',
        'pf-success': '#12B76A',
        'pf-warning': '#F79009',
        'pf-danger': '#D92D20',
      },
    },
  },
  plugins: [],
}
