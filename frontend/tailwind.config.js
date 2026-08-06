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
          DEFAULT: '#7c3aed',
          light: '#a78bfa',
          dark: '#5b21b6',
        },
        accent: '#06b6d4',
        surface: {
          DEFAULT: '#0f0f1a',
          card: '#1a1a2e',
          elevated: '#16213e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Orbitron', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #0f0f1a 0%, #1a0533 50%, #0a1628 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(6,182,212,0.05) 100%)',
        'button-gradient': 'linear-gradient(135deg, #7c3aed, #06b6d4)',
      },
      boxShadow: {
        'glow-purple': '0 0 30px rgba(124, 58, 237, 0.4)',
        'glow-cyan': '0 0 30px rgba(6, 182, 212, 0.4)',
        'glow-sm': '0 0 15px rgba(124, 58, 237, 0.3)',
        'card': '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
  // Important: don't purge Ant Design classes
  corePlugins: {
    preflight: false, // Disable Tailwind reset to avoid conflicts with Ant Design
  },
}
