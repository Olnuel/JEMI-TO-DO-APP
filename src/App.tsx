import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Sparkles, Heart, CheckCircle2, ListFilter, Trash2 } from 'lucide-react';
import { Task, Category, Habit, MoodType, AppData } from './types/todo';
import { THEMES } from './types/theme';
import { loadAppData, saveAppData, exportBackup, DEFAULT_APP_DATA } from './utils/storage';
import { playFairyChime, playPop, playSparkle } from './utils/soundEffects';
import { fireGirlyConfetti } from './utils/confetti';

import { Navbar } from './components/Navbar';
import { AffirmationBanner } from './components/AffirmationBanner';
import { CategoryFilter } from './components/CategoryFilter';
import { TaskCard } from './components/TaskCard';
import { TaskModal } from './components/TaskModal';
import { HabitWaterTracker } from './components/HabitWaterTracker';
import { FocusTimer } from './components/FocusTimer';
import { StickerBook } from './components/StickerBook';
import { ScratchpadModal } from './components/ScratchpadModal';
import { ThemeSelectorModal } from './components/ThemeSelectorModal';

export function App() {
  const [appData, setAppData] = useState<AppData>(() => loadAppData());

  const [activeTab, setActiveTab] = useState<'tasks' | 'habits' | 'focus' | 'stickers'>('tasks');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [energyFilter, setEnergyFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'smart' | 'dueDate' | 'priority' | 'alphabetical'>('smart');

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    saveAppData(appData);
  }, [appData]);

  const currentTheme = THEMES[appData.theme] || THEMES.coquette;

  // Add Petals Helper
  const handleAddPetals = (amount: number) => {
    setAppData((prev) => ({
      ...prev,
      petals: prev.petals + amount,
    }));
  };

  // Sound Toggle
  const toggleSound = () => {
    setAppData((prev) => ({
      ...prev,
      soundEnabled: !prev.soundEnabled,
    }));
  };

  // Task Handlers
  const handleSaveTask = (taskData: Omit<Task, 'id' | 'createdAt'> & { id?: string }) => {
    if (taskData.id) {
      // Edit existing
      setAppData((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskData.id
            ? { ...t, ...taskData, id: taskData.id! }
            : t
        ),
      }));
    } else {
      // Create new
      const newTask: Task = {
        ...taskData,
        id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        createdAt: new Date().toISOString(),
      };
      setAppData((prev) => ({
        ...prev,
        tasks: [newTask, ...prev.tasks],
        petals: prev.petals + 5, // Reward for creating a task!
      }));
    }
  };

  const handleToggleComplete = (id: string) => {
    setAppData((prev) => {
      const task = prev.tasks.find((t) => t.id === id);
      if (!task) return prev;
      const isNowCompleted = !task.completed;

      if (isNowCompleted) {
        fireGirlyConfetti();
      }

      const updatedTasks = prev.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: isNowCompleted,
              completedAt: isNowCompleted ? new Date().toISOString() : undefined,
            }
          : t
      );

      return {
        ...prev,
        tasks: updatedTasks,
        petals: isNowCompleted ? prev.petals + 10 : Math.max(0, prev.petals - 10),
      };
    });
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setAppData((prev) => {
      let earnedBonus = false;
      const updatedTasks = prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const updatedSubtasks = t.subtasks.map((st) => {
          if (st.id !== subtaskId) return st;
          if (!st.completed) earnedBonus = true;
          return { ...st, completed: !st.completed };
        });
        return { ...t, subtasks: updatedSubtasks };
      });

      return {
        ...prev,
        tasks: updatedTasks,
        petals: earnedBonus ? prev.petals + 5 : prev.petals,
      };
    });
  };

  const handleTogglePin = (id: string) => {
    playPop(appData.soundEnabled);
    setAppData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, isPinned: !t.isPinned } : t)),
    }));
  };

  const handleDuplicateTask = (task: Task) => {
    playSparkle(appData.soundEnabled);
    const duplicated: Task = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: `${task.title} (Copy)`,
      completed: false,
      completedAt: undefined,
      createdAt: new Date().toISOString(),
      subtasks: task.subtasks.map((st) => ({
        ...st,
        id: `st-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        completed: false,
      })),
    };

    setAppData((prev) => ({
      ...prev,
      tasks: [duplicated, ...prev.tasks],
    }));
  };

  const handleDeleteTask = (id: string) => {
    playPop(appData.soundEnabled);
    setAppData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
    }));
  };

  const handleClearCompleted = () => {
    playPop(appData.soundEnabled);
    setAppData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => !t.completed),
    }));
  };

  // Habits & Water Handlers
  const handleToggleHabit = (id: string) => {
    setAppData((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => {
        if (h.id !== id) return h;
        const nextState = !h.completedToday;
        return {
          ...h,
          completedToday: nextState,
          streak: nextState ? h.streak + 1 : Math.max(0, h.streak - 1),
        };
      }),
    }));
  };

  const handleAddHabit = (title: string, emoji: string) => {
    const newHabit: Habit = {
      id: `h-${Date.now()}`,
      title,
      emoji,
      completedToday: false,
      streak: 0,
    };
    setAppData((prev) => ({
      ...prev,
      habits: [...prev.habits, newHabit],
    }));
  };

  const handleDeleteHabit = (id: string) => {
    playPop(appData.soundEnabled);
    setAppData((prev) => ({
      ...prev,
      habits: prev.habits.filter((h) => h.id !== id),
    }));
  };

  const handleSetWaterGlasses = (count: number) => {
    setAppData((prev) => ({
      ...prev,
      waterGlasses: count,
    }));
  };

  // Mood & Scratchpad
  const handleSelectMood = (mood: MoodType) => {
    setAppData((prev) => ({
      ...prev,
      currentMood: mood,
    }));
  };

  const handleSaveScratchpad = (text: string) => {
    setAppData((prev) => ({
      ...prev,
      scratchpad: text,
    }));
  };

  // Backup & Reset
  const handleExport = () => {
    playSparkle(appData.soundEnabled);
    exportBackup(appData);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.tasks && Array.isArray(parsed.tasks)) {
          setAppData(parsed);
          playFairyChime(appData.soundEnabled);
          alert('🎀 Aesthetic backup successfully restored!');
        }
      } catch {
        alert('Oops! Could not read this backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetSampleData = () => {
    if (window.confirm('Reset to the initial cute sample tasks and habits?')) {
      playFairyChime(appData.soundEnabled);
      setAppData(DEFAULT_APP_DATA);
    }
  };

  // Filtered & Sorted Tasks
  const filteredTasks = useMemo(() => {
    return appData.tasks
      .filter((t) => {
        // Category
        if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
        // Status
        if (statusFilter === 'active' && t.completed) return false;
        if (statusFilter === 'completed' && !t.completed) return false;
        // Priority
        if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
        // Energy
        if (energyFilter !== 'all' && t.energy !== energyFilter) return false;
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = t.title.toLowerCase().includes(q);
          const matchNotes = t.notes?.toLowerCase().includes(q);
          const matchTags = t.tags.some((tag) => tag.toLowerCase().includes(q));
          if (!matchTitle && !matchNotes && !matchTags) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Pinning always takes top priority unless sorting alphabetical
        if (sortBy !== 'alphabetical') {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
        }

        // Incomplete first
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }

        if (sortBy === 'dueDate') {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        }

        if (sortBy === 'priority') {
          const weight = { urgent: 4, important: 3, soft: 2, chill: 1 };
          return weight[b.priority] - weight[a.priority];
        }

        if (sortBy === 'alphabetical') {
          return a.title.localeCompare(b.title);
        }

        // Smart default: due dates soonest
        if (a.dueDate && b.dueDate) {
          return a.dueDate.localeCompare(b.dueDate);
        }
        return 0;
      });
  }, [
    appData.tasks,
    selectedCategory,
    statusFilter,
    priorityFilter,
    energyFilter,
    searchQuery,
    sortBy,
  ]);

  // Task Counts for Category Pills
  const taskCountsByCategory = useMemo(() => {
    const counts: Record<string, number> = { all: appData.tasks.length };
    appData.categories.forEach((c) => {
      counts[c.id] = appData.tasks.filter((t) => t.category === c.id).length;
    });
    return counts;
  }, [appData.tasks, appData.categories]);

  const completedCount = appData.tasks.filter((t) => t.completed).length;
  const totalCount = appData.tasks.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className={`min-h-screen ${currentTheme.bgGradient} transition-colors duration-500 font-sans pb-24`}>
      {/* Navbar */}
      <Navbar
        currentTheme={currentTheme}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        petals={appData.petals}
        soundEnabled={appData.soundEnabled}
        toggleSound={toggleSound}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onOpenScratchpad={() => setIsScratchpadOpen(true)}
        onExport={handleExport}
        onImport={handleImport}
        onResetSampleData={handleResetSampleData}
      />

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Daily Affirmation & Mood Check-In Banner */}
        <AffirmationBanner
          currentMood={appData.currentMood}
          onSelectMood={handleSelectMood}
          soundEnabled={appData.soundEnabled}
        />

        {/* Tab 1: Tasks & Planner */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            {/* Top Stats & Quick Add Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white/80 border border-pink-200/80 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-400 to-rose-400 flex items-center justify-center text-white text-xl shadow-md shadow-pink-200">
                  🎀
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-serif-chic font-bold text-rose-950">
                    Your Sparkling Agenda
                  </h2>
                  <p className="text-xs text-rose-500 font-medium">
                    {completedCount} of {totalCount} completed • {completionPercentage}% achieved today ✨
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {completedCount > 0 && (
                  <button
                    onClick={handleClearCompleted}
                    className="px-3 py-2 rounded-2xl bg-pink-50 hover:bg-pink-100 text-rose-600 text-xs font-semibold border border-pink-200 transition-colors flex items-center gap-1.5"
                    title="Clean up completed tasks"
                  >
                    <Trash2 size={13} />
                    <span className="hidden sm:inline">Clear Done</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    playPop(appData.soundEnabled);
                    setTaskToEdit(null);
                    setIsTaskModalOpen(true);
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:to-rose-600 text-white text-xs font-bold shadow-md shadow-pink-200 hover:scale-102 active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={16} strokeWidth={3} />
                  <span>Add Glam Task 🎀</span>
                </button>
              </div>
            </div>

            {/* Category Filter & Search Bar */}
            <CategoryFilter
              categories={appData.categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              taskCountsByCategory={taskCountsByCategory}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              priorityFilter={priorityFilter}
              setPriorityFilter={setPriorityFilter}
              energyFilter={energyFilter}
              setEnergyFilter={setEnergyFilter}
              sortBy={sortBy}
              setSortBy={setSortBy}
              onResetFilters={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setStatusFilter('all');
                setPriorityFilter('all');
                setEnergyFilter('all');
                setSortBy('smart');
              }}
            />

            {/* Tasks List */}
            {filteredTasks.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white/70 border border-pink-200/80 shadow-xs">
                <div className="text-5xl mb-3 animate-float-slow">🌸</div>
                <h3 className="text-lg font-serif-chic font-bold text-rose-950">
                  No tasks found in this view!
                </h3>
                <p className="text-xs text-rose-500 max-w-sm mx-auto mt-1 mb-4">
                  {searchQuery
                    ? 'No tasks matched your cute search query. Try another keyword or reset filters!'
                    : 'Your to-do list is beautifully clear. Ready to plan your next sparkling win?'}
                </p>
                <button
                  onClick={() => {
                    playPop(appData.soundEnabled);
                    setTaskToEdit(null);
                    setIsTaskModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-2xl bg-rose-500 text-white text-xs font-bold shadow-sm hover:scale-105 transition-all inline-flex items-center gap-1.5"
                >
                  <Plus size={14} /> Add First Glam Task
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    categories={appData.categories}
                    onToggleComplete={handleToggleComplete}
                    onToggleSubtask={handleToggleSubtask}
                    onTogglePin={handleTogglePin}
                    onEdit={(t) => {
                      setTaskToEdit(t);
                      setIsTaskModalOpen(true);
                    }}
                    onDuplicate={handleDuplicateTask}
                    onDelete={handleDeleteTask}
                    soundEnabled={appData.soundEnabled}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Daily Habits & Water Glow */}
        {activeTab === 'habits' && (
          <HabitWaterTracker
            waterGlasses={appData.waterGlasses}
            onSetWaterGlasses={handleSetWaterGlasses}
            habits={appData.habits}
            onToggleHabit={handleToggleHabit}
            onAddHabit={handleAddHabit}
            onDeleteHabit={handleDeleteHabit}
            soundEnabled={appData.soundEnabled}
            onAddPetals={handleAddPetals}
          />
        )}

        {/* Tab 3: Focus Lounge & Pomodoro */}
        {activeTab === 'focus' && (
          <FocusTimer
            soundEnabled={appData.soundEnabled}
            onAddPetals={handleAddPetals}
          />
        )}

        {/* Tab 4: Sticker Book & Rewards */}
        {activeTab === 'stickers' && (
          <StickerBook
            petals={appData.petals}
            soundEnabled={appData.soundEnabled}
          />
        )}
      </main>

      {/* Floating Action Button for Adding Tasks (Mobile & Quick Access) */}
      <button
        onClick={() => {
          playPop(appData.soundEnabled);
          setTaskToEdit(null);
          setIsTaskModalOpen(true);
        }}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-pink-400 text-white flex items-center justify-center shadow-lg shadow-pink-400/50 hover:scale-110 active:scale-95 transition-all cursor-pointer group"
        title="Add new task"
      >
        <Plus size={24} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Task Creation & Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
        categories={appData.categories}
        soundEnabled={appData.soundEnabled}
      />

      {/* Scratchpad & Quick Notes Modal */}
      <ScratchpadModal
        isOpen={isScratchpadOpen}
        onClose={() => setIsScratchpadOpen(false)}
        scratchpad={appData.scratchpad}
        onSaveScratchpad={handleSaveScratchpad}
        soundEnabled={appData.soundEnabled}
      />

      {/* Theme Selector Modal */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentThemeId={appData.theme}
        onSelectTheme={(themeId) => setAppData((prev) => ({ ...prev, theme: themeId }))}
        soundEnabled={appData.soundEnabled}
      />
    </div>
  );
}
export default App;
