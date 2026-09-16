'use server';

import { GoogleGenAI } from '@google/genai';
import type { DiaryEntry } from '@/lib/supabase/types';
import { GAPJA_60 } from '@/lib/ganjia';

// ─── Gemini 클라이언트 (서버 전용) ──────────────
function getClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.includes('여기에_API')) {
    throw new Error('GEMINI_API_KEY가 설정되지 않았어요. .env.local에 키를 입력해주세요.');
  }
  return new GoogleGenAI({ apiKey: key });
}

// ─── 일기 데이터 → 분석용 텍스트 요약 ─────────
function summarizeEntries(entries: DiaryEntry[]): string {
  if (entries.length === 0) return '일기 없음';

  // 최근 50개까지만 (토큰 절약)
  const recent = [...entries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 50);

  const lines = recent.map((e) => {
    const pillar = GAPJA_60[e.day_gapja_idx];
    const parts: string[] = [
      `날짜: ${e.date}`,
      `일주(日柱): ${pillar?.name ?? '?'} (천간오행:${pillar?.ohaeng} 지지오행:${pillar?.branchOhaeng})`,
    ];
    if (e.mood)         parts.push(`기분: ${e.mood}`);
    if (e.energy_level) parts.push(`에너지: ${e.energy_level}/5`);
    if (e.tags?.length) parts.push(`태그: ${e.tags.join(', ')}`);
    if (e.title)        parts.push(`제목: ${e.title}`);
    // 본문은 150자까지만
    if (e.content)      parts.push(`내용: ${e.content.slice(0, 150)}`);
    return parts.join(' | ');
  });

  return lines.join('\n');
}

// ─── 오행별 통계 요약 ───────────────────────────
function summarizeOhaeng(entries: DiaryEntry[]): string {
  const map: Record<string, { count: number; energySum: number; energyN: number; moods: Record<string, number> }> = {};

  for (const e of entries) {
    const pillar = GAPJA_60[e.day_gapja_idx];
    if (!pillar) continue;
    const key = pillar.ohaeng; // 천간 오행 기준
    if (!map[key]) map[key] = { count: 0, energySum: 0, energyN: 0, moods: {} };
    map[key].count++;
    if (e.energy_level) { map[key].energySum += e.energy_level; map[key].energyN++; }
    if (e.mood) map[key].moods[e.mood] = (map[key].moods[e.mood] ?? 0) + 1;
  }

  return Object.entries(map)
    .map(([o, s]) => {
      const avgE = s.energyN > 0 ? (s.energySum / s.energyN).toFixed(1) : '–';
      const topMood = Object.entries(s.moods).sort(([, a], [, b]) => b - a)[0]?.[0] ?? '–';
      return `${o}(${s.count}일): 평균에너지 ${avgE}, 주요기분 ${topMood}`;
    })
    .join(' / ');
}

// ─── 메인 분석 함수 ─────────────────────────────
export async function analyzeWithGemini(entries: DiaryEntry[]): Promise<string> {
  const client = getClient();

  const entrySummary = summarizeEntries(entries);
  const ohaengSummary = summarizeOhaeng(entries);

  const prompt = `당신은 동양 철학(오행·육십갑자)과 심리 패턴 분석에 정통한 한국어 어시스턴트입니다.

아래는 사용자의 일기 데이터입니다(최근 ${Math.min(entries.length, 50)}개):

[오행별 통계]
${ohaengSummary}

[일기 데이터]
${entrySummary}

위 데이터를 바탕으로 다음을 한국어로 분석해 주세요:

1. **에너지·기분 패턴** — 어떤 조건(일주, 오행, 요일 등)에서 에너지/기분이 높고 낮은지
2. **오행 감수성** — 사용자가 어떤 오행 기운에 민감하게 반응하는지
3. **반복 키워드·태그 패턴** — 자주 등장하는 태그나 주제에서 보이는 생활 패턴
4. **총평 및 제안** — 2~3줄로 전체적인 패턴 요약과 앞으로의 관찰 포인트 제안

분석은 솔직하고 구체적으로, 마크다운 형식(굵게, 목록)으로 작성해 주세요. 데이터가 부족한 부분은 솔직히 언급하세요.`;

  const response = await client.models.generateContent({
    model: 'gemini-2.0-flash-lite',
    contents: prompt,
  });

  return response.text ?? '분석 결과를 받지 못했어요.';
}
