export type Priority = 'urgent' | 'important' | 'soft' | 'chill';
export type EnergyLevel = 'boss' | 'flow' | 'cozy';
export type RecurringType = 'none' | 'daily' | 'weekly';

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  priority: Priority;
  energy: EnergyLevel;
  category: string;
  isPinned: boolean;
  subtasks: Subtask[];
  recurring: RecurringType;
  tags: string[];
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string; // Tailwind color class or hex
}

export interface Habit {
  id: string;
  title: string;
  emoji: string;
  completedToday: boolean;
  streak: number;
}

export type MoodType = 'adorable' | 'girlboss' | 'peaceful' | 'cozy' | 'sleepy';

export interface Sticker {
  id: string;
  name: string;
  emoji: string;
  description: string;
  requiredPetals: number;
  unlocked: boolean;
}

export interface AppData {
  tasks: Task[];
  categories: Category[];
  habits: Habit[];
  waterGlasses: number;
  lastWaterDate: string;
  petals: number;
  currentMood: MoodType | null;
  scratchpad: string;
  unlockedStickers: string[];
  theme: string;
  soundEnabled: boolean;
}
