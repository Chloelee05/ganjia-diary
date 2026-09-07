'use client';

import type { DiaryEntry } from '@/lib/supabase/types';
import GapjaBadge from './GapjaBadge';
import { GAPJA_60, parseDate } from '@/lib/ganjia';

interface EntryListProps {
  entries: DiaryEntry[];
  onSelect?: (entry: DiaryEntry) => void;
}

export default function EntryList({ entries, onSelect }: EntryListProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-stone-400 py-8 text-center">아직 일기가 없어요.</p>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const dayPillar = GAPJA_60[entry.day_gapja_idx];
        const monthPillar = GAPJA_60[entry.month_gapja_idx];
        const yearPillar = GAPJA_60[entry.year_gapja_idx];

        return (
          <div
            key={entry.id}
            onClick={() => onSelect?.(entry)}
            className={`border border-stone-200 rounded-xl p-4 bg-white ${
              onSelect ? 'cursor-pointer hover:border-stone-400 transition-colors' : ''
            }`}
          >
            {/* 날짜 + 갑자 */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs text-stone-400 font-mono">{entry.date}</span>
              <div className="flex gap-1.5">
                <GapjaBadge pillar={yearPillar} label="년" size="sm" />
                <GapjaBadge pillar={monthPillar} label="월" size="sm" />
                <GapjaBadge pillar={dayPillar} label="일" size="sm" />
              </div>
              {entry.mood && (
                <span className="text-xs text-stone-500 ml-auto">{entry.mood}</span>
              )}
            </div>

            {/* 제목 */}
            {entry.title && (
              <h3 className="text-sm font-semibold text-stone-800 mb-1">{entry.title}</h3>
            )}

            {/* 본문 미리보기 */}
            <p className="text-sm text-stone-600 line-clamp-2 leading-relaxed">
              {entry.content}
            </p>

            {/* 태그 */}
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {entry.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] px-2 py-0.5 bg-stone-100 text-stone-500 rounded-full"
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
