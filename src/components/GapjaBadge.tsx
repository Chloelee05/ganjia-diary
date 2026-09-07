'use client';

import type { GanjiPillar } from '@/lib/ganjia';

const OHAENG_COLORS: Record<string, string> = {
  목: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  화: 'bg-red-100 text-red-800 border-red-200',
  토: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  금: 'bg-slate-100 text-slate-700 border-slate-300',
  수: 'bg-blue-100 text-blue-800 border-blue-200',
};

interface GapjaBadgeProps {
  pillar: GanjiPillar;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export default function GapjaBadge({ pillar, label, size = 'md', onClick }: GapjaBadgeProps) {
  const color = OHAENG_COLORS[pillar.ohaeng] ?? 'bg-gray-100 text-gray-700 border-gray-200';

  const sizeClass = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  }[size];

  return (
    <span
      className={`inline-flex flex-col items-center gap-0.5 border rounded-lg font-medium ${color} ${sizeClass} ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      onClick={onClick}
      title={`${pillar.nameHanja} · ${pillar.ohaeng} ${pillar.eumyang}`}
    >
      {label && <span className="text-[10px] opacity-60 font-normal leading-none">{label}</span>}
      <span>{pillar.name}</span>
    </span>
  );
}
