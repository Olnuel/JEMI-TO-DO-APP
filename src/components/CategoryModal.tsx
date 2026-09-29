import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Category } from '../types/todo';
import { playPop, playSparkle } from '../utils/soundEffects';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  soundEnabled: boolean;
}

const EMOJI_OPTIONS = [
  '🎀', '🌸', '💄', '📚', '💼', '🛍️', '✈️', '💪', '🍰', '👯‍♀️',
  '🏡', '💰', '🎨', '🌿', '✨', '👗', '🎵', '📖', '✍️', '📸',
  '🌱', '🐾', '💝', '🔮', '💻', '🧹', '🎁', '🎉', '💕', '🌅',
  '🌙', '🌈', '🚨', '🌟', '🎓', '💎', '🩷', '🙏', '⭐', '❄️',
  '🎄', '🏋️‍♀️', '🥗', '📋', '📞', '📱', '💡', '🛒', '🏦', '📈',
  '🤝', '🎤', '🎬', '🎮', '🍥', '🍿', '🎧', '🧶', '🧁', '☕',
  '🍵', '🥞', '🍽️', '🍜', '🧋', '🍩', '🍷', '🍸', '🧘‍♀️', '💆‍♀️',
  '💇‍♀️', '💋', '👠', '👡', '👜', '💍', '🕯️', '💐', '🛋️', '🗂️',
  '🧘', '🌍', '♻️', '🌲', '🏕️', '🚗', '🗺️', '🏖️', '⛰️', '🌊',
  '🎢', '🎪', '🎭', '🎺', '🎸', '🎹', '🎙️', '🎼', '🎻', '🥁',
  '🏀', '⚽', '🏈', '🎾', '⛳', '🎳', '🏹', '🥊', '🥋', '🤸',
  '🏃‍♀️', '🏊‍♀️', '🚴‍♀️', '🏄‍♀️', '⛵', '🎣', '🐴', '🦁', '🦒', '🐠',
  '🌺', '🌳', '🛝', '🐕', '🐈', '🐰', '🐹', '🦔', '🦅', '🦋',
  '🐝', '🍂', '☀️', '🌧️', '⛄', '🌷', '🍁', '🎆', '🎃', '🦃',
  '🐣', '💑', '👰', '👶', '🎓', '💃', '🏫', '🎊', '👋', '🎈',
  '🏠', '🍖', '🧺', '🏝️', '🚢', '🏨', '⛺', '🚐', '🎒', '🥾',
  '🧗', '🪂', '🎈', '🚁', '🤿', '🏄', '🛶', '🚣', '🐫', '🐘',
  '🏞️', '🎡', '🍺', '🥃', '🥐', '🍦', '🍫', '🍬', '🏛️', '🔬',
  '🌌', '🔭', '🖼️', '🎨', '✏️', '🏺', '🗿', '🪵', '🧵', '💍',
  '🕯️', '🧼', '🛁', '💄', '🧴', '🪴', '🌵', '🌳', '🌹', '💜',
  '🌼', '🍋', '🌿', '🫚', '🧄', '🧅', '🍅', '🌶️', '🥒', '🥬',
  '🥦', '🥕', '🥔', '🍠', '🌽', '🫘', '🥛', '🍌', '🍎', '🍐',
  '🍑', '🍒', '🍓', '🫐', '🍇', '🥑', '🥥', '🥭', '🍍', '🥝',
  '🍊', '🍋', '🥭', '🍈', '🍉', '🍏', '🍐', '🍑', '🍒', '🍓',
];

const COLOR_OPTIONS = [
  'pink', 'rose', 'fuchsia', 'purple', 'violet', 'indigo', 'blue',
  'sky', 'cyan', 'teal', 'emerald', 'green', 'lime', 'yellow',
  'amber', 'orange', 'red', 'stone', 'slate', 'brown',
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onDeleteCategory,
  soundEnabled,
}) => {
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('🎀');
  const [newColor, setNewColor] = useState('pink');

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!newName.trim()) return;
    playSparkle(soundEnabled);
    const category: Category = {
      id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: newName.trim(),
      emoji: newEmoji,
      color: newColor,
    };
    onAddCategory(category);
    setNewName('');
    setNewEmoji('🎀');
    setNewColor('pink');
  };

  const handleDelete = (id: string) => {
    if (id === 'all') return;
    playPop(soundEnabled);
    onDeleteCategory(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pink-950/30 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white/95 rounded-3xl p-6 sm:p-7 shadow-2xl border border-pink-200/90 text-stone-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-pink-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🗂️</span>
            <h2 className="text-xl font-serif-chic font-bold text-rose-950">
              Manage Categories
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-pink-100 text-stone-400 hover:text-rose-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Add New Category Form */}
        <div className="mt-4 p-4 rounded-2xl bg-pink-50/60 border border-pink-200/80 space-y-3">
          <h3 className="text-xs font-bold text-rose-800 uppercase tracking-wider">
            Create New Category ✨
          </h3>

          {/* Name Input */}
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Category name (e.g. Yoga, Work, Pets...)"
            className="w-full px-4 py-2.5 rounded-2xl bg-white border border-pink-200 focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm text-stone-800 placeholder:text-stone-400 font-medium"
          />

          {/* Emoji Picker */}
          <div>
            <label className="block text-[11px] font-bold text-rose-800 uppercase tracking-wider mb-1.5">
              Choose Emoji
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 rounded-xl bg-white border border-pink-200">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setNewEmoji(emoji)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${
                    newEmoji === emoji
                      ? 'bg-rose-500 shadow-sm scale-110'
                      : 'hover:bg-pink-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-[11px] font-bold text-rose-800 uppercase tracking-wider mb-1.5">
              Choose Color
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewColor(color)}
                  className={`w-7 h-7 rounded-full transition-all ${
                    newColor === color
                      ? 'ring-2 ring-offset-2 ring-rose-500 scale-110'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: `var(--color-${color}-400, #f472b6)` }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Add Button */}
          <button
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white font-bold text-sm shadow-md shadow-pink-300 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Plus size={16} strokeWidth={3} />
            <span>Add Category 🎀</span>
          </button>
        </div>

        {/* Existing Categories List */}
        <div className="mt-4">
          <h3 className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-2">
            Your Categories ({categories.length})
          </h3>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-white border border-pink-200/80"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cat.emoji}</span>
                  <span className="text-sm font-medium text-stone-700">{cat.name}</span>
                </div>
                {cat.id !== 'all' && (
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-pink-100 transition-colors"
                    title="Delete category"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
