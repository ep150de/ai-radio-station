/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        walnut: '#0d0a07',
        panel: '#1f1a14',
        cream: '#f4e9d8',
        parchment: '#c8b8a0',
        gold: '#b8860b',
        amber: '#ffbf00',
        'amber-glow': '#ffbf00',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
