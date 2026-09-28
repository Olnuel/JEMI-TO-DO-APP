import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, Coffee } from 'lucide-react';
import { playFairyChime, playPop, startAmbientRain, stopAmbientSound } from '../utils/soundEffects';
import { fireGirlyConfetti } from '../utils/confetti';

interface FocusTimerProps {
  soundEnabled: boolean;
  onAddPetals: (amount: number) => void;
}

type Mode = 'focus' | 'shortBreak' | 'longBreak';

const MODE_DURATIONS: Record<Mode, number> = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export const FocusTimer: React.FC<FocusTimerProps> = ({ soundEnabled, onAddPetals }) => {
  const [mode, setMode] = useState<Mode>('focus');
  const [timeLeft, setTimeLeft] = useState(MODE_DURATIONS.focus);
  const [isRunning, setIsRunning] = useState(false);
  const [ambientActive, setAmbientActive] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(2);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setTimeLeft(MODE_DURATIONS[mode]);
    setIsRunning(false);
  }, [mode]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode]);

  // Clean up ambient sound on unmount
  useEffect(() => {
    return () => {
      stopAmbientSound();
    };
  }, []);

  const handleComplete = () => {
    setIsRunning(false);
    playFairyChime(soundEnabled);
    fireGirlyConfetti();

    if (mode === 'focus') {
      setSessionsCompleted((prev) => prev + 1);
      onAddPetals(20);
      setMode('shortBreak');
    } else {
      setMode('focus');
    }
  };

  const toggleTimer = () => {
    playPop(soundEnabled);
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    playPop(soundEnabled);
    setIsRunning(false);
    setTimeLeft(MODE_DURATIONS[mode]);
  };

  const toggleAmbientSound = () => {
    if (ambientActive) {
      stopAmbientSound();
      setAmbientActive(false);
    } else {
      startAmbientRain(0.15);
      setAmbientActive(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDuration = MODE_DURATIONS[mode];
  const progressPercent = ((totalDuration - timeLeft) / totalDuration) * 100;

  return (
    <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-white/90 border border-pink-200/80 shadow-md backdrop-blur-md relative overflow-hidden text-center">
      {/* Background cute ornaments */}
      <div className="absolute top-4 left-6 text-2xl opacity-20 select-none animate-float-slow">
        🍓
      </div>
      <div className="absolute bottom-6 right-8 text-2xl opacity-20 select-none animate-pulse">
        ✨
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-100 text-rose-800 text-xs font-bold border border-pink-200 mb-2">
          <span>🫖</span>
          <span>Focus Tea Room</span>
        </div>
        <h2 className="text-2xl font-serif-chic font-bold text-rose-950">
          Chérie Aesthetic Pomodoro
        </h2>
        <p className="text-xs text-rose-400 font-medium mt-1">
          Slip into flow state with gentle ambient rain & delicious focus 🌸
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="inline-flex p-1 rounded-2xl bg-pink-100/70 border border-pink-200/60 mb-8">
        <button
          onClick={() => {
            playPop(soundEnabled);
            setMode('focus');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            mode === 'focus'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'text-stone-600 hover:text-rose-900'
          }`}
        >
          <span>🌸 25m Glow Focus</span>
        </button>
        <button
          onClick={() => {
            playPop(soundEnabled);
            setMode('shortBreak');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            mode === 'shortBreak'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'text-stone-600 hover:text-rose-900'
          }`}
        >
          <span>🍓 5m Strawberry Break</span>
        </button>
        <button
          onClick={() => {
            playPop(soundEnabled);
            setMode('longBreak');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            mode === 'longBreak'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'text-stone-600 hover:text-rose-900'
          }`}
        >
          <span>💅 15m Beauty Rest</span>
        </button>
      </div>

      {/* Circular Progress & Timer Display */}
      <div className="relative w-64 h-64 mx-auto flex items-center justify-center my-4">
        {/* SVG Ring */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            className="stroke-pink-100 fill-transparent"
            strokeWidth="5"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            className="stroke-rose-400 fill-transparent transition-all duration-1000 ease-linear"
            strokeWidth="5"
            strokeDasharray="264"
            strokeDashoffset={264 - (264 * progressPercent) / 100}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl mb-1 animate-bounce" style={{ animationDuration: '3s' }}>
            {mode === 'focus' ? '🫖' : mode === 'shortBreak' ? '🍓' : '🧖‍♀️'}
          </div>
          <div className="text-5xl font-bold font-serif-chic tracking-tight bg-gradient-to-r from-rose-700 to-pink-600 bg-clip-text text-transparent">
            {formatTime(timeLeft)}
          </div>
          <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-widest mt-1">
            {isRunning ? 'Flowing Gently...' : 'Paused'}
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={toggleTimer}
          className={`px-8 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200'
              : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-rose-300 scale-105'
          }`}
        >
          {isRunning ? <Pause size={18} /> : <Play size={18} />}
          <span>{isRunning ? 'Pause Flow' : 'Start Focus ✨'}</span>
        </button>

        <button
          onClick={resetTimer}
          className="p-3.5 rounded-2xl bg-pink-100 hover:bg-pink-200 text-rose-800 transition-colors"
          title="Reset timer"
          aria-label="Reset timer"
        >
          <RotateCcw size={18} />
        </button>

        <button
          onClick={toggleAmbientSound}
          className={`px-4 py-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
            ambientActive
              ? 'bg-purple-500 text-white shadow-md shadow-purple-200'
              : 'bg-pink-100 hover:bg-pink-200 text-rose-800'
          }`}
          title="Toggle cozy soothing rain white noise"
        >
          {ambientActive ? <Volume2 size={16} /> : <VolumeX size={16} />}
          <span className="hidden sm:inline">
            {ambientActive ? 'Rain Playing 🌧️' : 'Ambient Rain'}
          </span>
        </button>
      </div>

      {/* Footer Stats */}
      <div className="mt-8 pt-5 border-t border-pink-100 flex items-center justify-around text-xs text-rose-800">
        <div className="flex items-center gap-1.5 font-semibold">
          <Coffee size={14} className="text-amber-600" />
          <span>Completed Sessions: <strong>{sessionsCompleted}</strong> 🫖</span>
        </div>
        <div className="flex items-center gap-1.5 font-semibold">
          <Sparkles size={14} className="text-pink-500" />
          <span>Reward: <strong>+20 Petals</strong> per completed focus session</span>
        </div>
      </div>
    </div>
  );
};
