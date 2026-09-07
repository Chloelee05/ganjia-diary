'use client';

import { useEffect, useState } from 'react';
import { GAPJA_60 } from '@/lib/ganjia';
import { getDayGapjaStats, getAllEntries } from '@/lib/diary';
import type { DiaryEntry } from '@/lib/supabase/types';
import GapjaBadge from '@/components/GapjaBadge';

const OHAENG_COLORS: Record<string, string> = {
  목: '#10b981',
  화: '#ef4444',
  토: '#f59e0b',
  금: '#6b7280',
  수: '#3b82f6',
};

interface MoodStat {
  mood: string;
  count: number;
}

interface OhaengStat {
  ohaeng: string;
  count: number;
  entryCount: number;
}

export default function AnalysisPage() {
  const [stats, setStats] = useState<Record<number, number>>({});
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDayGapjaStats(), getAllEntries()]).then(([s, e]) => {
      setStats(s);
      setEntries(e);
      setLoading(false);
    });
  }, []);

  const totalEntries = entries.length;
  const uniqueDayGapja = Object.keys(stats).length;

  // 오행별 일기 개수
  const ohaengStats: OhaengStat[] = ['목', '화', '토', '금', '수'].map((ohaeng) => {
    const pillarsInOhaeng = GAPJA_60.filter((g) => g.ohaeng === ohaeng);
    const count = pillarsInOhaeng.length;
    const entryCount = pillarsInOhaeng.reduce((sum, g) => sum + (stats[g.index] ?? 0), 0);
    return { ohaeng, count, entryCount };
  });

  // 기분 분포
  const moodMap: Record<string, number> = {};
  for (const e of entries) {
    if (e.mood) moodMap[e.mood] = (moodMap[e.mood] ?? 0) + 1;
  }
  const moodStats: MoodStat[] = Object.entries(moodMap)
    .map(([mood, count]) => ({ mood, count }))
    .sort((a, b) => b.count - a.count);

  // 일주별 가장 많이 기록된 top 5
  const topPillars = Object.entries(stats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([idx, count]) => ({ pillar: GAPJA_60[Number(idx)], count }));

  // 월별 일기 개수
  const monthlyMap: Record<string, number> = {};
  for (const e of entries) {
    const ym = e.date.slice(0, 7);
    monthlyMap[ym] = (monthlyMap[ym] ?? 0) + 1;
  }
  const monthlyStats = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12);

  const maxMonthlyCount = Math.max(...monthlyStats.map(([, c]) => c), 1);

  if (loading) {
    return (
      <div className="py-16 text-center text-stone-400 text-sm">분석 중...</div>
    );
  }

  if (totalEntries === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <p className="text-stone-400 text-sm">아직 일기가 없어요.</p>
        <p className="text-stone-400 text-xs mt-1">일기를 작성하면 패턴을 분석해 드려요.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-800 mb-1">패턴 분석</h1>
        <p className="text-sm text-stone-500">
          총 {totalEntries}개의 일기 · {uniqueDayGapja}가지 일주 기록
        </p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="총 일기 수" value={String(totalEntries)} />
        <StatCard label="기록된 일주 종류" value={`${uniqueDayGapja} / 60`} />
        <StatCard
          label="평균 에너지"
          value={
            entries.filter((e) => e.energy_level).length > 0
              ? (
                  entries.reduce((s, e) => s + (e.energy_level ?? 0), 0) /
                  entries.filter((e) => e.energy_level).length
                ).toFixed(1)
              : '-'
          }
        />
        <StatCard
          label="연속 기록 중"
          value={`${getStreakDays(entries)}일`}
        />
      </div>

      {/* 월별 기록 */}
      {monthlyStats.length > 0 && (
        <Section title="월별 일기 수">
          <div className="flex items-end gap-1.5 h-32">
            {monthlyStats.map(([ym, count]) => (
              <div key={ym} className="flex flex-col items-center flex-1 gap-1">
                <span className="text-[10px] text-stone-500">{count}</span>
                <div
                  className="w-full bg-stone-700 rounded-t"
                  style={{ height: `${(count / maxMonthlyCount) * 80}px` }}
                />
                <span className="text-[9px] text-stone-400 leading-tight text-center">
                  {ym.slice(5)}월
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 오행별 */}
      <Section title="오행(五行)별 기록">
        <div className="flex flex-wrap gap-3">
          {ohaengStats.map(({ ohaeng, count, entryCount }) => (
            <div
              key={ohaeng}
              className="flex flex-col items-center p-4 rounded-xl border bg-white gap-1 flex-1 min-w-[80px]"
              style={{ borderColor: OHAENG_COLORS[ohaeng] + '40' }}
            >
              <span
                className="text-lg font-bold"
                style={{ color: OHAENG_COLORS[ohaeng] }}
              >
                {ohaeng}
              </span>
              <span className="text-2xl font-bold text-stone-800">{entryCount}</span>
              <span className="text-[11px] text-stone-400">일기</span>
            </div>
          ))}
        </div>
      </Section>

      {/* 가장 많이 기록된 일주 */}
      {topPillars.length > 0 && (
        <Section title="가장 많이 기록된 일주 Top 5">
          <div className="space-y-2">
            {topPillars.map(({ pillar, count }, i) => (
              <div key={pillar.index} className="flex items-center gap-3">
                <span className="text-xs text-stone-400 w-4 text-right">{i + 1}</span>
                <GapjaBadge pillar={pillar} size="sm" />
                <div className="flex-1 bg-stone-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-stone-700 rounded-full"
                    style={{ width: `${(count / topPillars[0].count) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-stone-600 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 기분 분포 */}
      {moodStats.length > 0 && (
        <Section title="기분 분포">
          <div className="space-y-2">
            {moodStats.map(({ mood, count }) => (
              <div key={mood} className="flex items-center gap-3">
                <span className="text-sm w-28 text-stone-600">{mood}</span>
                <div className="flex-1 bg-stone-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-stone-500 rounded-full"
                    style={{ width: `${(count / moodStats[0].count) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-stone-500 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 60갑자 커버리지 히트맵 */}
      <Section title="60갑자 커버리지">
        <div className="grid grid-cols-10 gap-1">
          {GAPJA_60.map((pillar) => {
            const count = stats[pillar.index] ?? 0;
            const opacity = count === 0 ? 0.08 : Math.min(0.15 + count * 0.15, 1);
            return (
              <div
                key={pillar.index}
                className="aspect-square rounded flex items-center justify-center text-[10px] font-medium text-stone-700"
                style={{ backgroundColor: `rgba(68, 64, 60, ${opacity})` }}
                title={`${pillar.name} · ${count}개`}
              >
                {pillar.name}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-stone-400 mt-2">
          진할수록 해당 일주의 일기가 많아요
        </p>
      </Section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4">
      <p className="text-xs text-stone-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-stone-800">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-stone-700 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function getStreakDays(entries: DiaryEntry[]): number {
  if (entries.length === 0) return 0;
  const dates = entries.map((e) => e.date).sort();
  const today = new Date();
  let streak = 0;
  let check = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  for (let i = 0; i < 365; i++) {
    const dateStr = check.toISOString().slice(0, 10);
    if (dates.includes(dateStr)) {
      streak++;
      check.setDate(check.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}
