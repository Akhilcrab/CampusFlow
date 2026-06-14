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
      description: 'Pending notifications & tasks',
    },
    {
      title: 'Assignments Due',
      value: stats.byCategory.ASSIGNMENT,
      icon: AlertCircle,
      description: 'Require immediate submissions',
    },
    {
      title: 'Upcoming Exams',
      value: stats.byCategory.EXAM,
      icon: CheckCircle2,
      description: 'Schedules and quiz dates',
    },
    {
      title: 'Placement Openings',
      value: stats.byCategory.PLACEMENT,
      icon: Briefcase,
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
            className="group relative overflow-hidden rounded-[28px] border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-8 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] backdrop-blur-md"
          >
            <div className="flex items-start justify-between w-full mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                <IconComponent className="w-5 h-5" />
              </div>
            </div>
            
            <div className="flex flex-col items-start">
              <span className="text-5xl font-bold text-slate-900 dark:text-white tracking-tight font-display mb-1.5">
                {card.value}
              </span>
              <h4 className="text-[18px] font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                {card.title}
              </h4>
              <p className="text-[14px] text-slate-400 dark:text-slate-500 mt-1 font-medium leading-normal">
                {card.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
