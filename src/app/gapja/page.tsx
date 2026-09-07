'use client';

import { useEffect, useState } from 'react';
import { GAPJA_60, getDayPillar, today } from '@/lib/ganjia';
import type { GanjiPillar } from '@/lib/ganjia';
import { getDayGapjaStats, getEntriesByDayGapja } from '@/lib/diary';
import type { DiaryEntry } from '@/lib/supabase/types';
import GapjaGrid from '@/components/GapjaGrid';
import EntryList from '@/components/EntryList';
import GapjaBadge from '@/components/GapjaBadge';

export default function GapjaPage() {
  const todayPillar = getDayPillar(today());
  const [selected, setSelected] = useState<GanjiPillar>(todayPillar);
  const [stats, setStats] = useState<Record<number, number>>({});
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getDayGapjaStats().then(setStats);
  }, []);

  useEffect(() => {
    setLoading(true);
    getEntriesByDayGapja(selected.index).then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, [selected]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-800 mb-1">60갑자 보기</h1>
        <p className="text-sm text-stone-500">
          같은 일주가 돌아오는 날의 일기를 모아 패턴을 발견하세요. (60일 주기)
        </p>
      </div>

      {/* 그리드 */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
        <GapjaGrid
          selectedIdx={selected.index}
          highlightIdx={todayPillar.index}
          entryCountByIdx={stats}
          onSelect={setSelected}
        />
        <p className="text-xs text-stone-400 mt-3">
          오렌지 링 = 오늘 일주 · 숫자 = 해당 일주 일기 수
        </p>
      </div>

      {/* 선택된 갑자 상세 */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <GapjaBadge pillar={selected} size="lg" />
          <div>
            <p className="text-sm font-semibold text-stone-700">
              {selected.nameHanja} ({selected.name})
            </p>
            <p className="text-xs text-stone-500">
              {selected.ohaeng} {selected.eumyang} · 60갑자 #{selected.index + 1}
            </p>
          </div>
          <span className="ml-auto text-sm text-stone-500">
            {stats[selected.index] ?? 0}개의 일기
          </span>
        </div>

        {loading ? (
          <p className="text-sm text-stone-400 py-4 text-center">불러오는 중...</p>
        ) : (
          <EntryList entries={entries} />
        )}
      </div>
    </div>
  );
}
