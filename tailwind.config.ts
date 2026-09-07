import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        
        /* Forces Academy Command Swatches */
        command: {
          navy: '#0E1B2A',
          midnight: '#0F1C2B',
          slate: '#455D4A',
          brass: '#C6A75E',
          charcoal: '#1F2937',
          canvas: '#F6F8FA',
          recessed: '#EDF1F5',
          hairline: '#D4D9DF',
          subtle: '#E2E6EB',
        },

        /* Semantic Tokens */
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          container: '#0F1C2B',
          'on-container': '#788598',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
          container: '#CEEAD1',
          'on-container': '#234E35',
        },
        tertiary: {
          DEFAULT: '#C6A75E',
          foreground: '#FFFFFF',
          container: '#FDF7EC',
          'on-container': '#7A5312',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        /* Operational Status & State Tokens */
        status: {
          pass: {
            DEFAULT: '#234E35',
            bg: '#EDF6F0',
            border: '#88BE9B',
          },
          fail: {
            DEFAULT: '#782525',
            bg: '#FDF2F2',
            border: '#E29A9A',
          },
          paused: {
            DEFAULT: '#7A5312',
            bg: '#FDF7EC',
            border: '#DEC088',
          },
          retake: {
            DEFAULT: '#405364',
            bg: '#EEF2F6',
            border: '#9BB0C1',
          },
        },
      },
      borderRadius: {
        xs: '2px',
        sm: '3px',
        DEFAULT: '4px',
        md: '4px',
        lg: '6px',
        xl: '8px',
      },
      fontFamily: {
        sans: ['Geist Sans', 'Geist', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Geist Sans', 'Geist', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'military-card': '0 1px 3px 0 rgba(14, 27, 42, 0.05)',
        'military-modal': '0 4px 0 0 rgba(14, 27, 42, 0.08)',
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
      transitionTimingFunction: {
        military: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
