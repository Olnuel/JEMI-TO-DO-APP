import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, Clock, Sparkles } from 'lucide-react';
import { Task, Category, Priority, EnergyLevel, RecurringType, Subtask } from '../types/todo';
import { playPop, playSparkle } from '../utils/soundEffects';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt'> & { id?: string }) => void;
  taskToEdit?: Task | null;
  categories: Category[];
  soundEnabled: boolean;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  taskToEdit,
  categories,
  soundEnabled,
}) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('daily');
  const [priority, setPriority] = useState<Priority>('important');
  const [energy, setEnergy] = useState<EnergyLevel>('flow');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [recurring, setRecurring] = useState<RecurringType>('none');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setNotes(taskToEdit.notes || '');
      setCategory(taskToEdit.category);
      setPriority(taskToEdit.priority);
      setEnergy(taskToEdit.energy);
      setDueDate(taskToEdit.dueDate || '');
      setDueTime(taskToEdit.dueTime || '');
      setRecurring(taskToEdit.recurring);
      setSubtasks(taskToEdit.subtasks || []);
      setTags(taskToEdit.tags || []);
      setIsPinned(taskToEdit.isPinned || false);
    } else {
      // Defaults for new task
      setTitle('');
      setNotes('');
      setCategory('daily');
      setPriority('important');
      setEnergy('flow');
      setDueDate(new Date().toISOString().split('T')[0]);
      setDueTime('');
      setRecurring('none');
      setSubtasks([]);
      setTags([]);
      setIsPinned(false);
    }
  }, [taskToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (!newSubtaskText.trim()) return;
    playPop(soundEnabled);
    setSubtasks([
      ...subtasks,
      {
        id: `st-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        text: newSubtaskText.trim(),
        completed: false,
      },
    ]);
    setNewSubtaskText('');
  };

  const handleRemoveSubtask = (id: string) => {
    playPop(soundEnabled);
    setSubtasks(subtasks.filter((st) => st.id !== id));
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/^#/, '');
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    playSparkle(soundEnabled);
    onSave({
      id: taskToEdit?.id,
      title: title.trim(),
      notes: notes.trim(),
      completed: taskToEdit ? taskToEdit.completed : false,
      completedAt: taskToEdit?.completedAt,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      priority,
      energy,
      category,
      isPinned,
      subtasks,
      recurring,
      tags,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pink-950/30 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white/95 rounded-3xl p-6 sm:p-7 shadow-2xl border border-pink-200/90 text-stone-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-pink-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎀</span>
            <h2 className="text-xl font-serif-chic font-bold text-rose-950">
              {taskToEdit ? 'Edit Sparkling Task' : 'Add a New Glam Task'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-pink-100 text-stone-400 hover:text-rose-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-rose-800 uppercase tracking-wider mb-1">
              Task Title ✨
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Order fresh pink peonies & matcha latte 💐"
              className="w-full px-4 py-2.5 rounded-2xl bg-pink-50/50 border border-pink-200 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white text-sm text-stone-800 placeholder:text-stone-400 font-medium transition-all"
            />
          </div>

          {/* Category Picker */}
          <div>
            <label className="block text-xs font-bold text-rose-800 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categories
                .filter((c) => c.id !== 'all')
                .map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      category === cat.id
                        ? 'bg-rose-500 text-white shadow-xs scale-102'
                        : 'bg-pink-50/80 hover:bg-pink-100 text-stone-700 border border-pink-200'
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
            </div>
          </div>

          {/* Priority & Energy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Priority */}
            <div>
              <label className="block text-xs font-bold text-rose-800 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 rounded-2xl bg-pink-50/50 border border-pink-200 focus:outline-none focus:ring-2 focus:ring-rose-400 text-xs text-stone-700 font-semibold"
              >
                <option value="urgent">🔥 Urgent & Glam</option>
                <option value="important">🎀 Cute & Important</option>
                <option value="soft">☁️ Soft & Flexible</option>
                <option value="chill">💤 Chill & Whenever</option>
              </select>
            </div>

            {/* Energy */}
            <div>
              <label className="block text-xs font-bold text-rose-800 uppercase tracking-wider mb-1">
                Energy Level
              </label>
              <select
                value={energy}
                onChange={(e) => setEnergy(e.target.value as EnergyLevel)}
                className="w-full px-3 py-2 rounded-2xl bg-pink-50/50 border border-pink-200 focus:outline-none focus:ring-2 focus:ring-rose-400 text-xs text-stone-700 font-semibold"
              >
                <option value="boss">⚡ High Energy (Girl Boss)</option>
                <option value="flow">🌸 Medium Energy (Flow)</option>
                <option value="cozy">🧋 Low Energy (Cozy & Soft)</option>
              </select>
            </div>
          </div>

          {/* Due Date & Time & Recurring */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-rose-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar size={12} /> Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl bg-pink-50/50 border border-pink-200 focus:outline-none focus:ring-2 focus:ring-rose-400 text-xs text-stone-700 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-rose-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Clock size={12} /> Due Time
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3 py-2 rounded-2xl bg-pink-50/50 border border-pink-200 focus:outline-none focus:ring-2 focus:ring-rose-400 text-xs text-stone-700 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-rose-800 uppercase tracking-wider mb-1">
                Routine / Recur
              </label>
              <select
                value={recurring}
                onChange={(e) => setRecurring(e.target.value as RecurringType)}
                className="w-full px-3 py-2 rounded-2xl bg-pink-50/50 border border-pink-200 focus:outline-none focus:ring-2 focus:ring-rose-400 text-xs text-stone-700 font-semibold"
              >
                <option value="none">One-time</option>
                <option value="daily">Daily Routine</option>
                <option value="weekly">Weekly Routine</option>
              </select>
            </div>
          </div>

          {/* Subtasks Builder */}
          <div>
            <label className="block text-xs font-bold text-rose-800 uppercase tracking-wider mb-1">
              Checklist / Subtasks ({subtasks.length})
            </label>
            <div className="space-y-1.5 mb-2 max-h-36 overflow-y-auto">
              {subtasks.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between gap-2 px-3 py-1.5 bg-pink-50/70 rounded-xl text-xs"
                >
                  <span className="text-stone-700 font-medium">• {st.text}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(st.id)}
                    className="text-stone-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="Add checklist step..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-pink-50/50 border border-pink-200 text-xs placeholder:text-stone-400"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 bg-pink-200 hover:bg-pink-300 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <Plus size={14} /> Add
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-rose-800 uppercase tracking-wider mb-1">
              Notes & Thoughts 📔
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add links, details, inspiration or cute reminders..."
              className="w-full px-4 py-2 rounded-2xl bg-pink-50/50 border border-pink-200 focus:outline-none focus:ring-2 focus:ring-rose-400 text-xs text-stone-700 placeholder:text-stone-400"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-rose-800 uppercase tracking-wider mb-1">
              Tags
            </label>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-md bg-pink-100 text-rose-700 text-xs font-semibold flex items-center gap-1"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-rose-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Type tag and press Enter (e.g. selfcare, study)..."
              className="w-full px-3 py-1.5 rounded-xl bg-pink-50/50 border border-pink-200 text-xs placeholder:text-stone-400"
            />
          </div>

          {/* Pin toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isPinned"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="w-4 h-4 rounded text-rose-500 focus:ring-rose-400 accent-rose-500"
            />
            <label htmlFor="isPinned" className="text-xs font-semibold text-rose-900 cursor-pointer">
              ⭐ Pin this task to the top of my list
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white font-bold text-sm shadow-md shadow-pink-300 hover:shadow-lg hover:shadow-pink-300 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <Sparkles size={16} />
              <span>{taskToEdit ? 'Save Changes ✨' : 'Add Sparkle to My Day 🎀'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
