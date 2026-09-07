'use client';

import { useEffect, useState, useMemo } from 'react';
import { GAPJA_60 } from '@/lib/ganjia';
import { getAllEntries } from '@/lib/diary';
import type { DiaryEntry } from '@/lib/supabase/types';
import { getOhaengColor, getOhaengBg } from '@/lib/ohaeng';
import {
  avgEnergy,
  avgMoodScore,
  moodDistribution,
  ohaengAnalysis,
  pillarStats,
  tagAnalysis,
  timeSeries,
  streakDays,
  generateInsights,
  MOOD_EMOJI,
  type OhaengStats,
  type PillarStat,
} from '@/lib/analysis';

// ─── 탭 정의 ──────────────────────────────────
const TABS = ['개요', '에너지·기분', '오행 분석', '일주 분석', '태그'] as const;
type Tab = (typeof TABS)[number];

export default function AnalysisPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('개요');

  useEffect(() => {
    getAllEntries().then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, []);

  const ohaeng = useMemo(() => ohaengAnalysis(entries), [entries]);
  const pillars = useMemo(() => pillarStats(entries), [entries]);
  const tags = useMemo(() => tagAnalysis(entries), [entries]);
  const series = useMemo(() => timeSeries(entries, 90), [entries]);
  const insights = useMemo(() => generateInsights(entries, ohaeng, tags), [entries, ohaeng, tags]);
  const streak = streakDays(entries);

  if (loading) return <Spinner />;
  if (entries.length === 0) return <Empty />;

  const avgE = avgEnergy(entries);
  const avgM = avgMoodScore(entries);
  const moodDist = moodDistribution(entries);

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* 페이지 헤더 */}
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
        <h1 className="text-xl font-bold" style={{ letterSpacing: '-0.02em' }}>패턴 분석</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-faint)' }}>
          {entries.length}개의 일기 · {new Set(entries.map(e => e.day_gapja_idx)).size}/60 일주 경험
        </p>
      </div>

      {/* 탭 */}
      <div className="flex gap-0" style={{ borderBottom: '1px solid var(--border)' }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              color: tab === t ? 'var(--text-ink)' : 'var(--text-faint)',
              background: 'none',
              border: 'none',
              borderBottom: tab === t ? '2px solid var(--text-ink)' : '2px solid transparent',
              marginBottom: '-1px',
              fontFamily: 'inherit',
              transition: 'color 0.1s',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── 개요 탭 ── */}
      {tab === '개요' && (
        <div className="space-y-8">

          {/* 숫자 요약 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="총 일기" value={String(entries.length)} />
            <Stat label="연속 기록" value={`${streak}일`} />
            <Stat
              label="평균 에너지"
              value={avgE !== null ? `${avgE.toFixed(1)} / 5` : '–'}
              sub="1=방전, 5=최상"
            />
            <Stat
              label="평균 기분"
              value={avgM !== null ? `${avgM.toFixed(1)} / 4` : '–'}
              sub="1=최악, 4=좋음"
            />
          </div>

          {/* 인사이트 */}
          {insights.length > 0 && (
            <Section title="발견된 패턴">
              <div className="space-y-2.5">
                {insights.map((ins, i) => (
                  <div
                    key={i}
                    className="flex gap-3 items-start"
                    style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-mid)' }}
                  >
                    <span style={{ minWidth: '18px', fontSize: '14px' }}>{ins.icon}</span>
                    <span>{ins.text}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* 기분 요약 */}
          <Section title="기분 분포">
            <div className="flex items-end gap-3 h-28">
              {moodDist.map((m) => (
                <div key={m.label} className="flex flex-col items-center flex-1 gap-1">
                  <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>
                    {m.count > 0 ? `${Math.round(m.pct)}%` : ''}
                  </span>
                  <div
                    className="w-full rounded-sm"
                    style={{
                      height: `${Math.max((m.pct / 100) * 72, m.count > 0 ? 4 : 0)}px`,
                      background: m.label === '좋음' ? '#3a6b4a'
                        : m.label === '보통' ? '#8a8a8a'
                        : m.label === '나쁨' ? '#b84030'
                        : '#7a3a2a',
                      opacity: 0.7,
                    }}
                  />
                  <span style={{ fontSize: '16px' }}>{m.emoji}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>{m.count}개</span>
                </div>
              ))}
            </div>
          </Section>

          {/* 60갑자 커버리지 히트맵 */}
          <Section title="60갑자 히트맵 — 일기 수">
            <GapjaHeatmap entries={entries} mode="count" />
          </Section>
        </div>
      )}

      {/* ── 에너지·기분 탭 ── */}
      {tab === '에너지·기분' && (
        <div className="space-y-8">

          {/* 시계열 */}
          {series.length >= 2 && (
            <Section title={`에너지 추이 — 최근 ${series.length}개 기록`}>
              <EnergySeries series={series} />
            </Section>
          )}

          {/* 기분 추이 */}
          {series.length >= 2 && (
            <Section title="기분 추이">
              <MoodSeries series={series} />
            </Section>
          )}

          {/* 기분별 평균 에너지 */}
          <Section title="기분에 따른 에너지 비교">
            <MoodEnergyTable entries={entries} />
          </Section>

          {/* 월별 기록 */}
          <Section title="월별 기록 수">
            <MonthlyBar entries={entries} />
          </Section>
        </div>
      )}

      {/* ── 오행 분석 탭 ── */}
      {tab === '오행 분석' && (
        <div className="space-y-8">
          <p style={{ fontSize: '13px', color: 'var(--text-faint)', lineHeight: 1.7 }}>
            일주(日柱)의 <strong>천간 오행</strong>과 <strong>지지 오행</strong>별로 
            에너지와 기분의 평균을 비교해요.<br />
            데이터가 쌓일수록 더 유의미한 패턴이 보여요. (각 오행당 최소 5개 이상 권장)
          </p>

          <Section title="지지(地支) 오행 — 에너지 & 기분">
            <OhaengTable stats={ohaeng} type="branch" />
          </Section>

          <Section title="천간(天干) 오행 — 에너지 & 기분">
            <OhaengTable stats={ohaeng} type="stem" />
          </Section>

          <Section title="오행별 기분 분포">
            <OhaengMoodGrid stats={ohaeng} type="branch" entries={entries} />
          </Section>
        </div>
      )}

      {/* ── 일주 분석 탭 ── */}
      {tab === '일주 분석' && (
        <div className="space-y-8">
          <Section title={`기록된 일주 ${pillars.length}가지`}>
            <PillarTable pillars={pillars} />
          </Section>

          {/* 에너지 기준 60갑자 히트맵 */}
          <Section title="일주별 평균 에너지 히트맵">
            <GapjaHeatmap entries={entries} mode="energy" />
          </Section>
        </div>
      )}

      {/* ── 태그 탭 ── */}
      {tab === '태그' && (
        <div className="space-y-8">
          {tags.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-faint)', paddingTop: '32px', textAlign: 'center' }}>
              아직 태그가 없어요. 일기 작성 시 태그를 달아보세요.
            </p>
          ) : (
            <>
              <Section title="태그 목록 (빈도순)">
                <TagTable tags={tags} />
              </Section>
              <Section title="태그 클라우드">
                <TagCloud tags={tags} />
              </Section>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 서브 컴포넌트들
// ─────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p
        className="mb-4"
        style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ padding: '16px', background: '#f5f3ef', borderRadius: '6px' }}>
      <p style={{ fontSize: '11px', color: 'var(--text-faint)', marginBottom: '6px' }}>{label}</p>
      <p style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '4px' }}>{sub}</p>}
    </div>
  );
}

