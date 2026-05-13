import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './emails/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FAF7F2',
        forest: '#1B4332',
        'forest-soft': '#2D5F4A',
        charcoal: '#1A1A1A',
        'charcoal-soft': '#4A4A4A',
        muted: '#6B6B6B',
        rule: '#E5DFD3',
        'rule-soft': '#EFEAE0',
        'muted-red': '#B33A3A',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-lora)', 'Georgia', 'serif'],
      },
      fontSize: {
        body: ['16px', { lineHeight: '1.65' }],
        'body-lg': ['17px', { lineHeight: '1.7' }],
      },
      maxWidth: {
        prose: '68ch',
        page: '1100px',
      },
    },
  },
  plugins: [],
};

export default config;
