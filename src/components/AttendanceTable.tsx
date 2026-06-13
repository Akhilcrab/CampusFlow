'use client';

import React from 'react';
import { Subject } from './AttendanceDashboard';
import { Plus, Minus, Check, X, ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface AttendanceTableProps {
  subjects: Subject[];
  targetPercent: number;
  onAddPresent: (id: string) => void;
  onAddAbsent: (id: string) => void;
  onRemovePresent: (id: string) => void;
  onRemoveAbsent: (id: string) => void;
}

export default function AttendanceTable({
  subjects,
  targetPercent,
  onAddPresent,
  onAddAbsent,
  onRemovePresent,
  onRemoveAbsent
}: AttendanceTableProps) {
  
  const getProgressColor = (percent: number) => {
    if (percent < 70) return 'bg-[#EF4444]'; // Red
    if (percent < targetPercent) return 'bg-[#F59E0B]'; // Amber
    if (percent < 80) return 'bg-[#3B82F6]'; // Blue
    return 'bg-[#22C55E]'; // Green
  };

  const getRiskBadge = (percent: number) => {
    if (percent < 70) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[10px] text-[10px] font-bold bg-[#FEF2F2] dark:bg-red-950/20 border border-[#FEE2E2] dark:border-red-900/30 text-[#EF4444]">
          <ShieldAlert className="w-3 h-3 shrink-0" /> High Risk
        </span>
      );
    }
    if (percent < targetPercent) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[10px] text-[10px] font-bold bg-[#FFFBEB] dark:bg-amber-950/20 border border-[#FEF3C7] dark:border-amber-900/30 text-[#D97706] dark:text-amber-400">
          <AlertTriangle className="w-3 h-3 shrink-0" /> Medium Risk
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[10px] text-[10px] font-bold bg-[#ECFDF5] dark:bg-emerald-950/20 border border-[#A7F3D0] dark:border-emerald-900/30 text-[#059669] dark:text-emerald-450">
        <CheckCircle2 className="w-3 h-3 shrink-0" /> Safe
      </span>
    );
  };

  const getPriorityBadge = (percent: number) => {
    if (percent < 70) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase bg-[#FEF2F2] dark:bg-red-950/10 text-[#EF4444] border border-[#EF4444]/20">
          🔴 Critical
        </span>
      );
    }
    if (percent < 75) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase bg-[#FFFBEB] dark:bg-orange-950/10 text-[#D97706] dark:text-amber-400 border border-[#D97706]/20">
          🟠 High
        </span>
      );
    }
    if (percent < 80) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase bg-[#EFF6FF] dark:bg-blue-950/10 text-[#2563EB] dark:text-blue-400 border border-[#2563EB]/20">
          🟡 Medium
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase bg-[#ECFDF5] dark:bg-emerald-950/10 text-[#059669] dark:text-emerald-400 border border-[#059669]/20">
        🟢 Safe
      </span>
    );
  };

  return (
    <div className="cf-card bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-[24px] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] w-full">
      <div className="flex items-center justify-between border-b border-[#E5E7EB] dark:border-slate-800 pb-4 mb-5">
        <div>
          <h3 className="text-sm font-extrabold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider">
            📚 Subject-Wise Academic Ingestion
          </h3>
          <p className="text-xs text-[#9CA3AF] dark:text-gray-500 mt-0.5 font-medium">
            Log lectures and monitor status thresholds in real-time.
          </p>
        </div>
      </div>

      {/* Table List */}
      <div className="flex flex-col gap-4">
        {subjects.map((subject) => {
          const attendancePercent = subject.total > 0 ? (subject.present / subject.total) * 100 : 0;
          const roundedPercent = Math.round(attendancePercent);
          
          return (
            <div 
              key={subject.id} 
              className="group p-4 border border-[#E5E7EB] dark:border-slate-800/80 rounded-[18px] hover:border-[#1677FF] dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Subject details & progress bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-2 mb-1.5">
                  <h4 className="font-extrabold text-sm text-[#111827] dark:text-slate-200 truncate">
                    {subject.name}
                  </h4>
                  <div className="flex items-center gap-1.5">
                    {getRiskBadge(attendancePercent)}
                    {getPriorityBadge(attendancePercent)}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full">
                  <div className="flex-1 bg-[#E5E7EB] dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${getProgressColor(attendancePercent)}`}
                      style={{ width: `${Math.min(attendancePercent, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-black text-[#111827] dark:text-slate-100 min-w-[34px] text-right">
                    {roundedPercent}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#6B7280] dark:text-gray-400 font-semibold mt-1.5">
                  <span>Present: <strong className="text-[#111827] dark:text-slate-200 font-bold">{subject.present}</strong> / Total: <strong className="text-[#111827] dark:text-slate-200 font-bold">{subject.total}</strong></span>
                  <span>Absent: <strong className="text-[#EF4444] dark:text-red-400 font-bold">{subject.total - subject.present}</strong></span>
                </div>
              </div>

              {/* Attendance quick logging buttons */}
              <div className="flex items-center justify-end gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-dashed border-[#E5E7EB] dark:border-slate-800">
                {/* Present log controls */}
                <div className="flex flex-col gap-1 items-center">
                  <span className="text-[10px] font-extrabold text-[#6B7280]">Present</span>
                  <div className="flex items-center bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-lg p-0.5 shadow-sm">
                    <button
                      onClick={() => onRemovePresent(subject.id)}
                      disabled={subject.present === 0}
                      className="p-1 text-[#6B7280] dark:text-gray-400 hover:text-[#EF4444] dark:hover:text-red-400 disabled:opacity-30 transition-colors cursor-pointer"
                      title="Undo Present Class"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onAddPresent(subject.id)}
                      className="p-1 text-[#059669] dark:text-emerald-450 hover:bg-[#E6F4EA] dark:hover:bg-emerald-950/20 rounded-md transition-all cursor-pointer flex items-center gap-0.5"
                      title="Log Present Class"
                    >
                      <Plus className="w-3 h-3" />
                      <Check className="w-2.5 h-2.5 font-extrabold" />
                    </button>
                  </div>
                </div>

                {/* Absent log controls */}
                <div className="flex flex-col gap-1 items-center">
                  <span className="text-[10px] font-extrabold text-[#6B7280]">Absent</span>
                  <div className="flex items-center bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-lg p-0.5 shadow-sm">
                    <button
                      onClick={() => onRemoveAbsent(subject.id)}
                      disabled={subject.total <= subject.present}
                      className="p-1 text-[#6B7280] dark:text-gray-400 hover:text-[#EF4444] dark:hover:text-red-400 disabled:opacity-30 transition-colors cursor-pointer"
                      title="Undo Absent Class"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onAddAbsent(subject.id)}
                      className="p-1 text-[#D97706] dark:text-amber-500 hover:bg-[#FEF3C7] dark:hover:bg-amber-950/20 rounded-md transition-all cursor-pointer flex items-center gap-0.5"
                      title="Log Absent Class"
                    >
                      <Plus className="w-3 h-3" />
                      <X className="w-2.5 h-2.5 font-extrabold" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
