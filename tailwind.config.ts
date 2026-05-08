import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      boxShadow: {
        glow: '0 0 45px rgba(54, 144, 255, 0.28)',
        greenGlow: '0 0 35px rgba(30, 215, 96, 0.22)',
        purpleGlow: '0 0 35px rgba(168, 85, 247, 0.25)'
      },
      keyframes: {
        pulseLine: {
          '0%, 100%': { opacity: '0.45', transform: 'scaleX(0.92)' },
          '50%': { opacity: '1', transform: 'scaleX(1)' }
        }
      },
      animation: { pulseLine: 'pulseLine 2.4s ease-in-out infinite' }
    }
  },
  plugins: [require('tailwindcss-animate')]
};

export default config;
