import type { Metadata } from 'next';
import { Noto_Serif_KR } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const notoSerif = Noto_Serif_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: '六十甲子 일기',
  description: '일진(日辰)별 기록으로 패턴을 발견합니다.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={notoSerif.variable}>
      <body
        className="min-h-screen font-serif"
        style={{ background: 'var(--bg-paper)', color: 'var(--text-ink)' }}
      >
        {/* ── 상단 네비 ── */}
        <header
          className="sticky top-0 z-10"
          style={{
            background: 'rgba(249,248,245,0.92)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div className="max-w-5xl mx-auto px-5 h-12 flex items-center gap-1">
            {/* 로고 */}
            <Link
              href="/"
              className="mr-5 flex items-baseline gap-1.5 select-none"
              style={{ textDecoration: 'none' }}
            >
              <span
                className="text-base font-bold tracking-widest"
                style={{ color: 'var(--text-ink)', letterSpacing: '0.12em' }}
              >
                六十甲子
              </span>
            </Link>

            <NavLink href="/">일기</NavLink>
            <NavLink href="/list">목록</NavLink>
            <NavLink href="/gapja">60갑자</NavLink>
            <NavLink href="/analysis">분석</NavLink>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-5 py-10">{children}</main>
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1 rounded text-sm transition-colors"
      style={{
        color: 'var(--text-mid)',
        textDecoration: 'none',
        letterSpacing: '0.01em',
      }}
    >
      {children}
    </Link>
  );
}
