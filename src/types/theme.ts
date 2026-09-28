export interface ThemeConfig {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  bgGradient: string;
  cardBg: string;
  accent: string;
  accentHover: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  ribbonBg: string;
  tagBg: string;
}

export const THEMES: Record<string, ThemeConfig> = {
  coquette: {
    id: 'coquette',
    name: 'Coquette Dream',
    tagline: 'Lace, silk bows & delicate pearls',
    icon: '🎀',
    bgGradient: 'bg-gradient-to-br from-pink-100 via-rose-50 to-pink-50',
    cardBg: 'bg-white/80 backdrop-blur-md',
    accent: 'bg-pink-400 hover:bg-pink-500 text-white',
    accentHover: 'hover:bg-pink-500',
    border: 'border-pink-200/70',
    textPrimary: 'text-rose-950',
    textSecondary: 'text-rose-500',
    ribbonBg: 'bg-pink-300 text-pink-900',
    tagBg: 'bg-pink-50 text-pink-700 border-pink-200',
  },
  sakura: {
    id: 'sakura',
    name: 'Sakura Petal',
    tagline: 'Spring breeze & matcha mornings',
    icon: '🌸',
    bgGradient: 'bg-gradient-to-br from-rose-100 via-emerald-50/30 to-pink-50',
    cardBg: 'bg-white/85 backdrop-blur-md',
    accent: 'bg-rose-400 hover:bg-rose-500 text-white',
    accentHover: 'hover:bg-rose-500',
    border: 'border-rose-200/60',
    textPrimary: 'text-stone-800',
    textSecondary: 'text-rose-600',
    ribbonBg: 'bg-rose-300 text-rose-900',
    tagBg: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  lavender: {
    id: 'lavender',
    name: 'Kawaii Lavender',
    tagline: 'Cloud dreams & lilac serenity',
    icon: '💜',
    bgGradient: 'bg-gradient-to-br from-purple-100 via-pink-50 to-indigo-50',
    cardBg: 'bg-white/85 backdrop-blur-md',
    accent: 'bg-purple-400 hover:bg-purple-500 text-white',
    accentHover: 'hover:bg-purple-500',
    border: 'border-purple-200/70',
    textPrimary: 'text-purple-950',
    textSecondary: 'text-purple-600',
    ribbonBg: 'bg-purple-300 text-purple-950',
    tagBg: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  strawberry: {
    id: 'strawberry',
    name: 'Strawberry Shortcake',
    tagline: 'Sweet cream, berry bliss & tart glow',
    icon: '🍓',
    bgGradient: 'bg-gradient-to-br from-red-100 via-rose-50 to-amber-50',
    cardBg: 'bg-white/85 backdrop-blur-md',
    accent: 'bg-rose-500 hover:bg-rose-600 text-white',
    accentHover: 'hover:bg-rose-600',
    border: 'border-rose-300/60',
    textPrimary: 'text-rose-950',
    textSecondary: 'text-red-500',
    ribbonBg: 'bg-rose-400 text-white',
    tagBg: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  vanilla: {
    id: 'vanilla',
    name: 'Vanilla Clean Girl',
    tagline: 'Warm cashmere, oat milk latte & gold',
    icon: '☕',
    bgGradient: 'bg-gradient-to-br from-amber-100/60 via-stone-50 to-orange-50/50',
    cardBg: 'bg-white/90 backdrop-blur-md',
    accent: 'bg-amber-700 hover:bg-amber-800 text-white',
    accentHover: 'hover:bg-amber-800',
    border: 'border-amber-200/60',
    textPrimary: 'text-stone-800',
    textSecondary: 'text-amber-800',
    ribbonBg: 'bg-amber-200 text-amber-900',
    tagBg: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Princess',
    tagline: 'Twilight stars & neon glitter vibes',
    icon: '✨',
    bgGradient: 'bg-gradient-to-br from-slate-900 via-purple-950 to-pink-950',
    cardBg: 'bg-slate-900/80 backdrop-blur-md',
    accent: 'bg-pink-500 hover:bg-pink-600 text-white',
    accentHover: 'hover:bg-pink-600',
    border: 'border-pink-500/30',
    textPrimary: 'text-pink-100',
    textSecondary: 'text-pink-400',
    ribbonBg: 'bg-pink-600 text-white',
    tagBg: 'bg-purple-900/50 text-pink-300 border-pink-700/50',
  },
};
