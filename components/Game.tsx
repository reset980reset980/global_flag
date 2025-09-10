import React, { useState, useEffect } from 'react';
import type { Question } from '../types.ts';
import { GameMode } from '../types.ts';

interface GameProps {
  question: Question;
  onAnswer: (selectedCode: string) => void;
  questionNumber: number;
  totalQuestions: number;
  score: number;
  onGoHome?: () => void;
}

const FlagCard: React.FC<{ flagUrl: string }> = ({ flagUrl }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const img = new Image();
    img.src = flagUrl;
    img.onload = () => setIsLoading(false);
  }, [flagUrl]);

  return (
    <div className="w-full h-48 md:h-64 bg-slate-700 rounded-lg flex items-center justify-center mb-8 shadow-lg overflow-hidden">
      {isLoading ? (
        <div className="animate-pulse w-full h-full bg-slate-600"></div>
      ) : (
        <img src={flagUrl} alt="Country flag" className="w-full h-full object-contain animate-fade-in" />
      )}
    </div>
  );
};

const OptionButton: React.FC<{
  optionText: string;
  onClick: () => void;
  disabled: boolean;
  feedback?: 'correct' | 'incorrect' | 'hidden';
}> = ({ optionText, onClick, disabled, feedback }) => {
  const baseClasses = 'w-full text-left p-4 rounded-lg font-semibold text-lg transition-all duration-300 transform';
  
  let feedbackClasses = 'bg-slate-700 hover:bg-slate-600 hover:scale-105';
  if (feedback === 'correct') {
    feedbackClasses = 'bg-green-600 scale-105 ring-2 ring-white animate-tada';
  } else if (feedback === 'incorrect') {
    feedbackClasses = 'bg-red-600 animate-shake';
  } else if (feedback === 'hidden') {
    feedbackClasses = 'bg-slate-700 opacity-50';
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${feedbackClasses}`}
    >
      {optionText}
    </button>
  );
};

const Game: React.FC<GameProps> = ({ question, onAnswer, questionNumber, totalQuestions, score, onGoHome }) => {
  const [selection, setSelection] = useState<string | null>(null);

  useEffect(() => {
    setSelection(null);
  }, [question]);

  const handleOptionClick = (code: string) => {
    setSelection(code);
    onAnswer(code);
  };
  
  const progressPercentage = (questionNumber / totalQuestions) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto bg-slate-800 p-8 rounded-xl shadow-2xl animate-fade-in">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2 text-slate-300">
          <div className="flex items-center space-x-4">
            <p className="font-bold">Question {questionNumber} / {totalQuestions}</p>
            {onGoHome && (
              <button
                onClick={onGoHome}
                className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
                title="홈으로 가기"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                </svg>
                <span>홈</span>
              </button>
            )}
          </div>
          <p className="font-bold text-cyan-400">Score: {score}</p>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2.5">
          <div className="bg-cyan-500 h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPercentage}%` }}></div>
        </div>
      </div>
      
      {question.mode === GameMode.FLAG_TO_COUNTRY && question.flagUrl && (
        <FlagCard flagUrl={question.flagUrl} key={question.flagUrl}/>
      )}
      
      {question.mode === GameMode.COUNTRY_TO_CAPITAL && question.countryName && (
        <div className="w-full h-48 md:h-64 bg-slate-700 rounded-lg flex items-center justify-center mb-8 shadow-lg relative">
          {/* 작은 국기 표시 (오른쪽 상단) */}
          <div className="absolute top-4 right-4 w-16 h-12 bg-slate-600 rounded border-2 border-red-500 overflow-hidden shadow-lg">
            <img 
              src={`https://flagcdn.com/w320/${question.correctAnswerCode}.png`}
              alt="Country flag"
              className="w-full h-full object-contain"
            />
          </div>
          
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {question.countryName}
            </h2>
            <p className="text-slate-400 text-lg">
              이 나라의 수도는?
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {question.options.map((option) => {
          let feedback: 'correct' | 'incorrect' | 'hidden' | undefined = undefined;
          if (selection) {
            if (option.code === question.correctAnswerCode) {
              feedback = 'correct';
            } else if (option.code === selection) {
              feedback = 'incorrect';
            } else {
              feedback = 'hidden';
            }
          }

          return (
            <OptionButton
              key={option.code}
              optionText={option.name}
              onClick={() => handleOptionClick(option.code)}
              disabled={!!selection}
              feedback={feedback}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Game;