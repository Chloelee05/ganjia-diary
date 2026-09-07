/**
 * 분석 엔진
 * 
 * 저장된 일기 데이터(mood, energy_level, tags, gapja_idx 등)를 집계/상관분석.
 * 텍스트 NLP는 없음 — 구조화된 필드 기반.
 */

import type { DiaryEntry } from './supabase/types';
import { GAPJA_60 } from './ganjia';
import { getOhaengColor } from './ohaeng';

// ─── 기분 점수화 ───────────────────────────────
const MOOD_SCORE: Record<string, number> = {
  '좋음': 4,
  '보통': 3,
  '나쁨': 2,
  '최악': 1,
};
const MOOD_EMOJI: Record<string, string> = {
  '좋음': '😊',
  '보통': '😐',
  '나쁨': '😔',
  '최악': '😩',
};
export { MOOD_EMOJI };

export function moodScore(mood: string | null | undefined): number | null {
  if (!mood) return null;
  return MOOD_SCORE[mood] ?? null;
}

export function avgMoodScore(entries: DiaryEntry[]): number | null {
  const scores = entries.map((e) => moodScore(e.mood)).filter((s): s is number => s !== null);
  if (scores.length === 0) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

export function avgEnergy(entries: DiaryEntry[]): number | null {
  const vals = entries.map((e) => e.energy_level).filter((v): v is number => v !== null);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

// ─── 기분 라벨 분포 ────────────────────────────
export interface MoodDist {
  label: string;
  emoji: string;
  count: number;
  pct: number;
}

export function moodDistribution(entries: DiaryEntry[]): MoodDist[] {
  const labels = ['좋음', '보통', '나쁨', '최악'];
  const total = entries.filter((e) => e.mood).length;
  return labels.map((label) => {
    const count = entries.filter((e) => e.mood === label).length;
    return {
      label,
      emoji: MOOD_EMOJI[label],
      count,
      pct: total > 0 ? (count / total) * 100 : 0,
    };
  });
}

// ─── 오행별 통계 ────────────────────────────────
export interface OhaengStats {
  ohaeng: string;
  color: string;
  stemEntries: DiaryEntry[];   // 천간이 해당 오행인 일기
  branchEntries: DiaryEntry[]; // 지지가 해당 오행인 일기
  stemAvgEnergy: number | null;
  stemAvgMood: number | null;
  branchAvgEnergy: number | null;
  branchAvgMood: number | null;
  stemCount: number;
  branchCount: number;
}

export function ohaengAnalysis(entries: DiaryEntry[]): OhaengStats[] {
  return ['목', '화', '토', '금', '수'].map((ohaeng) => {
    const stemEntries = entries.filter((e) => GAPJA_60[e.day_gapja_idx].ohaeng === ohaeng);
    const branchEntries = entries.filter((e) => GAPJA_60[e.day_gapja_idx].branchOhaeng === ohaeng);
    return {
      ohaeng,
      color: getOhaengColor(ohaeng),
      stemEntries,
      branchEntries,
      stemAvgEnergy: avgEnergy(stemEntries),
      stemAvgMood: avgMoodScore(stemEntries),
      branchAvgEnergy: avgEnergy(branchEntries),
      branchAvgMood: avgMoodScore(branchEntries),
      stemCount: stemEntries.length,
      branchCount: branchEntries.length,
    };
  });
}

// ─── 일주별 통계 ────────────────────────────────
export interface PillarStat {
  idx: number;
  name: string;
  stem: string;
  branch: string;
  stemOhaeng: string;
  branchOhaeng: string;
  count: number;
  avgEnergy: number | null;
  avgMood: number | null;
  moodDist: MoodDist[];
  tags: string[];
}

export function pillarStats(entries: DiaryEntry[]): PillarStat[] {
  return GAPJA_60
    .map((pillar) => {
      const es = entries.filter((e) => e.day_gapja_idx === pillar.index);
      if (es.length === 0) return null;
      const tagMap: Record<string, number> = {};
      for (const e of es) {
        for (const t of e.tags ?? []) {
          tagMap[t] = (tagMap[t] ?? 0) + 1;
        }
      }
      return {
        idx: pillar.index,
        name: pillar.name,
        stem: pillar.stem,
        branch: pillar.branch,
        stemOhaeng: pillar.ohaeng,
        branchOhaeng: pillar.branchOhaeng,
        count: es.length,
        avgEnergy: avgEnergy(es),
        avgMood: avgMoodScore(es),
        moodDist: moodDistribution(es),
        tags: Object.entries(tagMap)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([t]) => t),
      };
    })
    .filter((s): s is PillarStat => s !== null);
}

// ─── 태그 분석 ────────────────────────────────
export interface TagStat {
  tag: string;
  count: number;
  ohaengMap: Record<string, number>; // 오행별 등장 횟수
  avgEnergy: number | null;
  avgMood: number | null;
}

export function tagAnalysis(entries: DiaryEntry[]): TagStat[] {
  const map: Record<string, { entries: DiaryEntry[]; ohaengMap: Record<string, number> }> = {};

  for (const e of entries) {
    const ohaeng = GAPJA_60[e.day_gapja_idx].ohaeng;
    for (const tag of e.tags ?? []) {
      if (!map[tag]) map[tag] = { entries: [], ohaengMap: {} };
      map[tag].entries.push(e);
      map[tag].ohaengMap[ohaeng] = (map[tag].ohaengMap[ohaeng] ?? 0) + 1;
    }
  }

  return Object.entries(map)
    .map(([tag, { entries: es, ohaengMap }]) => ({
      tag,
      count: es.length,
      ohaengMap,
      avgEnergy: avgEnergy(es),
      avgMood: avgMoodScore(es),
    }))
    .sort((a, b) => b.count - a.count);
}

// ─── 시계열 (최근 N개) ────────────────────────
export interface TimePoint {
  date: string;
  energy: number | null;
  moodScore: number | null;
  mood: string | null;
  dayGapja: string;
}

export function timeSeries(entries: DiaryEntry[], n = 60): TimePoint[] {
  return [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-n)
    .map((e) => ({
      date: e.date,
      energy: e.energy_level,
      moodScore: moodScore(e.mood),
      mood: e.mood,
      dayGapja: e.day_gapja,
    }));
}

// ─── 연속 기록 ────────────────────────────────
export function streakDays(entries: DiaryEntry[]): number {
  if (entries.length === 0) return 0;
  const dateSet = new Set(entries.map((e) => e.date));
  const today = new Date();
  let streak = 0;
  const cur = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  for (let i = 0; i < 365; i++) {
    const s = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
    if (dateSet.has(s)) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// ─── 자동 인사이트 생성 ────────────────────────
export interface Insight {
  icon: string;
  text: string;
}

export function generateInsights(
  entries: DiaryEntry[],
  ohaengStats: OhaengStats[],
  tagStats: TagStat[],
): Insight[] {
  const insights: Insight[] = [];

  // 오행 × 에너지 최고/최저
  const withEnergy = ohaengStats
    .map((o) => ({ ...o, e: o.branchAvgEnergy }))
    .filter((o) => o.e !== null && o.branchCount >= 2)
    .sort((a, b) => (b.e ?? 0) - (a.e ?? 0));

  if (withEnergy.length >= 2) {
    const best = withEnergy[0];
    const worst = withEnergy[withEnergy.length - 1];
    insights.push({
      icon: '⚡',
      text: `지지가 ${best.ohaeng}인 날 평균 에너지가 ${best.e!.toFixed(1)}로 가장 높아요.`,
    });
    if (worst.e! < best.e! - 0.5) {
      insights.push({
        icon: '🌙',
        text: `지지가 ${worst.ohaeng}인 날 에너지가 ${worst.e!.toFixed(1)}로 상대적으로 낮아요.`,
      });
    }
  }

  // 오행 × 기분 최고
  const withMood = ohaengStats
    .map((o) => ({ ...o, m: o.branchAvgMood }))
    .filter((o) => o.m !== null && o.branchCount >= 2)
    .sort((a, b) => (b.m ?? 0) - (a.m ?? 0));

  if (withMood.length >= 1) {
    const best = withMood[0];
    const moodLabel = best.m! >= 3.5 ? '좋음' : best.m! >= 2.5 ? '보통' : '나쁨';
    insights.push({
      icon: '✨',
      text: `지지 ${best.ohaeng}일에 기분이 주로 "${moodLabel}" — 평균 ${best.m!.toFixed(1)}/4.0`,
    });
  }

  // 가장 흔한 태그
  if (tagStats.length > 0) {
    insights.push({
      icon: '#',
      text: `자주 등장한 태그: ${tagStats.slice(0, 3).map((t) => `#${t.tag} (${t.count}회)`).join(', ')}`,
    });
  }

  // 총 일기 수와 60갑자 커버리지
  const covered = new Set(entries.map((e) => e.day_gapja_idx)).size;
  insights.push({
    icon: '📅',
    text: `60갑자 중 ${covered}가지 일주를 경험 — 앞으로 ${60 - covered}가지 남았어요.`,
  });

  // 월별 가장 많이 쓴 달
  const monthMap: Record<string, number> = {};
  for (const e of entries) monthMap[e.date.slice(0, 7)] = (monthMap[e.date.slice(0, 7)] ?? 0) + 1;
  const topMonth = Object.entries(monthMap).sort(([, a], [, b]) => b - a)[0];
  if (topMonth) {
    insights.push({
      icon: '📝',
      text: `${topMonth[0]}에 ${topMonth[1]}개로 가장 많이 썼어요.`,
    });
  }

  return insights;
}
