'use client';

import { useState, useEffect } from 'react';
import { getSaju, today, formatDate, parseDate } from '@/lib/ganjia';
import { saveEntry, getEntryByDate, deleteEntry } from '@/lib/diary';
import type { DiaryEntry } from '@/lib/supabase/types';
import SajuDisplay from './SajuDisplay';

const MOODS = ['😄 좋음', '😊 보통', '😐 그냥저냥', '😔 나쁨', '😩 최악'];
const ENERGY_LABELS = ['', '1 – 방전', '2 – 피곤', '3 – 보통', '4 – 활기', '5 – 최상'];

interface DiaryEditorProps {
  initialDate?: Date;
  onSaved?: (entry: DiaryEntry) => void;
}

export default function DiaryEditor({ initialDate, onSaved }: DiaryEditorProps) {
  const [date, setDate] = useState<Date>(initialDate ?? today());
  const [saju, setSaju] = useState(() => getSaju(initialDate ?? today()));

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [energy, setEnergy] = useState(3);
  const [tags, setTags] = useState('');
  const [existing, setExisting] = useState<DiaryEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // 날짜 바뀔 때마다 갑자 재계산 + 기존 일기 로드
  useEffect(() => {
    setSaju(getSaju(date));
    setSaved(false);

    getEntryByDate(formatDate(date)).then((entry) => {
      if (entry) {
        setExisting(entry);
        setTitle(entry.title ?? '');
        setContent(entry.content);
        setMood(entry.mood ?? '');
        setEnergy(entry.energy_level ?? 3);
        setTags((entry.tags ?? []).join(', '));
      } else {
        setExisting(null);
        setTitle('');
        setContent('');
        setMood('');
        setEnergy(3);
        setTags('');
      }
    });
  }, [date]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(parseDate(e.target.value));
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const entry = await saveEntry(date, {
        title: title.trim() || undefined,
        content: content.trim(),
        mood: mood || undefined,
        energy_level: energy,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      });
      setExisting(entry);
      setSaved(true);
      onSaved?.(entry);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existing || !confirm('이 일기를 삭제할까요?')) return;
    await deleteEntry(existing.id);
    setExisting(null);
    setTitle('');
    setContent('');
    setMood('');
    setEnergy(3);
    setTags('');
    setSaved(false);
  };

  return (
    <div className="space-y-5">
      {/* 날짜 + 갑자 */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <input
          type="date"
          value={formatDate(date)}
          onChange={handleDateChange}
          className="border border-stone-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-300"
        />
        <SajuDisplay saju={saju} />
        {existing && (
          <span className="text-xs text-stone-400 ml-auto">기존 일기 수정 중</span>
        )}
      </div>

      {/* 제목 */}
      <input
        type="text"
        placeholder="제목 (선택)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border border-stone-200 rounded-lg px-4 py-2.5 text-sm bg-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300"
      />

      {/* 본문 */}
      <textarea
        placeholder={`${formatDate(date)} 일기를 써보세요...`}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={10}
        className="w-full border border-stone-200 rounded-lg px-4 py-3 text-sm bg-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300 resize-none leading-relaxed"
      />

      {/* 기분 · 에너지 */}
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-stone-500 font-medium">기분</label>
          <div className="flex flex-wrap gap-1.5">
            {MOODS.map((m) => (
              <button
                key={m}
                onClick={() => setMood(mood === m ? '' : m)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  mood === m
                    ? 'bg-stone-800 text-white border-stone-800'
                    : 'border-stone-200 text-stone-600 hover:border-stone-400'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-stone-500 font-medium">
            에너지 – {ENERGY_LABELS[energy]}
          </label>
          <input
            type="range"
            min={1}
            max={5}
            value={energy}
            onChange={(e) => setEnergy(Number(e.target.value))}
            className="w-32 accent-stone-700"
          />
        </div>
      </div>

      {/* 태그 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-stone-500 font-medium">태그 (쉼표로 구분)</label>
        <input
          type="text"
          placeholder="예: 여행, 만남, 일, 건강"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="w-full border border-stone-200 rounded-lg px-4 py-2 text-sm bg-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300"
        />
      </div>

      {/* 버튼 */}
      <div className="flex gap-2 justify-end">
        {existing && (
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-sm text-red-500 hover:text-red-700 transition-colors"
          >
            삭제
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={!content.trim() || saving}
          className="px-6 py-2 text-sm bg-stone-800 text-white rounded-lg hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? '저장 중...' : saved ? '✓ 저장됨' : '저장'}
        </button>
      </div>
    </div>
  );
}
