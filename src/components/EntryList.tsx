'use client';

import type { DiaryEntry } from '@/lib/supabase/types';
import { GAPJA_60 } from '@/lib/ganjia';
import type { GanjiPillar } from '@/lib/ganjia';
import { getOhaengColor } from '@/lib/ohaeng';

interface EntryListProps {
  entries: DiaryEntry[];
  onSelect?: (entry: DiaryEntry) => void;
}

export default function EntryList({ entries, onSelect }: EntryListProps) {
  if (entries.length === 0) {
    return (
      <p
        className="py-12 text-center text-sm"
        style={{ color: 'var(--text-faint)' }}
      >
        아직 일기가 없어요.
      </p>
    );
  }

  return (
    <div>
      {entries.map((entry, i) => {
        const dayPillar = GAPJA_60[entry.day_gapja_idx];
        const monthPillar = GAPJA_60[entry.month_gapja_idx];
        const yearPillar = GAPJA_60[entry.year_gapja_idx];
        const isLast = i === entries.length - 1;

        return (
          <div
            key={entry.id}
            onClick={() => onSelect?.(entry)}
            style={{
              borderBottom: isLast ? 'none' : '1px solid var(--border)',
              padding: '18px 0',
              cursor: onSelect ? 'pointer' : 'default',
            }}
            className={onSelect ? 'hover:opacity-75 transition-opacity' : ''}
          >
            {/* 날짜 + 갑자 */}
            <div className="flex items-center gap-3 mb-2">
              <span style={{ fontSize: '12px', color: 'var(--text-faint)', fontVariantNumeric: 'tabular-nums' }}>
                {entry.date}
              </span>

              {/* 년월일 갑자 — 분리 색상 */}
              <div className="flex items-center gap-1.5">
                <SplitGapja pillar={yearPillar} label="년" />
                <span style={{ color: 'var(--border)', fontSize: '10px' }}>·</span>
                <SplitGapja pillar={monthPillar} label="월" />
                <span style={{ color: 'var(--border)', fontSize: '10px' }}>·</span>
                <SplitGapja pillar={dayPillar} label="일" bold />
              </div>

              {entry.mood && (
                <span style={{ fontSize: '11px', color: 'var(--text-faint)', marginLeft: 'auto' }}>
                  {
                    entry.mood === '좋음' ? '😊' :
                    entry.mood === '보통' ? '😐' :
                    entry.mood === '나쁨' ? '😔' :
                    entry.mood === '최악' ? '😩' : entry.mood
                  }
                </span>
              )}
            </div>

            {/* 제목 */}
            {entry.title && (
              <p
                className="mb-1"
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--text-ink)',
                  letterSpacing: '-0.01em',
                }}
              >
                {entry.title}
              </p>
            )}

            {/* 본문 미리보기 */}
            <p
              className="line-clamp-2"
              style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--text-mid)' }}
            >
              {entry.content}
            </p>

            {/* 태그 */}
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {entry.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: '10px',
                      padding: '2px 7px',
                      borderRadius: '20px',
                      background: '#f0ede8',
                      color: 'var(--text-faint)',
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SplitGapja({
  pillar,
  label,
  bold = false,
}: {
  pillar: GanjiPillar;
  label: string;
  bold?: boolean;
}) {
  const stemColor = getOhaengColor(pillar.ohaeng);
  const branchColor = getOhaengColor(pillar.branchOhaeng);

  return (
    <span className="flex items-baseline gap-0.5">
      <span style={{ fontSize: '9px', color: 'var(--text-faint)' }}>{label}</span>
      <span style={{ fontSize: bold ? '13px' : '11px', fontWeight: bold ? 600 : 400 }}>
        <span style={{ color: stemColor }}>{pillar.stem}</span>
        <span style={{ color: branchColor }}>{pillar.branch}</span>
      </span>
    </span>
  );
}
