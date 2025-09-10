import React, { useState, useCallback, useMemo } from 'react';
import { Continent, GameMode } from './types.ts';
import type { Question, Country } from './types.ts';
import { COUNTRIES } from './constants/countries.ts';
import ContinentSelector from './components/ContinentSelector.tsx';
import Game from './components/Game.tsx';
import ResultModal from './components/ResultModal.tsx';
import Leaderboard from './components/Leaderboard.tsx';
import GameModeSelector from './components/GameModeSelector.tsx';

const TOTAL_QUESTIONS = 10;
const MIN_COUNTRIES_FOR_GAME = 4;

// 배경음악 관리
let lobbyMusic: HTMLAudioElement | null = null;
let playMusic: HTMLAudioElement | null = null;
let currentBackgroundMusic: HTMLAudioElement | null = null;

// 효과음 생성 함수 (Web Audio API)
const createSound = (frequency: number, duration: number, type: 'sine' | 'square' | 'sawtooth' = 'sine') => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (e) {
    console.warn('Could not create sound:', e);
  }
};

const SOUND_CONFIGS = {
  click: { frequency: 800, duration: 0.1 },
  correct: { frequency: 523, duration: 0.3 }, // C5 음
  incorrect: { frequency: 220, duration: 0.5 }, // A3 음 (낮은 음)
  win: { frequency: 659, duration: 0.8 } // E5 음
};

type SoundType = keyof typeof SOUND_CONFIGS;

const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

// 배경음악 초기화 함수
const initializeBackgroundMusic = () => {
  try {
    if (!lobbyMusic) {
      // 여러 경로 시도 (OGG 우선, MP3 fallback)
      const lobbyPaths = ['/lobby.ogg', './lobby.ogg', '/public/lobby.ogg', '/lobby.mp3', './lobby.mp3', '/public/lobby.mp3'];
      lobbyMusic = new Audio();
      lobbyMusic.loop = true;
      lobbyMusic.volume = 0.3;
      lobbyMusic.preload = 'auto';
      
      let lobbyLoaded = false;
      
      const tryLoadLobby = (pathIndex = 0) => {
        if (pathIndex >= lobbyPaths.length || lobbyLoaded) return;
        
        lobbyMusic.src = lobbyPaths[pathIndex];
        
        const onLoad = () => {
          lobbyLoaded = true;
          console.log(`Lobby music loaded from: ${lobbyPaths[pathIndex]}`);
          lobbyMusic.removeEventListener('canplaythrough', onLoad);
          lobbyMusic.removeEventListener('error', onError);
        };
        
        const onError = () => {
          if (pathIndex === lobbyPaths.length - 1) {
            console.log('Background music unavailable - running without music');
          }
          lobbyMusic.removeEventListener('canplaythrough', onLoad);
          lobbyMusic.removeEventListener('error', onError);
          tryLoadLobby(pathIndex + 1);
        };
        
        lobbyMusic.addEventListener('canplaythrough', onLoad);
        lobbyMusic.addEventListener('error', onError);
        lobbyMusic.load();
      };
      
      tryLoadLobby();
    }
    
    if (!playMusic) {
      // 여러 경로 시도 (OGG 우선, MP3 fallback)
      const playPaths = ['/play.ogg', './play.ogg', '/public/play.ogg', '/play.mp3', './play.mp3', '/public/play.mp3'];
      playMusic = new Audio();
      playMusic.loop = true;
      playMusic.volume = 0.3;
      playMusic.preload = 'auto';
      
      let playLoaded = false;
      
      const tryLoadPlay = (pathIndex = 0) => {
        if (pathIndex >= playPaths.length || playLoaded) return;
        
        playMusic.src = playPaths[pathIndex];
        
        const onLoad = () => {
          playLoaded = true;
          console.log(`Play music loaded from: ${playPaths[pathIndex]}`);
          playMusic.removeEventListener('canplaythrough', onLoad);
          playMusic.removeEventListener('error', onError);
        };
        
        const onError = () => {
          if (pathIndex === playPaths.length - 1) {
            console.log('Play music unavailable - running without music');
          }
          playMusic.removeEventListener('canplaythrough', onLoad);
          playMusic.removeEventListener('error', onError);
          tryLoadPlay(pathIndex + 1);
        };
        
        playMusic.addEventListener('canplaythrough', onLoad);
        playMusic.addEventListener('error', onError);
        playMusic.load();
      };
      
      tryLoadPlay();
    }
  } catch (e) {
    console.warn('Could not initialize background music:', e);
  }
};

