import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { pool: { 50: '#f4f9fc', 100: '#d7e6ee', 500: '#22b8cf', 700: '#087ea4', 950: '#102a43' } },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      boxShadow: { aqua: '0 18px 42px rgba(8,126,164,.20)' },
    },
  },
  plugins: [],
} satisfies Config;
