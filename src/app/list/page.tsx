'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAllEntries } from '@/app/actions';
import type { DiaryEntry } from '@/lib/supabase/types';
import EntryList from '@/components/EntryList';

export default function ListPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllEntries().then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, []);

  const handleSelect = (entry: DiaryEntry) => {
    router.push(`/?date=${entry.date}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-ink)' }}>전체 일기 목록</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-mid)' }}>{entries.length}개의 일기</p>
      </div>

      {loading ? (
        <p className="text-sm py-8 text-center" style={{ color: 'var(--text-faint)' }}>불러오는 중...</p>
      ) : (
        <EntryList entries={entries} onSelect={handleSelect} />
      )}
    </div>
  );
}
