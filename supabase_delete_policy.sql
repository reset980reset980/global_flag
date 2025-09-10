-- Supabase에서 실행할 SQL
-- 기존 정책 확인 및 삭제 권한 추가

-- 먼저 현재 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'game_records';

-- 익명 사용자에게 DELETE 권한 추가
CREATE POLICY "Enable delete for anonymous users" ON public.game_records
FOR DELETE 
TO anon
USING (true);

-- 또는 모든 작업을 허용하는 정책 (개발용)
DROP POLICY IF EXISTS "Enable all for anonymous users" ON public.game_records;
CREATE POLICY "Enable all for anonymous users" ON public.game_records
FOR ALL 
TO anon
USING (true)
WITH CHECK (true);

-- 테이블의 RLS 상태 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'game_records';