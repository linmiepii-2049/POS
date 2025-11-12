import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        line: {
          green: '#00B900',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

