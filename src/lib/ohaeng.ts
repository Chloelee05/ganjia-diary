/**
 * 오행 색상 시스템
 * 
 * 절제된 팔레트 — 너무 채도 높지 않게, 종이 위의 먹 느낌으로
 */

export const OHAENG_COLOR = {
  목: '#3a6b4a',   // 청록이 아닌 깊은 숲 초록
  화: '#b84030',   // 주홍 가까운 테라코타
  토: '#8a6c20',   // 황토색
  금: '#5a5a5a',   // 따뜻한 회철색
  수: '#2c5282',   // 깊은 쪽빛
} as const;

// 배경용 (매우 연하게)
export const OHAENG_BG = {
  목: '#f1f5f2',
  화: '#fdf2f1',
  토: '#fdf8ef',
  금: '#f5f5f5',
  수: '#eff4fb',
} as const;

// 테두리용
export const OHAENG_BORDER = {
  목: '#c4d9ca',
  화: '#f0c4be',
  토: '#e8d9b0',
  금: '#d8d8d8',
  수: '#b8ccec',
} as const;

export type Ohaeng = keyof typeof OHAENG_COLOR;

export function getOhaengColor(ohaeng: string): string {
  return OHAENG_COLOR[ohaeng as Ohaeng] ?? '#6b6b6b';
}

export function getOhaengBg(ohaeng: string): string {
  return OHAENG_BG[ohaeng as Ohaeng] ?? '#f5f5f5';
}

export function getOhaengBorder(ohaeng: string): string {
  return OHAENG_BORDER[ohaeng as Ohaeng] ?? '#e0e0e0';
}
