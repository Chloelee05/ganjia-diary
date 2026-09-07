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
  title: '60갑자 일기',
  description: '일진(日辰)별 일기를 기록하고 패턴을 분석합니다.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={notoSerif.variable}>
      <body className="bg-stone-50 text-stone-900 min-h-screen font-serif antialiased">
        {/* 상단 네비게이션 */}
        <nav className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-stone-200">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-6">
            <Link href="/" className="font-bold text-lg tracking-tight text-stone-800">
              六十甲子
            </Link>
            <Link
              href="/"
              className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
            >
              오늘 일기
            </Link>
            <Link
              href="/list"
              className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
            >
              전체 목록
            </Link>
            <Link
              href="/gapja"
              className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
            >
              60갑자 보기
            </Link>
            <Link
              href="/analysis"
              className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
            >
              패턴 분석
            </Link>
          </div>
        </nav>

        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
