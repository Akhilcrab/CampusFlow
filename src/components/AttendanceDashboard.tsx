'use client';

import React, { useState } from 'react';
import AttendanceStats from './AttendanceStats';
import AttendanceTable from './AttendanceTable';
import AttendanceMissCalculator from './AttendanceMissCalculator';
import AttendanceRecovery from './AttendanceRecovery';
import AttendanceInsights from './AttendanceInsights';
import { RotateCcw, AlertCircle } from 'lucide-react';

export interface Subject {
  id: string;
  name: string;
  present: number;
  total: number;
}

const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'dbms', name: 'DBMS', present: 17, total: 25 },
  { id: 'daa', name: 'DAA', present: 21, total: 25 },
  { id: 'java', name: 'Java Programming', present: 18, total: 25 },
  { id: 'cn', name: 'Computer Networks', present: 19, total: 25 },
  { id: 'os', name: 'Operating Systems', present: 16, total: 25 }
];

export default function AttendanceDashboard() {
  const [subjects, setSubjects] = useState<Subject[]>(DEFAULT_SUBJECTS);
  const [targetPercent, setTargetPercent] = useState<number>(75);

  const handleIncrementPresent = (id: string) => {
    setSubjects(prev =>
      prev.map(sub =>
        sub.id === id ? { ...sub, present: sub.present + 1, total: sub.total + 1 } : sub
      )
    );
  };

  const handleIncrementAbsent = (id: string) => {
    setSubjects(prev =>
      prev.map(sub =>
        sub.id === id ? { ...sub, total: sub.total + 1 } : sub
      )
    );
  };

  const handleDecrementClass = (id: string, type: 'present' | 'absent') => {
    setSubjects(prev =>
      prev.map(sub => {
        if (sub.id !== id) return sub;
        if (sub.total <= 1) return sub; // Prevent 0 total classes
        
        if (type === 'present') {
          if (sub.present <= 0) return sub;
          return { ...sub, present: sub.present - 1, total: sub.total - 1 };
        } else {
          // decrementing absent means total goes down, present stays same (as long as total > present)
          if (sub.total > sub.present) {
            return { ...sub, total: sub.total - 1 };
          }
          return sub;
        }
      })
    );
  };

  const handleReset = () => {
    setSubjects(DEFAULT_SUBJECTS);
    setTargetPercent(75);
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Dashboard Top bar / Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight flex items-center gap-2">
            📊 Attendance Risk Monitor
          </h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Predictive AI Assistant for keeping your attendance above threshold requirements.
          </p>
        </div>
        
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] px-3.5 py-1.5 rounded-[12px] text-xs font-semibold flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Demo Sandbox Mode
          </div>
          <button
            onClick={handleReset}
            className="cf-btn bg-white border border-[#E5E7EB] hover:bg-slate-50 text-[#111827] text-xs px-3.5 py-2 flex items-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.02)] active:scale-95 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Data
          </button>
        </div>
      </div>

      {/* Metric Cards (Stats) */}
      <AttendanceStats subjects={subjects} targetPercent={targetPercent} />

      {/* Main Core Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start w-full">
        {/* Left Column (2-Span): Subject Table and Recovery Prediction */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <AttendanceTable
            subjects={subjects}
            targetPercent={targetPercent}
            onAddPresent={handleIncrementPresent}
            onAddAbsent={handleIncrementAbsent}
            onRemovePresent={(id) => handleDecrementClass(id, 'present')}
            onRemoveAbsent={(id) => handleDecrementClass(id, 'absent')}
          />
          
          <AttendanceRecovery
            subjects={subjects}
            targetPercent={targetPercent}
          />
        </div>

        {/* Right Column (1-Span): AI Insight and Miss Calculator */}
        <div className="lg:col-span-1 flex flex-col gap-8 lg:sticky lg:top-8">
          <AttendanceInsights
            subjects={subjects}
            targetPercent={targetPercent}
          />
          
          <AttendanceMissCalculator
            subjects={subjects}
            targetPercent={targetPercent}
            onChangeTarget={setTargetPercent}
          />
        </div>
      </div>
    </div>
  );
}
