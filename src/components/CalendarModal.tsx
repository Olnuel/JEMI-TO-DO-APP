import React, { useMemo, useState } from 'react';
import {
  X,
  Calendar,
  Download,
  ExternalLink,
  Check,
  Info,
  Sparkles,
  ChevronDown,
  Link2,
  RefreshCw,
} from 'lucide-react';
import { Task } from '../types/todo';
import {
  CALENDAR_PROVIDERS,
  CalendarProvider,
  CalendarProviderId,
  getProvider,
  buildDeepLink,
  downloadICS,
  getSchedulableTasks,
} from '../utils/calendar';
import { playPop, playSparkle } from '../utils/soundEffects';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  soundEnabled: boolean;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  tasks,
  soundEnabled,
}) => {
  const [selectedId, setSelectedId] = useState<CalendarProviderId>('google');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('all');
  const [justLinked, setJustLinked] = useState<string | null>(null);

  const schedulable = useMemo(() => getSchedulableTasks(tasks), [tasks]);

  const selected: CalendarProvider = getProvider(selectedId);

  const exportTargetTasks = useMemo(() => {
    if (selectedTaskId === 'all') return schedulable;
    const one = schedulable.find((t) => t.id === selectedTaskId);
    return one ? [one] : [];
  }, [schedulable, selectedTaskId]);

  if (!isOpen) return null;

  const handleExportICS = () => {
    if (exportTargetTasks.length === 0) return;
    playSparkle(soundEnabled);
    const scope = selectedTaskId === 'all' ? 'all-tasks' : 'single-task';
    downloadICS(exportTargetTasks, `jemi-${selected.id}-${scope}-${new Date().toISOString().slice(0, 10)}.ics`);
  };

  const handleOpenDeepLink = () => {
    if (!selected.supportsDeepLink) return;
    playPop(soundEnabled);
    if (selectedTaskId === 'all') {
      // Export path: ICS is the way to move everything at once.
      handleExportICS();
      return;
    }
    const task = schedulable.find((t) => t.id === selectedTaskId);
    if (!task) return;
    const url = buildDeepLink(selected.id, task);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleLink = () => {
    playSparkle(soundEnabled);
    setJustLinked(selected.id);
    setTimeout(() => setJustLinked(null), 2200);
  };

  const hasSelection = exportTargetTasks.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pink-950/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glow-card relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white/95 rounded-3xl p-6 sm:p-7 shadow-2xl border border-pink-200/90 text-stone-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-pink-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🗓️</span>
            <h2 className="text-xl font-serif-chic font-bold text-rose-950">
              Connect a Calendar
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-pink-100 text-stone-400 hover:text-rose-600 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step 1 — Choose the calendar */}
        <div className="mt-4">
          <label className="block text-xs font-bold text-rose-800 uppercase tracking-wider mb-1.5">
            1 · Choose your calendar
          </label>
          <div className="relative">
            <select
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value as CalendarProviderId);
                playPop(soundEnabled);
              }}
              className="w-full appearance-none px-4 py-3 rounded-2xl bg-pink-50/60 border border-pink-200 focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm text-stone-800 font-semibold cursor-pointer"
            >
              {CALENDAR_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.emoji} {p.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-400 pointer-events-none"
            />
          </div>

          {/* Provider quick-pick chips */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {CALENDAR_PROVIDERS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedId(p.id);
                  playPop(soundEnabled);
                }}
                title={p.name}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                  selectedId === p.id
                    ? 'bg-rose-500 text-white shadow-sm scale-105'
                    : 'bg-pink-50/80 hover:bg-pink-100 text-stone-700 border border-pink-200'
                }`}
              >
                <span>{p.emoji}</span>
                <span className="hidden sm:inline">{p.shortName}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected provider detail */}
        <div className="mt-3 p-3.5 rounded-2xl bg-pink-50/50 border border-pink-200/80">
          <div className="flex items-center gap-2.5">
            <span
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
              style={{ backgroundColor: `${selected.brandColor}22`, border: `1.5px solid ${selected.brandColor}66` }}
            >
              {selected.emoji}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-rose-950">{selected.name}</p>
              <p className="text-[11px] text-stone-500">
                {selected.supportsDeepLink ? 'Quick-add + .ics import' : '.ics import'}
              </p>
            </div>
            <div className="ml-auto flex gap-1 shrink-0">
              {selected.supportsIcs && (
                <span
                  className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold"
                  title="Supports standard .ics import"
                >
                  ICS
                </span>
              )}
              {selected.supportsDeepLink && (
                <span
                  className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 border border-purple-200 text-[10px] font-bold"
                  title="Supports one-tap pre-filled event"
                >
                  QUICK
                </span>
              )}
            </div>
          </div>
          <p className="text-[11px] text-stone-600 leading-relaxed mt-2.5">{selected.notes}</p>
        </div>

        {/* Step 2 — Choose what to send */}
        <div className="mt-4">
          <label className="block text-xs font-bold text-rose-800 uppercase tracking-wider mb-1.5">
            2 · What do you want to send?
          </label>
          <div className="relative">
            <select
              value={selectedTaskId}
              onChange={(e) => {
                setSelectedTaskId(e.target.value);
                playPop(soundEnabled);
              }}
              disabled={schedulable.length === 0}
              className="w-full appearance-none px-4 py-3 rounded-2xl bg-pink-50/60 border border-pink-200 focus:outline-none focus:ring-2 focus:ring-rose-400 text-xs text-stone-800 font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="all">
                All {schedulable.length} scheduled task{schedulable.length === 1 ? '' : 's'}
              </option>
              {schedulable.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.completed ? '✓ ' : ''}
                  {t.dueDate} — {t.title}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-400 pointer-events-none"
            />
          </div>
          {schedulable.length === 0 && (
            <p className="text-[11px] text-rose-500 mt-1.5">
              No tasks have a due date yet — add one to a task first.
            </p>
          )}
        </div>

        {/* Step 3 — Action */}
        <div className="mt-4 space-y-2">
          <label className="block text-xs font-bold text-rose-800 uppercase tracking-wider">
            3 · Connect
          </label>

          <button
            onClick={handleOpenDeepLink}
            disabled={!hasSelection || justLinked === selected.id}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white font-bold text-sm shadow-md shadow-pink-300 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {justLinked === selected.id ? (
              <>
                <Check size={16} /> Connected!
              </>
            ) : (
              <>
                {selected.supportsDeepLink ? <ExternalLink size={16} /> : <Link2 size={16} />}
                {selected.connectLabel}
              </>
            )}
          </button>

          <button
            onClick={handleExportICS}
            disabled={!hasSelection}
            className="w-full py-2.5 rounded-2xl bg-pink-100 text-rose-800 border border-pink-200 font-bold text-xs hover:bg-pink-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={15} />
            Download .ics file ({exportTargetTasks.length} event{exportTargetTasks.length === 1 ? '' : 's'})
          </button>

          <button
            onClick={handleLink}
            className="w-full py-2 rounded-2xl text-rose-500 text-xs font-semibold hover:bg-rose-50 transition-colors flex items-center justify-center gap-1.5"
            title="Mark this calendar as your connected one"
          >
            <RefreshCw size={12} />
            Set {selected.shortName} as my connected calendar
          </button>
        </div>

        {/* Honest note about live sync */}
        <div className="mt-4 p-3 rounded-2xl bg-rose-50/60 border border-rose-200 flex items-start gap-2">
          <Info size={14} className="text-rose-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-stone-600 leading-relaxed">
            <strong className="text-rose-800">How this works:</strong> Jemi runs entirely in
            your browser, so it exports a standard{' '}
            <span className="font-mono text-rose-700">.ics</span> file rather than syncing
            live. Every calendar on this list imports it. For automatic two-way sync you would
            need to authorise Jemi through that provider's API on a server.
          </p>
        </div>

        <a
          href={selected.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 text-[11px] text-rose-500 hover:text-rose-700 font-semibold inline-flex items-center gap-1 hover:underline"
        >
          {selected.name} import help
          <ExternalLink size={10} />
        </a>
      </div>
    </div>
  );
};
