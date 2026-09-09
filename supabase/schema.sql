-- 60갑자 일기 스키마
-- Supabase SQL Editor에서 실행하세요
-- (이미 테이블이 있다면 아래 migration.sql을 대신 실행하세요)

create table if not exists diary_entries (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  -- 유저 분리
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,

  -- 날짜 (양력 YYYY-MM-DD) - user_id와 복합 unique
  date        date not null,

  -- 갑자 정보 (프론트에서 계산 후 저장)
  day_gapja       text not null,
  month_gapja     text not null,
  year_gapja      text not null,
  day_gapja_idx   smallint not null,
  month_gapja_idx smallint not null,
  year_gapja_idx  smallint not null,

  -- 일기 내용
  title        text,
  content      text not null,
  mood         text,
  tags         text[],
  energy_level smallint check (energy_level between 1 and 5),

  -- 복합 unique: 같은 유저가 같은 날짜에 하나만
  unique (user_id, date)
);

-- RLS 활성화
alter table diary_entries enable row level security;

-- 자기 일기만 접근 가능
create policy "own entries only" on diary_entries
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

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

-- 인덱스
create index if not exists idx_diary_user_date on diary_entries(user_id, date desc);
create index if not exists idx_diary_day_gapja_idx on diary_entries(day_gapja_idx);
create index if not exists idx_diary_month_gapja_idx on diary_entries(month_gapja_idx);
create index if not exists idx_diary_year_gapja_idx on diary_entries(year_gapja_idx);
