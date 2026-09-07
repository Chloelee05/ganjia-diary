'use client';

import type { GanjiPillar } from '@/lib/ganjia';
import { getOhaengColor, getOhaengBg, getOhaengBorder } from '@/lib/ohaeng';

interface GapjaBadgeProps {
  pillar: GanjiPillar;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  showHanja?: boolean;
}

export default function GapjaBadge({
  pillar,
  label,
  size = 'md',
  onClick,
  showHanja = false,
}: GapjaBadgeProps) {
  const stemColor = getOhaengColor(pillar.ohaeng);
  const branchColor = getOhaengColor(pillar.branchOhaeng);

  // 배경은 천간 오행의 아주 연한 tint
  const bg = getOhaengBg(pillar.ohaeng);
  const border = getOhaengBorder(pillar.ohaeng);

  const px = { sm: '8px', md: '12px', lg: '14px' }[size];
  const py = { sm: '3px', md: '5px', lg: '7px' }[size];
  const fontSize = { sm: '11px', md: '13px', lg: '15px' }[size];
  const labelSize = { sm: '9px', md: '10px', lg: '11px' }[size];
  const hanjaSize = { sm: '8px', md: '9px', lg: '10px' }[size];

  return (
    <span
      onClick={onClick}
      title={`${pillar.nameHanja} · 천간 ${pillar.ohaeng} · 지지 ${pillar.branchOhaeng}`}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1px',
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: '5px',
        padding: `${py} ${px}`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'opacity 0.15s',
        userSelect: 'none',
      }}
      className={onClick ? 'hover:opacity-75' : ''}
    >
      {label && (
        <span style={{ fontSize: labelSize, color: '#9b9b9b', lineHeight: 1 }}>
          {label}
        </span>
      )}

      {/* 갑자 이름: 천간·지지 각각 색 */}
      <span style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1.1 }}>
        <span style={{ fontSize, fontWeight: 600, color: stemColor, letterSpacing: '-0.01em' }}>
          {pillar.stem}
        </span>
        <span style={{ fontSize, fontWeight: 600, color: branchColor, letterSpacing: '-0.01em' }}>
          {pillar.branch}
        </span>
      </span>

      {/* 한자 (옵션) */}
      {showHanja && (
        <span style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1 }}>
          <span style={{ fontSize: hanjaSize, color: stemColor, opacity: 0.5 }}>
            {pillar.stemHanja}
          </span>
          <span style={{ fontSize: hanjaSize, color: branchColor, opacity: 0.5 }}>
            {pillar.branchHanja}
          </span>
        </span>
      )}
    </span>
  );
}
