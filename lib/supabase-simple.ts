import { createClient } from '@supabase/supabase-js'

// Supabase 설정을 직접 하드코딩
const SUPABASE_URL = 'https://ugoexwzegnpnelnxxzzf.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnb2V4d3plZ25wbmVsbnh4enpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczOTgwNzQsImV4cCI6MjA3Mjk3NDA3NH0.JtZNSVmILPJ3YRuG0DQJ7Tqt9whTwUK2rt5jtzeQiMU'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// 게임 기록 타입 정의
export interface GameRecord {
  id?: number
  player_name: string
  score: number
  total_questions: number
  time_taken: number
  game_mode: string
  created_at?: string
}

// 간단한 저장 함수
export const saveGameRecord = async (record: Omit<GameRecord, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('game_records')
    .insert([record])
    .select()

  if (error) {
    console.error('Save error:', error)
    return null
  }
  
  return data
}

// 간단한 조회 함수
export const getTopRecords = async (gameMode?: string, limit: number = 20) => {
  let query = supabase
    .from('game_records')
    .select('*')

  if (gameMode) {
    query = query.eq('game_mode', gameMode)
  }

  const { data, error } = await query
    .order('score', { ascending: false })
    .order('time_taken', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Fetch error:', error)
    return []
  }

  return data || []
}

// 관리자 기능: 모든 게임 기록 삭제
export const clearAllRecords = async (adminPassword: string) => {
  // Vite에서 정의한 환경변수 사용
  const masterPassword = (process.env.MASTER_PASSWORD as string) || '940831'
  
  if (adminPassword !== masterPassword) {
    throw new Error('잘못된 관리자 비밀번호입니다.')
  }

  // 먼저 모든 레코드를 조회
  const { data: records, error: fetchError } = await supabase
    .from('game_records')
    .select('id')

  if (fetchError) {
    console.error('Fetch records error:', fetchError)
    throw fetchError
  }

  if (!records || records.length === 0) {
    console.log('No records to delete')
    return true
  }

  // 모든 ID를 사용하여 삭제
  const ids = records.map(r => r.id)
  const { error: deleteError } = await supabase
    .from('game_records')
    .delete()
    .in('id', ids)

  if (deleteError) {
    console.error('Delete records error:', deleteError)
    throw deleteError
  }

  console.log(`Successfully deleted ${ids.length} records`)
  return true
}