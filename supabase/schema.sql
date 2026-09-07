-- 60갑자 일기 스키마
-- Supabase SQL Editor에서 실행하세요

create table if not exists diary_entries (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- 날짜 (양력 YYYY-MM-DD)
  date        date not null unique,

  -- 갑자 정보 (프론트에서 계산 후 저장)
  day_gapja       text not null,     -- 예: 갑자
  month_gapja     text not null,
  year_gapja      text not null,
  day_gapja_idx   smallint not null, -- 0~59
  month_gapja_idx smallint not null,
  year_gapja_idx  smallint not null,

  -- 일기 내용
  title        text,
  content      text not null,
  mood         text,
  tags         text[],
  energy_level smallint check (energy_level between 1 and 5)
);

-- RLS 활성화
alter table diary_entries enable row level security;

-- 개인 앱: 인증 없이 전체 접근 허용 (싱글유저)
-- 멀티유저 앱을 원하면 auth.uid() 기반으로 변경하세요
create policy "allow all" on diary_entries
  for all using (true) with check (true);

-- updated_at 자동 갱신 트리거
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger diary_entries_updated_at
  before update on diary_entries
  for each row execute function update_updated_at();

-- 유용한 인덱스
create index if not exists idx_diary_date on diary_entries(date desc);
create index if not exists idx_diary_day_gapja_idx on diary_entries(day_gapja_idx);
create index if not exists idx_diary_month_gapja_idx on diary_entries(month_gapja_idx);
create index if not exists idx_diary_year_gapja_idx on diary_entries(year_gapja_idx);
