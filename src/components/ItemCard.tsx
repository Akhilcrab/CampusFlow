'use client';

import React from 'react';
import { Calendar, Clock, Check, Trash2, ArrowUpRight, FileText, Image, CheckSquare, Star, Info } from 'lucide-react';
import { ExtractedItemWithReminders } from '@/types';
import { Category, Priority } from '@prisma/client';

interface ItemCardProps {
  item: ExtractedItemWithReminders;
  onToggleComplete: (id: string, isCompleted: boolean) => void;
  onDeleteItem: (id: string) => void;
  onUpdatePriority: (id: string, priority: Priority | null) => void;
  onToggleStar: (id: string, isStarred: boolean) => void;
}

const categoryStyles: Record<Category, { label: string; bg: string; text: string; border: string }> = {
  ASSIGNMENT: { label: 'Assignment', bg: 'bg-blue-50 dark:bg-blue-950/20', text: 'text-[#1677FF] dark:text-blue-400', border: 'border-blue-100 dark:border-blue-900/50' },
  EXAM: { label: 'Exam', bg: 'bg-red-50 dark:bg-red-950/20', text: 'text-[#EF4444] dark:text-red-400', border: 'border-red-100 dark:border-red-900/50' },
  EVENT: { label: 'Event', bg: 'bg-purple-50 dark:bg-purple-950/20', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-100 dark:border-purple-900/50' },
  PLACEMENT: { label: 'Placement', bg: 'bg-green-50 dark:bg-green-950/20', text: 'text-[#22C55E] dark:text-emerald-400', border: 'border-green-100 dark:border-green-900/50' },
  NOTICE: { label: 'Notice', bg: 'bg-amber-50 dark:bg-amber-950/20', text: 'text-[#F59E0B] dark:text-amber-400', border: 'border-amber-100 dark:border-amber-900/50' },
  OTHER: { label: 'Other', bg: 'bg-gray-50 dark:bg-gray-800/20', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-100 dark:border-gray-800' },
};

const priorityStyles: Record<Priority, { label: string; text: string; badgeBg: string; borderClass: string }> = {
  CRITICAL: { label: 'Critical', text: 'text-red-700 dark:text-red-400', badgeBg: 'bg-red-100 dark:bg-red-950/30', borderClass: 'border-l-4 border-l-[#EF4444]' },
  HIGH: { label: 'High Urgency', text: 'text-orange-700 dark:text-orange-450', badgeBg: 'bg-orange-100 dark:bg-orange-950/30', borderClass: 'border-l-4 border-l-[#F59E0B]' },
  MEDIUM: { label: 'Medium', text: 'text-blue-700 dark:text-blue-400', badgeBg: 'bg-blue-100 dark:bg-blue-950/30', borderClass: 'border-l-4 border-l-[#1677FF]' },
  LOW: { label: 'Low Priority', text: 'text-gray-700 dark:text-gray-450', badgeBg: 'bg-gray-100 dark:bg-gray-800/50', borderClass: 'border-l-4 border-l-gray-300 dark:border-l-gray-700' },
};

export default function ItemCard({ 
  item, 
  onToggleComplete, 
  onDeleteItem,
  onUpdatePriority,
  onToggleStar
}: ItemCardProps) {
  const cStyle = categoryStyles[item.category];
  
  // Decide which priority is active (user override takes precedence)
  const activePriority = item.userPriority || item.priority;
  const pStyle = priorityStyles[activePriority];

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

  const getPriorityExplanation = (category: Category, deadline: Date | string | null | undefined, priority: Priority): string => {
    if (!deadline) return `Priority set to ${priority.toLowerCase()} based on standard classification rules.`;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffMs = deadlineDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (category === 'EXAM' && diffHours > 0 && diffHours < 24) {
      return 'Exam scheduled tomorrow.';
    }
    if (category === 'PLACEMENT' && diffHours > 0 && diffHours < 24) {
      return 'Placement Registration deadline is closing within 24 hours.';
    }
    if (diffHours <= 0) {
      return 'Task deadline has already passed.';
    }
    if (diffHours < 3) {
      return 'Deadline is critically close (less than 3 hours away).';
    }
    if (diffHours < 24) {
      return 'Deadline is within 24 hours.';
    }
    if (diffHours < 72) {
      return 'Deadline is within 3 days.';
    }
    return 'Deadline is more than 3 days away.';
  };

  return (
    <div 
      className={`cf-card bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800/80 rounded-[24px] p-6 flex flex-col justify-between transition-all duration-200 relative overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] ${pStyle.borderClass} ${
        item.isCompleted ? 'opacity-50 dark:opacity-40 bg-gray-50/50 dark:bg-slate-900/50' : ''
      }`}
    >
      {/* Complete/Status Overlay Indicator */}
      {item.isCompleted && (
        <div className="absolute top-4 right-14 bg-emerald-50 dark:bg-emerald-950/20 text-[#22C55E] text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/50 flex items-center gap-1">
          <CheckSquare className="w-3.5 h-3.5" /> Completed
        </div>
      )}

      {/* Pin/Star Button on Top Right */}
      <button
        onClick={() => onToggleStar(item.id, !item.isStarred)}
        className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-200 cursor-pointer ${
          item.isStarred
            ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-500'
            : 'border-gray-200 dark:border-slate-800 text-gray-400 dark:text-gray-500 hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900'
        }`}
        title={item.isStarred ? 'Unstar Task' : 'Star Task'}
      >
        <Star className={`w-3.5 h-3.5 ${item.isStarred ? 'fill-amber-500' : ''}`} />
      </button>

      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 flex-wrap mb-4 pr-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border ${cStyle.bg} ${cStyle.text} ${cStyle.border}`}>
              {cStyle.label}
            </span>
            {!item.isCompleted && (
              <div className="relative group flex items-center">
                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full cursor-help flex items-center gap-1 ${pStyle.badgeBg} ${pStyle.text}`}>
                  {pStyle.label} {item.userPriority ? '⭐' : ''}
                </span>
                
                {/* Priority Tooltip explanation */}
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:flex flex-col w-56 bg-slate-950 dark:bg-slate-950 text-white border border-slate-800 text-[10px] rounded-[10px] p-3 shadow-xl z-50 leading-relaxed transition-all animate-slide-up">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5 font-extrabold uppercase tracking-wider text-[#8B5CF6]">
                    <span>Priority Engine</span>
                    <Info className="w-3 h-3 text-[#8B5CF6]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div><span className="font-bold text-gray-400">AI Priority:</span> <span className="font-semibold text-gray-200">{item.priority}</span></div>
                    {item.userPriority && (
                      <div><span className="font-bold text-gray-400">User Override:</span> <span className="font-semibold text-amber-400">{item.userPriority}</span></div>
                    )}
                    <div className="mt-1 border-t border-slate-800 pt-1.5 font-medium text-slate-350">
                      {item.priorityExplanation || getPriorityExplanation(item.category, item.deadline, item.priority)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Source indicator */}
          <span className="text-[#6B7280] dark:text-gray-450 text-[11px] flex items-center gap-1">
            {item.sourceType === 'screenshot' ? (
              <Image className="w-3 h-3 text-[#F59E0B]" />
            ) : (
              <FileText className="w-3 h-3 text-[#22C55E]" />
            )}
            {item.sourceName || 'manual'}
          </span>
        </div>

        {/* Title & Summary */}
        <h3 className={`text-sm font-extrabold text-[#111827] dark:text-slate-100 leading-snug tracking-tight ${item.isCompleted ? 'line-through text-[#9CA3AF] dark:text-slate-500' : ''}`}>
          {item.title}
        </h3>
        <p className="text-[#6B7280] dark:text-gray-400 text-xs mt-2.5 leading-relaxed font-medium">
          {item.summary}
        </p>

        {/* Action Required Details */}
        {item.actionRequired && !item.isCompleted && (
          <div className="mt-4 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-[14px] border border-slate-100 dark:border-slate-800/60 flex items-start gap-2.5">
            <ArrowUpRight className="w-3.5 h-3.5 text-[#1677FF] shrink-0 mt-0.5" />
            <div>
              <p className="text-[9px] text-[#6B7280] dark:text-gray-450 font-extrabold uppercase tracking-wider">Action Required</p>
              <p className="text-xs text-[#111827] dark:text-slate-200 mt-0.5 font-bold">{item.actionRequired}</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Details & Interactive Actions */}
      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        {/* Deadline Information */}
        <div className="flex flex-col gap-0.5 text-xs">
          <span className={`font-bold flex items-center gap-1.5 ${
            item.isCompleted ? 'text-[#9CA3AF] dark:text-slate-500' : 
            activePriority === 'CRITICAL' ? 'text-[#EF4444]' : 
            activePriority === 'HIGH' ? 'text-[#F59E0B]' : 'text-[#1677FF]'
          }`}>
            <Clock className="w-3.5 h-3.5" />
            {formatDeadline(item.deadline)}
          </span>
          {item.date && (
            <span className="text-[10px] text-[#9CA3AF] dark:text-gray-400 flex items-center gap-1 font-semibold">
              <Calendar className="w-3 h-3" />
              {item.date} {item.time ? `@ ${item.time}` : ''}
            </span>
          )}
        </div>

        {/* Actions Button Panel */}
        <div className="flex items-center gap-2">
          {/* Priority dropdown Selector */}
          {!item.isCompleted && (
            <select
              value={item.userPriority || ''}
              onChange={(e) => onUpdatePriority(item.id, e.target.value ? e.target.value as Priority : null)}
              className="text-[10px] font-extrabold px-2 py-1.5 rounded-[12px] bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-[#111827] dark:text-slate-200 focus:outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-sm"
              title="Manual Priority Override"
            >
              <option value="">AI Priority</option>
              <option value="CRITICAL">🔴 Critical</option>
              <option value="HIGH">🔴 High</option>
              <option value="MEDIUM">🟠 Medium</option>
              <option value="LOW">🟢 Low</option>
            </select>
          )}

          {/* Complete Checklist Toggle */}
          <button
            onClick={() => onToggleComplete(item.id, !item.isCompleted)}
            className={`w-8.5 h-8.5 rounded-[12px] flex items-center justify-center border transition-all duration-200 cursor-pointer active:scale-95 ${
              item.isCompleted
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-800 text-[#22C55E]'
                : 'border-gray-200 dark:border-slate-800 text-gray-550 dark:text-gray-400 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            title={item.isCompleted ? 'Mark Active' : 'Mark Done'}
          >
            <Check className="w-4 h-4" />
          </button>

          {/* Delete Button */}
          <button
            onClick={() => onDeleteItem(item.id)}
            className="w-8.5 h-8.5 rounded-[12px] flex items-center justify-center border border-gray-200 dark:border-slate-800 text-gray-400 dark:text-gray-500 bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-100 dark:hover:border-red-900 hover:text-[#EF4444] transition-all duration-200 cursor-pointer active:scale-95"
            title="Delete Item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
