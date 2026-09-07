'use client';

import { GAPJA_60 } from '@/lib/ganjia';
import type { GanjiPillar } from '@/lib/ganjia';

const OHAENG_COLORS: Record<string, string> = {
  목: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
  화: 'bg-red-50 border-red-200 hover:bg-red-100',
  토: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
  금: 'bg-slate-50 border-slate-200 hover:bg-slate-100',
  수: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
};

const OHAENG_TEXT: Record<string, string> = {
  목: 'text-emerald-800',
  화: 'text-red-800',
  토: 'text-amber-900',
  금: 'text-slate-700',
  수: 'text-blue-800',
};

interface GapjaGridProps {
  selectedIdx?: number;
  entryCountByIdx?: Record<number, number>;
  onSelect?: (pillar: GanjiPillar) => void;
  highlightIdx?: number; // 오늘 일주
}

export default function GapjaGrid({
  selectedIdx,
  entryCountByIdx = {},
  onSelect,
  highlightIdx,
}: GapjaGridProps) {
  return (
    <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
      {GAPJA_60.map((pillar) => {
        const count = entryCountByIdx[pillar.index] ?? 0;
        const isSelected = selectedIdx === pillar.index;
        const isToday = highlightIdx === pillar.index;
        const color = OHAENG_COLORS[pillar.ohaeng] ?? 'bg-gray-50 border-gray-200 hover:bg-gray-100';
        const textColor = OHAENG_TEXT[pillar.ohaeng] ?? 'text-gray-700';

        return (
          <button
            key={pillar.index}
            onClick={() => onSelect?.(pillar)}
            className={`relative flex flex-col items-center py-2 px-1 border rounded-lg text-xs transition-all ${color} ${textColor} ${
              isSelected ? 'ring-2 ring-stone-600 ring-offset-1' : ''
            } ${isToday ? 'ring-2 ring-amber-500 ring-offset-1' : ''}`}
            title={`${pillar.nameHanja} · ${pillar.ohaeng} ${pillar.eumyang}${count ? ` · ${count}개` : ''}`}
          >
            <span className="font-semibold">{pillar.name}</span>
            <span className="text-[10px] opacity-60">{pillar.nameHanja}</span>
            {count > 0 && (
              <span className="absolute top-1 right-1 text-[9px] bg-stone-700 text-white rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
