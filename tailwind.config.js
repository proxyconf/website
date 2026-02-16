/** @type {import('tailwindcss').Config} */

// Catppuccin Mocha color palette
const catppuccin = {
  rosewater: '#f5e0dc',
  flamingo: '#f2cdcd',
  pink: '#f5c2e7',
  mauve: '#cba6f7',
  red: '#f38ba8',
  maroon: '#eba0ac',
  peach: '#fab387',
  yellow: '#f9e2af',
  green: '#a6e3a1',
  teal: '#94e2d5',
  sky: '#89dceb',
  sapphire: '#74c7ec',
  blue: '#89b4fa',
  lavender: '#b4befe',
  text: '#cdd6f4',
  subtext1: '#bac2de',
  subtext0: '#a6adc8',
  overlay2: '#9399b2',
  overlay1: '#7f849c',
  overlay0: '#6c7086',
  surface2: '#585b70',
  surface1: '#45475a',
  surface0: '#313244',
  base: '#1e1e2e',
  mantle: '#181825',
  crust: '#11111b',
};

module.exports = {
  content: [
    './templates/**/*.html',
    './content/**/*.md',
  ],
  theme: {
    extend: {
      colors: {
        // Catppuccin semantic colors - more vibrant choices
        primary: catppuccin.mauve,
        secondary: catppuccin.sapphire,
        accent: catppuccin.peach,
        success: catppuccin.green,
        warning: catppuccin.yellow,
        error: catppuccin.red,
        // Additional vibrant accent colors for visual interest
        highlight: catppuccin.pink,
        glow: catppuccin.sky,
        spark: catppuccin.teal,
        flame: catppuccin.peach,
        // Catppuccin raw palette
        ...catppuccin,
      },
      backgroundImage: {
        // Vibrant gradient backgrounds
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-hero': `linear-gradient(135deg, ${catppuccin.mauve}15 0%, ${catppuccin.sapphire}10 50%, ${catppuccin.teal}15 100%)`,
        'gradient-glow': `radial-gradient(ellipse at center, ${catppuccin.mauve}20 0%, transparent 70%)`,
        'gradient-accent': `linear-gradient(90deg, ${catppuccin.pink} 0%, ${catppuccin.mauve} 50%, ${catppuccin.sapphire} 100%)`,
        'gradient-warm': `linear-gradient(135deg, ${catppuccin.peach}20 0%, ${catppuccin.pink}15 50%, ${catppuccin.mauve}20 100%)`,
        'gradient-cool': `linear-gradient(135deg, ${catppuccin.teal}20 0%, ${catppuccin.sapphire}15 50%, ${catppuccin.blue}20 100%)`,
      },
      boxShadow: {
        'glow-sm': `0 0 15px ${catppuccin.mauve}30`,
        'glow-md': `0 0 30px ${catppuccin.mauve}40`,
        'glow-lg': `0 0 50px ${catppuccin.mauve}50`,
        'glow-pink': `0 0 30px ${catppuccin.pink}40`,
        'glow-teal': `0 0 30px ${catppuccin.teal}40`,
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': catppuccin.text,
            '--tw-prose-headings': catppuccin.text,
            '--tw-prose-lead': catppuccin.subtext1,
            '--tw-prose-links': catppuccin.sapphire,
            '--tw-prose-bold': catppuccin.text,
            '--tw-prose-counters': catppuccin.overlay1,
            '--tw-prose-bullets': catppuccin.overlay1,
            '--tw-prose-hr': catppuccin.surface1,
            '--tw-prose-quotes': catppuccin.subtext0,
            '--tw-prose-quote-borders': catppuccin.mauve,
            '--tw-prose-captions': catppuccin.subtext0,
            '--tw-prose-code': catppuccin.peach,
            '--tw-prose-pre-code': catppuccin.text,
            '--tw-prose-pre-bg': catppuccin.mantle,
            '--tw-prose-th-borders': catppuccin.surface1,
            '--tw-prose-td-borders': catppuccin.surface0,
            // Links
            a: {
              color: catppuccin.sapphire,
              textDecoration: 'none',
              '&:hover': {
                color: catppuccin.sky,
                textDecoration: 'underline',
              },
            },
            // Code blocks
            code: {
              color: catppuccin.peach,
              backgroundColor: catppuccin.surface0,
              borderRadius: '0.25rem',
              padding: '0.125rem 0.375rem',
              fontWeight: '400',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            // Pre blocks
            pre: {
              backgroundColor: catppuccin.mantle,
              border: `1px solid ${catppuccin.surface0}`,
            },
            // Headings
            h1: {
              color: catppuccin.text,
              fontWeight: '700',
            },
            h2: {
              color: catppuccin.text,
              fontWeight: '600',
            },
            h3: {
              color: catppuccin.subtext1,
              fontWeight: '600',
            },
            h4: {
              color: catppuccin.subtext1,
              fontWeight: '500',
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
