'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ExtractedItemWithReminders, DashboardStats } from '@/types';
import FileUpload from './FileUpload';
import StatCards from './StatCards';
import ItemCard from './ItemCard';
import NotificationManager from './NotificationManager';
import { Calendar, BookOpen, Layers, RefreshCw, Sun, Moon, Star } from 'lucide-react';
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
    <div className="w-full min-h-screen px-4 md:px-8 py-8 flex flex-col gap-10 transition-colors duration-300">
      
      {/* 1. Premium Top Navigation Bar */}
      <header className="w-full max-w-7xl mx-auto bg-white/50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 rounded-[24px] px-6 py-4 flex items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.15)] backdrop-blur-md transition-all select-none">
        
        {/* Sleek logo branding */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-slate-950 dark:bg-white flex items-center justify-center text-white dark:text-slate-950 font-black text-xs font-display">
            C
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight font-display">
            CampusFlow<span className="text-slate-400 dark:text-slate-500 font-medium">.ai</span>
          </span>
        </div>

        {/* Floating rounded link tabs */}
        <nav className="hidden md:flex items-center gap-1">
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
              className={`text-xs font-bold px-4 py-2 rounded-full transition-all duration-200 cursor-pointer ${
                activeNav === tab.key
                  ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <Link
            href="/attendance"
            className="text-xs font-bold px-4 py-2 rounded-full transition-all duration-200 cursor-pointer text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 flex items-center gap-1"
          >
            📊 Attendance
          </Link>
        </nav>

        {/* Action Panel: Light/Dark Switcher & Live Alerts */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full border border-slate-200/60 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-sm"
            title="Toggle Light/Dark Mode"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-slate-700 dark:text-slate-350" />
            ) : (
              <Sun className="w-4 h-4 text-slate-300" />
            )}
          </button>

          <NotificationManager items={items} onReminderTriggered={handleReminderTriggered} />
        </div>
      </header>

      {/* Mobile navigation row (visible only on small screens) */}
      <div className="md:hidden w-full max-w-7xl mx-auto flex items-center justify-center gap-1 border border-slate-200/60 dark:border-slate-800/60 bg-white/30 dark:bg-slate-900/30 rounded-full p-1.5 backdrop-blur-md">
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
              setFilterKey('all');
            }}
            className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer ${
              activeNav === tab.key
                ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 shadow-sm'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 2. Unified Grid Layout Container */}
      <main className="w-full max-w-7xl mx-auto flex flex-col gap-10">
        
        {/* Dynamic Notification Banner */}
        {items.length > 0 && (
          <div className="w-full bg-emerald-50/60 dark:bg-emerald-950/10 border border-emerald-100/60 dark:border-emerald-900/30 rounded-[24px] p-5 flex items-center justify-between text-emerald-700 dark:text-emerald-400 shadow-[0_1px_2px_rgba(0,0,0,0.02)] backdrop-blur-sm animate-slide-up select-none">
            <div className="flex items-center gap-3">
              <span className="flex w-2 h-2 rounded-full bg-emerald-500 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
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
              className="text-[11px] font-extrabold hover:underline flex items-center gap-1.5 cursor-pointer text-emerald-700/80 hover:text-emerald-700 dark:text-emerald-450/80 dark:hover:text-emerald-350"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Sync Live
            </button>
          </div>
        )}

        {/* HERO & QUICK ACTIONS FOR DASHBOARD LANDING */}
        {activeNav === 'dashboard' && (
          <div className="flex flex-col gap-10 w-full animate-fade-in-up">
            {/* HERO SECTION */}
            <div className="flex flex-col items-center text-center px-4 pt-8 pb-2 max-w-3xl mx-auto">
              <h1 className="text-[40px] sm:text-[56px] md:text-[80px] font-extrabold tracking-tight text-slate-900 dark:text-white leading-[0.95] font-display select-none">
                CampusFlow
              </h1>
              <p className="text-[18px] sm:text-[20px] md:text-[24px] font-bold text-slate-800 dark:text-slate-200 mt-5 tracking-tight font-display">
                AI-Powered Academic Command Center
              </p>
              <p className="text-[14px] sm:text-[16px] text-slate-450 dark:text-slate-500 mt-3 max-w-[650px] leading-relaxed font-medium">
                Automatically organize assignments, exams, placements, notices, and events from WhatsApp exports and screenshots.
              </p>
            </div>

            {/* QUICK ACTIONS SECTION */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl mx-auto px-4 select-none">
              
              {/* WhatsApp Card */}
              <div 
                onClick={() => {
                  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                  if (fileInput) {
                    fileInput.accept = ".txt,text/plain";
                    fileInput.click();
                  }
                }}
                className="group relative cursor-pointer overflow-hidden rounded-[28px] border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-7 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 transition-colors group-hover:bg-slate-100 dark:group-hover:bg-slate-800">
                  <svg className="h-5 w-5 text-slate-650 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785 4.5 4.5 0 0 0 2.212-.497 2 2 0 0 1 1.7.15c1.05.59 2.285.923 3.602.923Z" />
                  </svg>
                </div>
                <h3 className="text-[18px] font-bold text-slate-900 dark:text-white tracking-tight">Upload WhatsApp</h3>
                <p className="mt-1 text-[14px] text-slate-400 dark:text-slate-500 leading-normal font-medium">
                  Drop your text file chat exports to automatically extract tasks.
                </p>
              </div>

              {/* Screenshot Card */}
              <div 
                onClick={() => {
                  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                  if (fileInput) {
                    fileInput.accept = "image/*";
                    fileInput.click();
                  }
                }}
                className="group relative cursor-pointer overflow-hidden rounded-[28px] border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-7 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 transition-colors group-hover:bg-slate-100 dark:group-hover:bg-slate-800">
                  <svg className="h-5 w-5 text-slate-650 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                  </svg>
                </div>
                <h3 className="text-[18px] font-bold text-slate-900 dark:text-white tracking-tight">Upload Screenshot</h3>
                <p className="mt-1 text-[14px] text-slate-400 dark:text-slate-500 leading-normal font-medium">
                  Extract dates, info, and deadlines directly from screenshots.
                </p>
              </div>

              {/* Open Inbox Card */}
              <div 
                onClick={() => {
                  setActiveNav('inbox');
                  setFilterKey('all');
                }}
                className="group relative cursor-pointer overflow-hidden rounded-[28px] border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-7 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 transition-colors group-hover:bg-slate-100 dark:group-hover:bg-slate-800">
                  <svg className="h-5 w-5 text-slate-650 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </div>
                <h3 className="text-[18px] font-bold text-slate-900 dark:text-white tracking-tight">Open Inbox</h3>
                <p className="mt-1 text-[14px] text-slate-400 dark:text-slate-500 leading-normal font-medium">
                  View your parsed updates, sorted by urgency and priority.
                </p>
              </div>

              {/* View Placements Card */}
              <div 
                onClick={() => {
                  setActiveNav('placements');
                  setFilterKey('all');
                }}
                className="group relative cursor-pointer overflow-hidden rounded-[28px] border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-7 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 transition-colors group-hover:bg-slate-100 dark:group-hover:bg-slate-800">
                  <svg className="h-5 w-5 text-slate-650 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 .621-.504 1.125-1.125 1.125H4.875A1.125 1.125 0 0 1 3.75 18.4V14.15m16.5 0c0-1.224-1.007-2.12-2.25-2.03a47.241 47.241 0 0 0-12 0c-1.243-.09-2.25.806-2.25 2.03m16.5 0V7.875c0-.621-.504-1.125-1.125-1.125H16.5M3.75 14.15V7.875c0-.621.504-1.125 1.125-1.125H7.5m3 13.5v-3.75m0-.005a1.5 1.5 0 0 1 3 0v3.75m-9.75-13.5c.504 0 .908-.404.908-.908V5.03c0-.504-.404-.908-.908-.908H4.872c-.504 0-.908.404-.908.908v1.077c0 .504.404.908.908.908h1.128ZM19.128 6.75c.504 0 .908-.404.908-.908V5.03c0-.504-.404-.908-.908-.908h-1.128c-.504 0-.908.404-.908.908v1.077c0 .504.404.908.908.908h1.128ZM12 6.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
                  </svg>
                </div>
                <h3 className="text-[18px] font-bold text-slate-900 dark:text-white tracking-tight">View Placements</h3>
                <p className="mt-1 text-[14px] text-slate-400 dark:text-slate-500 leading-normal font-medium">
                  Track campus placement status, interviews, and company alerts.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3. Metric Counter Cards */}
        <div className="animate-fade-in-up">
          <StatCards stats={stats} />
        </div>

        {/* 4. Split Workspace Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start w-full">
          
          {/* Left Column: Upload Center */}
          <div className="lg:col-span-1 flex flex-col gap-6 lg:sticky lg:top-8 animate-fade-in-up">
            <h2 className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight font-display">
              Upload Center
            </h2>
            <FileUpload onItemExtracted={handleItemExtracted} />
          </div>

          {/* Right Column: Academic Inbox Feed */}
          <div className="lg:col-span-2 flex flex-col gap-6 animate-fade-in-up">
            
            {/* Header controls & seed buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
              <h2 className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight font-display">
                Academic Inbox
              </h2>
              
              {items.length === 0 && !loading && (
                <button
                  onClick={handleSeedDemo}
                  className="bg-slate-950 dark:bg-white hover:bg-slate-900 dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-bold px-4.5 py-2.5 rounded-full transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  Load Sandbox Mock Data
                </button>
              )}
            </div>

            {/* Starred Tasks pinned list at top */}
            {starredItems.length > 0 && activeNav === 'dashboard' && filterKey === 'all' && (
              <div className="flex flex-col gap-4 p-6 bg-amber-500/[0.02] dark:bg-amber-500/[0.01] border border-amber-200/50 dark:border-amber-900/30 rounded-[28px] animate-slide-up">
                <div className="flex items-center justify-between border-b border-amber-100 dark:border-amber-950/20 pb-2 mb-1">
                  <h4 className="text-[12px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5 select-none">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Starred Tasks ({starredItems.length})
                  </h4>
                  <span className="text-[10px] text-amber-500/80 dark:text-amber-400/80 font-bold uppercase tracking-wider">
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
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none select-none">
                {[
                  { key: 'all', label: 'All Tasks' },
                  { key: 'ASSIGNMENT', label: 'Assignments' },
                  { key: 'EXAM', label: 'Exams' },
                  { key: 'PLACEMENT', label: 'Placements' },
                  { key: 'EVENT', label: 'Events' },
                  { key: 'starred', label: 'Starred' },
                  { key: 'high', label: 'High Priority' }
                ].map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setFilterKey(filter.key)}
                    className={`text-[12px] font-semibold px-4 py-1.5 rounded-full transition-all duration-200 cursor-pointer border shrink-0 ${
                      filterKey === filter.key
                        ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900 shadow-sm'
                        : 'bg-white/60 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-[28px] backdrop-blur-md">
                <RefreshCw className="w-6 h-6 text-slate-800 dark:text-white animate-spin mb-3" />
                <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">Syncing academic databases...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 rounded-[28px] p-8 backdrop-blur-md">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-4 text-slate-500">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-slate-900 dark:text-white font-bold text-base tracking-tight">No Tasks Found</h3>
                <p className="text-slate-450 dark:text-slate-500 text-xs mt-1.5 max-w-xs leading-relaxed font-medium">
                  There are no items matching the selected filters. Change filters or seed mock data to check dashboard functionality.
                </p>
                {items.length === 0 && (
                  <button
                    onClick={handleSeedDemo}
                    className="mt-6 bg-slate-950 dark:bg-white hover:bg-slate-900 dark:hover:bg-slate-100 text-white dark:text-slate-950 text-xs font-bold px-4 py-2.5 rounded-full transition-all"
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
