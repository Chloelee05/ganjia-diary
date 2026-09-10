'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  getSaju,
  today,
  parseDate,
  formatDate,
  getDayPillar,
  GAPJA_60,
} from '@/lib/ganjia';
import type { GanjiPillar } from '@/lib/ganjia';
import { getOhaengColor, getOhaengBg } from '@/lib/ohaeng';
import { getAllEntries, getEntriesByDayGapja } from '@/app/actions';
import type { DiaryEntry } from '@/lib/supabase/types';
import DiaryEditor from '@/components/DiaryEditor';
import { streakDays, avgEnergy, avgMoodScore, MOOD_EMOJI } from '@/lib/analysis';
import { loadUserSaju, getSipsungForStem, getMainSipsungForBranch, SIPSUNG_CATEGORY_COLOR } from '@/lib/sipsung';

export default function DashboardPage() {
  const todayDate = today();
  const todaySaju = getSaju(todayDate);

  const [date, setDate] = useState(todayDate);
  const [allEntries, setAllEntries] = useState<DiaryEntry[]>([]);
  const [samePillarEntries, setSamePillarEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSaju, setUserSaju] = useState(() => loadUserSaju());

  // URL 날짜 파라미터 지원
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('date');
    if (p) setDate(parseDate(p));
  }, []);

  useEffect(() => {
    getAllEntries().then((es) => {
      setAllEntries(es);
      setLoading(false);
    });
  }, []);

  const saju = getSaju(date);
  const isToday = formatDate(date) === formatDate(todayDate);

  // 선택된 날짜의 일주와 같은 일주의 이전 기록
  useEffect(() => {
    getEntriesByDayGapja(saju.day.index).then(setSamePillarEntries);
  }, [saju.day.index]);

  const streak = useMemo(() => streakDays(allEntries), [allEntries]);
  const recentEntries = useMemo(
    () => [...allEntries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [allEntries]
  );
  const todayEntry = allEntries.find((e) => e.date === formatDate(todayDate));

  // 선택 날짜의 같은 일주 이전 기록 (선택 날짜 제외)
  const prevSamePillar = useMemo(
    () => samePillarEntries.filter((e) => e.date !== formatDate(date)).slice(0, 3),
    [samePillarEntries, date]
  );

  // 다음 같은 일주 날짜 (오늘 기준)
  const nextSamePillarDate = useMemo(() => {
    const targetIdx = saju.day.index;
    const cur = new Date(todayDate);
    for (let i = 1; i <= 60; i++) {
      cur.setDate(cur.getDate() + 1);
      if (getDayPillar(cur).index === targetIdx) return new Date(cur);
    }
    return null;
  }, [saju.day.index, todayDate]);

  // 오늘이 60갑자 주기상 몇 번째인지
  const cycleDay = useMemo(() => {
    const startOfCycle = new Date(todayDate);
    for (let i = 0; i < 60; i++) {
      startOfCycle.setDate(startOfCycle.getDate() - 1);
      if (getDayPillar(startOfCycle).index === 0) {
        return 60 - i;
      }
    }
    return todaySaju.day.index + 1;
  }, [todayDate]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 max-w-5xl mx-auto">

      {/* ══ 메인 컬럼 ══════════════════════════════ */}
      <div className="space-y-0">

        {/* 날짜 헤더 */}
        <DayHeader date={date} saju={saju} isToday={isToday} onDateChange={setDate} userSaju={userSaju} />

        {/* 에디터 */}
        <div style={{ paddingTop: '28px' }}>
          <DiaryEditor initialDate={date} onDateChange={setDate} />
        </div>

        {/* 같은 일주 이전 기록 */}
        {prevSamePillar.length > 0 && (
          <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
            <SectionLabel>
              이전 <StemBranch pillar={saju.day} />일 기록
            </SectionLabel>
            <div className="space-y-0 mt-3">
              {prevSamePillar.map((entry) => (
                <PastEntryRow key={entry.id} entry={entry} />
              ))}
            </div>
            {samePillarEntries.length > 3 && (
              <Link
                href={`/gapja`}
                style={{ fontSize: '11px', color: 'var(--text-faint)', display: 'block', marginTop: '12px' }}
              >
                전체 {samePillarEntries.length}개 보기 →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ══ 사이드바 ══════════════════════════════ */}
      <aside className="space-y-6 lg:border-l" style={{ borderColor: 'var(--border)', paddingLeft: '0' }}>
        <div className="lg:pl-8 space-y-6">

          {/* 오늘 상태 */}
          <TodayStatus
            todayEntry={todayEntry}
            streak={streak}
            total={allEntries.length}
            avgE={avgEnergy(allEntries)}
            avgM={avgMoodScore(allEntries)}
          />

          {/* 주기 정보 */}
          <CycleWidget
            dayPillar={todaySaju.day}
            cycleDay={cycleDay}
            nextDate={nextSamePillarDate}
          />

          {/* 최근 기록 */}
          {recentEntries.length > 0 && (
            <div>
              <SectionLabel>최근 기록</SectionLabel>
              <div className="mt-3 space-y-0">
                {recentEntries.map((e) => (
                  <RecentRow key={e.id} entry={e} currentDate={formatDate(date)} onSelect={() => setDate(parseDate(e.date))} />
                ))}
              </div>
              <Link
                href="/list"
                style={{ fontSize: '11px', color: 'var(--text-faint)', display: 'block', marginTop: '10px' }}
              >
                전체 목록 →
              </Link>
            </div>
          )}

          {/* 60갑자 미니 사이클 뷰 */}
          <MiniCycleStrip dayPillar={todaySaju.day} allEntries={allEntries} />
        </div>
      </aside>
    </div>
  );
}

// ──────────────────────────────────────────────
// 날짜 헤더
// ──────────────────────────────────────────────
function DayHeader({
  date,
  saju,
  isToday,
  onDateChange,
  userSaju,
}: {
  date: Date;
  saju: ReturnType<typeof getSaju>;
  isToday: boolean;
  userSaju: ReturnType<typeof loadUserSaju>;
  onDateChange: (d: Date) => void;
}) {
  const weekday = date.toLocaleDateString('ko-KR', { weekday: 'short' });
  const fullDate = date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
      <div className="flex items-start justify-between gap-4 flex-wrap">

        {/* 날짜 텍스트 */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>{weekday}</span>
            {isToday && (
              <span
                style={{
                  fontSize: '10px',
                  padding: '1px 7px',
                  borderRadius: '20px',
                  background: '#f5e9c8',
                  color: '#8a6c20',
                }}
              >
                오늘
              </span>
            )}
            <input
              type="date"
              value={formatDate(date)}
              onChange={(e) => onDateChange(parseDate(e.target.value))}
              style={{
                fontSize: '11px',
                color: 'var(--text-faint)',
                background: 'none',
                border: 'none',
                outline: 'none',
                cursor: 'pointer',
                marginLeft: '4px',
              }}
            />
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>
            {fullDate}
          </h1>
        </div>

        {/* 사주 — 년/월/일 */}
        <div className="flex items-end gap-5">
          {([
            { label: '년', pillar: saju.year },
            { label: '월', pillar: saju.month },
            { label: '일', pillar: saju.day, large: true },
          ] as { label: string; pillar: GanjiPillar; large?: boolean }[]).map(({ label, pillar, large }) => (
            <SipsungPillarCell key={label} label={label} pillar={pillar} large={large} userSaju={userSaju} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// 오늘 상태 카드
// ──────────────────────────────────────────────
function TodayStatus({
  todayEntry,
  streak,
  total,
  avgE,
  avgM,
}: {
  todayEntry: DiaryEntry | undefined;
  streak: number;
  total: number;
  avgE: number | null;
  avgM: number | null;
}) {
  return (
    <div style={{ background: '#f5f3ef', borderRadius: '8px', padding: '16px' }}>
      <div className="flex items-center justify-between mb-3">
        <span style={{ fontSize: '11px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          오늘
        </span>
        <span
          style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '20px',
            background: todayEntry ? '#3a6b4a22' : 'transparent',
            color: todayEntry ? '#3a6b4a' : 'var(--text-faint)',
            border: `1px solid ${todayEntry ? '#3a6b4a44' : 'var(--border)'}`,
          }}
        >
          {todayEntry ? '✓ 기록됨' : '미기록'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MiniStat label="연속" value={`${streak}일`} />
        <MiniStat label="총 일기" value={`${total}개`} />
        <MiniStat label="평균 에너지" value={avgE !== null ? avgE.toFixed(1) : '–'} />
        <MiniStat
          label="평균 기분"
          value={avgM !== null
            ? (avgM >= 3.5 ? '😊' : avgM >= 2.5 ? '😐' : avgM >= 1.5 ? '😔' : '😩')
            : '–'}
        />
      </div>

      {todayEntry?.mood && (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-mid)' }}>
          오늘 기분: {MOOD_EMOJI[todayEntry.mood] ?? ''} {todayEntry.mood}
          {todayEntry.energy_level && (
            <span style={{ marginLeft: '8px', color: 'var(--text-faint)' }}>
              에너지 {todayEntry.energy_level}/5
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: '10px', color: 'var(--text-faint)', marginBottom: '2px' }}>{label}</p>
      <p style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</p>
    </div>
  );
}

// ──────────────────────────────────────────────
// 60갑자 주기 위젯
// ──────────────────────────────────────────────
function CycleWidget({
  dayPillar,
  cycleDay,
  nextDate,
}: {
  dayPillar: GanjiPillar;
  cycleDay: number;
  nextDate: Date | null;
}) {
  const stemColor = getOhaengColor(dayPillar.ohaeng);
  const branchColor = getOhaengColor(dayPillar.branchOhaeng);
  const daysToNext = nextDate
    ? Math.ceil((nextDate.getTime() - new Date().getTime()) / 86400000)
    : null;

  // 60칸 중 현재 위치 시각화
  const progress = (dayPillar.index + 1) / 60;

  return (
    <div>
      <SectionLabel>60갑자 주기</SectionLabel>
      <div style={{ marginTop: '10px' }}>

        {/* 현재 일주 크게 */}
        <div className="flex items-baseline gap-2 mb-3">
          <span style={{ fontSize: '36px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
            <span style={{ color: stemColor }}>{dayPillar.stem}</span>
            <span style={{ color: branchColor }}>{dayPillar.branch}</span>
          </span>
          <div style={{ fontSize: '11px', color: 'var(--text-faint)', lineHeight: 1.5 }}>
            <div>{dayPillar.nameHanja}</div>
            <div>#{dayPillar.index + 1} / 60</div>
          </div>
        </div>

        {/* 진행 바 */}
        <div style={{ background: 'var(--border)', height: '4px', borderRadius: '2px', marginBottom: '8px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${progress * 100}%`,
              background: stemColor,
              borderRadius: '2px',
              opacity: 0.7,
            }}
          />
        </div>

        <div className="flex justify-between" style={{ fontSize: '10px', color: 'var(--text-faint)' }}>
          <span>갑자 (1)</span>
          <span>계해 (60)</span>
        </div>

        {/* 오행 정보 */}
        <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-mid)', lineHeight: 1.8 }}>
          <div>천간: <span style={{ color: stemColor, fontWeight: 500 }}>{dayPillar.stem}</span> {dayPillar.ohaeng} {dayPillar.eumyang}</div>
          <div>지지: <span style={{ color: branchColor, fontWeight: 500 }}>{dayPillar.branch}</span> {dayPillar.branchOhaeng}</div>
        </div>

        {/* 다음 같은 일주 */}
        {nextDate && daysToNext !== null && (
          <div
            style={{
              marginTop: '10px',
              padding: '8px 10px',
              background: getOhaengBg(dayPillar.ohaeng),
              borderRadius: '5px',
              fontSize: '11px',
              color: 'var(--text-mid)',
              lineHeight: 1.6,
            }}
          >
            <span style={{ color: 'var(--text-faint)' }}>다음 </span>
            <span style={{ color: stemColor, fontWeight: 600 }}>{dayPillar.stem}</span>
            <span style={{ color: branchColor, fontWeight: 600 }}>{dayPillar.branch}</span>
            <span style={{ color: 'var(--text-faint)' }}>일</span>
            <span style={{ marginLeft: '6px', fontWeight: 600 }}>
              {nextDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
            </span>
            <span style={{ color: 'var(--text-faint)', marginLeft: '4px' }}>({daysToNext}일 후)</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// 미니 60갑자 스트립 (오늘 위치 강조)
// ──────────────────────────────────────────────
function MiniCycleStrip({
  dayPillar,
  allEntries,
}: {
  dayPillar: GanjiPillar;
  allEntries: DiaryEntry[];
}) {
  const entrySet = new Set(allEntries.map((e) => e.day_gapja_idx));

  return (
    <div>
      <SectionLabel>60갑자 커버리지</SectionLabel>
      <div
        className="grid mt-3"
        style={{ gridTemplateColumns: 'repeat(10, 1fr)', gap: '2px' }}
      >
        {GAPJA_60.map((p) => {
          const isToday = p.index === dayPillar.index;
          const hasEntry = entrySet.has(p.index);
          const stemColor = getOhaengColor(p.ohaeng);
          const branchColor = getOhaengColor(p.branchOhaeng);

          return (
            <div
              key={p.index}
              title={`${p.name} (#${p.index + 1})${hasEntry ? ' · 기록 있음' : ''}`}
              style={{
                aspectRatio: '1',
                borderRadius: '3px',
                background: isToday
                  ? '#2a2a2a'
                  : hasEntry
                  ? '#f0ede8'
                  : '#f5f3ef',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                border: isToday ? 'none' : '1px solid transparent',
              }}
            >
              <span
                style={{
                  fontSize: '7px',
                  fontWeight: 600,
                  lineHeight: 1,
                  color: isToday ? '#fff' : 'transparent',
                }}
              >
                {isToday ? p.name : ''}
              </span>
              {!isToday && hasEntry && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: '2px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '3px',
                    height: '3px',
                    borderRadius: '50%',
                    background: stemColor,
                    opacity: 0.6,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: '10px', color: 'var(--text-faint)', marginTop: '6px' }}>
        {entrySet.size}/60 일주 경험 · 점 = 기록 있음
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────
// 최근 기록 행
// ──────────────────────────────────────────────
function RecentRow({
  entry,
  currentDate,
  onSelect,
}: {
  entry: DiaryEntry;
  currentDate: string;
  onSelect: () => void;
}) {
  const dayPillar = GAPJA_60[entry.day_gapja_idx];
  const stemColor = getOhaengColor(dayPillar.ohaeng);
  const branchColor = getOhaengColor(dayPillar.branchOhaeng);
  const isSelected = entry.date === currentDate;

  return (
    <button
      onClick={onSelect}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '9px 0',
        background: 'none',
        border: 'none',
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
        opacity: isSelected ? 0.5 : 1,
      }}
      className="hover:opacity-75 transition-opacity"
    >
      <div className="flex items-start gap-2">
        <div style={{ minWidth: '32px', textAlign: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: 700 }}>
            <span style={{ color: stemColor }}>{dayPillar.stem}</span>
            <span style={{ color: branchColor }}>{dayPillar.branch}</span>
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>{entry.date}</span>
            {entry.mood && <span style={{ fontSize: '11px' }}>{MOOD_EMOJI[entry.mood] ?? ''}</span>}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-mid)', lineHeight: 1.4 }}
            className="line-clamp-2">
            {entry.title ? <strong>{entry.title}</strong> : entry.content.slice(0, 50)}
          </p>
        </div>
      </div>
    </button>
  );
}

// ──────────────────────────────────────────────
// 이전 같은 일주 기록
// ──────────────────────────────────────────────
function PastEntryRow({ entry }: { entry: DiaryEntry }) {
  const dayPillar = GAPJA_60[entry.day_gapja_idx];
  const stemColor = getOhaengColor(dayPillar.ohaeng);
  const branchColor = getOhaengColor(dayPillar.branchOhaeng);

  return (
    <div style={{ padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2 mb-1.5">
        <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>{entry.date}</span>
        {entry.mood && <span style={{ fontSize: '12px' }}>{MOOD_EMOJI[entry.mood] ?? ''}</span>}
        {entry.energy_level && (
          <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>에너지 {entry.energy_level}/5</span>
        )}
        {entry.tags && entry.tags.length > 0 && (
          <span style={{ fontSize: '10px', color: 'var(--text-faint)' }}>
            {entry.tags.map((t) => `#${t}`).join(' ')}
          </span>
        )}
      </div>
      {entry.title && (
        <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px', letterSpacing: '-0.01em' }}>
          {entry.title}
        </p>
      )}
      <p style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--text-mid)' }} className="line-clamp-3">
        {entry.content}
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────
// 헬퍼 컴포넌트
// ──────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: '10px',
        color: 'var(--text-faint)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        fontWeight: 500,
      }}
    >
      {children}
    </p>
  );
}

function SipsungPillarCell({
  label, pillar, large, userSaju,
}: {
  label: string;
  pillar: GanjiPillar;
  large?: boolean;
  userSaju: ReturnType<typeof loadUserSaju>;
}) {
  const stemSS = userSaju ? getSipsungForStem(userSaju.ilganIdx, pillar.stemIndex) : null;
  const branchSS = userSaju ? getMainSipsungForBranch(userSaju.ilganIdx, pillar.branchIndex) : null;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span style={{ fontSize: '9px', color: 'var(--text-faint)' }}>{label}</span>
      <span style={{ lineHeight: 1, fontWeight: 700, fontSize: large ? '32px' : '16px', letterSpacing: '-0.02em' }}>
        <span style={{ color: getOhaengColor(pillar.ohaeng) }}>{pillar.stem}</span>
        <span style={{ color: getOhaengColor(pillar.branchOhaeng) }}>{pillar.branch}</span>
      </span>
      <span style={{ fontSize: '9px', color: 'var(--text-faint)', letterSpacing: '0.02em' }}>
        {pillar.nameHanja}
      </span>
      {stemSS && branchSS ? (
        <span style={{ fontSize: '9px', fontWeight: 600, lineHeight: 1.4, textAlign: 'center' }}>
          <span style={{ color: SIPSUNG_CATEGORY_COLOR[stemSS.category] }}>
            {stemSS.name}
          </span>
          <span style={{ color: 'var(--border)', margin: '0 1px' }}>/</span>
          <span style={{ color: SIPSUNG_CATEGORY_COLOR[branchSS.category], opacity: 0.8 }}>
            {branchSS.name}
          </span>
        </span>
      ) : (
        <span style={{ fontSize: '9px', color: 'var(--text-faint)', opacity: 0.7 }}>
          {pillar.ohaeng}/{pillar.branchOhaeng}
        </span>
      )}
    </div>
  );
}

function StemBranch({ pillar }: { pillar: GanjiPillar }) {
  return (
    <span style={{ fontWeight: 700 }}>
      <span style={{ color: getOhaengColor(pillar.ohaeng) }}>{pillar.stem}</span>
      <span style={{ color: getOhaengColor(pillar.branchOhaeng) }}>{pillar.branch}</span>
    </span>
  );
}
