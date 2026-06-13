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
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[10px] text-[10px] font-bold bg-[#FEF2F2] border border-[#FEE2E2] text-[#EF4444]">
          <ShieldAlert className="w-3 h-3" /> High Risk
        </span>
      );
    }
    if (percent < targetPercent) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[10px] text-[10px] font-bold bg-[#FFFBEB] border border-[#FEF3C7] text-[#D97706]">
          <AlertTriangle className="w-3 h-3" /> Medium Risk
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[10px] text-[10px] font-bold bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669]">
        <CheckCircle2 className="w-3 h-3" /> Safe
      </span>
    );
  };

  const getPriorityBadge = (percent: number) => {
    if (percent < 70) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase bg-[#FEF2F2] text-[#EF4444] border border-[#EF4444]/20">
          🔴 Critical
        </span>
      );
    }
    if (percent < 75) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase bg-[#FFFBEB] text-[#D97706] border border-[#D97706]/20">
          🟠 High
        </span>
      );
    }
    if (percent < 80) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/20">
          🟡 Medium
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase bg-[#ECFDF5] text-[#059669] border border-[#059669]/20">
        🟢 Safe
      </span>
    );
  };

  return (
    <div className="cf-card bg-white border border-[#E5E7EB] rounded-[24px] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] w-full">
      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4 mb-5">
        <div>
          <h3 className="text-sm font-extrabold text-[#6B7280] uppercase tracking-wider">
            📚 Subject-Wise Academic Ingestion
          </h3>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
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
              className="group p-4 border border-[#E5E7EB] rounded-[18px] hover:border-[#1677FF] hover:bg-slate-50/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Subject details & progress bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-2 mb-1.5">
                  <h4 className="font-extrabold text-sm text-[#111827] truncate">
                    {subject.name}
                  </h4>
                  <div className="flex items-center gap-1.5">
                    {getRiskBadge(attendancePercent)}
                    {getPriorityBadge(attendancePercent)}
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full">
                  <div className="flex-1 bg-[#E5E7EB] rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${getProgressColor(attendancePercent)}`}
                      style={{ width: `${Math.min(attendancePercent, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-black text-[#111827] min-w-[34px] text-right">
                    {roundedPercent}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#6B7280] font-medium mt-1.5">
                  <span>Present: <strong className="text-[#111827] font-semibold">{subject.present}</strong> / Total: <strong className="text-[#111827] font-semibold">{subject.total}</strong></span>
                  <span>Absent: <strong className="text-[#EF4444] font-semibold">{subject.total - subject.present}</strong></span>
                </div>
              </div>

              {/* Attendance quick logging buttons */}
              <div className="flex items-center justify-end gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-dashed border-[#E5E7EB]">
                {/* Present log controls */}
                <div className="flex flex-col gap-1 items-center">
                  <span className="text-[10px] font-bold text-[#6B7280]">Present</span>
                  <div className="flex items-center bg-white border border-[#E5E7EB] rounded-lg p-0.5 shadow-sm">
                    <button
                      onClick={() => onRemovePresent(subject.id)}
                      disabled={subject.present === 0}
                      className="p-1 text-[#6B7280] hover:text-[#EF4444] disabled:opacity-40 transition-colors cursor-pointer"
                      title="Undo Present Class"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onAddPresent(subject.id)}
                      className="p-1 text-[#059669] hover:bg-[#E6F4EA] rounded-md transition-all cursor-pointer flex items-center gap-0.5"
                      title="Log Present Class"
                    >
                      <Plus className="w-3 h-3" />
                      <Check className="w-2.5 h-2.5 font-bold" />
                    </button>
                  </div>
                </div>

                {/* Absent log controls */}
                <div className="flex flex-col gap-1 items-center">
                  <span className="text-[10px] font-bold text-[#6B7280]">Absent</span>
                  <div className="flex items-center bg-white border border-[#E5E7EB] rounded-lg p-0.5 shadow-sm">
                    <button
                      onClick={() => onRemoveAbsent(subject.id)}
                      disabled={subject.total <= subject.present}
                      className="p-1 text-[#6B7280] hover:text-[#EF4444] disabled:opacity-40 transition-colors cursor-pointer"
                      title="Undo Absent Class"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onAddAbsent(subject.id)}
                      className="p-1 text-[#D97706] hover:bg-[#FEF3C7] rounded-md transition-all cursor-pointer flex items-center gap-0.5"
                      title="Log Absent Class"
                    >
                      <Plus className="w-3 h-3" />
                      <X className="w-2.5 h-2.5 font-bold" />
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
