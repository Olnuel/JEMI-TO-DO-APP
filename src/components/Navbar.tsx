import React from 'react';
import { Sparkles, Volume2, VolumeX, Palette, BookOpen, Download, Upload, RotateCcw, Moon, Sun, Wand2, Calendar } from 'lucide-react';
import { ThemeConfig } from '../types/theme';

interface NavbarProps {
  currentTheme: ThemeConfig;
  activeTab: 'tasks' | 'habits' | 'focus' | 'stickers';
  setActiveTab: (tab: 'tasks' | 'habits' | 'focus' | 'stickers') => void;
  petals: number;
  soundEnabled: boolean;
  toggleSound: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  glowMode: boolean;
  toggleGlowMode: () => void;
  onOpenThemeModal: () => void;
  onOpenScratchpad: () => void;
  onOpenCalendarModal: () => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetSampleData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTheme,
  activeTab,
  setActiveTab,
  petals,
  soundEnabled,
  toggleSound,
  darkMode,
  toggleDarkMode,
  glowMode,
  toggleGlowMode,
  onOpenThemeModal,
  onOpenScratchpad,
  onOpenCalendarModal,
  onExport,
  onImport,
  onResetSampleData,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/70 border-b border-pink-200/50 shadow-xs transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-400 via-rose-300 to-pink-200 flex items-center justify-center shadow-md shadow-pink-300/40 text-xl animate-float-slow glow-emoji">
            🎀
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl sm:text-2xl font-serif-chic font-bold tracking-tight bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                Jemi
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 font-semibold border border-pink-200">
                Aesthetic To-Do
              </span>
            </div>
            <p className="text-[11px] text-rose-400 font-medium hidden sm:block">
              Daily Planner, Habits & Glow Lounge ✨
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center p-1 rounded-2xl bg-pink-100/60 border border-pink-200/60">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'tasks'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-rose-700/80 hover:text-rose-900 hover:bg-white/40'
            }`}
          >
            <span>🎀</span>
            <span>Tasks</span>
          </button>
          <button
            onClick={() => setActiveTab('habits')}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'habits'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-rose-700/80 hover:text-rose-900 hover:bg-white/40'
            }`}
          >
            <span>💧</span>
            <span>Habits & Glow</span>
          </button>
          <button
            onClick={() => setActiveTab('focus')}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'focus'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-rose-700/80 hover:text-rose-900 hover:bg-white/40'
            }`}
          >
            <span>🫖</span>
            <span>Focus Tea</span>
          </button>
          <button
            onClick={() => setActiveTab('stickers')}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'stickers'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-rose-700/80 hover:text-rose-900 hover:bg-white/40'
            }`}
          >
            <span>🧸</span>
            <span className="hidden xs:inline">Stickers</span>
          </button>
        </nav>

        {/* Right Action Icons & Petals Count */}
        <div className="flex items-center gap-2">
          {/* Petal Points Badge */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-pink-200/80 to-rose-200/80 border border-pink-300/60 shadow-2xs text-xs font-bold text-rose-900 cursor-pointer hover:scale-105 transition-transform"
            title="Complete tasks & habits to collect Petals and unlock stickers!"
            onClick={() => setActiveTab('stickers')}
          >
            <span className="animate-spin text-sm" style={{ animationDuration: '6s' }}>🌸</span>
            <span>{petals}</span>
            <span className="text-[10px] text-rose-700 font-medium hidden sm:inline">Petals</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-rose-600 border border-pink-200 transition-colors"
            title={soundEnabled ? 'Sound is ON (Click to mute)' : 'Sound is MUTED (Click to enable)'}
            aria-label="Toggle cute sounds"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-xl border transition-all ${
              darkMode
                ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-500/40'
                : 'bg-pink-50 hover:bg-pink-100 text-rose-600 border-pink-200'
            }`}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle dark mode"
            aria-pressed={darkMode}
          >
            {darkMode ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {/* Glow Mode Toggle */}
          <button
            onClick={toggleGlowMode}
            className={`p-2 rounded-xl border transition-all ${
              glowMode
                ? 'bg-fuchsia-500 text-white border-fuchsia-300 shadow-lg shadow-fuchsia-500/40'
                : 'bg-pink-50 hover:bg-pink-100 text-rose-600 border-pink-200'
            }`}
            title={glowMode ? 'Turn off neon glow' : 'Turn on neon glow'}
            aria-label="Toggle glow effect"
            aria-pressed={glowMode}
          >
            <Wand2 size={16} />
          </button>

          {/* Digital Calendar Connect Button */}
          <button
            onClick={onOpenCalendarModal}
            className="p-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-rose-600 border border-pink-200 transition-colors"
            title="Connect a digital calendar (Google, Outlook, Apple, Notion...)"
            aria-label="Connect a digital calendar"
          >
            <Calendar size={16} />
          </button>

          {/* Pink Scratchpad Drawer Button */}
          <button
            onClick={onOpenScratchpad}
            className="p-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-rose-600 border border-pink-200 transition-colors relative"
            title="Pink Brain Dump & Scratchpad"
            aria-label="Open notes scratchpad"
          >
            <BookOpen size={16} />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-400 rounded-full animate-ping" />
          </button>

          {/* Theme Selector Button */}
          <button
            onClick={onOpenThemeModal}
            className="p-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-rose-600 border border-pink-200 transition-colors flex items-center gap-1 text-xs font-medium"
            title="Choose Aesthetic Theme"
            aria-label="Open theme picker"
          >
            <Palette size={16} />
            <span className="hidden md:inline">{currentTheme.icon}</span>
          </button>

          {/* Export / Backup Dropdown or Button */}
          <div className="relative group">
            <button
              className="p-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-rose-600 border border-pink-200 transition-colors"
              title="Data & Backup Options"
              aria-label="Backup options"
            >
              <Sparkles size={16} />
            </button>
            <div className="absolute right-0 mt-2 w-48 py-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-pink-200 hidden group-hover:block transition-all z-50">
              <button
                onClick={onExport}
                className="w-full text-left px-4 py-2 text-xs text-rose-800 hover:bg-pink-50 flex items-center gap-2"
              >
                <Download size={14} /> Export Backup (.json)
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full text-left px-4 py-2 text-xs text-rose-800 hover:bg-pink-50 flex items-center gap-2"
              >
                <Upload size={14} /> Restore Backup (.json)
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={onImport}
                accept=".json"
                className="hidden"
              />
              <div className="border-t border-pink-100 my-1"></div>
              <button
                onClick={onResetSampleData}
                className="w-full text-left px-4 py-2 text-xs text-rose-500 hover:bg-rose-50 flex items-center gap-2"
              >
                <RotateCcw size={14} /> Reset Sample Tasks
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
