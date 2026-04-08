/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    "../../index.html",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff', 100: '#dbeafe', 500: '#3b82f6',
          600: '#2563eb', 900: '#1e3a8a',
        },
        bay: {
          50: '#f5fbf8',
          100: '#e2f0ea',
          200: '#cce4d8',
          300: '#8aadaa',
          400: '#4a7060',
          500: '#3a5a4a',
          600: '#2d4a3c',
          700: '#1f3a2e',
          800: '#1a3028',
          900: '#0e1f18',
        },
      },
    },
  },
  plugins: [],
}
