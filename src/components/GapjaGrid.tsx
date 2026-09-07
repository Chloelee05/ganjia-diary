'use client';

import { GAPJA_60 } from '@/lib/ganjia';
import type { GanjiPillar } from '@/lib/ganjia';
import { getOhaengColor } from '@/lib/ohaeng';

interface GapjaGridProps {
  selectedIdx?: number;
  entryCountByIdx?: Record<number, number>;
  onSelect?: (pillar: GanjiPillar) => void;
  highlightIdx?: number;
}

export default function GapjaGrid({
  selectedIdx,
  entryCountByIdx = {},
  onSelect,
  highlightIdx,
}: GapjaGridProps) {
  return (
    <div
      className="grid gap-px"
      style={{
        gridTemplateColumns: 'repeat(10, 1fr)',
        background: '#e8e4de', // grid line color
        border: '1px solid #e8e4de',
        borderRadius: '6px',
        overflow: 'hidden',
      }}
    >
      {GAPJA_60.map((pillar) => {
        const count = entryCountByIdx[pillar.index] ?? 0;
        const isSelected = selectedIdx === pillar.index;
        const isToday = highlightIdx === pillar.index;

        const stemColor = getOhaengColor(pillar.ohaeng);
        const branchColor = getOhaengColor(pillar.branchOhaeng);

        return (
          <button
            key={pillar.index}
            onClick={() => onSelect?.(pillar)}
            title={`${pillar.name} (${pillar.nameHanja}) · 천간 ${pillar.ohaeng} · 지지 ${pillar.branchOhaeng}${count ? ` · 일기 ${count}개` : ''}`}
            style={{
              background: isSelected
                ? '#2a2a2a'
                : isToday
                ? '#fdf8ed'
                : '#faf9f6',
            }}
            className="relative flex flex-col items-center justify-center py-2.5 px-1 transition-colors hover:brightness-95 group"
          >
            {/* 오늘 표시 — 상단 줄 */}
            {isToday && (
              <span
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: '#c4933f' }}
              />
            )}

            {/* 갑자 이름: 천간·지지 각각 색 */}
            <span className="flex items-baseline leading-none mb-1">
              <span
                className="text-[13px] font-semibold tracking-tight"
                style={{ color: isSelected ? 'rgba(255,255,255,0.9)' : stemColor }}
              >
                {pillar.stem}
              </span>
              <span
                className="text-[13px] font-semibold tracking-tight"
                style={{ color: isSelected ? 'rgba(255,255,255,0.7)' : branchColor }}
              >
                {pillar.branch}
              </span>
            </span>

            {/* 한자: 같은 색 계열 흐리게 */}
            <span className="flex items-baseline leading-none">
              <span
                className="text-[9px]"
                style={{
                  color: isSelected
                    ? 'rgba(255,255,255,0.4)'
                    : stemColor,
                  opacity: isSelected ? 1 : 0.45,
                }}
              >
                {pillar.stemHanja}
              </span>
              <span
                className="text-[9px]"
                style={{
                  color: isSelected
                    ? 'rgba(255,255,255,0.4)'
                    : branchColor,
                  opacity: isSelected ? 1 : 0.45,
                }}
              >
                {pillar.branchHanja}
              </span>
            </span>

            {/* 일기 개수 도트 */}
            {count > 0 && (
              <span
                className="absolute bottom-1 right-1.5 text-[8px] font-medium tabular-nums"
                style={{ color: isSelected ? 'rgba(255,255,255,0.5)' : '#aaa' }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
