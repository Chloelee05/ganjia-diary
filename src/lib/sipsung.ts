/**
 * 십성(十星) 계산 엔진
 * 
 * 일간(日干)을 기준으로 각 천간/지지의 십성을 구합니다.
 * 
 * 십성 목록:
 * 비견(比肩), 겁재(劫財)
 * 식신(食神), 상관(傷官)
 * 정재(正財), 편재(偏財)
 * 정관(正官), 편관(偏官/七殺)
 * 정인(正印), 편인(偏印/梟神)
 */

import { CHEONGAN_OHAENG, CHEONGAN_EUMYANG, JIJI } from './ganjia';

// ─── 오행 상생상극 ───────────────────────────────

/** 오행이 생하는 오행 (목→화→토→금→수→목) */
const GENERATES: Record<string, string> = {
  목: '화', 화: '토', 토: '금', 금: '수', 수: '목',
};

/** 오행이 극하는 오행 (목→토→수→화→금→목) */
const CONTROLS: Record<string, string> = {
  목: '토', 화: '금', 토: '수', 금: '목', 수: '화',
};

// ─── 십성 정의 ───────────────────────────────────

export interface Sipsung {
  name: string;    // 비견, 겁재, ...
  hanja: string;   // 比肩, 劫財, ...
  alias?: string;  // 칠살, 효신 등 별칭
  category: '비겁' | '식상' | '재성' | '관성' | '인성';
  color: string;   // 표시 색상
}

const SIPSUNG_MAP: Record<string, Sipsung> = {
  비견: { name: '비견', hanja: '比肩', category: '비겁', color: '#3a6b4a' },
  겁재: { name: '겁재', hanja: '劫財', category: '비겁', color: '#2d5a3a' },
  식신: { name: '식신', hanja: '食神', category: '식상', color: '#2c5282' },
  상관: { name: '상관', hanja: '傷官', category: '식상', color: '#1e3a6e' },
  정재: { name: '정재', hanja: '正財', category: '재성', color: '#8a6c20' },
  편재: { name: '편재', hanja: '偏財', category: '재성', color: '#6b5018' },
  정관: { name: '정관', hanja: '正官', category: '관성', color: '#7a2a20' },
  편관: { name: '편관', hanja: '偏官', alias: '칠살', category: '관성', color: '#b84030' },
  정인: { name: '정인', hanja: '正印', category: '인성', color: '#5a3a6b' },
  편인: { name: '편인', hanja: '偏印', alias: '효신', category: '인성', color: '#3a2a5a' },
};

export const SIPSUNG_CATEGORY_COLOR: Record<string, string> = {
  비겁: '#3a6b4a',
  식상: '#2c5282',
  재성: '#8a6c20',
  관성: '#b84030',
  인성: '#5a3a6b',
};

/**
 * 천간 십성 계산
 * @param ilganIdx - 일간 천간 인덱스 (0~9)
 * @param targetStemIdx - 대상 천간 인덱스 (0~9)
 */
export function getSipsungForStem(ilganIdx: number, targetStemIdx: number): Sipsung {
  const ilganOhaeng = CHEONGAN_OHAENG[ilganIdx];
  const ilganYin = !CHEONGAN_EUMYANG[ilganIdx]; // true = yin
  const targetOhaeng = CHEONGAN_OHAENG[targetStemIdx];
  const targetYin = !CHEONGAN_EUMYANG[targetStemIdx];

  const sameYinYang = ilganYin === targetYin;

  // 1. 같은 오행
  if (ilganOhaeng === targetOhaeng) {
    return SIPSUNG_MAP[sameYinYang ? '비견' : '겁재'];
  }

  // 2. 일간이 생하는 오행
  if (GENERATES[ilganOhaeng] === targetOhaeng) {
    return SIPSUNG_MAP[sameYinYang ? '식신' : '상관'];
  }

  // 3. 일간이 극하는 오행 (재성)
  if (CONTROLS[ilganOhaeng] === targetOhaeng) {
    return SIPSUNG_MAP[sameYinYang ? '편재' : '정재'];
  }

  // 4. 대상이 일간을 극하는 오행 (관성)
  if (CONTROLS[targetOhaeng] === ilganOhaeng) {
    return SIPSUNG_MAP[sameYinYang ? '편관' : '정관'];
  }

  // 5. 대상이 일간을 생하는 오행 (인성)
  if (GENERATES[targetOhaeng] === ilganOhaeng) {
    return SIPSUNG_MAP[sameYinYang ? '편인' : '정인'];
  }

  // fallback (이론적으로 도달 불가)
  return SIPSUNG_MAP['비견'];
}

// ─── 지장간(支藏干) ─────────────────────────────
// 정기(正氣) 위주로 정의 (여기/중기 포함)
export interface JangGan {
  stemIdx: number;
  days: number; // 해당 기간 (일)
  type: '여기' | '중기' | '정기';
}

