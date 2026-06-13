'use client';

import React from 'react';
import { BookOpen, AlertCircle, CheckCircle2, Briefcase } from 'lucide-react';
import { DashboardStats } from '@/types';

interface StatCardsProps {
  stats: DashboardStats;
}

export default function StatCards({ stats }: StatCardsProps) {
  const cards = [
    {
      title: 'Active Inbox',
      value: stats.totalActive,
      icon: BookOpen,
      colorClass: 'text-[#1677FF]',
      description: 'Pending notifications & tasks',
    },
    {
      title: 'Assignments Due',
      value: stats.byCategory.ASSIGNMENT,
      icon: AlertCircle,
      colorClass: 'text-[#EF4444]',
      description: 'Require immediate submissions',
    },
    {
      title: 'Upcoming Exams',
      value: stats.byCategory.EXAM,
      icon: CheckCircle2,
      colorClass: 'text-[#F59E0B]',
      description: 'Schedules and quiz dates',
    },
    {
      title: 'Placement Opportunities',
      value: stats.byCategory.PLACEMENT,
      icon: Briefcase,
      colorClass: 'text-[#22C55E]',
      description: 'Active campus hiring windows',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
      {cards.map((card, i) => {
        const IconComponent = card.icon;
        return (
          <div 
            key={i} 
            className="cf-card bg-white border border-[#E5E7EB] rounded-[24px] p-8 flex flex-col items-center text-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]"
          >
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
              <IconComponent className={`w-6 h-6 ${card.colorClass}`} />
            </div>
            <div>
              <span className="text-3xl font-black text-[#111827] tracking-tight">
                {card.value}
              </span>
              <h4 className="text-xs font-bold text-[#6B7280] uppercase tracking-wider mt-1.5">
                {card.title}
              </h4>
            </div>
            <p className="text-[11px] text-[#9CA3AF] mt-3 font-medium">
              {card.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
