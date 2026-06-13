'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AttendanceDashboard from '@/components/AttendanceDashboard';
import { Sun, Moon } from 'lucide-react';

export default function AttendancePage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

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

  return (
    <div className="w-full min-h-screen bg-[#F5F5F7] dark:bg-[#090D16] px-6 py-8 flex flex-col gap-8 transition-colors duration-300">
      {/* 1. Floating Top Navigation Bar (Consistent with Dashboard.tsx) */}
      <header className="w-full max-w-7xl mx-auto bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-[24px] px-6 py-4 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] transition-all">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#1677FF] flex items-center justify-center font-black text-white text-sm">
              CF
            </span>
            <span className="font-extrabold text-[#111827] dark:text-slate-100 text-base tracking-tight">
              CampusFlow<span className="text-[#1677FF]">.ai</span>
            </span>
          </Link>
        </div>

        {/* Floating rounded link tabs */}
        <nav className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1">
          {[
            { key: 'dashboard', label: 'Dashboard', href: '/?tab=dashboard' },
            { key: 'inbox', label: 'Inbox', href: '/?tab=inbox' },
            { key: 'assignments', label: 'Assignments', href: '/?tab=assignments' },
            { key: 'placements', label: 'Placements', href: '/?tab=placements' }
          ].map(tab => (
            <Link
              key={tab.key}
              href={tab.href}
              className="text-xs font-bold px-4 py-2 rounded-[16px] transition-all cursor-pointer text-[#6B7280] dark:text-gray-400 hover:text-[#111827] dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850"
            >
              {tab.label}
            </Link>
          ))}
          <Link
            href="/attendance"
            className="text-xs font-bold px-4 py-2 rounded-[16px] transition-all cursor-pointer bg-slate-100 dark:bg-slate-800 text-[#111827] dark:text-slate-100 flex items-center gap-1"
          >
            📊 Attendance
          </Link>
        </nav>

        {/* Action Panel: Theme Switcher & Live Alerts */}
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
              <Sun className="w-4 h-4 text-amber-500" />
            )}
          </button>

          <span className="text-xs font-bold bg-[#F0FDF4] dark:bg-emerald-950/10 border border-[#BBF7D0] dark:border-emerald-800/30 text-[#166534] dark:text-emerald-400 px-3 py-1.5 rounded-[12px] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] relative flex">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#22C55E]"></span>
            </span>
            Live Sync Active
          </span>
        </div>
      </header>

      {/* 2. Main Attendance Content */}
      <main className="w-full max-w-7xl mx-auto flex flex-col gap-8 animate-slide-up">
        <AttendanceDashboard />
      </main>
    </div>
  );
}
