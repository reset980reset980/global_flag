-- Supabase RLS 완전 비활성화
-- Supabase 대시보드 SQL Editor에서 실행하세요

-- RLS 비활성화
ALTER TABLE game_records DISABLE ROW LEVEL SECURITY;

-- 모든 권한 부여
GRANT ALL ON game_records TO anon;
GRANT ALL ON game_records TO authenticated;
GRANT USAGE ON SEQUENCE game_records_id_seq TO anon;
GRANT USAGE ON SEQUENCE game_records_id_seq TO authenticated;

-- 테스트 쿼리
SELECT COUNT(*) FROM game_records;

-- 테이블 구조 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'game_records'
ORDER BY ordinal_position;