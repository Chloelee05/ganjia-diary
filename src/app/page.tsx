'use client';

import { useState, useEffect } from 'react';
import { getSaju, today, parseDate, formatDate } from '@/lib/ganjia';
import DiaryEditor from '@/components/DiaryEditor';

export default function HomePage() {
  const [date, setDate] = useState(today());
  const saju = getSaju(date);

  // URL 쿼리파라미터로 날짜 지정 지원
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const d = params.get('date');
    if (d) setDate(parseDate(d));
  }, []);

  const todayDate = today();
  const isToday = formatDate(date) === formatDate(todayDate);

  const weekday = date.toLocaleDateString('ko-KR', { weekday: 'long' });
  const fullDate = date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-2xl mx-auto">

      {/* ── 날짜 헤더 ── */}
      <div className="mb-8" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm mb-1" style={{ color: 'var(--text-faint)' }}>
              {weekday}
              {isToday && (
                <span
                  className="ml-2 text-xs px-1.5 py-0.5 rounded"
                  style={{ background: '#f5e9c8', color: '#8a6c20' }}
                >
                  오늘
                </span>
              )}
            </p>
            <h1 className="text-2xl font-bold" style={{ letterSpacing: '-0.03em' }}>
              {fullDate}
            </h1>
          </div>

          {/* 일주/월주/년주 */}
          <div className="flex flex-col items-end gap-1">
            <PillarRow label="일" pillar={saju.day} large />
            <div className="flex gap-3">
              <PillarRow label="월" pillar={saju.month} />
              <PillarRow label="년" pillar={saju.year} />
            </div>
          </div>
        </div>
      </div>

      {/* ── 에디터 ── */}
      <DiaryEditor initialDate={date} onDateChange={setDate} />
    </div>
  );
}

import { getOhaengColor } from '@/lib/ohaeng';
import type { GanjiPillar } from '@/lib/ganjia';

function PillarRow({
  label,
  pillar,
  large = false,
}: {
  label: string;
  pillar: GanjiPillar;
  large?: boolean;
}) {
  const stemColor = getOhaengColor(pillar.ohaeng);
  const branchColor = getOhaengColor(pillar.branchOhaeng);

  return (
    <div className="flex items-baseline gap-1">
      <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>{label}</span>
      <span
        style={{
          fontSize: large ? '22px' : '13px',
          fontWeight: 700,
          letterSpacing: '-0.01em',
          lineHeight: 1,
        }}
      >
        <span style={{ color: stemColor }}>{pillar.stem}</span>
        <span style={{ color: branchColor }}>{pillar.branch}</span>
      </span>
      {large && (
        <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>
          {pillar.nameHanja}
        </span>
      )}
    </div>
  );
}
