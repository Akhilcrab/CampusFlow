'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ExtractedItemWithReminders, DashboardStats } from '@/types';
import FileUpload from './FileUpload';
import StatCards from './StatCards';
import ItemCard from './ItemCard';
import NotificationManager from './NotificationManager';
import { Calendar, BookOpen, Layers, RefreshCw, Sun, Moon, Star, Check } from 'lucide-react';
import { Category, Priority } from '@prisma/client';
import { playBellChime } from '@/lib/sound';

export default function Dashboard() {
  // Navigation tabs: 'dashboard' | 'inbox' | 'placements' | 'assignments'
  const [activeNav, setActiveNav] = useState<'dashboard' | 'inbox' | 'placements' | 'assignments'>('dashboard');
  const [items, setItems] = useState<ExtractedItemWithReminders[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Quick task list filtering state
  const [filterKey, setFilterKey] = useState<string>('all');
  
  const [stats, setStats] = useState<DashboardStats>({
    totalActive: 0,
    urgentCount: 0,
    completedCount: 0,
    byCategory: {
      ASSIGNMENT: 0,
      EXAM: 0,
      EVENT: 0,
      PLACEMENT: 0,
      NOTICE: 0,
      OTHER: 0,
    }
  });

  // Restore theme on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
      const initialTheme = savedTheme || 'light';
      setTheme(initialTheme);
      if (initialTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const fetchItems = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    try {
      const response = await fetch('/api/items');
      const result = await response.json();
      
      if (response.ok && result.success) {
        setItems(result.data);
        calculateStats(result.data);
      }
    } catch (err) {
      console.error('Failed to load items:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (data: ExtractedItemWithReminders[]) => {
    const active = data.filter(i => !i.isCompleted);
    const completed = data.filter(i => i.isCompleted);
    
    // Urgency stats using overrides if present
    const urgent = active.filter(i => {
      const priority = i.userPriority || i.priority;
      return priority === 'CRITICAL' || priority === 'HIGH';
    });
    
    const byCategory = {
      ASSIGNMENT: 0,
      EXAM: 0,
      EVENT: 0,
      PLACEMENT: 0,
      NOTICE: 0,
      OTHER: 0,
    };

    active.forEach(item => {
      if (byCategory[item.category] !== undefined) {
        byCategory[item.category]++;
      }
    });

    setStats({
      totalActive: active.length,
      urgentCount: urgent.length,
      completedCount: completed.length,
      byCategory,
    });
  };

  useEffect(() => {
    fetchItems();
    
    // Read the "tab" query parameter from URL to set the active navigation view
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab && ['dashboard', 'inbox', 'placements', 'assignments'].includes(tab)) {
        setActiveNav(tab as any);
      }
    }
  }, []);

  const handleItemExtracted = () => {
    fetchItems();
  };

  const handleToggleComplete = async (id: string, isCompleted: boolean) => {
    try {
      const response = await fetch(`/api/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted }),
      });
      if (response.ok) {
        setItems(prev => {
          const updated = prev.map(item => item.id === id ? { ...item, isCompleted } : item);
          calculateStats(updated);
          return updated;
        });
        
        if (isCompleted) {
          playBellChime();
        }

        setTimeout(() => fetchItems(), 500);
      }
    } catch (err) {
      console.error('Failed to complete item:', err);
    }
  };

  const handleUpdatePriority = async (id: string, userPriority: Priority | null) => {
    try {
      const response = await fetch(`/api/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPriority }),
      });
      if (response.ok) {
        setItems(prev => {
          const updated = prev.map(item => item.id === id ? { ...item, userPriority } : item);
          calculateStats(updated);
          return updated;
        });
      }
    } catch (err) {
      console.error('Failed to override item priority:', err);
    }
  };

  const handleToggleStar = async (id: string, isStarred: boolean) => {
    try {
      const response = await fetch(`/api/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStarred }),
      });
      if (response.ok) {
        setItems(prev => {
          return prev.map(item => item.id === id ? { ...item, isStarred } : item);
        });
      }
    } catch (err) {
      console.error('Failed to star item:', err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const response = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setItems(prev => {
          const filtered = prev.filter(item => item.id !== id);
          calculateStats(filtered);
          return filtered;
        });
      }
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const handleSeedDemo = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/items', { method: 'POST' });
      if (response.ok) {
        await fetchItems();
      }
    } catch (err) {
      console.error('Failed to seed demo database:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReminderTriggered = () => {
    fetchItems();
  };

  // Re-sort items: Incomplete first, ordered by active priority (userPriority || priority), then by deadline
  const priorityOrder: Record<Priority, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };

  const sortedItems = [...items].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1;
    }
    const aPriority = a.userPriority || a.priority;
    const bPriority = b.userPriority || b.priority;
    if (priorityOrder[aPriority] !== priorityOrder[bPriority]) {
      return priorityOrder[aPriority] - priorityOrder[bPriority];
    }
    const ad = a.deadline ? new Date(a.deadline).getTime() : Infinity;
    const bd = b.deadline ? new Date(b.deadline).getTime() : Infinity;
    return ad - bd;
  });

  // Filter items based on navigation AND quick filter tabs
  const filteredItems = sortedItems.filter(item => {
    // Navigation routing filter
    if (activeNav === 'inbox') {
      if (item.isCompleted) return false;
    } else if (activeNav === 'assignments') {
      if (item.category !== Category.ASSIGNMENT) return false;
    } else if (activeNav === 'placements') {
      if (item.category !== Category.PLACEMENT) return false;
    }

    // Quick filter check
    if (filterKey === 'all') return true;
    if (filterKey === 'starred') return !!item.isStarred;
    if (filterKey === 'high') {
      const p = item.userPriority || item.priority;
      return p === 'CRITICAL' || p === 'HIGH';
    }
    return item.category === filterKey;
  });

  // Starred tasks section filter (Only incomplete starred tasks)
  const starredItems = sortedItems.filter(item => item.isStarred && !item.isCompleted);

  return (
    <div className="w-full min-h-screen bg-[#F5F5F7] dark:bg-[#090D16] px-6 py-8 flex flex-col gap-8 transition-colors duration-300">
      {/* 1. Floating Top Navigation Bar */}
      <header className="w-full max-w-7xl mx-auto bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-[24px] px-6 py-4 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] transition-all">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-[#1677FF] flex items-center justify-center font-black text-white text-sm">
            CF
          </span>
          <span className="font-extrabold text-[#111827] dark:text-slate-100 text-base tracking-tight">
            CampusFlow<span className="text-[#1677FF]">.ai</span>
          </span>
        </div>

        {/* Floating rounded link tabs */}
        <nav className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1">
          {[
            { key: 'dashboard', label: 'Dashboard' },
            { key: 'inbox', label: 'Inbox' },
            { key: 'assignments', label: 'Assignments' },
            { key: 'placements', label: 'Placements' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveNav(tab.key as any);
                setFilterKey('all'); // Clear filters on tab change
              }}
              className={`text-xs font-bold px-4 py-2 rounded-[16px] transition-all cursor-pointer ${
                activeNav === tab.key
                  ? 'bg-slate-100 dark:bg-slate-800 text-[#111827] dark:text-slate-100'
                  : 'text-[#6B7280] dark:text-gray-400 hover:text-[#111827] dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <Link
            href="/attendance"
            className="text-xs font-bold px-4 py-2 rounded-[16px] transition-all cursor-pointer text-[#6B7280] dark:text-gray-400 hover:text-[#111827] dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center gap-1"
          >
            📊 Attendance
          </Link>
        </nav>

        {/* Action Panel: Light/Dark Switcher & Live Alerts */}
        <div className="flex items-center gap-3">
          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-[14px] border border-gray-200 dark:border-slate-800 text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-sm"
            title="Toggle Light/Dark Mode"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-[#1677FF]" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>

          <NotificationManager items={items} onReminderTriggered={handleReminderTriggered} />
        </div>
      </header>

      {/* 2. Unified Grid Layout Container */}
      <main className="w-full max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* Dynamic Notification Banner (Green section banner) */}
        {items.length > 0 && (
          <div className="w-full bg-[#F0FDF4] dark:bg-emerald-950/10 border border-[#BBF7D0] dark:border-emerald-900/30 rounded-[24px] p-5 flex items-center justify-between text-[#166534] dark:text-emerald-400 shadow-[0_1px_2px_rgba(0,0,0,0.04)] animate-slide-up">
            <div className="flex items-center gap-3">
              <span className="flex w-2.5 h-2.5 rounded-full bg-[#22C55E] relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75"></span>
              </span>
              <div className="text-xs font-bold flex flex-wrap gap-x-4 gap-y-1">
                <span>📢 3 new notices detected</span>
                <span>•</span>
                <span>TCS Placement deadline tomorrow</span>
                <span>•</span>
                <span>Exam schedule updated</span>
              </div>
            </div>
            <button 
              onClick={() => fetchItems(true)}
              className="text-[11px] font-extrabold hover:underline flex items-center gap-1.5 cursor-pointer text-[#166534]/80 hover:text-[#166534] dark:text-emerald-400/80 dark:hover:text-emerald-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Sync Live
            </button>
          </div>
        )}

        {/* 3. Metric Counter Cards */}
        <StatCards stats={stats} />

        {/* 4. Split Workspace Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start w-full">
          
          {/* Left Column: Upload Center (Static block) */}
          <div className="lg:col-span-1 flex flex-col gap-6 lg:sticky lg:top-8">
            <h3 className="text-sm font-extrabold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#1677FF]" /> Upload Center
            </h3>
            <FileUpload onItemExtracted={handleItemExtracted} />
          </div>

          {/* Right Column: Academic Inbox Feed */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Header controls & seed buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] dark:border-slate-800 pb-4">
              <h3 className="text-sm font-extrabold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#1677FF]" /> Academic Inbox Feed
              </h3>
              
              {items.length === 0 && !loading && (
                <button
                  onClick={handleSeedDemo}
                  className="cf-btn flex items-center gap-2 bg-[#1677FF] hover:bg-[#1677FF]/90 text-white text-xs px-4 py-2.5 rounded-[16px] transition-all cursor-pointer shadow-sm"
                >
                  Load Sandbox Mock Data
                </button>
              )}
            </div>

            {/* Starred Tasks pinned list at top */}
            {starredItems.length > 0 && activeNav === 'dashboard' && filterKey === 'all' && (
              <div className="flex flex-col gap-4 p-5 bg-amber-500/[0.03] dark:bg-amber-500/[0.01] border border-amber-200/60 dark:border-amber-800/40 rounded-[24px] animate-slide-up">
                <div className="flex items-center justify-between border-b border-amber-100 dark:border-amber-950/40 pb-2 mb-1">
                  <h4 className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5 select-none">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Starred Tasks ({starredItems.length})
                  </h4>
                  <span className="text-[10px] text-amber-500 dark:text-amber-400/80 font-semibold uppercase tracking-wider">
                    High Priority Focus Panel
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {starredItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onToggleComplete={handleToggleComplete}
                      onDeleteItem={handleDeleteItem}
                      onUpdatePriority={handleUpdatePriority}
                      onToggleStar={handleToggleStar}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quick Inbox Filters Panel */}
            {items.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto py-1.5 scrollbar-thin">
                {[
                  { key: 'all', label: 'All Tasks' },
                  { key: 'ASSIGNMENT', label: 'Assignments' },
                  { key: 'EXAM', label: 'Exams' },
                  { key: 'PLACEMENT', label: 'Placements' },
                  { key: 'EVENT', label: 'Events' },
                  { key: 'starred', label: '⭐ Starred' },
                  { key: 'high', label: '🔴 High Priority' }
                ].map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setFilterKey(filter.key)}
                    className={`text-[10px] font-black tracking-wider uppercase px-3.5 py-1.5 rounded-full transition-all cursor-pointer border shrink-0 ${
                      filterKey === filter.key
                        ? 'bg-[#1677FF] border-[#1677FF] text-white shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-850'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 cf-card bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-[24px]">
                <RefreshCw className="w-8 h-8 text-[#1677FF] animate-spin mb-3" />
                <p className="text-[#6B7280] dark:text-gray-400 text-sm">Syncing academic databases...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center cf-card bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-[24px] p-8">
                <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800/40 flex items-center justify-center border border-slate-100 dark:border-slate-800 text-[#6B7280] mb-4">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-[#111827] dark:text-slate-100 font-bold text-lg">No Tasks Found</h3>
                <p className="text-[#6B7280] dark:text-gray-450 text-xs max-w-sm mt-1">
                  There are no items matching the selected filters. Change filters or seed mock data to check dashboard functionality.
                </p>
                {items.length === 0 && (
                  <button
                    onClick={handleSeedDemo}
                    className="mt-6 cf-btn flex items-center gap-2 bg-[#1677FF]/10 hover:bg-[#1677FF]/20 border border-[#1677FF]/20 text-[#1677FF] text-xs px-4 py-2.5 rounded-[16px] transition-all"
                  >
                    Load Mock Academic Tasks
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
                {filteredItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onToggleComplete={handleToggleComplete}
                    onDeleteItem={handleDeleteItem}
                    onUpdatePriority={handleUpdatePriority}
                    onToggleStar={handleToggleStar}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
