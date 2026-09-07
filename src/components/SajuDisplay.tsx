'use client';

import type { Saju } from '@/lib/ganjia';
import GapjaBadge from './GapjaBadge';

interface SajuDisplayProps {
  saju: Saju;
  onDayClick?: () => void;
}

export default function SajuDisplay({ saju, onDayClick }: SajuDisplayProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <GapjaBadge pillar={saju.year} label="년" size="md" />
      <GapjaBadge pillar={saju.month} label="월" size="md" />
      <GapjaBadge pillar={saju.day} label="일" size="lg" onClick={onDayClick} />
    </div>
  );
}
