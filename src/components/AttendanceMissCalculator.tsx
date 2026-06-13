'use client';

import React from 'react';
import { Subject } from './AttendanceDashboard';
import { AlertCircle, ShieldAlert, CheckCircle2, Sliders } from 'lucide-react';

interface AttendanceMissCalculatorProps {
  subjects: Subject[];
  targetPercent: number;
  onChangeTarget: (val: number) => void;
}

export default function AttendanceMissCalculator({
  subjects,
  targetPercent,
  onChangeTarget
}: AttendanceMissCalculatorProps) {
  
  // Calculate miss count
  const calculateCanMiss = (present: number, total: number, target: number) => {
    const t = target / 100;
    if (total === 0) return 0;
    const currentPercent = (present / total) * 100;
    
    if (currentPercent < target) return 0;
    
    // Solve: present / (total + m) >= t => present >= t * (total + m) => present / t - total >= m
    const m = Math.floor(present / t - total);
    return Math.max(0, m);
  };

  const getStatus = (canMiss: number, currentPercent: number, target: number) => {
    if (currentPercent < target) {
      return {
        label: 'Must Attend',
        colorClass: 'bg-[#FEF2F2] text-[#EF4444] border-[#FEE2E2]',
        statusIcon: ShieldAlert
      };
    }
    if (canMiss === 0) {
      return {
        label: 'Be Careful',
        colorClass: 'bg-[#FFFBEB] text-[#D97706] border-[#FEF3C7]',
        statusIcon: AlertCircle
      };
    }
    return {
      label: 'Safe To Miss',
      colorClass: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]',
      statusIcon: CheckCircle2
    };
  };

  return (
    <div className="cf-card bg-white border border-[#E5E7EB] rounded-[24px] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] w-full flex flex-col gap-6">
      <div>
        <h3 className="text-sm font-extrabold text-[#6B7280] uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#1677FF]" /> Miss Safety Limits
        </h3>
        <p className="text-xs text-[#9CA3AF] mt-0.5">
          Estimate how many consecutive future classes you can safely skip.
        </p>
      </div>

      {/* Target Adjuster Slider */}
      <div className="bg-slate-50 border border-[#E5E7EB] rounded-[18px] p-4 flex flex-col gap-2">
        <div className="flex justify-between text-xs font-bold text-[#111827]">
          <span>Required Threshold</span>
          <span className="text-[#1677FF] font-black">{targetPercent}%</span>
        </div>
        <input
          type="range"
          min="60"
          max="90"
          step="5"
          value={targetPercent}
          onChange={(e) => onChangeTarget(Number(e.target.value))}
          className="w-full h-1 bg-[#E5E7EB] rounded-lg appearance-none cursor-pointer accent-[#1677FF] my-1.5"
        />
        <div className="flex justify-between text-[10px] text-[#9CA3AF] font-bold">
          <span>60%</span>
          <span>75% (Min ERP)</span>
          <span>90%</span>
        </div>
      </div>

      {/* Miss calculation items */}
      <div className="flex flex-col gap-3.5">
        {subjects.map((subject) => {
          const currentPercent = subject.total > 0 ? (subject.present / subject.total) * 100 : 0;
          const canMiss = calculateCanMiss(subject.present, subject.total, targetPercent);
          const status = getStatus(canMiss, currentPercent, targetPercent);
          const StatusIcon = status.statusIcon;

          return (
            <div 
              key={subject.id} 
              className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-[16px] bg-slate-50/20"
            >
              <div className="min-w-0 flex-1">
                <span className="text-xs font-extrabold text-[#111827] block truncate">
                  {subject.name}
                </span>
                <span className="text-[10px] text-[#9CA3AF] font-semibold">
                  Current: {currentPercent.toFixed(0)}%
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-sm font-black text-[#111827] block">
                    {canMiss} {canMiss === 1 ? 'Class' : 'Classes'}
                  </span>
                  <span className="text-[9px] text-[#9CA3AF] font-bold uppercase tracking-wider block">
                    Can Miss
                  </span>
                </div>

                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-[10px] text-[10px] font-black border uppercase tracking-wider ${status.colorClass}`}>
                  <StatusIcon className="w-2.5 h-2.5" />
                  {status.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
