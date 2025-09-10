-- Supabase RLS 정책 재설정
-- 이 SQL을 Supabase 대시보드의 SQL Editor에서 실행하세요

-- 기존 정책 삭제 (있을 경우)
DROP POLICY IF EXISTS "Anyone can insert game records" ON game_records;
DROP POLICY IF EXISTS "Anyone can view game records" ON game_records;

-- RLS 비활성화 (테스트용)
ALTER TABLE game_records DISABLE ROW LEVEL SECURITY;

-- 또는 RLS를 활성화하고 정책을 다시 설정
-- ALTER TABLE game_records ENABLE ROW LEVEL SECURITY;

-- 새로운 정책 생성 (RLS 활성화 시)
-- CREATE POLICY "Enable all access for anonymous users" ON game_records
--   FOR ALL
--   USING (true)
--   WITH CHECK (true);

-- 테이블 권한 설정
GRANT ALL ON game_records TO anon;
GRANT ALL ON game_records TO authenticated;

-- 테이블 구조 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'game_records';