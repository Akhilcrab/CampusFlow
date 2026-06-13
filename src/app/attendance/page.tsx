'use client';

import React from 'react';
import Link from 'next/link';
import AttendanceDashboard from '@/components/AttendanceDashboard';

export default function AttendancePage() {
  return (
    <div className="w-full min-h-screen bg-[#F5F5F7] px-6 py-8 flex flex-col gap-8">
      {/* 1. Floating Top Navigation Bar (Consistent with Dashboard.tsx) */}
      <header className="w-full max-w-7xl mx-auto bg-white border border-[#E5E7EB] rounded-[24px] px-6 py-4 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] transition-all">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#1677FF] flex items-center justify-center font-black text-white text-sm">
              CF
            </span>
            <span className="font-extrabold text-[#111827] text-base tracking-tight">
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
              className="text-xs font-bold px-4 py-2 rounded-[16px] transition-all cursor-pointer text-[#6B7280] hover:text-[#111827] hover:bg-slate-50"
            >
              {tab.label}
            </Link>
          ))}
          <Link
            href="/attendance"
            className="text-xs font-bold px-4 py-2 rounded-[16px] transition-all cursor-pointer bg-slate-100 text-[#111827] flex items-center gap-1"
          >
            📊 Attendance
          </Link>
        </nav>

        {/* Live Alerts Status Info */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] px-3 py-1.5 rounded-[12px] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] relative flex">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#22C55E]"></span>
            </span>
            Live Sync Active
          </span>
        </div>
      </header>

      {/* 2. Main Attendance Content */}
      <main className="w-full max-w-7xl mx-auto flex flex-col gap-8">
        <AttendanceDashboard />
      </main>
    </div>
  );
}
