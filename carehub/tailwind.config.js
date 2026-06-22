/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#16162f',
        muted: '#69708a',
        cloud: '#f7f9fe',
        line: '#e6eaf5',
        violet: '#5d5fef',
      },
      boxShadow: {
        card: '0 18px 50px rgba(74, 86, 137, 0.10)',
        soft: '0 10px 30px rgba(91, 91, 180, 0.12)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
