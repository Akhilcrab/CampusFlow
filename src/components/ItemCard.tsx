'use client';

import React from 'react';
import { Calendar, Clock, Check, Trash2, ArrowUpRight, FileText, Image, CheckSquare } from 'lucide-react';
import { ExtractedItemWithReminders } from '@/types';
import { Category, Priority } from '@prisma/client';

interface ItemCardProps {
  item: ExtractedItemWithReminders;
  onToggleComplete: (id: string, isCompleted: boolean) => void;
  onDeleteItem: (id: string) => void;
}

const categoryStyles: Record<Category, { label: string; bg: string; text: string; border: string }> = {
  ASSIGNMENT: { label: 'Assignment', bg: 'bg-blue-50', text: 'text-[#1677FF]', border: 'border-blue-100' },
  EXAM: { label: 'Exam', bg: 'bg-red-50', text: 'text-[#EF4444]', border: 'border-red-100' },
  EVENT: { label: 'Event', bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
  PLACEMENT: { label: 'Placement', bg: 'bg-green-50', text: 'text-[#22C55E]', border: 'border-green-100' },
  NOTICE: { label: 'Notice', bg: 'bg-amber-50', text: 'text-[#F59E0B]', border: 'border-amber-100' },
  OTHER: { label: 'Other', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-100' },
};

const priorityStyles: Record<Priority, { label: string; text: string; badgeBg: string; borderClass: string }> = {
  CRITICAL: { label: 'Critical', text: 'text-red-700', badgeBg: 'bg-red-100', borderClass: 'border-l-4 border-l-[#EF4444]' },
  HIGH: { label: 'High Urgency', text: 'text-orange-700', badgeBg: 'bg-orange-100', borderClass: 'border-l-4 border-l-[#F59E0B]' },
  MEDIUM: { label: 'Medium', text: 'text-blue-700', badgeBg: 'bg-blue-100', borderClass: 'border-l-4 border-l-[#1677FF]' },
  LOW: { label: 'Low Priority', text: 'text-gray-700', badgeBg: 'bg-gray-100', borderClass: '' },
};

export default function ItemCard({ item, onToggleComplete, onDeleteItem }: ItemCardProps) {
  const cStyle = categoryStyles[item.category];
  const pStyle = priorityStyles[item.priority];

  // Helper to format remaining time relative to current local time
  const formatDeadline = (deadlineStr?: string | null) => {
    if (!deadlineStr) return 'No deadline specified';
    const deadline = new Date(deadlineStr);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const diffHrs = diffMs / (1000 * 60 * 60);

    if (diffMs < 0) {
      const hoursAgo = Math.abs(Math.round(diffHrs));
      if (hoursAgo < 24) {
        return `Ended ${hoursAgo}h ago`;
      }
      return `Ended ${Math.round(hoursAgo / 24)} days ago`;
    }
    
    if (diffHrs < 1) {
      const mins = Math.max(1, Math.round(diffMs / (1000 * 60)));
      return `Ends in ${mins}m!`;
    }
    
    if (diffHrs < 24) {
      return `Ends in ${Math.round(diffHrs)}h`;
    }
    
    const days = Math.round(diffHrs / 24);
    if (days === 1) return 'Due tomorrow';
    return `Due in ${days} days`;
  };

  return (
    <div 
      className={`cf-card bg-white border border-[#E5E7EB] rounded-[24px] p-6 flex flex-col justify-between transition-all duration-200 relative overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] ${pStyle.borderClass} ${
        item.isCompleted ? 'opacity-60 bg-gray-50/50' : ''
      }`}
    >
      {/* Complete/Status Overlay Indicator */}
      {item.isCompleted && (
        <div className="absolute top-4 right-4 bg-emerald-50 text-[#22C55E] text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
          <CheckSquare className="w-3.5 h-3.5" /> Completed
        </div>
      )}

      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${cStyle.bg} ${cStyle.text} ${cStyle.border}`}>
              {cStyle.label}
            </span>
            {!item.isCompleted && (
              <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${pStyle.badgeBg} ${pStyle.text}`}>
                {pStyle.label}
              </span>
            )}
          </div>
          
          {/* Source indicator */}
          <span className="text-[#6B7280] text-xs flex items-center gap-1">
            {item.sourceType === 'screenshot' ? (
              <Image className="w-3.5 h-3.5 text-[#F59E0B]" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-[#22C55E]" />
            )}
            {item.sourceName || 'manual'}
          </span>
        </div>

        {/* Title & Summary */}
        <h3 className={`text-base font-bold text-[#111827] leading-snug tracking-tight ${item.isCompleted ? 'line-through text-[#9CA3AF]' : ''}`}>
          {item.title}
        </h3>
        <p className="text-[#6B7280] text-xs mt-2.5 leading-relaxed">
          {item.summary}
        </p>

        {/* Action Required Details */}
        {item.actionRequired && !item.isCompleted && (
          <div className="mt-4 p-4 bg-slate-50 rounded-[14px] border border-slate-100 flex items-start gap-2.5">
            <ArrowUpRight className="w-4 h-4 text-[#1677FF] shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] text-[#6B7280] font-extrabold uppercase tracking-wider">Action Required</p>
              <p className="text-xs text-[#111827] mt-0.5 font-bold">{item.actionRequired}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Details & Interactive Actions */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
        {/* Deadline Information */}
        <div className="flex flex-col gap-1 text-xs">
          <span className={`font-bold flex items-center gap-1.5 ${
            item.isCompleted ? 'text-[#9CA3AF]' : 
            item.priority === 'CRITICAL' ? 'text-[#EF4444]' : 
            item.priority === 'HIGH' ? 'text-[#F59E0B]' : 'text-[#1677FF]'
          }`}>
            <Clock className="w-3.5 h-3.5" />
            {formatDeadline(item.deadline)}
          </span>
          {item.date && (
            <span className="text-[10px] text-[#9CA3AF] flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5" />
              {item.date} {item.time ? `@ ${item.time}` : ''}
            </span>
          )}
        </div>

        {/* Actions Button Panel */}
        <div className="flex items-center gap-2">
          {/* Complete Checklist Toggle */}
          <button
            onClick={() => onToggleComplete(item.id, !item.isCompleted)}
            className={`w-9 h-9 rounded-[16px] flex items-center justify-center border transition-all duration-200 cursor-pointer ${
              item.isCompleted
                ? 'bg-emerald-50 border-emerald-100 text-[#22C55E]'
                : 'border-gray-200 text-gray-500 bg-white hover:bg-slate-50'
            }`}
            title={item.isCompleted ? 'Mark Active' : 'Mark Done'}
          >
            <Check className="w-4 h-4" />
          </button>

          {/* Delete Button */}
          <button
            onClick={() => onDeleteItem(item.id)}
            className="w-9 h-9 rounded-[16px] flex items-center justify-center border border-gray-200 text-gray-400 bg-white hover:bg-red-50 hover:border-red-100 hover:text-[#EF4444] transition-all duration-200 cursor-pointer"
            title="Delete Item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
