'use client';

import { useState, useEffect } from 'react';
import { formatDate, parseDate, today } from '@/lib/ganjia';
import { saveEntry, getEntryByDate, deleteEntry } from '@/lib/diary';
import type { DiaryEntry } from '@/lib/supabase/types';

const MOODS = [
  { label: '좋음', emoji: '😊' },
  { label: '보통', emoji: '😐' },
  { label: '나쁨', emoji: '😔' },
  { label: '최악', emoji: '😩' },
];

interface DiaryEditorProps {
  initialDate?: Date;
  onSaved?: (entry: DiaryEntry) => void;
  onDateChange?: (date: Date) => void;
}

export default function DiaryEditor({ initialDate, onSaved, onDateChange }: DiaryEditorProps) {
  const [date, setDate] = useState<Date>(initialDate ?? today());
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [energy, setEnergy] = useState(3);
  const [tags, setTags] = useState('');
  const [existing, setExisting] = useState<DiaryEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    const d = initialDate ?? today();
    setDate(d);
  }, [initialDate]);

  useEffect(() => {
    setJustSaved(false);
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
    const d = parseDate(e.target.value);
    setDate(d);
    onDateChange?.(d);
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
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      setExisting(entry);
      setJustSaved(true);
      onSaved?.(entry);
      setTimeout(() => setJustSaved(false), 2000);
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
  };

  // Ctrl+S / Cmd+S 저장
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid var(--border)',
    borderRadius: 0,
    padding: '6px 0',
    fontSize: '14px',
    color: 'var(--text-ink)',
    outline: 'none',
  };

  return (
    <div className="space-y-5">
      {/* 날짜 선택 — subtle */}
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={formatDate(date)}
          onChange={handleDateChange}
          style={{
            ...inputStyle,
            width: 'auto',
            fontSize: '13px',
            color: 'var(--text-faint)',
            borderBottom: 'none',
          }}
        />
        {existing && (
          <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
            · 저장된 일기 있음
          </span>
        )}
      </div>

      {/* 제목 */}
      <input
        type="text"
        placeholder="제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{
          ...inputStyle,
          fontSize: '18px',
          fontWeight: 600,
          letterSpacing: '-0.02em',
        }}
      />

      {/* 본문 */}
      <textarea
        placeholder="오늘 어떤 일이 있었나요..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={12}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          borderRadius: 0,
          padding: '16px 0',
          fontSize: '14px',
          lineHeight: '1.9',
          color: 'var(--text-ink)',
          outline: 'none',
          resize: 'none',
        }}
      />

      {/* 메타 — 기분·에너지·태그 */}
      <div
        className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-1"
        style={{ fontSize: '12px', color: 'var(--text-faint)' }}
      >
        {/* 기분 */}
        <div className="flex items-center gap-1.5">
          <span>기분</span>
          {MOODS.map((m) => (
            <button
              key={m.label}
              onClick={() => setMood(mood === m.label ? '' : m.label)}
              title={m.label}
              style={{
                fontSize: '16px',
                opacity: mood === '' || mood === m.label ? 1 : 0.25,
                transition: 'opacity 0.1s',
                background: 'none',
                border: 'none',
                padding: '2px',
                lineHeight: 1,
              }}
            >
              {m.emoji}
            </button>
          ))}
        </div>

        {/* 에너지 */}
        <div className="flex items-center gap-2">
          <span>에너지</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setEnergy(n)}
                style={{
                  width: '16px',
                  height: '6px',
                  borderRadius: '2px',
                  background: n <= energy ? 'var(--text-ink)' : 'var(--border)',
                  border: 'none',
                  transition: 'background 0.1s',
                }}
              />
            ))}
          </div>
          <span style={{ color: 'var(--text-faint)' }}>
            {['', '방전', '피곤', '보통', '활기', '최상'][energy]}
          </span>
        </div>

        {/* 태그 */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="shrink-0">#</span>
          <input
            type="text"
            placeholder="태그 (쉼표 구분)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '12px',
              color: 'var(--text-mid)',
              outline: 'none',
              width: '100%',
            }}
          />
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center justify-between pt-1">
        <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
          {justSaved ? '✓ 저장됨' : '⌘S로 저장'}
        </span>
        <div className="flex gap-2">
          {existing && (
            <button
              onClick={handleDelete}
              style={{
                fontSize: '12px',
                color: '#b84030',
                background: 'none',
                border: 'none',
                padding: '6px 10px',
                opacity: 0.7,
              }}
              className="hover:opacity-100 transition-opacity"
            >
              삭제
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!content.trim() || saving}
            style={{
              fontSize: '13px',
              background: content.trim() ? 'var(--text-ink)' : 'var(--border)',
              color: content.trim() ? '#fff' : 'var(--text-faint)',
              border: 'none',
              borderRadius: '4px',
              padding: '7px 18px',
              transition: 'background 0.15s',
              fontFamily: 'inherit',
            }}
          >
            {saving ? '저장 중' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
