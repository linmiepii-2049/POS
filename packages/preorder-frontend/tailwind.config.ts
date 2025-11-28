import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0F62FE',
          dark: '#0043CE',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;



