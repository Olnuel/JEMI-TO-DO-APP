import { AppData } from '../types/todo';
import { INITIAL_CATEGORIES, INITIAL_HABITS, INITIAL_TASKS } from '../constants/sampleData';

const STORAGE_KEY = 'cherie_todo_app_data_v1';

export const DEFAULT_APP_DATA: AppData = {
  tasks: INITIAL_TASKS,
  categories: INITIAL_CATEGORIES,
  habits: INITIAL_HABITS,
  waterGlasses: 4,
  lastWaterDate: new Date().toISOString().split('T')[0],
  petals: 45,
  currentMood: 'adorable',
  scratchpad: '✨ Goals for this month:\n• Read 2 books 📚\n• Drink 8 glasses of water daily 💧\n• Buy silk pajamas & fresh flowers 💐\n• Glow with calm confidence 🎀',
  unlockedStickers: ['satin_bow', 'ballet_slippers'],
  theme: 'coquette',
  soundEnabled: true,
};

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_APP_DATA;
    const parsed = JSON.parse(raw);

    // Reset daily water if date changed
    const today = new Date().toISOString().split('T')[0];
    if (parsed.lastWaterDate !== today) {
      parsed.waterGlasses = 0;
      parsed.lastWaterDate = today;
      // Reset habit daily status
      if (Array.isArray(parsed.habits)) {
        parsed.habits = parsed.habits.map((h: { completedToday: boolean }) => ({ ...h, completedToday: false }));
      }
    }

    return {
      ...DEFAULT_APP_DATA,
      ...parsed,
    };
  } catch (e) {
    console.error('Failed to load data from localStorage', e);
    return DEFAULT_APP_DATA;
  }
}

export function saveAppData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data to localStorage', e);
  }
}

export function exportBackup(data: AppData): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cherie-planner-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
