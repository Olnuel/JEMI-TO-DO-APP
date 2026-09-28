import React, { useState } from 'react';
import {
  Pin,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Check,
  Edit3,
  Copy,
  Trash2,
  Zap,
  Coffee,
  Sparkles,
} from 'lucide-react';
import { Task, Category } from '../types/todo';
import { playPop, playFairyChime } from '../utils/soundEffects';

interface TaskCardProps {
  task: Task;
  categories: Category[];
  onToggleComplete: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onTogglePin: (id: string) => void;
  onEdit: (task: Task) => void;
  onDuplicate: (task: Task) => void;
  onDelete: (id: string) => void;
  soundEnabled: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  categories,
  onToggleComplete,
  onToggleSubtask,
  onTogglePin,
  onEdit,
  onDuplicate,
  onDelete,
  soundEnabled,
}) => {
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const category = categories.find((c) => c.id === task.category) || {
    id: 'other',
    name: 'General',
    emoji: '🌸',
    color: 'pink',
  };

  const completedSubtasks = task.subtasks.filter((st) => st.completed).length;
  const totalSubtasks = task.subtasks.length;
  const progressPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const handleMainToggle = () => {
    if (!task.completed) {
      playFairyChime(soundEnabled);
    } else {
      playPop(soundEnabled);
    }
    onToggleComplete(task.id);
  };

  const handleSubtaskToggle = (subtaskId: string) => {
    playPop(soundEnabled);
    onToggleSubtask(task.id, subtaskId);
  };

  // Due date formatting
  const getDueBadge = () => {
    if (!task.dueDate) return null;
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = task.dueDate < today && !task.completed;
    const isToday = task.dueDate === today;

    let text = task.dueDate;
    if (isToday) text = 'Today';
    else if (
      task.dueDate ===
      new Date(Date.now() + 86400000).toISOString().split('T')[0]
    ) {
      text = 'Tomorrow';
    }

    if (task.dueTime) {
      text += ` • ${task.dueTime}`;
    }

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
          isOverdue
            ? 'bg-rose-100 text-rose-700 border border-rose-300'
            : isToday
            ? 'bg-amber-100 text-amber-800 border border-amber-300 font-bold'
            : 'bg-stone-100 text-stone-600 border border-stone-200'
        }`}
      >
        <Calendar size={11} />
        {text}
      </span>
    );
  };

  const getPriorityBadge = () => {
    switch (task.priority) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
            🔥 Urgent & Glam
          </span>
        );
      case 'important':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-pink-100 text-pink-700 border border-pink-200">
            🎀 Important
          </span>
        );
      case 'soft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-100 text-purple-700 border border-purple-200">
            ☁️ Soft & Chill
          </span>
        );
      case 'chill':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
            💤 Cozy Vibe
          </span>
        );
    }
  };

  const getEnergyBadge = () => {
    switch (task.energy) {
      case 'boss':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Zap size={10} /> Girl Boss
          </span>
        );
      case 'flow':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-pink-50 text-pink-700 border border-pink-200">
            <Sparkles size={10} /> Flow
          </span>
        );
      case 'cozy':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Coffee size={10} /> Cozy
          </span>
        );
    }
  };

  return (
    <div
      className={`group relative rounded-3xl p-4 sm:p-5 transition-all duration-300 border ${
        task.completed
          ? 'bg-white/50 border-pink-200/40 opacity-75'
          : task.isPinned
          ? 'bg-gradient-to-br from-white/95 to-pink-50/70 border-pink-300 shadow-md shadow-pink-100/50'
          : 'bg-white/85 border-pink-200/70 hover:border-pink-300 shadow-xs hover:shadow-md hover:shadow-pink-100/40'
      }`}
    >
      {/* Pinned Ribbon Indicator */}
      {task.isPinned && !task.completed && (
        <div className="absolute -top-2.5 right-6 px-3 py-0.5 bg-gradient-to-r from-pink-400 to-rose-400 text-white text-[10px] font-bold rounded-full shadow-xs flex items-center gap-1 tracking-wider uppercase">
          <span>⭐</span> Pinned
        </div>
      )}

      <div className="flex items-start gap-3.5">
        {/* Cute Bow Checkbox Button */}
        <button
          onClick={handleMainToggle}
          className={`mt-1 shrink-0 w-7 h-7 rounded-2xl flex items-center justify-center transition-all duration-300 cursor-pointer ${
            task.completed
              ? 'bg-gradient-to-tr from-pink-400 to-rose-500 text-white shadow-xs scale-95'
              : 'bg-pink-50/80 border-2 border-pink-300 hover:border-pink-500 hover:bg-pink-100 text-transparent hover:text-pink-400'
          }`}
          title={task.completed ? 'Mark incomplete' : 'Mark complete (get 10 petals!)'}
          aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
        >
          {task.completed ? <Check size={16} strokeWidth={3} /> : '🎀'}
        </button>

        {/* Content Section */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {/* Category tag */}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
              <span>{category.emoji}</span>
              <span>{category.name}</span>
            </span>

            {/* Priority tag */}
            {getPriorityBadge()}

            {/* Energy badge */}
            {getEnergyBadge()}

            {/* Due date badge */}
            {getDueBadge()}

            {/* Recurring badge */}
            {task.recurring && task.recurring !== 'none' && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] bg-purple-50 text-purple-600 border border-purple-200">
                <Clock size={10} />
                {task.recurring}
              </span>
            )}
          </div>

          {/* Title */}
          <h2
            onClick={handleMainToggle}
            className={`text-base font-semibold leading-snug cursor-pointer transition-colors ${
              task.completed
                ? 'line-through text-stone-400 font-normal'
                : 'text-stone-800 hover:text-rose-600'
            }`}
          >
            {task.title}
          </h2>

          {/* Notes Preview / Accordion */}
          {task.notes && (
            <div className="mt-1.5">
              <button
                onClick={() => setShowNotes(!showNotes)}
                className="text-xs text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1"
              >
                <span>{showNotes ? 'Hide notes' : 'View notes & thoughts ✨'}</span>
                {showNotes ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {showNotes && (
                <p className="mt-1.5 text-xs text-stone-600 bg-pink-50/60 p-2.5 rounded-xl border border-pink-100 whitespace-pre-wrap font-sans">
                  {task.notes}
                </p>
              )}
            </div>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {task.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[10px] text-pink-600/90 bg-pink-50 px-2 py-0.5 rounded-md font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Subtasks Progress Bar & Checklist */}
          {totalSubtasks > 0 && (
            <div className="mt-3 pt-2.5 border-t border-pink-100/80">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <button
                  onClick={() => setShowSubtasks(!showSubtasks)}
                  className="font-semibold text-rose-700 flex items-center gap-1.5 hover:text-rose-900"
                >
                  <span>Checklist ({completedSubtasks}/{totalSubtasks})</span>
                  {showSubtasks ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                <span className="text-[11px] font-bold text-pink-500">{progressPercent}%</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-pink-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-400 to-rose-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Subtask list */}
              {showSubtasks && (
                <div className="mt-2.5 space-y-1.5 pl-1">
                  {task.subtasks.map((st) => (
                    <div
                      key={st.id}
                      onClick={() => handleSubtaskToggle(st.id)}
                      className="flex items-center gap-2 text-xs cursor-pointer group/st py-1 px-2 rounded-lg hover:bg-pink-50/70 transition-colors"
                    >
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                          st.completed
                            ? 'bg-rose-400 border-rose-400 text-white'
                            : 'border-pink-300 group-hover/st:border-rose-400'
                        }`}
                      >
                        {st.completed && <Check size={10} strokeWidth={3} />}
                      </div>
                      <span
                        className={`transition-colors ${
                          st.completed
                            ? 'line-through text-stone-400'
                            : 'text-stone-700 group-hover/st:text-rose-900'
                        }`}
                      >
                        {st.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card Actions (Pin & More Menu) */}
        <div className="flex items-center gap-1 shrink-0 relative">
          <button
            onClick={() => onTogglePin(task.id)}
            className={`p-1.5 rounded-xl transition-colors ${
              task.isPinned
                ? 'text-rose-500 bg-pink-100 hover:bg-pink-200'
                : 'text-stone-400 hover:text-rose-500 hover:bg-pink-50'
            }`}
            title={task.isPinned ? 'Unpin' : 'Pin to top'}
            aria-label={task.isPinned ? 'Unpin' : 'Pin to top'}
          >
            <Pin size={15} className={task.isPinned ? 'fill-rose-400' : ''} />
          </button>

          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-pink-50 transition-colors"
            title="More actions"
            aria-label="More actions"
          >
            <MoreVertical size={15} />
          </button>

          {/* Context Dropdown Menu */}
          {showMenu && (
            <div
              className="absolute right-0 top-8 w-36 bg-white rounded-2xl shadow-lg border border-pink-200 py-1.5 z-30"
              onMouseLeave={() => setShowMenu(false)}
            >
              <button
                onClick={() => {
                  setShowMenu(false);
                  onEdit(task);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-stone-700 hover:bg-pink-50 flex items-center gap-2"
              >
                <Edit3 size={13} /> Edit
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  onDuplicate(task);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-stone-700 hover:bg-pink-50 flex items-center gap-2"
              >
                <Copy size={13} /> Duplicate
              </button>
              <div className="border-t border-pink-100 my-1"></div>
              <button
                onClick={() => {
                  setShowMenu(false);
                  onDelete(task.id);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
