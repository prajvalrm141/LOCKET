/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#f3eee6',
        'paper-deep': '#e8e0d4',
        ink: '#2a221c',
        'ink-soft': '#5a4d45',
        muted: '#8b7d72',
        rose: '#8d5b56',
        'rose-light': '#c49a96',
        'rose-dark': '#6b4440',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Figtree', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'paper': '0 2px 8px rgba(42, 34, 28, 0.08), 0 1px 3px rgba(42, 34, 28, 0.06)',
        'paper-hover': '0 8px 24px rgba(42, 34, 28, 0.12), 0 4px 12px rgba(42, 34, 28, 0.08)',
      },
      transitionDuration: {
        'slow': '300ms',
      },
      transitionTimingFunction: {
        'gentle': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
    },
  },
  plugins: [],
}