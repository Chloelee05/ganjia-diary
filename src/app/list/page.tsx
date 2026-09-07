'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAllEntries } from '@/lib/diary';
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
        <h1 className="text-2xl font-bold text-stone-800">전체 일기 목록</h1>
        <p className="text-sm text-stone-500 mt-1">{entries.length}개의 일기</p>
      </div>

      {loading ? (
        <p className="text-sm text-stone-400 py-8 text-center">불러오는 중...</p>
      ) : (
        <EntryList entries={entries} onSelect={handleSelect} />
      )}
    </div>
  );
}
