import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        line: 'var(--line)',
        accent: 'var(--accent)',
      },
      borderRadius: {
        card: '20px',
        qrbox: '28px',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.32, 1.2, 0.4, 1)',
      },
      fontFamily: {
        sans: [
          'var(--font-inter)',
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 -1px 0 rgba(255, 255, 255, 0.15) inset, 0 8px 24px rgba(0, 0, 0, 0.18)',
        fab: '0 8px 24px rgba(0, 122, 255, 0.35)',
        sheet: '0 -10px 40px rgba(0, 0, 0, 0.2)',
        qr: '0 16px 40px rgba(0, 0, 0, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
