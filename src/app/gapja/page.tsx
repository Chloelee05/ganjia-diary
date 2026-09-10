'use client';

import { useEffect, useState } from 'react';
import { GAPJA_60, getDayPillar, today } from '@/lib/ganjia';
import type { GanjiPillar } from '@/lib/ganjia';
import { getDayGapjaStats, getEntriesByDayGapja } from '@/app/actions';
import type { DiaryEntry } from '@/lib/supabase/types';
import GapjaGrid from '@/components/GapjaGrid';
import EntryList from '@/components/EntryList';
import { getOhaengColor } from '@/lib/ohaeng';

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

  const stemColor = getOhaengColor(selected.ohaeng);
  const branchColor = getOhaengColor(selected.branchOhaeng);
  const entryCount = stats[selected.index] ?? 0;

  return (
    <div className="space-y-10">

      {/* 페이지 타이틀 */}
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
        <h1 className="text-xl font-bold" style={{ letterSpacing: '-0.02em' }}>
          60갑자
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-faint)' }}>
          일주를 선택하면 같은 일진에 기록된 일기를 모아볼 수 있어요. (60일 주기)
        </p>
      </div>

      {/* 그리드 */}
      <GapjaGrid
        selectedIdx={selected.index}
        highlightIdx={todayPillar.index}
        entryCountByIdx={stats}
        onSelect={setSelected}
      />

      {/* 범례 */}
      <div className="flex flex-wrap gap-4 text-xs" style={{ color: 'var(--text-faint)' }}>
        <span>
          <span
            className="inline-block w-2 h-2 rounded-sm mr-1"
            style={{ background: '#f5e9c8', border: '1px solid #c4933f', verticalAlign: 'middle' }}
          />
          오늘 일주
        </span>
        <span>
          <span
            className="inline-block w-2 h-2 rounded-sm mr-1"
            style={{ background: '#2a2a2a', verticalAlign: 'middle' }}
          />
          선택됨
        </span>
        <span>우측 하단 숫자 = 일기 수</span>
      </div>

      {/* 선택된 갑자 상세 */}
      <div>
        <div
          style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}
          className="flex items-baseline gap-3"
        >
          <span style={{ fontSize: '28px', fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em' }}>
            <span style={{ color: stemColor }}>{selected.stem}</span>
            <span style={{ color: branchColor }}>{selected.branch}</span>
          </span>
          <span style={{ fontSize: '14px', color: 'var(--text-faint)' }}>
            {selected.nameHanja}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
            천간 {selected.ohaeng} · 지지 {selected.branchOhaeng} · #{selected.index + 1}/60
          </span>
          <span style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--text-faint)' }}>
            {entryCount}개의 일기
          </span>
        </div>

        {loading ? (
          <p className="py-8 text-sm text-center" style={{ color: 'var(--text-faint)' }}>
            불러오는 중...
          </p>
        ) : (
          <EntryList entries={entries} />
        )}
      </div>
    </div>
  );
}
