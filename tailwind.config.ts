import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        aura: {
          violet: '#6C63FF',
          cyan: '#00D4FF',
          dark: '#050510',
          surface: '#0D0D1F',
          card: '#12122A',
          ink: '#FFFFFF',
          muted: '#A0A8C0',
        },
      },
      fontFamily: {
        orbitron: ['Orbitron', 'ui-sans-serif', 'system-ui'],
        syne: ['Syne', 'ui-sans-serif', 'system-ui'],
        dmSans: ['DM Sans', 'ui-sans-serif', 'system-ui'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(0, -18px, 0)' },
        },
        glow: {
          '0%, 100%': { opacity: '0.5', filter: 'blur(42px)' },
          '50%': { opacity: '0.9', filter: 'blur(58px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-180% 0' },
          '100%': { backgroundPosition: '180% 0' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(0.98)' },
          '50%': { opacity: '1', transform: 'scale(1.03)' },
        },
      },
      animation: {
        float: 'float 7s ease-in-out infinite',
        glow: 'glow 8s ease-in-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        gradientShift: 'gradientShift 12s ease infinite',
        'pulse-slow': 'pulseSlow 3.8s ease-in-out infinite',
      },
      backgroundImage: {
        'aura-gradient': 'linear-gradient(135deg, #6C63FF 0%, #00D4FF 100%)',
        'card-gradient':
          'linear-gradient(145deg, rgba(108, 99, 255, 0.16), rgba(18, 18, 42, 0.9), rgba(0, 212, 255, 0.08))',
        'hero-mesh':
          'radial-gradient(circle at 16% 18%, rgba(108, 99, 255, 0.38), transparent 32%), radial-gradient(circle at 84% 18%, rgba(0, 212, 255, 0.24), transparent 30%), radial-gradient(circle at 50% 88%, rgba(22, 217, 166, 0.16), transparent 36%)',
      },
      boxShadow: {
        aura: '0 18px 80px rgba(108, 99, 255, 0.22)',
        cyan: '0 18px 70px rgba(0, 212, 255, 0.16)',
      },
    },
  },
  plugins: [],
} satisfies Config
