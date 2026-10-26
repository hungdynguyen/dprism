import typography from '@tailwindcss/typography';
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#b51f3d',
        'primary-deep': '#951932',
        'tint-1': '#f9edf0',
        'tint-2': '#f0d7de',
        'tint-3': '#fffafb',
        n0: '#ffffff',
        n1: '#f5f6f7',
        n2: '#dce0e5',
        n3: '#a4afbd',
        n4: '#596575',
        n5: '#384454',
        n6: '#222b36',
        success: '#246d51',
        'success-soft': '#eaf4ee',
        warning: '#825b18',
        'warning-soft': '#faf1df',
        info: '#486a99',
        'info-soft': '#edf2f9',
        violet: '#6a548b',
        'violet-soft': '#f1edf6',
        orange: '#ad5218',
        'orange-soft': '#fff1e4',
      },
      fontFamily: { sans: ['Segoe UI', 'Inter', 'Arial', 'sans-serif'] },
      boxShadow: { panel: '0 4px 20px rgb(32 52 75 / .06)' },
    },
  },
  plugins: [typography],
};
