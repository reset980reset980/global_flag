import React, { useState, useEffect } from 'react';
import { saveGameRecord } from '../lib/supabase-simple.ts';
import { GameMode } from '../types.ts';

interface ResultModalProps {
  score: number;
  totalQuestions: number;
  gameStartTime: Date | null;
  gameEndTime: Date | null;
  gameMode: GameMode;
  onRestart: () => void;
  playSound: () => void;
}

const ResultModal: React.FC<ResultModalProps> = ({ score, totalQuestions, gameStartTime, gameEndTime, gameMode, onRestart, playSound }) => {
  const [displayedScore, setDisplayedScore] = useState(0);
  const [showSaveRecord, setShowSaveRecord] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  
  const percentage = Math.round((score / totalQuestions) * 100);
  
  // 게임 소요 시간 계산 (초 단위)
  const timeTaken = gameStartTime && gameEndTime 
    ? Math.round((gameEndTime.getTime() - gameStartTime.getTime()) / 1000)
    : 0;
  
  // 시간 포맷팅 (분:초)
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    playSound();
    if (score === 0) return;

    const duration = 800;
    let startTime: number;

    const animateScore = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const current = Math.min(Math.ceil((progress / duration) * score), score);
      setDisplayedScore(current);

      if (progress < duration) {
        requestAnimationFrame(animateScore);
      }
    };

    requestAnimationFrame(animateScore);
  }, [score, playSound]);
  
  const handleSaveRecord = async () => {
    if (!playerName.trim()) return;
    
    setIsSaving(true);
    setSaveError('');
    
    try {
      await saveGameRecord({
        player_name: playerName.trim(),
        score,
        total_questions: totalQuestions,
        time_taken: timeTaken,
        game_mode: gameMode
      });
      
      setSaveSuccess(true);
      setTimeout(() => {
        setShowSaveRecord(false);
        setSaveSuccess(false);
      }, 2000);
    } catch (error) {
      setSaveError('기록 저장에 실패했습니다. 다시 시도해주세요.');
      console.error('Error saving record:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  let message = '';
  if (percentage === 100) {
    message = "완벽해요! 당신은 진정한 국기 마스터입니다!";
  } else if (percentage >= 80) {
    message = "훌륭해요! 정말 잘 아시는군요!";
  } else if (percentage >= 50) {
    message = "잘했어요! 조금만 더 노력해봐요!";
  } else {
    message = "괜찮아요! 다음엔 더 잘할 수 있을 거예요.";
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center transform transition-all duration-300 animate-fade-in scale-95 hover:scale-100">
        {!showSaveRecord ? (
          <>
            <h2 className="text-3xl font-bold text-cyan-400 mb-4">게임 종료!</h2>
            <p className="text-slate-300 text-lg mb-6">{message}</p>
            
            <div className="bg-slate-700 rounded-xl p-6 mb-6">
              <p className="text-xl text-white mb-2">최종 점수</p>
              <p className="text-6xl font-bold text-cyan-300 my-2">
                {displayedScore} <span className="text-3xl text-slate-400">/ {totalQuestions}</span>
              </p>
              <p className="text-2xl font-semibold text-white mb-3">({percentage}%)</p>
              
              {timeTaken > 0 && (
                <div className="border-t border-slate-600 pt-3">
                  <p className="text-lg text-slate-300">소요 시간</p>
                  <p className="text-2xl font-bold text-yellow-400">{formatTime(timeTaken)}</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setShowSaveRecord(true)}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-transform duration-200 transform hover:scale-105 shadow-lg"
              >
                🏆 기록 저장하기
              </button>
              <button
                onClick={onRestart}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg transition-transform duration-200 transform hover:scale-105 shadow-lg"
              >
                다시 플레이하기
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">기록 저장</h2>
            <div className="bg-slate-700 rounded-xl p-4 mb-6">
              <p className="text-sm text-slate-300 mb-2">점수: {score}/{totalQuestions} ({percentage}%)</p>
              <p className="text-sm text-slate-300">시간: {formatTime(timeTaken)}</p>
            </div>
            
            {!saveSuccess ? (
              <>
                <div className="mb-6">
                  <label className="block text-slate-300 text-sm font-bold mb-2">
                    플레이어 이름
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="이름을 입력하세요"
                    maxLength={20}
                    className="w-full px-3 py-2 bg-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    disabled={isSaving}
                  />
                </div>
                
                {saveError && (
                  <p className="text-red-400 text-sm mb-4">{saveError}</p>
                )}
                
                <div className="space-y-3">
                  <button
                    onClick={handleSaveRecord}
                    disabled={!playerName.trim() || isSaving}
                    className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isSaving ? '저장 중...' : '저장하기'}
                  </button>
                  <button
                    onClick={() => setShowSaveRecord(false)}
                    className="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200"
                    disabled={isSaving}
                  >
                    취소
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-green-400 mb-4">
                  <svg className="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-lg font-bold">기록이 저장되었습니다!</p>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ResultModal;
