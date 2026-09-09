-- ============================================================
-- 마이그레이션: user_id 추가 및 유저별 데이터 격리
-- 기존 diary_entries 테이블이 있을 때 실행하세요
-- Supabase SQL Editor → 실행
-- ============================================================

-- 1. user_id 컬럼 추가 (nullable로 먼저)
ALTER TABLE diary_entries
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. 기존 일기들을 첫 번째(= 본인) 계정으로 귀속
--    (기존 데이터가 없으면 skip해도 됨)
UPDATE diary_entries
  SET user_id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1)
  WHERE user_id IS NULL;

-- 3. NOT NULL + 기본값 auth.uid() 설정
ALTER TABLE diary_entries ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE diary_entries ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 4. 날짜 단독 unique → (user_id, date) 복합 unique로 변경
ALTER TABLE diary_entries DROP CONSTRAINT IF EXISTS diary_entries_date_key;
ALTER TABLE diary_entries ADD CONSTRAINT diary_entries_user_date_unique UNIQUE (user_id, date);

-- 5. 기존 정책 전부 삭제
DROP POLICY IF EXISTS "allow all" ON diary_entries;
DROP POLICY IF EXISTS "authenticated only" ON diary_entries;
DROP POLICY IF EXISTS "own entries only" ON diary_entries;

-- 6. 유저별 격리 정책 생성
CREATE POLICY "own entries only" ON diary_entries
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. 인덱스 정리
DROP INDEX IF EXISTS idx_diary_date;
CREATE INDEX IF NOT EXISTS idx_diary_user_date ON diary_entries(user_id, date DESC);
