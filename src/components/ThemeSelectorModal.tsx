import React from 'react';
import { X, Check, Sparkles } from 'lucide-react';
import { THEMES, ThemeConfig } from '../types/theme';
import { playPop, playSparkle } from '../utils/soundEffects';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentThemeId: string;
  onSelectTheme: (themeId: string) => void;
  soundEnabled: boolean;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose,
  currentThemeId,
  onSelectTheme,
  soundEnabled,
}) => {
  if (!isOpen) return null;

  const handleSelect = (id: string) => {
    playSparkle(soundEnabled);
    onSelectTheme(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pink-950/30 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white/95 rounded-3xl p-6 sm:p-7 shadow-2xl border border-pink-200 text-stone-800 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-pink-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎨</span>
            <div>
              <h2 className="text-xl font-serif-chic font-bold text-rose-950">
                Choose Your Aesthetic Vibe
              </h2>
              <p className="text-xs text-rose-400 font-medium">
                Customize colors, fonts, and energy to match your daily mood ✨
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playPop(soundEnabled);
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-pink-100 text-stone-400 hover:text-rose-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Theme Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-5">
          {Object.values(THEMES).map((theme: ThemeConfig) => {
            const isSelected = currentThemeId === theme.id;
            return (
              <div
                key={theme.id}
                onClick={() => handleSelect(theme.id)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'border-rose-400 shadow-md scale-102 ring-2 ring-rose-200'
                    : 'border-pink-100 hover:border-pink-300 hover:scale-101'
                } ${theme.bgGradient}`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs">
                    <Check size={14} strokeWidth={3} />
                  </div>
                )}

                <div>
                  <div className="text-3xl mb-2">{theme.icon}</div>
                  <h3 className="text-base font-bold font-serif-chic text-stone-900">
                    {theme.name}
                  </h3>
                  <p className="text-xs text-stone-600 mt-0.5 font-medium">
                    {theme.tagline}
                  </p>
                </div>

                {/* Mini Palette Swatch */}
                <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-black/5">
                  <div className="w-5 h-5 rounded-full bg-pink-300 border border-white shadow-2xs" />
                  <div className="w-5 h-5 rounded-full bg-rose-400 border border-white shadow-2xs" />
                  <div className="w-5 h-5 rounded-full bg-purple-200 border border-white shadow-2xs" />
                  <div className="w-5 h-5 rounded-full bg-amber-100 border border-white shadow-2xs" />
                  <span className="text-[10px] font-bold text-stone-500 ml-auto uppercase tracking-wider">
                    {isSelected ? 'Active ✨' : 'Select'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Close Button */}
        <div className="mt-6 pt-3 border-t border-pink-100 flex justify-end">
          <button
            onClick={() => {
              playPop(soundEnabled);
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-sm transition-all"
          >
            Apply & Close 🎀
          </button>
        </div>
      </div>
    </div>
  );
};
