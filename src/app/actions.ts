'use server';

/**
 * 서버 액션: 서버에서 실행되어 쿠키 세션을 100% 보장
 * auth.uid() RLS가 항상 정상 동작합니다.
 */

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database, DiaryEntry, DiaryInsert, DiaryUpdate } from '@/lib/supabase/types';
import { buildEntryMeta } from '@/lib/diary';

async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component context: cookies are read-only
          }
        },
      },
    }
  );
}

// ─────────────────────────────────────────────
// 조회
// ─────────────────────────────────────────────

export async function getAllEntries(): Promise<DiaryEntry[]> {
  const sb = await getServerSupabase();
  const { data, error } = await sb
    .from('diary_entries')
    .select('*')
    .order('date', { ascending: false });
  if (error) console.error('[action] getAllEntries:', error.message);
  return (data as DiaryEntry[]) ?? [];
}

export async function getEntryByDate(dateStr: string): Promise<DiaryEntry | null> {
  const sb = await getServerSupabase();
  const { data } = await sb
    .from('diary_entries')
    .select('*')
    .eq('date', dateStr)
    .maybeSingle();
  return data as DiaryEntry | null;
}

export async function getEntriesByDayGapja(idx: number): Promise<DiaryEntry[]> {
  const sb = await getServerSupabase();
  const { data, error } = await sb
    .from('diary_entries')
    .select('*')
    .eq('day_gapja_idx', idx)
    .order('date', { ascending: false });
  if (error) console.error('[action] getEntriesByDayGapja:', error.message);
  return (data as DiaryEntry[]) ?? [];
}

export async function getEntriesByDateRange(
  start: string,
  end: string
): Promise<DiaryEntry[]> {
  const sb = await getServerSupabase();
  const { data, error } = await sb
    .from('diary_entries')
    .select('*')
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: true });
  if (error) console.error('[action] getEntriesByDateRange:', error.message);
  return (data as DiaryEntry[]) ?? [];
}

export async function getDayGapjaStats(): Promise<Record<number, number>> {
  const entries = await getAllEntries();
  const stats: Record<number, number> = {};
  for (const e of entries) {
    stats[e.day_gapja_idx] = (stats[e.day_gapja_idx] ?? 0) + 1;
  }
  return stats;
}

// ─────────────────────────────────────────────
// 저장 / 수정 / 삭제
// ─────────────────────────────────────────────

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
  const sb = await getServerSupabase();
  const meta = buildEntryMeta(date);
  const now = new Date().toISOString();
  const commonFields = {
    title: fields.title ?? null,
    content: fields.content,
    mood: fields.mood ?? null,
    energy_level: fields.energy_level ?? null,
    tags: fields.tags ?? null,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (sb.from('diary_entries') as any)
    .select('id')
    .eq('date', meta.date)
    .maybeSingle() as { data: { id: string } | null };

  if (existing) {
    const updatePayload = { ...commonFields, updated_at: now };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (sb.from('diary_entries') as any)
      .update(updatePayload)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as DiaryEntry;
  }

  const insertPayload = { ...meta, ...commonFields };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (sb.from('diary_entries') as any)
    .insert(insertPayload)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as DiaryEntry;
}

export async function deleteEntry(id: string): Promise<void> {
  const sb = await getServerSupabase();
  const { error } = await sb.from('diary_entries').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
