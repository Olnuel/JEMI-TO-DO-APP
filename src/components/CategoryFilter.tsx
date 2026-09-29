import React from 'react';
import { Search, X, SlidersHorizontal, Settings } from 'lucide-react';
import { Category, Priority, EnergyLevel } from '../types/todo';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  taskCountsByCategory: Record<string, number>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: 'all' | 'active' | 'completed';
  setStatusFilter: (status: 'all' | 'active' | 'completed') => void;
  priorityFilter: string;
  setPriorityFilter: (priority: string) => void;
  energyFilter: string;
  setEnergyFilter: (energy: string) => void;
  sortBy: 'smart' | 'dueDate' | 'priority' | 'alphabetical';
  setSortBy: (sort: 'smart' | 'dueDate' | 'priority' | 'alphabetical') => void;
  onResetFilters: () => void;
  onManageCategories: () => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  taskCountsByCategory,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  energyFilter,
  setEnergyFilter,
  sortBy,
  setSortBy,
  onResetFilters,
  onManageCategories,
}) => {
  const [showFilters, setShowFilters] = React.useState(false);

  const hasActiveFilters =
    searchQuery !== '' ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    energyFilter !== 'all' ||
    selectedCategory !== 'all';

  return (
    <div className="space-y-3">
      {/* Category Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none pt-1">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = taskCountsByCategory[cat.id] || 0;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-rose-500 text-white shadow-sm shadow-rose-300 scale-102'
                  : 'bg-white/80 hover:bg-white text-stone-700 border border-pink-200/80 hover:border-pink-300'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-white/30 text-white' : 'bg-pink-100 text-rose-700'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
        {/* Manage Categories Button */}
        <button
          onClick={onManageCategories}
          className="px-3.5 py-1.5 rounded-2xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all cursor-pointer bg-white/80 hover:bg-white text-stone-700 border border-pink-200/80 hover:border-pink-300"
          title="Manage categories"
        >
          <Settings size={13} />
          <span>Manage</span>
        </button>
      </div>

      {/* Search Bar & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, tags, notes... 🌸"
            className="w-full pl-10 pr-9 py-2 rounded-2xl bg-white/80 border border-pink-200/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-300 text-xs text-stone-800 placeholder:text-stone-400 font-medium transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Toggle & Quick Status Pills */}
        <div className="flex items-center gap-2">
          {/* Status Pills */}
          <div className="flex p-0.5 rounded-2xl bg-pink-100/70 border border-pink-200/60">
            {(['all', 'active', 'completed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize transition-all ${
                  statusFilter === s
                    ? 'bg-white text-rose-600 shadow-2xs'
                    : 'text-stone-600 hover:text-rose-900'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Toggle More Filters Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 rounded-2xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-rose-50 border-rose-300 text-rose-700'
                : 'bg-white/80 border-pink-200 text-stone-600 hover:bg-white'
            }`}
          >
            <SlidersHorizontal size={13} />
            <span className="hidden sm:inline">Filters & Sort</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Filters Drawer */}
      {showFilters && (
        <div className="p-4 rounded-2xl bg-white/90 border border-pink-200/90 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-150 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Sort by */}
            <div>
              <label className="block text-[11px] font-bold text-rose-800 uppercase tracking-wider mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'smart' | 'dueDate' | 'priority' | 'alphabetical')}
                className="w-full px-2.5 py-1.5 rounded-xl bg-pink-50/60 border border-pink-200 text-stone-700 font-medium"
              >
                <option value="smart">⭐ Pinned First & Smart</option>
                <option value="dueDate">📅 Due Date (Earliest)</option>
                <option value="priority">🔥 Priority (Urgent First)</option>
                <option value="alphabetical">🔤 Title (A to Z)</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-[11px] font-bold text-rose-800 uppercase tracking-wider mb-1">
                Priority Filter
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-pink-50/60 border border-pink-200 text-stone-700 font-medium"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">🔥 Urgent & Glam Only</option>
                <option value="important">🎀 Cute & Important Only</option>
                <option value="soft">☁️ Soft & Flexible Only</option>
                <option value="chill">💤 Chill Vibe Only</option>
              </select>
            </div>

            {/* Energy Filter */}
            <div>
              <label className="block text-[11px] font-bold text-rose-800 uppercase tracking-wider mb-1">
                Energy Level
              </label>
              <select
                value={energyFilter}
                onChange={(e) => setEnergyFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-pink-50/60 border border-pink-200 text-stone-700 font-medium"
              >
                <option value="all">All Energy Levels</option>
                <option value="boss">⚡ High Energy (Girl Boss)</option>
                <option value="flow">🌸 Medium Energy (Flow)</option>
                <option value="cozy">🧋 Low Energy (Cozy)</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex justify-end pt-1">
              <button
                onClick={onResetFilters}
                className="text-xs text-rose-500 hover:text-rose-700 font-semibold underline"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
