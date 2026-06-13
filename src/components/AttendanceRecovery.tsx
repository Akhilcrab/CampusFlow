'use client';

import React from 'react';
import { Subject } from './AttendanceDashboard';
import { Sparkles, CheckCircle2, ChevronRight, AlertTriangle } from 'lucide-react';

interface AttendanceRecoveryProps {
  subjects: Subject[];
  targetPercent: number;
}

export default function AttendanceRecovery({ subjects, targetPercent }: AttendanceRecoveryProps) {
  
  const calculateRecovery = (present: number, total: number, target: number) => {
    if (total === 0) return { classesNeeded: 0, projectedPercent: 0 };
    const currentPercent = (present / total) * 100;
    
    if (currentPercent >= target) {
      return { classesNeeded: 0, projectedPercent: currentPercent };
    }
    
    const t = target / 100;
    const x = Math.ceil((t * total - present) / (1 - t));
    const classesNeeded = Math.max(0, x);
    
    const projectedPercent = ((present + classesNeeded) / (total + classesNeeded)) * 100;
    
    return {
      classesNeeded,
      projectedPercent
    };
  };

  // Filter subjects below required target threshold
  const belowThresholdSubjects = subjects.filter(
    sub => (sub.total > 0 ? (sub.present / sub.total) * 100 : 0) < targetPercent
  );

  return (
    <div className="cf-card bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-[24px] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] w-full flex flex-col gap-5">
      <div>
        <h3 className="text-sm font-extrabold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#8B5CF6] dark:text-purple-400" /> Recovery Prediction Engine
        </h3>
        <p className="text-xs text-[#9CA3AF] dark:text-gray-500 mt-0.5 font-medium">
          AI-generated recovery metrics outlining consecutive lectures required to hit targets.
        </p>
      </div>

      {belowThresholdSubjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 px-4 border border-dashed border-[#A7F3D0] dark:border-emerald-800/40 bg-[#ECFDF5]/50 dark:bg-emerald-950/10 rounded-[18px] text-center">
          <CheckCircle2 className="w-10 h-10 text-[#059669] dark:text-emerald-400 mb-2.5" />
          <h4 className="text-sm font-extrabold text-[#065F46] dark:text-emerald-400">Excellent Status Dashboard</h4>
          <p className="text-xs text-[#047857] dark:text-emerald-550 mt-1 max-w-md font-semibold">
            All subjects are currently sitting comfortably at or above your required {targetPercent}% ERP threshold. No recovery actions are required.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {belowThresholdSubjects.map(subject => {
            const currentPercent = subject.total > 0 ? (subject.present / subject.total) * 100 : 0;
            const { classesNeeded, projectedPercent } = calculateRecovery(subject.present, subject.total, targetPercent);
            
            return (
              <div 
                key={subject.id} 
                className="p-5 border border-[#E5E7EB] dark:border-slate-800 rounded-[18px] bg-slate-50/20 dark:bg-slate-800/10 hover:border-[#8B5CF6] dark:hover:border-purple-900/60 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <span className="font-extrabold text-sm text-[#111827] dark:text-slate-200 truncate">
                      {subject.name}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF2F2] dark:bg-red-950/20 border border-[#FEE2E2] dark:border-red-900/30 text-[#EF4444] dark:text-red-400 shrink-0">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      Below Limit ({currentPercent.toFixed(0)}%)
                    </span>
                  </div>
                  
                  <div className="flex items-baseline gap-1 mt-3">
                    <span className="text-3xl font-black text-[#8B5CF6] dark:text-purple-400 tracking-tight">
                      {classesNeeded}
                    </span>
                    <span className="text-xs font-extrabold text-[#6B7280] dark:text-gray-400">
                      Consecutive Classes
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9CA3AF] dark:text-gray-500 mt-1 font-semibold">
                    Must attend next {classesNeeded} lectures without absence.
                  </p>
                </div>

                <div className="border-t border-[#E5E7EB] dark:border-slate-800 border-dashed pt-3 mt-4 flex items-center justify-between text-[11px]">
                  <span className="text-[#6B7280] dark:text-gray-400 font-semibold">
                    Current: <strong className="text-[#111827] dark:text-slate-200 font-bold">{subject.present}/{subject.total}</strong>
                  </span>
                  
                  <span className="flex items-center gap-1 text-[#059669] dark:text-emerald-450 font-bold">
                    Projected <ChevronRight className="w-3 h-3 text-[#9CA3AF] dark:text-gray-500" /> {projectedPercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