// 배경음악 제어 함수들
const startBackgroundMusic = (musicType: 'lobby' | 'play') => {
  try {
    initializeBackgroundMusic();
    
    // 현재 재생 중인 음악 정지
    stopBackgroundMusic();
    
    const musicToPlay = musicType === 'lobby' ? lobbyMusic : playMusic;
    if (musicToPlay && musicToPlay.src) {
      currentBackgroundMusic = musicToPlay;
      
      // 음악이 로드되었는지 확인
      const checkAndPlay = () => {
        if (musicToPlay.readyState >= 3) { // HAVE_FUTURE_DATA
          const playPromise = musicToPlay.play();
          
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log(`Successfully started ${musicType} music`);
              })
              .catch(e => {
                console.warn(`Could not play ${musicType} music:`, e.message);
                // 자동재생이 차단된 경우 사용자 상호작용 후 재시도
                if (e.name === 'NotAllowedError') {
                  console.log('Music autoplay blocked - will play after user interaction');
                }
              });
          }
        } else {
          // 아직 로드되지 않았으면 잠시 후 재시도
          setTimeout(checkAndPlay, 100);
        }
      };
      
      checkAndPlay();
    } else {
      console.warn(`${musicType} music not loaded or no source available`);
    }
  } catch (e) {
    console.warn('Could not start background music:', e);
  }
};

const stopBackgroundMusic = () => {
  if (currentBackgroundMusic) {
    currentBackgroundMusic.pause();
    currentBackgroundMusic.currentTime = 0;
    currentBackgroundMusic = null;
  }
};

const setBackgroundMusicVolume = (volume: number) => {
  if (lobbyMusic) lobbyMusic.volume = volume;
  if (playMusic) playMusic.volume = volume;
};

const toggleBackgroundMusic = (isPlaying: boolean, gameState: 'mode-selection' | 'continent-selection' | 'playing' | 'finished') => {
  if (isPlaying) {
    const musicType = gameState === 'playing' ? 'play' : 'lobby';
    startBackgroundMusic(musicType);
  } else {
    stopBackgroundMusic();
  }
};

const playSound = (sound: SoundType) => {
  try {
    const config = SOUND_CONFIGS[sound];
    
    // 승리 사운드는 특별한 멜로디로 재생
    if (sound === 'win') {
      const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
      notes.forEach((frequency, index) => {
        setTimeout(() => {
          createSound(frequency, 0.2);
        }, index * 150);
      });
    } else {
      createSound(config.frequency, config.duration);
    }
  } catch (e) {
    console.warn(`Could not play sound ${sound}:`, e.message);
    // Web Audio API가 지원되지 않는 경우 사용자에게 알림
    if (e.name === 'NotSupportedError') {
      console.info('Web Audio API not supported in this browser');
    }
  }
};

