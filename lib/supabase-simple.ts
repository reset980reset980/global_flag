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
  const masterPassword = process.env.MASTER_PASSWORD || '940831'
  
  if (adminPassword !== masterPassword) {
    throw new Error('잘못된 관리자 비밀번호입니다.')
  }

  const { error } = await supabase
    .from('game_records')
    .delete()
    .gte('id', 0) // 모든 레코드 삭제

  if (error) {
    console.error('Clear records error:', error)
    throw error
  }

  return true
}