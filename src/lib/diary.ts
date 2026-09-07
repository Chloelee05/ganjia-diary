/**
 * 일기 CRUD - localStorage (오프라인) + Supabase (온라인) 하이브리드
 * Supabase 환경변수 없으면 로컬 브라우저 저장소를 사용합니다.
 */

import { getSaju, formatDate } from './ganjia';
import type { DiaryEntry, DiaryInsert, DiaryUpdate } from './supabase/types';

const LOCAL_KEY = 'ganjia_diary_entries';

function isSupabaseConfigured(): boolean {
  return !!(
    typeof process !== 'undefined' &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// ─────────────────────────────────────────────
// Supabase 클라이언트 (lazy)
// ─────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabase: any = null;

async function getSupabase() {
  if (_supabase) return _supabase;
  const { createClient } = await import('./supabase/client');
  _supabase = createClient();
  return _supabase;
}

// ─────────────────────────────────────────────
// localStorage helpers
// ─────────────────────────────────────────────

function loadLocal(): DiaryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as DiaryEntry[]) : [];
  } catch {
    return [];
  }
}

function saveLocal(entries: DiaryEntry[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_KEY, JSON.stringify(entries));
}

function generateId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

// ─────────────────────────────────────────────
// API
// ─────────────────────────────────────────────

/** 날짜 → 갑자 메타데이터 자동 계산 */
export function buildEntryMeta(date: Date): Pick<
  DiaryInsert,
  | 'date'
  | 'day_gapja'
  | 'month_gapja'
  | 'year_gapja'
  | 'day_gapja_idx'
  | 'month_gapja_idx'
  | 'year_gapja_idx'
> {
  const saju = getSaju(date);
  return {
    date: formatDate(date),
    day_gapja: saju.day.name,
    month_gapja: saju.month.name,
    year_gapja: saju.year.name,
    day_gapja_idx: saju.day.index,
    month_gapja_idx: saju.month.index,
    year_gapja_idx: saju.year.index,
  };
}

/** 모든 일기 조회 */
export async function getAllEntries(): Promise<DiaryEntry[]> {
  if (isSupabaseConfigured()) {
    const sb = await getSupabase();
    const { data } = await sb
      .from('diary_entries')
      .select('*')
      .order('date', { ascending: false });
    return (data as DiaryEntry[]) ?? [];
  }
  return loadLocal().sort((a, b) => b.date.localeCompare(a.date));
}

/** 특정 날짜 일기 조회 */
export async function getEntryByDate(dateStr: string): Promise<DiaryEntry | null> {
  if (isSupabaseConfigured()) {
    const sb = await getSupabase();
    const { data } = await sb
      .from('diary_entries')
      .select('*')
      .eq('date', dateStr)
      .maybeSingle();
    return data as DiaryEntry | null;
  }
  return loadLocal().find((e) => e.date === dateStr) ?? null;
}

/** 특정 일주(갑자 index)의 모든 일기 조회 */
export async function getEntriesByDayGapja(idx: number): Promise<DiaryEntry[]> {
  if (isSupabaseConfigured()) {
    const sb = await getSupabase();
    const { data } = await sb
      .from('diary_entries')
      .select('*')
      .eq('day_gapja_idx', idx)
      .order('date', { ascending: false });
    return (data as DiaryEntry[]) ?? [];
  }
  return loadLocal()
    .filter((e) => e.day_gapja_idx === idx)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** 일기 저장 (upsert) */
export async function saveEntry(
  date: Date,
  fields: {
    title?: string;
    content: string;
    mood?: string;
    tags?: string[];
    energy_level?: number;
  }
): Promise<DiaryEntry> {
  const meta = buildEntryMeta(date);
  const now = new Date().toISOString();

  const commonFields = {
    title: fields.title ?? null,
    content: fields.content,
    mood: fields.mood ?? null,
    energy_level: fields.energy_level ?? null,
    tags: fields.tags ?? null,
  };

  if (isSupabaseConfigured()) {
    const sb = await getSupabase();
    const existing = await getEntryByDate(meta.date);

    if (existing) {
      const updatePayload: DiaryUpdate = { ...commonFields, updated_at: now };
      const { data } = await sb
        .from('diary_entries')
        .update(updatePayload)
        .eq('id', existing.id)
        .select()
        .single();
      return data as DiaryEntry;
    }

    const insertPayload: DiaryInsert = { ...meta, ...commonFields };
    const { data } = await sb
      .from('diary_entries')
      .insert(insertPayload)
      .select()
      .single();
    return data as DiaryEntry;
  }

  // localStorage
  const entries = loadLocal();
  const existing = entries.find((e) => e.date === meta.date);

  if (existing) {
    const updated: DiaryEntry = { ...existing, ...commonFields, updated_at: now };
    saveLocal(entries.map((e) => (e.date === meta.date ? updated : e)));
    return updated;
  }

  const newEntry: DiaryEntry = {
    id: generateId(),
    created_at: now,
    updated_at: now,
    ...meta,
    ...commonFields,
  };
  saveLocal([...entries, newEntry]);
  return newEntry;
}

/** 일기 삭제 */
export async function deleteEntry(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    const sb = await getSupabase();
    await sb.from('diary_entries').delete().eq('id', id);
    return;
  }
  saveLocal(loadLocal().filter((e) => e.id !== id));
}

/** 패턴 분석: 일주별 일기 개수 */
export async function getDayGapjaStats(): Promise<Record<number, number>> {
  const entries = await getAllEntries();
  const stats: Record<number, number> = {};
  for (const e of entries) {
    stats[e.day_gapja_idx] = (stats[e.day_gapja_idx] ?? 0) + 1;
  }
  return stats;
}

/** 특정 기간의 일기 조회 */
export async function getEntriesByDateRange(
  start: string,
  end: string
): Promise<DiaryEntry[]> {
  if (isSupabaseConfigured()) {
    const sb = await getSupabase();
    const { data } = await sb
      .from('diary_entries')
      .select('*')
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: true });
    return (data as DiaryEntry[]) ?? [];
  }
  return loadLocal()
    .filter((e) => e.date >= start && e.date <= end)
    .sort((a, b) => a.date.localeCompare(b.date));
}