function Spinner() {
  return <p style={{ padding: '64px', textAlign: 'center', color: 'var(--text-faint)', fontSize: '13px' }}>분석 중...</p>;
}

function Empty() {
  return (
    <div style={{ padding: '64px', textAlign: 'center' }}>
      <p style={{ color: 'var(--text-faint)', fontSize: '13px' }}>아직 일기가 없어요.</p>
      <p style={{ color: 'var(--text-faint)', fontSize: '12px', marginTop: '4px' }}>일기를 작성하면 패턴을 분석해 드려요.</p>
    </div>
  );
}

// ─── 에너지 시계열 ────────────────────────────
function EnergySeries({ series }: { series: ReturnType<typeof timeSeries> }) {
  const points = series.filter((p) => p.energy !== null);
  if (points.length < 2) return <p style={{ fontSize: '12px', color: 'var(--text-faint)' }}>데이터 부족</p>;

  const maxE = 5;
  const h = 80;
  const w = 100 / points.length;

  return (
    <div>
      <div className="flex items-end gap-px" style={{ height: `${h + 24}px`, alignItems: 'flex-end' }}>
        {series.map((p, i) => {
          const e = p.energy;
          const barH = e !== null ? (e / maxE) * h : 0;
          const barColor =
            e === null ? 'var(--border)'
            : e >= 4 ? '#3a6b4a'
            : e >= 3 ? '#8a8a8a'
            : '#b84030';

          return (
            <div
              key={i}
              className="flex flex-col items-center justify-end"
              style={{ flex: 1, height: `${h + 24}px` }}
              title={`${p.date} · ${p.dayGapja} · 에너지 ${e ?? '없음'}`}
            >
              <div
                style={{
                  width: '100%',
                  height: `${barH}px`,
                  background: barColor,
                  opacity: 0.75,
                  borderRadius: '2px 2px 0 0',
                  minHeight: e !== null ? '2px' : '0',
                  transition: 'height 0.2s',
                }}
              />
              {/* 날짜 — 5개마다 */}
              {i % Math.max(1, Math.floor(series.length / 6)) === 0 && (
                <span
                  style={{
                    fontSize: '8px',
                    color: 'var(--text-faint)',
                    marginTop: '4px',
                    writingMode: 'vertical-rl',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.date.slice(5)}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2" style={{ fontSize: '10px', color: 'var(--text-faint)' }}>
        <span>1 (방전)</span><span>5 (최상)</span>
      </div>
    </div>
  );
}

// ─── 기분 시계열 ────────────────────────────
function MoodSeries({ series }: { series: ReturnType<typeof timeSeries> }) {
  const EMOJI_MAP: Record<string, string> = MOOD_EMOJI;
  const points = series.filter((p) => p.mood);

  if (points.length < 2) return <p style={{ fontSize: '12px', color: 'var(--text-faint)' }}>데이터 부족</p>;

  return (
    <div className="flex flex-wrap gap-1">
      {series.map((p, i) => (
        <div
          key={i}
          title={`${p.date} · ${p.dayGapja} · ${p.mood ?? '기분 미기록'}`}
          style={{
            fontSize: '14px',
            opacity: p.mood ? 1 : 0.15,
            cursor: 'default',
          }}
        >
          {p.mood ? EMOJI_MAP[p.mood] ?? '?' : '·'}
        </div>
      ))}
    </div>
  );
}

// ─── 기분별 평균 에너지 ──────────────────────
function MoodEnergyTable({ entries }: { entries: DiaryEntry[] }) {
  const labels = ['좋음', '보통', '나쁨', '최악'];
  const rows = labels.map((label) => {
    const es = entries.filter((e) => e.mood === label);
    const ae = avgEnergy(es);
    return { label, count: es.length, avgE: ae };
  }).filter((r) => r.count > 0);

  if (rows.length === 0) return <p style={{ fontSize: '12px', color: 'var(--text-faint)' }}>기분 기록 없음</p>;

  const maxE = Math.max(...rows.map((r) => r.avgE ?? 0), 1);

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3">
          <span style={{ fontSize: '16px', width: '24px' }}>{MOOD_EMOJI[r.label]}</span>
          <span style={{ fontSize: '12px', color: 'var(--text-mid)', width: '36px' }}>{r.label}</span>
          <div style={{ flex: 1, background: 'var(--border)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: r.avgE !== null ? `${(r.avgE / maxE) * 100}%` : '0%',
                background: 'var(--text-ink)',
                borderRadius: '3px',
              }}
            />
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-faint)', width: '80px', textAlign: 'right' }}>
            {r.avgE !== null ? `에너지 avg ${r.avgE.toFixed(1)}` : '–'} · {r.count}개
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── 월별 바 ─────────────────────────────────
function MonthlyBar({ entries }: { entries: DiaryEntry[] }) {
  const monthMap: Record<string, number> = {};
  for (const e of entries) {
    const ym = e.date.slice(0, 7);
    monthMap[ym] = (monthMap[ym] ?? 0) + 1;
  }
  const months = Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b)).slice(-18);
  if (months.length === 0) return null;
  const maxC = Math.max(...months.map(([, c]) => c), 1);

  return (
    <div className="flex items-end gap-1" style={{ height: '80px' }}>
      {months.map(([ym, count]) => (
        <div key={ym} className="flex flex-col items-center justify-end flex-1" style={{ height: '80px' }} title={`${ym} · ${count}개`}>
          <span style={{ fontSize: '9px', color: 'var(--text-faint)', marginBottom: '2px' }}>{count}</span>
          <div
            style={{
              width: '100%',
              height: `${(count / maxC) * 52}px`,
              background: 'var(--text-ink)',
              opacity: 0.6,
              borderRadius: '2px 2px 0 0',
            }}
          />
          <span style={{ fontSize: '8px', color: 'var(--text-faint)', marginTop: '3px' }}>
            {ym.slice(2)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── 오행 테이블 ─────────────────────────────
function OhaengTable({ stats, type }: { stats: OhaengStats[]; type: 'stem' | 'branch' }) {
  const rows = stats.map((s) => ({
    ohaeng: s.ohaeng,
    color: s.color,
    count: type === 'stem' ? s.stemCount : s.branchCount,
    avgE: type === 'stem' ? s.stemAvgEnergy : s.branchAvgEnergy,
    avgM: type === 'stem' ? s.stemAvgMood : s.branchAvgMood,
  }));

  const maxE = Math.max(...rows.map((r) => r.avgE ?? 0), 1);

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['오행', '일기 수', '평균 에너지', '평균 기분 (4점)'].map((h) => (
              <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: 'var(--text-faint)', fontWeight: 500 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.ohaeng} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '10px 10px', fontWeight: 600 }}>
                <span style={{ color: r.color }}>{r.ohaeng}</span>
              </td>
              <td style={{ padding: '10px 10px', color: 'var(--text-mid)' }}>{r.count}</td>
              <td style={{ padding: '10px 10px' }}>
                {r.avgE !== null && r.count >= 1 ? (
                  <div className="flex items-center gap-2">
                    <div style={{ width: '80px', height: '5px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(r.avgE / maxE) * 100}%`, background: r.color, opacity: 0.8 }} />
                    </div>
                    <span style={{ color: 'var(--text-mid)' }}>{r.avgE.toFixed(1)}</span>
                  </div>
                ) : <span style={{ color: 'var(--text-faint)' }}>–</span>}
              </td>
              <td style={{ padding: '10px 10px', color: 'var(--text-mid)' }}>
                {r.avgM !== null && r.count >= 1 ? (
                  <span>
                    {r.avgM.toFixed(1)}
                    <span style={{ color: 'var(--text-faint)', marginLeft: '6px' }}>
                      {r.avgM >= 3.5 ? '😊' : r.avgM >= 2.5 ? '😐' : '😔'}
                    </span>
                  </span>
                ) : <span style={{ color: 'var(--text-faint)' }}>–</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── 오행별 기분 분포 ─────────────────────────
function OhaengMoodGrid({ stats, type, entries }: { stats: OhaengStats[]; type: 'stem' | 'branch'; entries: DiaryEntry[] }) {
  return (
    <div className="space-y-3">
      {stats.map((s) => {
        const es = type === 'branch' ? s.branchEntries : s.stemEntries;
        const dist = moodDistribution(es);
        const total = dist.reduce((a, b) => a + b.count, 0);
        if (total === 0) return null;

        return (
          <div key={s.ohaeng} className="flex items-center gap-3">
            <span style={{ fontSize: '13px', fontWeight: 600, color: s.color, width: '20px' }}>{s.ohaeng}</span>
            <div className="flex flex-1 rounded overflow-hidden" style={{ height: '16px' }}>
              {dist.map((m) => (
                m.count > 0 && (
                  <div
                    key={m.label}
                    style={{
                      width: `${m.pct}%`,
                      background:
                        m.label === '좋음' ? '#3a6b4a'
                        : m.label === '보통' ? '#aaa'
                        : m.label === '나쁨' ? '#b84030'
                        : '#7a3a2a',
                      opacity: 0.7,
                    }}
                    title={`${m.label} ${Math.round(m.pct)}%`}
                  />
                )
              ))}
            </div>
            <span style={{ fontSize: '10px', color: 'var(--text-faint)', width: '50px', textAlign: 'right' }}>
              {total}개
            </span>
          </div>
        );
      })}
      <div className="flex gap-4 mt-2" style={{ fontSize: '10px', color: 'var(--text-faint)' }}>
        {['좋음', '보통', '나쁨', '최악'].map((l) => (
          <span key={l} className="flex items-center gap-1">
            <span style={{
              display: 'inline-block', width: '8px', height: '8px',
              background: l === '좋음' ? '#3a6b4a' : l === '보통' ? '#aaa' : l === '나쁨' ? '#b84030' : '#7a3a2a',
              opacity: 0.7, borderRadius: '1px',
            }} />
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── 일주 테이블 ─────────────────────────────
function PillarTable({ pillars }: { pillars: PillarStat[] }) {
  const [sort, setSort] = useState<'count' | 'energy' | 'mood'>('count');

  const sorted = [...pillars].sort((a, b) => {
    if (sort === 'count') return b.count - a.count;
    if (sort === 'energy') return (b.avgEnergy ?? 0) - (a.avgEnergy ?? 0);
    return (b.avgMood ?? 0) - (a.avgMood ?? 0);
  });

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {(['count', 'energy', 'mood'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            style={{
              fontSize: '11px',
              padding: '3px 10px',
              borderRadius: '3px',
              border: '1px solid var(--border)',
              background: sort === s ? 'var(--text-ink)' : 'transparent',
              color: sort === s ? '#fff' : 'var(--text-faint)',
              fontFamily: 'inherit',
            }}
          >
            {s === 'count' ? '기록 순' : s === 'energy' ? '에너지 순' : '기분 순'}
          </button>
        ))}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['일주', '기록', '평균 에너지', '평균 기분', '자주 쓴 태그'].map((h) => (
                <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: 'var(--text-faint)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => {
              const stemColor = getOhaengColor(p.stemOhaeng);
              const branchColor = getOhaengColor(p.branchOhaeng);
              return (
                <tr key={p.idx} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '9px 8px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>
                      <span style={{ color: stemColor }}>{p.stem}</span>
                      <span style={{ color: branchColor }}>{p.branch}</span>
                    </span>
                  </td>
                  <td style={{ padding: '9px 8px', color: 'var(--text-mid)' }}>{p.count}</td>
                  <td style={{ padding: '9px 8px', color: 'var(--text-mid)' }}>
                    {p.avgEnergy !== null ? (
                      <span className="flex items-center gap-1.5">
                        <EnergyDots value={p.avgEnergy} />
                        {p.avgEnergy.toFixed(1)}
                      </span>
                    ) : '–'}
                  </td>
                  <td style={{ padding: '9px 8px', color: 'var(--text-mid)' }}>
                    {p.avgMood !== null
                      ? `${p.avgMood.toFixed(1)} ${p.avgMood >= 3.5 ? '😊' : p.avgMood >= 2.5 ? '😐' : '😔'}`
                      : '–'}
                  </td>
                  <td style={{ padding: '9px 8px', color: 'var(--text-faint)' }}>
                    {p.tags.length > 0 ? p.tags.map((t) => `#${t}`).join(' ') : '–'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EnergyDots({ value }: { value: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          style={{
            display: 'inline-block',
            width: '5px',
            height: '5px',
            borderRadius: '1px',
            background: n <= Math.round(value) ? 'var(--text-ink)' : 'var(--border)',
          }}
        />
      ))}
    </span>
  );
}

// ─── 태그 테이블 ─────────────────────────────
function TagTable({ tags }: { tags: ReturnType<typeof tagAnalysis> }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['태그', '횟수', '평균 에너지', '평균 기분', '주로 등장한 오행'].map((h) => (
              <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: 'var(--text-faint)', fontWeight: 500 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tags.slice(0, 20).map((t) => {
            const topOhaeng = Object.entries(t.ohaengMap).sort(([, a], [, b]) => b - a).slice(0, 2);
            return (
              <tr key={t.tag} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '9px 8px', fontWeight: 500 }}>#{t.tag}</td>
                <td style={{ padding: '9px 8px', color: 'var(--text-mid)' }}>{t.count}</td>
                <td style={{ padding: '9px 8px', color: 'var(--text-mid)' }}>
                  {t.avgEnergy !== null ? t.avgEnergy.toFixed(1) : '–'}
                </td>
                <td style={{ padding: '9px 8px', color: 'var(--text-mid)' }}>
                  {t.avgMood !== null
                    ? `${t.avgMood.toFixed(1)} ${t.avgMood >= 3.5 ? '😊' : t.avgMood >= 2.5 ? '😐' : '😔'}`
                    : '–'}
                </td>
                <td style={{ padding: '9px 8px' }}>
                  {topOhaeng.map(([o]) => (
                    <span key={o} style={{ color: getOhaengColor(o), fontSize: '12px', marginRight: '6px' }}>
                      {o}
                    </span>
                  ))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── 태그 클라우드 ────────────────────────────
function TagCloud({ tags }: { tags: ReturnType<typeof tagAnalysis> }) {
  const max = tags[0]?.count ?? 1;
  return (
    <div className="flex flex-wrap gap-2">
      {tags.slice(0, 40).map((t) => {
        const size = 10 + (t.count / max) * 14;
        return (
          <span
            key={t.tag}
            title={`${t.count}회`}
            style={{
              fontSize: `${size}px`,
              color: 'var(--text-mid)',
              opacity: 0.4 + (t.count / max) * 0.6,
              lineHeight: 1.4,
            }}
          >
            #{t.tag}
          </span>
        );
      })}
    </div>
  );
}

// ─── 60갑자 히트맵 ────────────────────────────
function GapjaHeatmap({ entries, mode }: { entries: DiaryEntry[]; mode: 'count' | 'energy' }) {
  const data = useMemo(() => {
    const map: Record<number, DiaryEntry[]> = {};
    for (const e of entries) {
      if (!map[e.day_gapja_idx]) map[e.day_gapja_idx] = [];
      map[e.day_gapja_idx].push(e);
    }
    return map;
  }, [entries]);

  const values = GAPJA_60.map((p) => {
    const es = data[p.index] ?? [];
    if (mode === 'count') return es.length;
    const ae = avgEnergy(es);
    return ae ?? 0;
  });

  const max = Math.max(...values, 1);

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(10, 1fr)',
          gap: '2px',
        }}
      >
        {GAPJA_60.map((pillar, i) => {
          const val = values[i];
          const stemColor = getOhaengColor(pillar.ohaeng);
          const branchColor = getOhaengColor(pillar.branchOhaeng);
          const es = data[pillar.index] ?? [];

          const intensity = val === 0 ? 0 : 0.07 + (val / max) * 0.75;

          // 에너지모드: 색이 높을수록 초록, 낮을수록 빨강
          const cellBg = mode === 'energy' && val > 0
            ? val >= 4 ? `rgba(58,107,74,${intensity})`
            : val >= 3 ? `rgba(138,138,138,${intensity})`
            : `rgba(184,64,48,${intensity})`
            : `rgba(26,26,26,${intensity})`;

          return (
            <div
              key={pillar.index}
              title={`${pillar.name} · ${mode === 'count' ? `${val}개` : val > 0 ? `에너지 avg ${val.toFixed(1)}` : '기록 없음'}`}
              style={{
                aspectRatio: '1',
                background: cellBg,
                borderRadius: '3px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px',
              }}
            >
              <span style={{ fontSize: '9px', fontWeight: 500, lineHeight: 1.1 }}>
                <span style={{ color: val > 0 ? stemColor : 'var(--text-faint)', opacity: val > 0 ? 0.8 : 0.3 }}>
                  {pillar.stem}
                </span>
                <span style={{ color: val > 0 ? branchColor : 'var(--text-faint)', opacity: val > 0 ? 0.8 : 0.3 }}>
                  {pillar.branch}
                </span>
              </span>
              {val > 0 && mode === 'count' && (
                <span style={{ fontSize: '7px', color: 'var(--text-faint)' }}>{val}</span>
              )}
              {val > 0 && mode === 'energy' && (
                <span style={{ fontSize: '7px', color: 'var(--text-faint)' }}>{val.toFixed(1)}</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex gap-4 mt-3" style={{ fontSize: '10px', color: 'var(--text-faint)' }}>
        {mode === 'count'
          ? <span>진할수록 해당 일주의 기록이 많아요</span>
          : <>
              <span style={{ color: '#3a6b4a' }}>■ 에너지 높음</span>
              <span style={{ color: '#aaa' }}>■ 보통</span>
              <span style={{ color: '#b84030' }}>■ 에너지 낮음</span>
            </>
        }
      </div>
    </div>
  );
}
