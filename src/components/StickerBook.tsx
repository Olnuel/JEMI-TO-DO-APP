import React, { useState } from 'react';
import { Lock, Sparkles, Award, RotateCcw, Heart } from 'lucide-react';
import { ALL_STICKERS } from '../constants/stickers';
import { playFairyChime, playPop } from '../utils/soundEffects';

interface StickerBookProps {
  petals: number;
  soundEnabled: boolean;
}

interface PlacedSticker {
  id: string;
  emoji: string;
  x: number;
  y: number;
  rotation: number;
}

export const StickerBook: React.FC<StickerBookProps> = ({ petals, soundEnabled }) => {
  const [boardStickers, setBoardStickers] = useState<PlacedSticker[]>([
    { id: 'ps-1', emoji: '🎀', x: 25, y: 30, rotation: -8 },
    { id: 'ps-2', emoji: '🩰', x: 70, y: 40, rotation: 12 },
    { id: 'ps-3', emoji: '🍓', x: 45, y: 65, rotation: 5 },
  ]);

  const stickers = ALL_STICKERS.map((s) => ({
    ...s,
    unlocked: petals >= s.requiredPetals,
  }));

  const nextSticker = stickers.find((s) => !s.unlocked);

  const handleStampSticker = (emoji: string, unlocked: boolean) => {
    if (!unlocked) {
      playPop(soundEnabled);
      return;
    }
    playFairyChime(soundEnabled);

    // Random placement within safe area (15% to 80%)
    const randomX = Math.floor(Math.random() * 65) + 15;
    const randomY = Math.floor(Math.random() * 60) + 20;
    const randomRot = Math.floor(Math.random() * 30) - 15;

    setBoardStickers((prev) => [
      ...prev,
      {
        id: `stk-${Date.now()}-${Math.random()}`,
        emoji,
        x: randomX,
        y: randomY,
        rotation: randomRot,
      },
    ]);
  };

  const clearBoard = () => {
    playPop(soundEnabled);
    setBoardStickers([]);
  };

  return (
    <div className="space-y-6">
      {/* Header & Petals Progress */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-pink-100/90 via-rose-50 to-purple-100/90 border border-pink-200/90 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-spin" style={{ animationDuration: '6s' }}>🌸</span>
              <h2 className="text-xl font-serif-chic font-bold text-rose-950">
                Chérie Sticker Book & Rewards
              </h2>
            </div>
            <p className="text-xs text-rose-500 font-medium mt-1">
              Earn petals by checking off to-dos, drinking water, and completing focus sessions!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-4 py-2 rounded-2xl bg-white/90 border border-pink-200 shadow-2xs flex items-center gap-2 font-bold text-rose-900 text-sm">
              <Award size={18} className="text-amber-500" />
              <span>{petals} Petals Collected</span>
            </div>
          </div>
        </div>

        {/* Next Unlock Progress */}
        {nextSticker ? (
          <div className="mt-4 pt-3 border-t border-pink-200/60">
            <div className="flex items-center justify-between text-xs font-semibold text-rose-800 mb-1.5">
              <span>Next Reward: {nextSticker.emoji} {nextSticker.name}</span>
              <span>{petals} / {nextSticker.requiredPetals} petals</span>
            </div>
            <div className="w-full h-2 bg-white/80 rounded-full overflow-hidden border border-pink-200">
              <div
                className="h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.round((petals / nextSticker.requiredPetals) * 100))}%`,
                }}
              />
            </div>
          </div>
        ) : (
          <div className="mt-3 text-xs font-bold text-rose-700 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" />
            <span>You have unlocked every single cute sticker in the collection! You are royalty! 👑</span>
          </div>
        )}
      </div>

      {/* Interactive Sticker Mood Board Canvas */}
      <div className="p-6 rounded-3xl bg-white/90 border border-pink-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-rose-950 flex items-center gap-1.5">
              <Heart size={14} className="fill-rose-400 text-rose-400" />
              <span>Your Aesthetic Sticker Mood Board</span>
            </h3>
            <p className="text-[11px] text-stone-500">
              Click any unlocked sticker below to stamp it onto your pinboard!
            </p>
          </div>
          <button
            onClick={clearBoard}
            className="text-xs text-rose-400 hover:text-rose-600 flex items-center gap-1 transition-colors font-medium"
          >
            <RotateCcw size={12} /> Clear Board
          </button>
        </div>

        {/* Pinboard Area */}
        <div className="relative w-full h-64 sm:h-72 rounded-2xl bg-gradient-to-br from-pink-50/60 via-rose-50/30 to-purple-50/50 border-2 border-dashed border-pink-200/90 overflow-hidden shadow-inner flex items-center justify-center">
          {boardStickers.length === 0 ? (
            <div className="text-center text-rose-300 pointer-events-none">
              <span className="text-4xl block mb-2 opacity-50">✨</span>
              <p className="text-xs font-medium">Tap your unlocked stickers below to decorate your dream board!</p>
            </div>
          ) : (
            boardStickers.map((item) => (
              <div
                key={item.id}
                style={{
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  transform: `translate(-50%, -50%) rotate(${item.rotation}deg)`,
                }}
                className="absolute text-4xl sm:text-5xl select-none cursor-pointer hover:scale-125 transition-transform drop-shadow-md animate-bounce"
                title="Sticker stamped on board"
              >
                {item.emoji}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Stickers Showcase Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        {stickers.map((s) => (
          <div
            key={s.id}
            onClick={() => handleStampSticker(s.emoji, s.unlocked)}
            className={`p-4 rounded-3xl border transition-all text-center flex flex-col items-center justify-between cursor-pointer ${
              s.unlocked
                ? 'bg-white/95 border-pink-200/90 hover:border-pink-400 shadow-xs hover:shadow-md hover:scale-103'
                : 'bg-stone-50/70 border-stone-200/70 opacity-60'
            }`}
          >
            <div className="relative mb-2">
              <div
                className={`text-4xl sm:text-5xl transition-transform ${
                  s.unlocked ? 'hover:rotate-12' : 'grayscale'
                }`}
              >
                {s.emoji}
              </div>
              {!s.unlocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/40 rounded-full">
                  <Lock size={16} className="text-stone-600" />
                </div>
              )}
            </div>

            <h4 className="text-xs font-bold text-stone-800 leading-snug">
              {s.name}
            </h4>

            <p className="text-[10px] text-stone-500 mt-1 line-clamp-2">
              {s.description}
            </p>

            <div className="mt-3 w-full">
              {s.unlocked ? (
                <span className="inline-block w-full py-1 rounded-xl bg-pink-100 text-rose-700 text-[10px] font-bold">
                  Stamp to Board 🎀
                </span>
              ) : (
                <span className="inline-block w-full py-1 rounded-xl bg-stone-100 text-stone-500 text-[10px] font-semibold">
                  {s.requiredPetals} Petals
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
