import React, { useState } from 'react';
import { Sparkles, RefreshCw, Heart } from 'lucide-react';
import { AFFIRMATIONS } from '../constants/affirmations';
import { MoodType } from '../types/todo';
import { playSparkle, playPop } from '../utils/soundEffects';

interface AffirmationBannerProps {
  currentMood: MoodType | null;
  onSelectMood: (mood: MoodType) => void;
  soundEnabled: boolean;
}

export const AffirmationBanner: React.FC<AffirmationBannerProps> = ({
  currentMood,
  onSelectMood,
  soundEnabled,
}) => {
  const [index, setIndex] = useState(0);

  const nextAffirmation = () => {
    playSparkle(soundEnabled);
    setIndex((prev) => (prev + 1) % AFFIRMATIONS.length);
  };

  const handleMood = (mood: MoodType) => {
    playPop(soundEnabled);
    onSelectMood(mood);
  };

  const current = AFFIRMATIONS[index];

  const moods: { type: MoodType; label: string; emoji: string }[] = [
    { type: 'adorable', label: 'Feeling Adorable', emoji: '🎀' },
    { type: 'girlboss', label: 'Girl Boss Mode', emoji: '💅' },
    { type: 'peaceful', label: 'Soft & Peaceful', emoji: '🌸' },
    { type: 'cozy', label: 'Cozy & Gentle', emoji: '🧸' },
    { type: 'sleepy', label: 'Sleepy Angel', emoji: '💤' },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-pink-100/90 via-rose-50/80 to-purple-100/90 border border-pink-200/80 shadow-sm backdrop-blur-md transition-all">
      {/* Decorative cute background elements */}
      <div className="absolute -right-4 -bottom-4 text-7xl opacity-15 select-none pointer-events-none">
        🎀
      </div>
      <div className="absolute top-2 right-12 text-3xl opacity-20 select-none pointer-events-none animate-pulse">
        ✨
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Affirmation Text */}
        <div className="flex-1">
          <div className="flex items-center gap-2 text-rose-500 font-semibold text-xs uppercase tracking-wider mb-1.5">
            <Sparkles size={14} className="text-pink-500 animate-spin" style={{ animationDuration: '8s' }} />
            <span>Daily Glow Affirmation</span>
            <button
              onClick={nextAffirmation}
              className="p-1 rounded-full hover:bg-pink-200/60 text-rose-600 transition-colors"
              title="Next affirmation"
              aria-label="New affirmation"
            >
              <RefreshCw size={12} />
            </button>
          </div>
          <p className="text-base sm:text-lg font-serif-chic italic text-rose-950 font-medium leading-relaxed">
            "{current.text}" <span className="inline-block animate-bounce">{current.emoji}</span>
          </p>
        </div>

        {/* Mood Check-In Selector */}
        <div className="flex flex-col sm:items-end w-full md:w-auto">
          <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Heart size={11} className="fill-rose-400" /> Today's Mood Check-In
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {moods.map((m) => {
              const isActive = currentMood === m.type;
              return (
                <button
                  key={m.type}
                  onClick={() => handleMood(m.type)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
                    isActive
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-300 scale-105'
                      : 'bg-white/80 text-rose-800 hover:bg-white border border-pink-200 hover:scale-102'
                  }`}
                >
                  <span>{m.emoji}</span>
                  <span className="text-[11px]">{m.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
