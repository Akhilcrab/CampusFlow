'use client';

import React from 'react';
import { Subject } from './AttendanceDashboard';
import { CheckCircle2, AlertTriangle, ShieldAlert, GraduationCap, XCircle, Percent, Target } from 'lucide-react';

interface AttendanceStatsProps {
  subjects: Subject[];
  targetPercent: number;
}

export default function AttendanceStats({ subjects, targetPercent }: AttendanceStatsProps) {
  const totalPresent = subjects.reduce((sum, s) => sum + s.present, 0);
  const totalClasses = subjects.reduce((sum, s) => sum + s.total, 0);
  const totalAbsent = totalClasses - totalPresent;
  
  const overallPercent = totalClasses > 0 ? (totalPresent / totalClasses) * 100 : 0;
  const overallPercentFormatted = overallPercent.toFixed(1);

  // Risk calculation rules
  let riskStatus: 'Safe' | 'Medium' | 'High' = 'Safe';
  let riskBadgeColor = 'bg-[#ECFDF5] dark:bg-emerald-950/20 border-[#A7F3D0] dark:border-emerald-800/30 text-[#065F46] dark:text-emerald-400';
  let riskText = 'Safe';
  let RiskIcon = CheckCircle2;

  if (overallPercent < 70) {
    riskStatus = 'High';
    riskBadgeColor = 'bg-[#FEF2F2] dark:bg-red-950/20 border-[#FEE2E2] dark:border-red-800/30 text-[#991B1B] dark:text-red-400';
    riskText = 'High Risk';
    RiskIcon = ShieldAlert;
  } else if (overallPercent < targetPercent) {
    riskStatus = 'Medium';
    riskBadgeColor = 'bg-[#FFFBEB] dark:bg-amber-950/20 border-[#FEF3C7] dark:border-amber-800/30 text-[#92400E] dark:text-amber-400';
    riskText = 'Medium Risk';
    RiskIcon = AlertTriangle;
  }

  const statCards = [
    {
      title: 'Overall Attendance',
      value: `${overallPercentFormatted}%`,
      subText: `${totalPresent} present / ${totalClasses} total`,
      icon: Percent,
      iconBg: 'bg-[#EFF6FF] dark:bg-blue-950/20 border-[#DBEAFE] dark:border-blue-900/50',
      iconColor: 'text-[#1677FF] dark:text-blue-400',
      footer: (
        <div className="w-full mt-3">
          <div className="w-full bg-[#E5E7EB] dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                riskStatus === 'High' ? 'bg-[#EF4444]' : riskStatus === 'Medium' ? 'bg-[#F59E0B]' : 'bg-[#22C55E]'
              }`}
              style={{ width: `${Math.min(overallPercent, 100)}%` }}
            />
          </div>
        </div>
      )
    },
    {
      title: 'Classes Logged',
      value: totalPresent.toString(),
      subText: `Out of ${totalClasses} classes`,
      icon: GraduationCap,
      iconBg: 'bg-[#F5F3FF] dark:bg-purple-950/20 border-[#EDE9FE] dark:border-purple-900/50',
      iconColor: 'text-[#8B5CF6] dark:text-purple-400',
      footer: (
        <p className="text-[11px] text-[#9CA3AF] dark:text-gray-400 mt-3 font-medium">
          Total academic lecture metrics logged
        </p>
      )
    },
    {
      title: 'Absent Classes',
      value: totalAbsent.toString(),
      subText: `${((totalAbsent / (totalClasses || 1)) * 100).toFixed(0)}% of total lectures missed`,
      icon: XCircle,
      iconBg: 'bg-[#FEF2F2] dark:bg-red-950/20 border-[#FEE2E2] dark:border-red-900/50',
      iconColor: 'text-[#EF4444] dark:text-red-400',
      footer: (
        <p className="text-[11px] text-[#9CA3AF] dark:text-gray-400 mt-3 font-medium">
          Missing more lectures increases risk levels
        </p>
      )
    },
    {
      title: 'Target vs Risk',
      value: `${targetPercent}% Target`,
      subText: 'Requirement threshold',
      icon: Target,
      iconBg: 'bg-[#FFFBEB] dark:bg-amber-950/20 border-[#FEF3C7] dark:border-amber-900/50',
      iconColor: 'text-[#F59E0B] dark:text-amber-400',
      footer: (
        <div className="mt-3 flex items-center justify-center">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all duration-300 ${riskBadgeColor}`}>
            <RiskIcon className="w-3.5 h-3.5" />
            {riskText}
          </span>
        </div>
      )
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full animate-slide-up">
      {statCards.map((card, i) => {
        const IconComponent = card.icon;
        return (
          <div 
            key={i} 
            className="cf-card bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-[24px] p-6 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)]"
          >
            <div className="flex items-center justify-between w-full mb-3">
              <span className="text-2xl font-black text-[#111827] dark:text-slate-100 tracking-tight">
                {card.value}
              </span>
              <div className={`w-9 h-9 rounded-full border flex items-center justify-center ${card.iconBg}`}>
                <IconComponent className={`w-4 h-4 ${card.iconColor}`} />
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
                {card.title}
              </h4>
              <p className="text-xs text-[#9CA3AF] dark:text-gray-500 mt-0.5 font-medium">
                {card.subText}
              </p>
            </div>
            {card.footer}
          </div>
        );
      })}
    </div>
  );
}
