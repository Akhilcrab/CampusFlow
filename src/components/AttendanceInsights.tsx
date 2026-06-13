'use client';

import React from 'react';
import { Subject } from './AttendanceDashboard';
import { Brain, Sparkles, CheckCircle } from 'lucide-react';

interface AttendanceInsightsProps {
  subjects: Subject[];
  targetPercent: number;
}

export default function AttendanceInsights({ subjects, targetPercent }: AttendanceInsightsProps) {
  
  // Calculate miss counts
  const getCanMissCount = (present: number, total: number, target: number) => {
    const t = target / 100;
    if (total === 0) return 0;
    if ((present / total) * 100 < target) return 0;
    return Math.max(0, Math.floor(present / t - total));
  };

  // Calculate recovery counts
  const getRecoveryCount = (present: number, total: number, target: number) => {
    if (total === 0) return 0;
    if ((present / total) * 100 >= target) return 0;
    const t = target / 100;
    return Math.max(0, Math.ceil((t * total - present) / (1 - t)));
  };

  // Analyze subjects
  const criticalSubjects = subjects.filter(s => (s.total > 0 ? (s.present / s.total) * 100 : 0) < 70);
  const warningSubjects = subjects.filter(s => {
    const pct = s.total > 0 ? (s.present / s.total) * 100 : 0;
    return pct >= 70 && pct < targetPercent;
  });
  const safeSubjects = subjects.filter(s => (s.total > 0 ? (s.present / s.total) * 100 : 0) >= targetPercent);

  // Recommendations builder
  const recommendations: string[] = [];
  
  // 1. Critical subjects recommendations
  criticalSubjects.forEach(s => {
    const recovery = getRecoveryCount(s.present, s.total, targetPercent);
    if (recovery > 0) {
      recommendations.push(`Attend next **${recovery}** ${s.name} lectures to reach ${targetPercent}%.`);
    }
  });

  // 2. Warning subjects recommendations
  warningSubjects.forEach(s => {
    const recovery = getRecoveryCount(s.present, s.total, targetPercent);
    if (recovery > 0) {
      recommendations.push(`Maintain progress in **${s.name}** (attend next ${recovery} classes to secure your standing).`);
    }
  });

  // 3. Safe subjects to miss recommendations
  safeSubjects.forEach(s => {
    const canMiss = getCanMissCount(s.present, s.total, targetPercent);
    if (canMiss > 0) {
      recommendations.push(`You can safely miss up to **${canMiss} ${s.name}** ${canMiss === 1 ? 'class' : 'classes'} if needed.`);
    }
  });

  // General weekly highlight recommendation
  if (criticalSubjects.length > 0) {
    recommendations.push(`Prioritize **${criticalSubjects.map(s => s.name).join(' & ')}** lectures this week.`);
  }

  // Build the main analysis text block
  let analysisText = '';
  if (criticalSubjects.length > 0) {
    const criticalList = criticalSubjects.map(s => `**${s.name}** (${Math.round((s.present/s.total)*100)}%)`).join(', ');
    analysisText = `Your attendance in ${criticalList} is critically low. You have missed several lectures, making recovery in these subjects highly time-sensitive.`;
  } else if (warningSubjects.length > 0) {
    const warningList = warningSubjects.map(s => `**${s.name}** (${Math.round((s.present/s.total)*100)}%)`).join(', ');
    analysisText = `You are slightly below the target threshold in ${warningList}. Prioritizing these courses now will prevent them from falling into the high-risk zone.`;
  } else {
    analysisText = `Fantastic status! All subjects are at or above the target required ${targetPercent}% threshold. You have optimized your scheduling safety margins.`;
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#EFF6FF] via-[#F5F3FF] to-[#FAF5FF] border border-[#E8E2FA] rounded-[24px] p-6 shadow-[0_4px_20px_rgba(139,92,246,0.06),0_1px_2px_rgba(0,0,0,0.02)] w-full">
      {/* Background soft glow decoration */}
      <div className="absolute -right-10 -top-10 w-28 h-28 bg-[#8B5CF6]/5 rounded-full blur-xl pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 w-28 h-28 bg-[#1677FF]/5 rounded-full blur-xl pointer-events-none" />

      {/* Title */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1677FF] to-[#8B5CF6] flex items-center justify-center text-white shadow-sm">
          <Brain className="w-4.5 h-4.5" />
        </div>
        <div>
          <h3 className="text-xs font-black text-[#8B5CF6] uppercase tracking-widest flex items-center gap-1">
            CampusFlow Insight <Sparkles className="w-3 h-3 text-[#8B5CF6] animate-pulse" />
          </h3>
          <span className="text-[10px] text-[#6B7280] font-semibold block">
            AI-Powered Co-Pilot analysis
          </span>
        </div>
      </div>

      {/* Analysis Content */}
      <p className="text-xs text-[#4B5563] leading-relaxed font-medium">
        {analysisText.split('**').map((chunk, index) => 
          index % 2 === 1 ? <strong key={index} className="text-[#111827] font-bold">{chunk}</strong> : chunk
        )}
      </p>

      {/* Actionable recommendations list */}
      <div className="mt-5 pt-4 border-t border-[#E5E7EB] border-dashed">
        <h4 className="text-[10px] font-black text-[#6B7280] uppercase tracking-wider mb-2.5">
          Recommended Actions
        </h4>

        {recommendations.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-[#059669] font-bold">
            <CheckCircle className="w-4 h-4" />
            No immediate alerts. Keep attending all lectures!
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex gap-2 text-xs text-[#4B5563] font-medium leading-normal">
                <span className="text-[#8B5CF6] mt-0.5 font-black">•</span>
                <span>
                  {rec.split('**').map((chunk, index) => 
                    index % 2 === 1 ? <strong key={index} className="text-[#111827] font-bold">{chunk}</strong> : chunk
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
