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
          dark: '#0f172a',      // Navy slate
          primary: '#1e1b4b',   // Deep purple-navy
          accent: '#2563eb',    // Bright blue accent
          cyan: '#06b6d4',
          surface: '#f8fafc',
          panel: '#ffffff'
        }
      }
    },
  },
  plugins: [],
}