export default function App() {
  const [gameState, setGameState] = useState<'mode-selection' | 'continent-selection' | 'playing' | 'finished'>('mode-selection');
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [selectedContinents, setSelectedContinents] = useState<Set<Continent>>(new Set());
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isMusicPlaying, setIsMusicPlaying] = useState(true); // 기본값을 음악 재생으로 변경
  const [musicVolume, setMusicVolume] = useState(0.3);
  const [gameStartTime, setGameStartTime] = useState<Date | null>(null);
  const [gameEndTime, setGameEndTime] = useState<Date | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const handleSelectMode = useCallback((mode: GameMode) => {
    playSound('click');
    setGameMode(mode);
    setGameState('continent-selection');
  }, []);

  const handleToggleContinent = useCallback((continent: Continent) => {
    playSound('click');
    setSelectedContinents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(continent)) {
        newSet.delete(continent);
      } else {
        newSet.add(continent);
      }
      return newSet;
    });
  }, []);
  
  const handleSelectAllContinents = useCallback(() => {
    playSound('click');
    if(selectedContinents.size === Object.keys(Continent).length) {
      setSelectedContinents(new Set());
    } else {
      setSelectedContinents(new Set(Object.values(Continent)));
    }
  }, [selectedContinents.size]);

  const filteredCountries = useMemo(() => {
    if (selectedContinents.size === 0) return [];
    return COUNTRIES.filter(country => selectedContinents.has(country.continent));
  }, [selectedContinents]);

  const handleStartGame = useCallback(() => {
    playSound('click');
    if (filteredCountries.length < MIN_COUNTRIES_FOR_GAME) {
      alert(`게임을 시작하려면 최소 ${MIN_COUNTRIES_FOR_GAME}개 국가가 필요합니다. 대륙을 더 선택해주세요.`);
      return;
    }

    if (!gameMode) {
      alert('게임 모드를 선택해주세요.');
      return;
    }

    const shuffledCountries = shuffleArray(filteredCountries);
    const gameQuestions: Question[] = shuffledCountries.slice(0, TOTAL_QUESTIONS).map((correctCountry) => {
      const distractors = shuffleArray(
        filteredCountries.filter(c => c.code !== correctCountry.code)
      ).slice(0, 3);
      
      if (gameMode === GameMode.FLAG_TO_COUNTRY) {
        // 국기 → 나라 이름 모드
        const options = shuffleArray([...distractors, correctCountry]).map(c => ({ 
          name: c.name, 
          code: c.code 
        }));

        return {
          flagUrl: `https://flagcdn.com/w320/${correctCountry.code}.png`,
          options: options,
          correctAnswerCode: correctCountry.code,
          mode: gameMode,
        };
      } else {
        // 나라 이름 → 수도 모드
        const options = shuffleArray([...distractors, correctCountry]).map(c => ({ 
          name: c.capital, 
          code: c.code 
        }));

        return {
          countryName: correctCountry.name,
          options: options,
          correctAnswerCode: correctCountry.code,
          mode: gameMode,
        };
      }
    });
    
    if(gameQuestions.length < 1){
      alert(`선택한 대륙에 국가가 충분하지 않습니다. 다른 대륙을 선택해주세요.`);
      return;
    }

    setQuestions(gameQuestions);
    setCurrentQuestionIndex(0);
    setScore(0);
    setGameStartTime(new Date()); // 게임 시작 시간 기록
    setGameState('playing');
  }, [filteredCountries, gameMode]);
  
  const handleAnswer = useCallback((selectedCode: string) => {
    const isCorrect = selectedCode === questions[currentQuestionIndex].correctAnswerCode;
    if (isCorrect) {
      playSound('correct');
      setScore(prev => prev + 1);
    } else {
      playSound('incorrect');
    }
    
    const isLastQuestion = currentQuestionIndex === questions.length - 1;
    setTimeout(() => {
      if (isLastQuestion) {
        setGameEndTime(new Date()); // 게임 종료 시간 기록
        setGameState('finished');
      } else {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    }, 1500);
  }, [currentQuestionIndex, questions]);

  const handleRestart = useCallback(() => {
    playSound('click');
    setGameState('mode-selection');
    setGameMode(null);
    setSelectedContinents(new Set());
    setQuestions([]);
    setGameStartTime(null);
    setGameEndTime(null);
  }, []);

  const handleMusicToggle = useCallback(() => {
    const newMusicState = !isMusicPlaying;
    setIsMusicPlaying(newMusicState);
    toggleBackgroundMusic(newMusicState, gameState);
    playSound('click');
  }, [isMusicPlaying, gameState]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setMusicVolume(newVolume);
    setBackgroundMusicVolume(newVolume);
  }, []);

  const handleShowLeaderboard = useCallback(() => {
    setShowLeaderboard(true);
    playSound('click');
  }, []);

  const handleCloseLeaderboard = useCallback(() => {
    setShowLeaderboard(false);
    playSound('click');
  }, []);

  // 앱 시작 시 음악 자동 시작
  React.useEffect(() => {
    if (isMusicPlaying) {
      // 사용자 상호작용이 필요한 브라우저 정책으로 인해 첫 클릭 후 시작
      const startInitialMusic = () => {
        toggleBackgroundMusic(true, gameState);
        document.removeEventListener('click', startInitialMusic);
      };
      document.addEventListener('click', startInitialMusic);
      
      return () => {
        document.removeEventListener('click', startInitialMusic);
      };
    }
  }, []); // 컴포넌트 마운트 시에만 실행

  // 게임 상태 변화 시 음악 전환
  React.useEffect(() => {
    if (isMusicPlaying) {
      toggleBackgroundMusic(true, gameState);
    }
  }, [gameState, isMusicPlaying]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 font-sans">
      {/* 음악 컨트롤 대시보드 */}
      <div className="fixed top-4 right-4 z-10 bg-slate-800 rounded-lg p-4 shadow-xl border border-slate-700">
        <div className="flex items-center space-x-4">
          {/* 음악 토글 버튼 */}
          <button
            onClick={handleMusicToggle}
            className={`p-2 rounded-full transition-all duration-300 ${
              isMusicPlaying 
                ? 'bg-cyan-500 text-white hover:bg-cyan-600' 
                : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
            }`}
            title={isMusicPlaying ? "배경음악 끄기" : "배경음악 켜기"}
          >
            {isMusicPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.5 13.5H2a1 1 0 01-1-1v-5a1 1 0 011-1h2.5l3.883-3.316a1 1 0 011.617.816zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.5 13.5H2a1 1 0 01-1-1v-5a1 1 0 011-1h2.5l3.883-3.316a1 1 0 011.617.816zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          
          {/* 볼륨 컨트롤 */}
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.816L4.5 13.5H2a1 1 0 01-1-1v-5a1 1 0 011-1h2.5l3.883-3.316a1 1 0 011.617.816z" clipRule="evenodd" />
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={musicVolume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-20 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${musicVolume * 100}%, #475569 ${musicVolume * 100}%, #475569 100%)`
              }}
            />
            <span className="text-xs text-slate-400 w-8 text-center">
              {Math.round(musicVolume * 100)}
            </span>
          </div>
          
          {/* 현재 재생 중인 음악 표시 */}
          {isMusicPlaying && (
            <div className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
              {gameState === 'playing' ? '🎵 Play' : '🎵 Lobby'}
            </div>
          )}
        </div>
      </div>
      
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-cyan-400">
          Global Flag Master Quiz
        </h1>
        <p className="text-slate-400 mt-2 text-lg">국기 지식을 테스트 해보세요!</p>
        
        {/* 리더보드 버튼 */}
        {(gameState === 'mode-selection' || gameState === 'continent-selection') && (
          <div className="mt-4">
            <button
              onClick={handleShowLeaderboard}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2 mx-auto"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>🏆 리더보드</span>
            </button>
          </div>
        )}
      </header>
      <main className="w-full max-w-4xl mx-auto">
        {gameState === 'mode-selection' && (
          <GameModeSelector
            onSelectMode={handleSelectMode}
            onShowLeaderboard={handleShowLeaderboard}
          />
        )}
        {gameState === 'continent-selection' && (
          <ContinentSelector
            selectedContinents={selectedContinents}
            onToggleContinent={handleToggleContinent}
            onStartGame={handleStartGame}
            onSelectAll={handleSelectAllContinents}
            canStart={filteredCountries.length >= MIN_COUNTRIES_FOR_GAME}
          />
        )}
        {gameState === 'playing' && questions.length > 0 && (
          <Game
            question={questions[currentQuestionIndex]}
            onAnswer={handleAnswer}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
            score={score}
          />
        )}
        {gameState === 'finished' && gameMode && (
          <ResultModal 
            score={score} 
            totalQuestions={questions.length}
            gameStartTime={gameStartTime}
            gameEndTime={gameEndTime}
            gameMode={gameMode}
            onRestart={handleRestart}
            playSound={() => playSound('win')}
          />
        )}
        
        {/* 리더보드 모달 */}
        {showLeaderboard && (
          <Leaderboard onClose={handleCloseLeaderboard} />
        )}
      </main>
    </div>
  );
}