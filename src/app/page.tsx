'use client';

import { useState } from 'react';
import { getSaju, today } from '@/lib/ganjia';
import DiaryEditor from '@/components/DiaryEditor';

export default function HomePage() {
  const todayDate = today();
  const saju = getSaju(todayDate);

  return (
    <div className="max-w-2xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-800 mb-1">오늘의 일기</h1>
        <p className="text-sm text-stone-500">
          {todayDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          &nbsp;·&nbsp;
          <span className="font-medium">{saju.year.name}년 {saju.month.name}월 {saju.day.name}일</span>
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
        <DiaryEditor initialDate={todayDate} />
      </div>

      <p className="text-xs text-stone-400 text-center mt-6">
        일주: <strong>{saju.day.name}</strong> ({saju.day.nameHanja}) · {saju.day.ohaeng} {saju.day.eumyang} · 60갑자 #{saju.day.index + 1}
      </p>
    </div>
  );
}
