'use client';

import { useState, useEffect } from 'react';
import {
  CHEONGAN, JIJI,
  CHEONGAN_HANJA, JIJI_HANJA,
  GAPJA_60,
} from '@/lib/ganjia';
import {
  saveUserSaju, loadUserSaju,
  getSipsungForStem, getMainSipsungForBranch,
  getSipsungForBranch,
  SIPSUNG_CATEGORY_COLOR,
  calcSajuSipsung,
  type UserSaju,
} from '@/lib/sipsung';
import { getOhaengColor } from '@/lib/ohaeng';

// 사주 입력 필드 (4기둥 × 2 = 8)
interface PillarInput {
  stemIdx: number;
  branchIdx: number;
}

const DEFAULT_PILLARS: { year: PillarInput; month: PillarInput; day: PillarInput; hour: PillarInput } = {
  year:  { stemIdx: 1, branchIdx: 9  }, // 을유
  month: { stemIdx: 4, branchIdx: 2  }, // 무인
  day:   { stemIdx: 1, branchIdx: 9  }, // 을유
  hour:  { stemIdx: 7, branchIdx: 5  }, // 신사
};

export default function SettingsPage() {
  const [pillars, setPillars] = useState(DEFAULT_PILLARS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = loadUserSaju();
    if (stored) {
      setPillars({
        year:  { stemIdx: stored.yearStemIdx  ?? 1, branchIdx: stored.yearBranchIdx  ?? 9 },
        month: { stemIdx: stored.monthStemIdx ?? 4, branchIdx: stored.monthBranchIdx ?? 2 },
        day:   { stemIdx: stored.dayStemIdx   ?? 1, branchIdx: stored.dayBranchIdx   ?? 9 },
        hour:  { stemIdx: stored.hourStemIdx  ?? 7, branchIdx: stored.hourBranchIdx  ?? 5 },
      });
    }
  }, []);

  const ilganIdx = pillars.day.stemIdx;

  const handleSave = () => {
    const saju: UserSaju = {
      ilganIdx,
      yearStemIdx:   pillars.year.stemIdx,  yearBranchIdx:  pillars.year.branchIdx,
      monthStemIdx:  pillars.month.stemIdx, monthBranchIdx: pillars.month.branchIdx,
      dayStemIdx:    pillars.day.stemIdx,   dayBranchIdx:   pillars.day.branchIdx,
      hourStemIdx:   pillars.hour.stemIdx,  hourBranchIdx:  pillars.hour.branchIdx,
    };
    saveUserSaju(saju);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sajuResult = calcSajuSipsung(ilganIdx, {
    yearStemIdx:   pillars.year.stemIdx,   yearBranchIdx:  pillars.year.branchIdx,
    monthStemIdx:  pillars.month.stemIdx,  monthBranchIdx: pillars.month.branchIdx,
    dayStemIdx:    pillars.day.stemIdx,    dayBranchIdx:   pillars.day.branchIdx,
    hourStemIdx:   pillars.hour.stemIdx,   hourBranchIdx:  pillars.hour.branchIdx,
  });

  return (
    <div className="max-w-3xl mx-auto space-y-10">

      {/* 헤더 */}
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>내 사주 설정</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-faint)', marginTop: '4px' }}>
          일기장의 갑자를 내 일간 기준 십성으로 표시합니다.
        </p>
      </div>

      {/* 사주 입력 */}
      <div>
        <SectionLabel>사주 입력 (년·월·일·시)</SectionLabel>
        <div className="grid grid-cols-4 gap-3 mt-4">
          {(['year', 'month', 'day', 'hour'] as const).map((key) => {
            const label = { year: '년', month: '월', day: '일', hour: '시' }[key];
            const p = pillars[key];
            const isDay = key === 'day';
            return (
              <div key={key}>
                <p style={{ fontSize: '10px', color: 'var(--text-faint)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {label}주
                  {isDay && <span style={{ marginLeft: '4px', color: '#b84030' }}>(일간)</span>}
                </p>
                {/* 천간 선택 */}
                <select
                  value={p.stemIdx}
                  onChange={(e) => setPillars((prev) => ({ ...prev, [key]: { ...prev[key], stemIdx: Number(e.target.value) } }))}
                  style={selectStyle}
                >
                  {CHEONGAN.map((c, i) => (
                    <option key={i} value={i}>{c}({CHEONGAN_HANJA[i]})</option>
                  ))}
                </select>
                {/* 지지 선택 */}
                <select
                  value={p.branchIdx}
                  onChange={(e) => setPillars((prev) => ({ ...prev, [key]: { ...prev[key], branchIdx: Number(e.target.value) } }))}
                  style={{ ...selectStyle, marginTop: '4px' }}
                >
                  {JIJI.map((j, i) => (
                    <option key={i} value={i}>{j}({JIJI_HANJA[i]})</option>
                  ))}
                </select>
                {/* 갑자 표시 */}
                <div style={{ marginTop: '6px', fontSize: '18px', fontWeight: 700, textAlign: 'center', letterSpacing: '-0.01em' }}>
                  <span style={{ color: getOhaengColor(['목','목','화','화','토','토','금','금','수','수'][p.stemIdx]) }}>
                    {CHEONGAN[p.stemIdx]}
                  </span>
                  <span style={{ color: getOhaengColor(['수','토','목','목','토','화','화','토','금','금','토','수'][p.branchIdx]) }}>
                    {JIJI[p.branchIdx]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 내 사주 십성 미리보기 */}
      <div>
        <SectionLabel>내 사주 십성 분석</SectionLabel>
        <p style={{ fontSize: '12px', color: 'var(--text-faint)', margin: '8px 0 16px' }}>
          일간 <strong style={{ color: getOhaengColor(['목','목','화','화','토','토','금','금','수','수'][ilganIdx]) }}>
            {CHEONGAN[ilganIdx]}
          </strong>({CHEONGAN_HANJA[ilganIdx]}) 기준
        </p>
        <div className="grid grid-cols-4 gap-4">
          {(['year', 'month', 'day', 'hour'] as const).map((key, ki) => {
            const label = ['년', '월', '일', '시'][ki];
            const p = pillars[key];
            const result = sajuResult[key];
            const stemColor = getOhaengColor(['목','목','화','화','토','토','금','금','수','수'][p.stemIdx]);
            const branchColor = getOhaengColor(['수','토','목','목','토','화','화','토','금','금','토','수'][p.branchIdx]);

            return (
              <div
                key={key}
                style={{
                  background: '#f5f3ef',
                  borderRadius: '8px',
                  padding: '16px 12px',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: '9px', color: 'var(--text-faint)', marginBottom: '8px', letterSpacing: '0.06em' }}>{label}주</p>
                {/* 천간 */}
                <div style={{ marginBottom: '4px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: stemColor }}>{CHEONGAN[p.stemIdx]}</span>
                  <div style={{ fontSize: '11px', color: SIPSUNG_CATEGORY_COLOR[result.stemSipsung.category], fontWeight: 600 }}>
                    {key === 'day' ? '일간' : result.stemSipsung.name}
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: branchColor }}>{JIJI[p.branchIdx]}</span>
                  {/* 지장간 십성 */}
                  <div className="flex flex-wrap justify-center gap-1 mt-1">
                    {result.branchJangGan.map(({ janggan, sipsung }, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '9px',
                          color: sipsung.category === result.branchMain.category ? SIPSUNG_CATEGORY_COLOR[sipsung.category] : 'var(--text-faint)',
                          fontWeight: janggan.type === '정기' ? 700 : 400,
                        }}
                        title={`${janggan.type} ${CHEONGAN[janggan.stemIdx]} (${janggan.days}일)`}
                      >
                        {sipsung.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 60갑자 × 십성 조견표 */}
      <div>
        <SectionLabel>60갑자 십성 조견표</SectionLabel>
        <p style={{ fontSize: '12px', color: 'var(--text-faint)', margin: '8px 0 14px' }}>
          일간 {CHEONGAN[ilganIdx]}({CHEONGAN_HANJA[ilganIdx]}) 기준 — 천간 십성 / 지지 정기 십성
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(10, 1fr)',
            gap: '2px',
            background: '#e8e4de',
            borderRadius: '6px',
            overflow: 'hidden',
            border: '1px solid #e8e4de',
          }}
        >
          {GAPJA_60.map((pillar) => {
            const stemSS = getSipsungForStem(ilganIdx, pillar.stemIndex);
            const branchSS = getMainSipsungForBranch(ilganIdx, pillar.branchIndex);
            const stemColor = getOhaengColor(pillar.ohaeng);
            const branchColor = getOhaengColor(pillar.branchOhaeng);

            return (
              <div
                key={pillar.index}
                title={`${pillar.name} · 천간:${stemSS.name} · 지지:${branchSS.name}`}
                style={{ background: '#faf9f6', padding: '6px 2px', textAlign: 'center' }}
              >
                {/* 갑자 */}
                <div style={{ fontSize: '12px', fontWeight: 600, lineHeight: 1.2 }}>
                  <span style={{ color: stemColor }}>{pillar.stem}</span>
                  <span style={{ color: branchColor }}>{pillar.branch}</span>
                </div>
                {/* 천간 십성 */}
                <div style={{ fontSize: '9px', color: SIPSUNG_CATEGORY_COLOR[stemSS.category], fontWeight: 600, lineHeight: 1.3 }}>
                  {stemSS.name}
                </div>
                {/* 지지 정기 십성 */}
                <div style={{ fontSize: '8px', color: SIPSUNG_CATEGORY_COLOR[branchSS.category], opacity: 0.7, lineHeight: 1.2 }}>
                  {branchSS.name}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-4 mt-3" style={{ fontSize: '10px' }}>
          {Object.entries(SIPSUNG_CATEGORY_COLOR).map(([cat, color]) => (
            <span key={cat} className="flex items-center gap-1">
              <span style={{ display: 'inline-block', width: '8px', height: '8px', background: color, borderRadius: '1px' }} />
              <span style={{ color: 'var(--text-faint)' }}>{cat}</span>
            </span>
          ))}
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="flex justify-end" style={{ paddingBottom: '40px' }}>
        <button
          onClick={handleSave}
          style={{
            padding: '10px 28px',
            background: 'var(--text-ink)',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          {saved ? '✓ 저장됨' : '저장'}
        </button>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: '10px', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>
      {children}
    </p>
  );
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '5px 6px',
  fontSize: '12px',
  background: 'var(--bg-paper)',
  border: '1px solid var(--border)',
  borderRadius: '4px',
  color: 'var(--text-ink)',
  fontFamily: 'inherit',
  cursor: 'pointer',
  outline: 'none',
};
