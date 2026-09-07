/**
 * 60갑자 계산 엔진
 * 
 * 천간 (天干, Heavenly Stems) × 지지 (地支, Earthly Branches) = 60갑자
 * 
 * 참고 기준일:
 * - 1984년 = 甲子年 (갑자년)
 * - 1900년 1월 1일 = 甲戌日 (갑술일, 60갑자 index = 10)
 * - 월주는 절기 기준 (소한~대설), 근사값 사용
 */

// ─────────────────────────────────────────────
// 기본 데이터
// ─────────────────────────────────────────────

export const CHEONGAN = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'] as const;
export const JIJI = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'] as const;

export const CHEONGAN_HANJA = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
export const JIJI_HANJA = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

// 오행 매핑
export const CHEONGAN_OHAENG = ['목', '목', '화', '화', '토', '토', '금', '금', '수', '수'] as const;
export const JIJI_OHAENG = ['수', '토', '목', '목', '토', '화', '화', '토', '금', '금', '토', '수'] as const;

// 음양 매핑 (양=true, 음=false)
export const CHEONGAN_EUMYANG = [true, false, true, false, true, false, true, false, true, false] as const;
export const JIJI_EUMYANG = [true, false, true, false, true, false, true, false, true, false, true, false] as const;

// 십이지신 (띠)
export const JIJI_ANIMAL = ['쥐', '소', '범', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'] as const;

// ─────────────────────────────────────────────
// 60갑자 목록 생성
// ─────────────────────────────────────────────

export interface GanjiPillar {
  index: number;        // 0~59
  stemIndex: number;    // 0~9 (천간)
  branchIndex: number;  // 0~11 (지지)
  stem: string;         // 갑~계
  branch: string;       // 자~해
  stemHanja: string;
  branchHanja: string;
  name: string;         // 갑자, 을축, ...
  nameHanja: string;
  ohaeng: string;       // 천간 오행
  branchOhaeng: string; // 지지 오행
  eumyang: string;      // 양 / 음
}

export const GAPJA_60: GanjiPillar[] = Array.from({ length: 60 }, (_, i) => {
  const stemIndex = i % 10;
  const branchIndex = i % 12;
  return {
    index: i,
    stemIndex,
    branchIndex,
    stem: CHEONGAN[stemIndex],
    branch: JIJI[branchIndex],
    stemHanja: CHEONGAN_HANJA[stemIndex],
    branchHanja: JIJI_HANJA[branchIndex],
    name: `${CHEONGAN[stemIndex]}${JIJI[branchIndex]}`,
    nameHanja: `${CHEONGAN_HANJA[stemIndex]}${JIJI_HANJA[branchIndex]}`,
    ohaeng: CHEONGAN_OHAENG[stemIndex],
    branchOhaeng: JIJI_OHAENG[branchIndex],
    eumyang: CHEONGAN_EUMYANG[stemIndex] ? '양' : '음',
  };
});

// ─────────────────────────────────────────────
// 년주 계산
// ─────────────────────────────────────────────

/**
 * 년주 계산
 * - 기준: 1984 = 甲子年 (index 0)
 * - 입춘(약 2월 4일) 이전이면 전년도 적용
 */
export function getYearPillar(date: Date): GanjiPillar {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-indexed
  const day = date.getDate();

  // 입춘 근사일: 2월 4일 (실제는 3~5일 사이)
  const IPCHUN_MONTH = 2;
  const IPCHUN_DAY = 4;

  let effectiveYear = year;
  if (month < IPCHUN_MONTH || (month === IPCHUN_MONTH && day < IPCHUN_DAY)) {
    effectiveYear = year - 1;
  }

  // 1984 = 甲子 = index 0
  const index = ((effectiveYear - 1984) % 60 + 60) % 60;
  return GAPJA_60[index];
}

// ─────────────────────────────────────────────
// 월주 계산
// ─────────────────────────────────────────────

/**
 * 절기 근사 날짜 (월별 절입 일)
 * 실제 절기는 해마다 1~2일 차이가 있으므로 근사값 사용.
 * [월(1-12), 근사일]
 * 
 * 전통월 순서 (지지): 자축인묘진사오미신유술해
 * 절기 기준:
 *   1월 소한(약 1/6) → 축월
 *   2월 입춘(약 2/4) → 인월  ← 년 바뀜
 *   3월 경칩(약 3/6) → 묘월
 *   4월 청명(약 4/5) → 진월
 *   5월 입하(약 5/6) → 사월
 *   6월 망종(약 6/6) → 오월
 *   7월 소서(약 7/7) → 미월
 *   8월 입추(약 8/7) → 신월
 *   9월 백로(약 9/8) → 유월
 *  10월 한로(약 10/8) → 술월
 *  11월 입동(약 11/7) → 해월
 *  12월 대설(약 12/7) → 자월
 */
const JEOLGI_APPROX: [number, number][] = [
  [1, 6],   // 소한 → 축월(1)
  [2, 4],   // 입춘 → 인월(2)
  [3, 6],   // 경칩 → 묘월(3)
  [4, 5],   // 청명 → 진월(4)
  [5, 6],   // 입하 → 사월(5)
  [6, 6],   // 망종 → 오월(6)
  [7, 7],   // 소서 → 미월(7)
  [8, 7],   // 입추 → 신월(8)
  [9, 8],   // 백로 → 유월(9)
  [10, 8],  // 한로 → 술월(10)
  [11, 7],  // 입동 → 해월(11)
  [12, 7],  // 대설 → 자월(12)
];

/**
 * 해당 날짜의 전통월 번호 반환 (1~12, 인월=1 기준)
 * 1 = 인월, 2 = 묘월, ..., 12 = 축월
 */
export function getTraditionalMonth(date: Date): number {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const [, approxDay] = JEOLGI_APPROX[month - 1];

  // 아직 이달 절기 전이면 전달 전통월
  let tradMonth: number;
  if (day < approxDay) {
    tradMonth = month - 1 === 0 ? 12 : month - 1;
  } else {
    tradMonth = month;
  }

  // 전통월 → 인월 기준 인덱스로 변환
  // 인월(2월) = 1, 묘월(3월) = 2, ..., 축월(1월) = 12
  // tradMonth(양력월) 2→인월1, 3→묘월2, ..., 12→자월11, 1→축월12
  let inIdx: number;
  if (tradMonth === 1) {
    inIdx = 12; // 축월
  } else {
    inIdx = tradMonth - 1; // 2월→1(인월), 3월→2(묘월), ...
  }
  return inIdx;
}

/**
 * 월주 계산
 * 월주 천간 = 년주 천간에 따라 결정
 * 
 * 갑년/기년: 병인월 시작
 * 을년/경년: 무인월 시작
 * 병년/신년: 경인월 시작
 * 정년/임년: 임인월 시작
 * 무년/계년: 갑인월 시작
 * 
 * 공식: monthStemBase = ((yearStem % 5) * 2 + 2) % 10
 */
export function getMonthPillar(date: Date): GanjiPillar {
  const yearPillar = getYearPillar(date);
  const tradMonth = getTraditionalMonth(date); // 1(인월) ~ 12(축월)

  const yearStemIndex = yearPillar.stemIndex;
  const monthStemBase = ((yearStemIndex % 5) * 2 + 2) % 10;

  // 인월(1) 기준으로 천간 증가
  const stemIndex = (monthStemBase + tradMonth - 1) % 10;

  // 인월(1)은 지지 인(2), 묘월(2)은 묘(3), ...
  // tradMonth 1→인(2), 2→묘(3), ..., 12→축(1)
  const branchIndex = (tradMonth - 1 + 2) % 12;

  // 60갑자 인덱스
  // stem × 12 조합에서 해당 branch 찾기
  const idx = GAPJA_60.findIndex(
    (g) => g.stemIndex === stemIndex && g.branchIndex === branchIndex
  );
  return GAPJA_60[idx];
}

// ─────────────────────────────────────────────
// 일주 계산
// ─────────────────────────────────────────────

/**
 * 일주 계산
 * 기준: 1900년 1월 1일 = 甲戌日 = 60갑자 index 10
 * 
 * 율리우스 일수(Julian Day Number) 방식 사용
 */
function toJulianDay(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

const BASE_JDN = toJulianDay(1900, 1, 1); // 1900년 1월 1일의 JDN
const BASE_GAPJA_IDX = 10; // 甲戌 = index 10

export function getDayPillar(date: Date): GanjiPillar {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const jdn = toJulianDay(year, month, day);
  const daysDiff = jdn - BASE_JDN;
  const idx = ((daysDiff + BASE_GAPJA_IDX) % 60 + 60) % 60;
  return GAPJA_60[idx];
}

// ─────────────────────────────────────────────
// 날짜 → 사주팔자 전체 반환
// ─────────────────────────────────────────────

export interface Saju {
  year: GanjiPillar;
  month: GanjiPillar;
  day: GanjiPillar;
  date: string; // YYYY-MM-DD
}

export function getSaju(date: Date): Saju {
  return {
    year: getYearPillar(date),
    month: getMonthPillar(date),
    day: getDayPillar(date),
    date: formatDate(date),
  };
}

// ─────────────────────────────────────────────
// 유틸리티
// ─────────────────────────────────────────────

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** 특정 갑자 이름으로 60갑자 찾기 */
export function findGapjaByName(name: string): GanjiPillar | undefined {
  return GAPJA_60.find((g) => g.name === name);
}

/** 오늘 날짜 */
export function today(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** 날짜 범위 내에서 특정 일주가 오는 날짜들 */
export function getDatesForDayPillar(
  pillarIndex: number,
  startDate: Date,
  endDate: Date
): Date[] {
  const results: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    if (getDayPillar(current).index === pillarIndex) {
      results.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  return results;
}
