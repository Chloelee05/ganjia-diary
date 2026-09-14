'use client';

import { useTheme } from './ThemeProvider';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
      title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
      style={{
        fontSize: '15px',
        lineHeight: 1,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '4px 8px',
        color: 'var(--text-faint)',
        transition: 'color 0.15s',
      }}
      className="hover:opacity-60 transition-opacity select-none"
    >
      {theme === 'dark' ? '☀︎' : '☽'}
    </button>
  );
}
