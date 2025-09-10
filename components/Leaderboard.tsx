import React, { useState, useEffect } from 'react';
import { getTopRecords, GameRecord } from '../lib/supabase-simple.ts';
import { GameMode } from '../types.ts';

interface LeaderboardProps {
  onClose: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ onClose }) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>(GameMode.FLAG_TO_COUNTRY);
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLeaderboard();
  }, [selectedMode]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getTopRecords(selectedMode, 20); // 게임 모드별 상위 20개 기록
      setRecords(data || []);
    } catch (err) {
      setError('리더보드를 불러오는데 실패했습니다.');
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getPercentage = (score: number, total: number) => {
    return Math.round((score / total) * 100);
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `${rank}위`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-fade-in">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-cyan-400">🏆 리더보드</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            title="닫기"
          >
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 게임 모드 탭 */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setSelectedMode(GameMode.FLAG_TO_COUNTRY)}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
              selectedMode === GameMode.FLAG_TO_COUNTRY
                ? 'bg-cyan-500 text-white shadow-lg'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            🏁 국기 맞추기
          </button>
          <button
            onClick={() => setSelectedMode(GameMode.COUNTRY_TO_CAPITAL)}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
              selectedMode === GameMode.COUNTRY_TO_CAPITAL
                ? 'bg-green-500 text-white shadow-lg'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            🏛️ 수도 맞추기
          </button>
        </div>

        {/* 새로고침 버튼 */}
        <div className="mb-4">
          <button
            onClick={loadLeaderboard}
            disabled={loading}
            className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{loading ? '로딩 중...' : '새로고침'}</span>
          </button>
        </div>

        {/* 리더보드 내용 */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="text-red-400 text-center py-8">
              <p>{error}</p>
              <button
                onClick={loadLeaderboard}
                className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                다시 시도
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-slate-400">리더보드를 불러오는 중...</p>
            </div>
          )}

          {!loading && !error && records.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <p className="text-xl mb-2">📊</p>
              <p>아직 등록된 기록이 없습니다.</p>
              <p className="text-sm mt-2">첫 번째 기록을 남겨보세요!</p>
            </div>
          )}

          {!loading && !error && records.length > 0 && (
            <div className="space-y-2">
              {records.map((record, index) => {
                const rank = index + 1;
                const isTopThree = rank <= 3;
                
                return (
                  <div
                    key={record.id}
                    className={`p-4 rounded-lg transition-all duration-200 hover:scale-102 ${
                      isTopThree 
                        ? 'bg-gradient-to-r from-yellow-900/30 to-slate-700 border border-yellow-500/30' 
                        : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`text-2xl font-bold ${
                          isTopThree ? 'text-yellow-400' : 'text-slate-400'
                        }`}>
                          {getRankBadge(rank)}
                        </div>
                        
                        <div>
                          <p className="font-bold text-white text-lg">{record.player_name}</p>
                          <p className="text-sm text-slate-300">
                            {formatDate(record.created_at || '')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-cyan-400">
                              {record.score}/{record.total_questions}
                            </p>
                            <p className="text-sm text-slate-400">
                              {getPercentage(record.score, record.total_questions)}%
                            </p>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-xl font-bold text-yellow-400">
                              {formatTime(record.time_taken)}
                            </p>
                            <p className="text-xs text-slate-400">시간</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 추가 정보 (상위 3등만 표시) */}
                    {isTopThree && (
                      <div className="mt-3 pt-3 border-t border-slate-600">
                        <div className="flex justify-between text-sm text-slate-300">
                          <span>정답률: {getPercentage(record.score, record.total_questions)}%</span>
                          <span>평균 문제당: {(record.time_taken / record.total_questions).toFixed(1)}초</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 하단 정보 */}
        <div className="mt-6 pt-4 border-t border-slate-700 text-center">
          <p className="text-sm text-slate-400 mb-2">
            {selectedMode === GameMode.FLAG_TO_COUNTRY ? '🏁 국기 맞추기' : '🏛️ 수도 맞추기'} 랭킹
          </p>
          <p className="text-xs text-slate-500">
            📈 순위는 점수 우선, 동점시 시간순으로 결정됩니다
          </p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;