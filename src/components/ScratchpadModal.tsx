import React from 'react';
import { X, Sparkles, Save, Heart } from 'lucide-react';
import { playPop, playSparkle } from '../utils/soundEffects';

interface ScratchpadModalProps {
  isOpen: boolean;
  onClose: () => void;
  scratchpad: string;
  onSaveScratchpad: (content: string) => void;
  soundEnabled: boolean;
}

export const ScratchpadModal: React.FC<ScratchpadModalProps> = ({
  isOpen,
  onClose,
  scratchpad,
  onSaveScratchpad,
  soundEnabled,
}) => {
  const [content, setContent] = React.useState(scratchpad);
  const [savedNotice, setSavedNotice] = React.useState(false);

  React.useEffect(() => {
    setContent(scratchpad);
  }, [scratchpad, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    playSparkle(soundEnabled);
    onSaveScratchpad(content);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pink-950/30 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-pink-50/95 rounded-3xl p-6 sm:p-7 shadow-2xl border-2 border-pink-200 text-stone-800 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-pink-200/80">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📔</span>
            <div>
              <h2 className="text-lg font-serif-chic font-bold text-rose-950">
                Pink Brain Dump & Scratchpad
              </h2>
              <p className="text-[11px] text-rose-400 font-medium">
                Jot down sudden thoughts, aesthetic wishlists, and cute reminders ✨
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

        {/* Notebook Body with lined aesthetic */}
        <div className="mt-4 flex-1 flex flex-col">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your dreams, wishlist items, grocery list, or secret thoughts..."
            rows={12}
            className="w-full flex-1 p-4 rounded-2xl bg-white/90 border border-pink-200 text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-300 font-sans leading-relaxed resize-none shadow-inner"
          />
        </div>

        {/* Footer with Actions */}
        <div className="mt-4 pt-3 border-t border-pink-200/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium">
            <Heart size={14} className="fill-rose-400 text-rose-400" />
            <span>{savedNotice ? 'Saved with love! 💖' : 'Auto-saves to your local storage'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Save size={14} />
              <span>Save Notes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