export const JIJANG_GAN: JangGan[][] = [
  // 자(子)
  [{ stemIdx: 8, days: 7, type: '여기' }, { stemIdx: 9, days: 23, type: '정기' }],
  // 축(丑)
  [{ stemIdx: 9, days: 9, type: '여기' }, { stemIdx: 7, days: 3, type: '중기' }, { stemIdx: 5, days: 18, type: '정기' }],
  // 인(寅)
  [{ stemIdx: 4, days: 7, type: '여기' }, { stemIdx: 2, days: 7, type: '중기' }, { stemIdx: 0, days: 16, type: '정기' }],
  // 묘(卯)
  [{ stemIdx: 0, days: 10, type: '여기' }, { stemIdx: 1, days: 20, type: '정기' }],
  // 진(辰)
  [{ stemIdx: 1, days: 9, type: '여기' }, { stemIdx: 9, days: 3, type: '중기' }, { stemIdx: 4, days: 18, type: '정기' }],
  // 사(巳)
  [{ stemIdx: 4, days: 7, type: '여기' }, { stemIdx: 6, days: 7, type: '중기' }, { stemIdx: 2, days: 16, type: '정기' }],
  // 오(午)
  [{ stemIdx: 2, days: 10, type: '여기' }, { stemIdx: 5, days: 10, type: '중기' }, { stemIdx: 3, days: 10, type: '정기' }],
  // 미(未)
  [{ stemIdx: 3, days: 9, type: '여기' }, { stemIdx: 1, days: 3, type: '중기' }, { stemIdx: 5, days: 18, type: '정기' }],
  // 신(申)
  [{ stemIdx: 4, days: 7, type: '여기' }, { stemIdx: 8, days: 7, type: '중기' }, { stemIdx: 6, days: 16, type: '정기' }],
  // 유(酉)
  [{ stemIdx: 6, days: 10, type: '여기' }, { stemIdx: 7, days: 20, type: '정기' }],
  // 술(戌)
  [{ stemIdx: 7, days: 9, type: '여기' }, { stemIdx: 3, days: 3, type: '중기' }, { stemIdx: 4, days: 18, type: '정기' }],
  // 해(亥)
  [{ stemIdx: 4, days: 7, type: '여기' }, { stemIdx: 0, days: 5, type: '중기' }, { stemIdx: 8, days: 18, type: '정기' }],
];

/** 지지의 지장간 십성 (여기/중기/정기 각각) */
export function getSipsungForBranch(
  ilganIdx: number,
  branchIdx: number
): { janggan: JangGan; sipsung: Sipsung }[] {
  return JIJANG_GAN[branchIdx].map((jg) => ({
    janggan: jg,
    sipsung: getSipsungForStem(ilganIdx, jg.stemIdx),
  }));
}

/** 정기(正氣)만 반환 */
export function getMainSipsungForBranch(
  ilganIdx: number,
  branchIdx: number
): Sipsung {
  const jangGans = JIJANG_GAN[branchIdx];
  const jeonggi = jangGans.find((j) => j.type === '정기') ?? jangGans[jangGans.length - 1];
  return getSipsungForStem(ilganIdx, jeonggi.stemIdx);
}

// ─── 사주 전체 십성 ──────────────────────────────

export interface PillarSipsungDetail {
  stemSipsung: Sipsung;
  branchJangGan: { janggan: JangGan; sipsung: Sipsung }[];
  branchMain: Sipsung;
}

export interface SajuSipsungResult {
  year: PillarSipsungDetail;
  month: PillarSipsungDetail;
  day: PillarSipsungDetail;   // 일지(日支)만 계산 (일간은 비견)
  hour: PillarSipsungDetail;
}

/** 사주 8글자의 십성을 모두 계산 */
export function calcSajuSipsung(
  ilganIdx: number,
  pillars: {
    yearStemIdx: number; yearBranchIdx: number;
    monthStemIdx: number; monthBranchIdx: number;
    dayStemIdx: number; dayBranchIdx: number;
    hourStemIdx: number; hourBranchIdx: number;
  }
): SajuSipsungResult {
  const calc = (stemIdx: number, branchIdx: number): PillarSipsungDetail => ({
    stemSipsung: getSipsungForStem(ilganIdx, stemIdx),
    branchJangGan: getSipsungForBranch(ilganIdx, branchIdx),
    branchMain: getMainSipsungForBranch(ilganIdx, branchIdx),
  });

  return {
    year: calc(pillars.yearStemIdx, pillars.yearBranchIdx),
    month: calc(pillars.monthStemIdx, pillars.monthBranchIdx),
    day: calc(pillars.dayStemIdx, pillars.dayBranchIdx),
    hour: calc(pillars.hourStemIdx, pillars.hourBranchIdx),
  };
}

// ─── 사용자 설정 ────────────────────────────────

export interface UserSaju {
  ilganIdx: number;   // 일간 인덱스 (0~9)
  // 전체 사주 (선택)
  yearStemIdx?: number;
  yearBranchIdx?: number;
  monthStemIdx?: number;
  monthBranchIdx?: number;
  dayStemIdx?: number;    // 일간과 동일
  dayBranchIdx?: number;
  hourStemIdx?: number;
  hourBranchIdx?: number;
}

const USER_SAJU_KEY = 'ganjia_user_saju';

export function loadUserSaju(): UserSaju | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_SAJU_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveUserSaju(saju: UserSaju): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_SAJU_KEY, JSON.stringify(saju));
}
