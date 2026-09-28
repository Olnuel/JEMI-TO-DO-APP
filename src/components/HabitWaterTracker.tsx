import React, { useState } from 'react';
import { Plus, Trash2, Check, Flame, Droplets, Sparkles, Trophy } from 'lucide-react';
import { Habit } from '../types/todo';
import { playWaterDrop, playPop, playFairyChime } from '../utils/soundEffects';
import { fireGirlyConfetti } from '../utils/confetti';

interface HabitWaterTrackerProps {
  waterGlasses: number;
  onSetWaterGlasses: (count: number) => void;
  habits: Habit[];
  onToggleHabit: (id: string) => void;
  onAddHabit: (title: string, emoji: string) => void;
  onDeleteHabit: (id: string) => void;
  soundEnabled: boolean;
  onAddPetals: (amount: number) => void;
}

export const HabitWaterTracker: React.FC<HabitWaterTrackerProps> = ({
  waterGlasses,
  onSetWaterGlasses,
  habits,
  onToggleHabit,
  onAddHabit,
  onDeleteHabit,
  soundEnabled,
  onAddPetals,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newEmoji, setNewEmoji] = useState('🌸');
  const [showAddForm, setShowAddForm] = useState(false);

  const maxWater = 8;

  const handleGlassClick = (index: number) => {
    playWaterDrop(soundEnabled);
    let newCount = index + 1;
    if (newCount === waterGlasses) {
      newCount = index; // toggle off
    }
    onSetWaterGlasses(newCount);

    if (newCount === maxWater) {
      playFairyChime(soundEnabled);
      fireGirlyConfetti();
      onAddPetals(25);
    } else if (newCount > waterGlasses) {
      onAddPetals(5);
    }
  };

  const handleHabitToggle = (habit: Habit) => {
    if (!habit.completedToday) {
      playFairyChime(soundEnabled);
      onAddPetals(10);
    } else {
      playPop(soundEnabled);
    }
    onToggleHabit(habit.id);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    playPop(soundEnabled);
    onAddHabit(newTitle.trim(), newEmoji);
    setNewTitle('');
    setShowAddForm(false);
  };

  const completedHabitsCount = habits.filter((h) => h.completedToday).length;
  const habitPercent = habits.length > 0 ? Math.round((completedHabitsCount / habits.length) * 100) : 0;

  const emojiChoices = ['🌸', '🧴', '🧘‍♀️', '📖', '🍵', '🍋', '🎧', '🥑', '✨', '💤', '🍓', '🎀'];

  return (
    <div className="space-y-6">
      {/* Hydration Glow Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-pink-50 via-white to-sky-50 border border-pink-200/80 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl animate-bounce">💧</span>
              <h2 className="text-lg font-serif-chic font-bold text-rose-950">
                Daily Glow Hydration
              </h2>
            </div>
            <p className="text-xs text-rose-500 font-medium">
              8 glasses a day for radiant skin & crystal-clear energy ✨
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-rose-800 bg-rose-100/80 px-3 py-1 rounded-full border border-rose-200">
              {waterGlasses} / {maxWater} Glasses ({Math.round((waterGlasses / maxWater) * 100)}%)
            </span>
          </div>
        </div>

        {/* 8 Interactive Glass Cups */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 py-2">
          {Array.from({ length: maxWater }).map((_, idx) => {
            const isFilled = idx < waterGlasses;
            return (
              <button
                key={idx}
                onClick={() => handleGlassClick(idx)}
                className={`group flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                  isFilled
                    ? 'bg-gradient-to-t from-sky-400 to-pink-300 border-pink-300 text-white shadow-md shadow-pink-200/50 scale-102'
                    : 'bg-white/80 border-pink-200 text-stone-300 hover:border-pink-300 hover:bg-white'
                }`}
                title={`Glass #${idx + 1}`}
              >
                <Droplets
                  size={24}
                  className={`transition-all duration-300 ${
                    isFilled ? 'fill-white stroke-white animate-pulse' : 'stroke-pink-300 group-hover:scale-110'
                  }`}
                />
                <span
                  className={`text-[10px] font-bold mt-1 ${
                    isFilled ? 'text-white' : 'text-stone-400'
                  }`}
                >
                  #{idx + 1}
                </span>
              </button>
            );
          })}
        </div>

        {waterGlasses === maxWater && (
          <div className="mt-3 p-2.5 rounded-xl bg-gradient-to-r from-pink-100 to-rose-100 border border-pink-300 flex items-center justify-center gap-2 text-xs font-bold text-rose-800 animate-bounce">
            <Trophy size={16} className="text-amber-500" />
            <span>Hydration Goal Smashed! You're glowing like a princess! 🌸✨ (+25 Petals)</span>
          </div>
        )}
      </div>

      {/* Daily Habits & Glow Streaks Card */}
      <div className="p-6 rounded-3xl bg-white/85 border border-pink-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-pink-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🩰</span>
              <h2 className="text-lg font-serif-chic font-bold text-rose-950">
                Daily Glow Habits
              </h2>
            </div>
            <p className="text-xs text-rose-400 font-medium">
              Consistency is your secret superpower, sweetie 💖
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Progress Pill */}
            <div className="text-xs font-bold text-rose-700 bg-pink-50 px-3 py-1 rounded-full border border-pink-200">
              {completedHabitsCount} of {habits.length} Complete ({habitPercent}%)
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
            >
              <Plus size={14} />
              <span>New Habit</span>
            </button>
          </div>
        </div>

        {/* Habit Progress Bar */}
        <div className="w-full h-2 bg-pink-100 rounded-full my-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-400 via-rose-400 to-purple-400 rounded-full transition-all duration-500"
            style={{ width: `${habitPercent}%` }}
          />
        </div>

        {/* Add Habit Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddSubmit}
            className="mb-5 p-4 rounded-2xl bg-pink-50/70 border border-pink-200 space-y-3 animate-in fade-in duration-200"
          >
            <div className="flex items-center gap-2">
              <select
                value={newEmoji}
                onChange={(e) => setNewEmoji(e.target.value)}
                className="px-2 py-1.5 rounded-xl bg-white border border-pink-200 text-base"
              >
                {emojiChoices.map((em) => (
                  <option key={em} value={em}>
                    {em}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Habit title (e.g. Gua Sha, 15 min Pilates, Read)..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-pink-200 text-xs font-medium text-stone-800 placeholder:text-stone-400"
                required
              />

              <button
                type="submit"
                className="px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all"
              >
                Add Habit
              </button>
            </div>
          </form>
        )}

        {/* Habits List */}
        <div className="space-y-2.5">
          {habits.map((h) => (
            <div
              key={h.id}
              className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                h.completedToday
                  ? 'bg-rose-50/60 border-rose-200/60'
                  : 'bg-white hover:bg-pink-50/40 border-pink-100 hover:border-pink-200'
              }`}
            >
              <div
                onClick={() => handleHabitToggle(h)}
                className="flex items-center gap-3 cursor-pointer flex-1"
              >
                <div
                  className={`w-6 h-6 rounded-xl border flex items-center justify-center transition-all ${
                    h.completedToday
                      ? 'bg-gradient-to-tr from-pink-400 to-rose-500 border-rose-400 text-white shadow-2xs'
                      : 'border-pink-300 hover:border-rose-400 text-transparent'
                  }`}
                >
                  <Check size={14} strokeWidth={3} />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xl">{h.emoji}</span>
                  <span
                    className={`text-sm font-semibold transition-colors ${
                      h.completedToday ? 'line-through text-stone-400' : 'text-stone-800'
                    }`}
                  >
                    {h.title}
                  </span>
                </div>
              </div>

              {/* Streak Badge & Delete */}
              <div className="flex items-center gap-3">
                <span
                  className="flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200"
                  title={`${h.streak} day streak!`}
                >
                  <Flame size={12} className="text-orange-500 fill-orange-500" />
                  <span>{h.streak}d</span>
                </span>

                <button
                  onClick={() => onDeleteHabit(h.id)}
                  className="p-1 rounded-lg text-stone-300 hover:text-rose-600 transition-colors"
                  title="Remove habit"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
