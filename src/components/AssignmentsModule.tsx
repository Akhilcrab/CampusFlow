'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Search, Filter, AlertTriangle, CheckCircle, Bell, RefreshCw, X, Plus } from 'lucide-react';

interface Reminder {
  id: string;
  reminderType: string;
  reminderDate: string;
  enabled: boolean;
}

interface Assignment {
  id: string;
  title: string;
  subject: string;
  description: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
  sourceType: string;
  sourceReference?: string;
  reminders: Reminder[];
}

export default function AssignmentsModule({ onUpdate }: { onUpdate?: () => void }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dueFilter, setDueFilter] = useState<string>('all'); // 'all' | '24h' | '3d' | '7d'
  
  // Set Reminder Modal / State
  const [selectedAsg, setSelectedAsg] = useState<Assignment | null>(null);
  const [reminderType, setReminderType] = useState<string>('1 Day Before');
  const [customDate, setCustomDate] = useState<string>('');
  const [reminderError, setReminderError] = useState<string>('');
  const [reminderSuccess, setReminderSuccess] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/assignments');
      const data = await res.json();
      if (res.ok && data.success) {
        setAssignments(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/assignments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setAssignments(prev =>
          prev.map(asg => (asg.id === id ? { ...asg, status: newStatus as any } : asg))
        );
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  const calculateReminderDate = (asg: Assignment, type: string, customVal: string): Date | null => {
    const due = new Date(asg.dueDate);
    if (type === 'Custom Date') {
      if (!customVal) return null;
      return new Date(customVal);
    }

    const daysMap: Record<string, number> = {
      '1 Day Before': 1,
      '2 Days Before': 2,
      '3 Days Before': 3,
      '1 Week Before': 7
    };

    const daysToSubtract = daysMap[type] || 1;
    return new Date(due.getTime() - daysToSubtract * 24 * 60 * 60 * 1000);
  };

  const handleSetReminder = async () => {
    if (!selectedAsg) return;
    setReminderError('');
    setReminderSuccess(false);
    setActionLoading(true);

    const rDate = calculateReminderDate(selectedAsg, reminderType, customDate);

    if (!rDate || isNaN(rDate.getTime())) {
      setReminderError('Please enter a valid custom date.');
      setActionLoading(false);
      return;
    }

    if (rDate.getTime() < Date.now()) {
      setReminderError('Validation Error: The calculated reminder date is in the past.');
      setActionLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/assignments/${selectedAsg.id}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reminderType,
          reminderDate: rDate.toISOString()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReminderSuccess(true);
        setTimeout(() => {
          setSelectedAsg(null);
          setReminderSuccess(false);
          fetchAssignments();
          if (onUpdate) onUpdate();
        }, 1500);
      } else {
        setReminderError(data.error || 'Failed to set reminder.');
      }
    } catch (err) {
      console.error(err);
      setReminderError('A server error occurred.');
    } finally {
      setActionLoading(false);
    }
  };

  const calculateDaysRemaining = (dueDateStr: string, status: string) => {
    const due = new Date(dueDateStr);
    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (status === 'Completed') {
      return { text: 'Done', colorClass: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40', status: 'safe' };
    }

    if (diffMs < 0) {
      return { text: 'Overdue', colorClass: 'text-red-600 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40', status: 'overdue' };
    }

    if (diffDays < 1) {
      const hours = Math.round(diffMs / (1000 * 60 * 60));
      return {
        text: hours <= 1 ? 'Due in less than 1 hour!' : `Due in ${hours} hours!`,
        colorClass: 'text-red-600 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 border animate-pulse',
        status: 'urgent'
      };
    }

    if (diffDays < 3) {
      return { text: `Due in ${Math.round(diffDays)} days`, colorClass: 'text-orange-600 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/40 border', status: 'soon' };
    }

    return { text: `Due in ${Math.round(diffDays)} days`, colorClass: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 border', status: 'safe' };
  };

  // Filters logic
  const filteredAssignments = assignments.filter(asg => {
    // Search Query filter
    const matchesSearch =
      asg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asg.description.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === 'all' || asg.status === statusFilter;

    // Due Range filter
    let matchesDue = true;
    const now = new Date();
    const dueTime = new Date(asg.dueDate).getTime();
    const diffHrs = (dueTime - now.getTime()) / (1000 * 60 * 60);

    if (dueFilter === '24h') {
      matchesDue = diffHrs > 0 && diffHrs <= 24;
    } else if (dueFilter === '3d') {
      matchesDue = diffHrs > 0 && diffHrs <= 72;
    } else if (dueFilter === '7d') {
      matchesDue = diffHrs > 0 && diffHrs <= 168;
    }

    return matchesSearch && matchesStatus && matchesDue;
  });

  return (
    <div className="w-full flex flex-col gap-6">
      
      {/* Header and Sync controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#111827] dark:text-slate-100 flex items-center gap-2 tracking-tight">
            📚 Assignments Manager
          </h2>
          <p className="text-[#6B7280] dark:text-gray-400 text-xs mt-1">
            Track and complete assignments parsed from academic notifications
          </p>
        </div>
        <button
          onClick={fetchAssignments}
          className="cf-btn bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs px-4 py-2 rounded-[16px] text-gray-700 dark:text-slate-200 font-bold flex items-center gap-2 self-start cursor-pointer active:scale-95 transition-all shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh List
        </button>
      </div>

      {/* Search & Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-[24px] shadow-sm">
        
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search assignments..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-[16px] border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-xs text-[#111827] dark:text-slate-200 focus:outline-none focus:border-[#1677FF] transition-all"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full p-2.5 rounded-[16px] border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-xs text-[#111827] dark:text-slate-200 focus:outline-none focus:border-[#1677FF] cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>

        {/* Due Range Filter */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <select
            value={dueFilter}
            onChange={e => setDueFilter(e.target.value)}
            className="w-full p-2.5 rounded-[16px] border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-xs text-[#111827] dark:text-slate-200 focus:outline-none focus:border-[#1677FF] cursor-pointer"
          >
            <option value="all">Any Due Date</option>
            <option value="24h">Due within 24 Hours</option>
            <option value="3d">Due within 3 Days</option>
            <option value="7d">Due within 7 Days</option>
          </select>
        </div>

      </div>

      {/* Grid List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-[24px]">
          <RefreshCw className="w-8 h-8 text-[#1677FF] animate-spin mb-3" />
          <p className="text-[#6B7280] dark:text-gray-400 text-sm">Syncing Assignments...</p>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-[24px] p-8">
          <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800/40 flex items-center justify-center text-gray-400 mb-4">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-[#111827] dark:text-slate-100 font-bold text-lg">No Assignments Found</h3>
          <p className="text-[#6B7280] dark:text-gray-450 text-xs max-w-sm mt-1">
            Try adjusting your search criteria, clearing filters, or uploading a classroom message on the left.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAssignments.map(asg => {
            const urgency = calculateDaysRemaining(asg.dueDate, asg.status);
            return (
              <div
                key={asg.id}
                className={`cf-card bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800/80 rounded-[24px] p-6 flex flex-col justify-between shadow-sm relative transition-all duration-200 ${
                  asg.status === 'Completed' ? 'opacity-60 bg-gray-55/50 dark:bg-slate-900/50' : ''
                }`}
              >
                <div>
                  {/* Badges */}
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/20 text-[#1677FF] border border-blue-100 dark:border-blue-900/40">
                      {asg.subject}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        asg.priority === 'High' ? 'bg-red-55 text-red-600 bg-red-50 dark:bg-red-950/25 border border-red-100 dark:border-red-900/40' :
                        asg.priority === 'Medium' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/25 border border-blue-100 dark:border-blue-900/40' :
                        'bg-gray-50 text-gray-500 dark:bg-gray-800/25 border border-gray-100 dark:border-gray-800'
                      }`}>
                        {asg.priority} Priority
                      </span>
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        asg.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        asg.status === 'Overdue' ? 'bg-red-55 text-red-600 bg-red-50 border border-red-100' :
                        asg.status === 'In Progress' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                        'bg-gray-50 text-gray-600 border border-gray-100'
                      }`}>
                        {asg.status}
                      </span>
                    </div>
                  </div>

                  <h3 className={`text-sm font-extrabold text-[#111827] dark:text-slate-100 ${asg.status === 'Completed' ? 'line-through text-gray-400' : ''}`}>
                    {asg.title}
                  </h3>
                  <p className="text-[#6B7280] dark:text-gray-400 text-xs mt-2 leading-relaxed">
                    {asg.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  
                  {/* Urgency and Due Date */}
                  <div className="flex flex-col gap-0.5">
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full ${urgency.colorClass}`}>
                      {urgency.text}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold ml-1.5 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Due: {new Date(asg.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* Set Reminder Button */}
                    {asg.status !== 'Completed' && (
                      <button
                        onClick={() => setSelectedAsg(asg)}
                        className="cf-btn border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 text-[10px] px-3 py-2 rounded-[12px] flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-xs"
                      >
                        <Bell className="w-3 h-3 text-[#1677FF]" /> Set Reminder
                      </button>
                    )}

                    {/* Status Dropdown */}
                    <select
                      value={asg.status}
                      onChange={e => handleStatusChange(asg.id, e.target.value)}
                      className="text-[10px] font-extrabold px-2.5 py-2 rounded-[12px] bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-[#111827] dark:text-slate-200 focus:outline-none cursor-pointer hover:bg-slate-100"
                    >
                      <option value="Pending">🕒 Pending</option>
                      <option value="In Progress">⚡ In Progress</option>
                      <option value="Completed">✅ Completed</option>
                      <option value="Overdue">⚠️ Overdue</option>
                    </select>
                  </div>

                </div>

                {/* Show Existing Reminders Badge */}
                {asg.reminders && asg.reminders.length > 0 && (
                  <div className="absolute top-4 right-4 text-[9px] font-bold text-gray-400 dark:text-gray-500 flex items-center gap-1 bg-slate-50 dark:bg-slate-800/40 px-2 py-1 rounded-full border border-gray-100 dark:border-slate-800">
                    <Bell className="w-2.5 h-2.5 text-[#1677FF]" /> {asg.reminders.length} reminder(s)
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Set Reminder Modal Overlay */}
      {selectedAsg && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[28px] p-6 max-w-sm w-full shadow-2xl relative flex flex-col gap-4 animate-slide-up">
            
            <button
              onClick={() => setSelectedAsg(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center border border-gray-200 dark:border-slate-800 text-gray-400 hover:bg-slate-50 cursor-pointer active:scale-95 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-slate-100">
                🔔 Set Assignment Reminder
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 leading-snug">
                Set a smart reminder alert for "{selectedAsg.title}"
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">
                Select Lead Time
              </label>
              <select
                value={reminderType}
                onChange={e => {
                  setReminderType(e.target.value);
                  setReminderError('');
                }}
                className="w-full p-2.5 rounded-[14px] border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-xs text-[#111827] dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="1 Day Before">1 Day Before Deadline</option>
                <option value="2 Days Before">2 Days Before Deadline</option>
                <option value="3 Days Before">3 Days Before Deadline</option>
                <option value="1 Week Before">1 Week Before Deadline</option>
                <option value="Custom Date">Custom Date & Time</option>
              </select>
            </div>

            {reminderType === 'Custom Date' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">
                  Select Custom Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={customDate}
                  onChange={e => {
                    setCustomDate(e.target.value);
                    setReminderError('');
                  }}
                  className="w-full p-2.5 rounded-[14px] border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-xs text-[#111827] dark:text-slate-200 focus:outline-none"
                />
              </div>
            )}

            {/* Success and Error States */}
            {reminderError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-150 dark:border-red-900/50 rounded-[14px] text-red-650 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{reminderError}</span>
              </div>
            )}

            {reminderSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-150 dark:border-emerald-900/50 rounded-[14px] text-emerald-650 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Reminder successfully scheduled!</span>
              </div>
            )}

            <button
              onClick={handleSetReminder}
              disabled={actionLoading || reminderSuccess}
              className="cf-btn bg-[#1677FF] hover:bg-[#1677FF]/90 text-white text-xs py-3 rounded-[16px] font-bold mt-2 shadow-sm cursor-pointer disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {actionLoading ? 'Scheduling...' : 'Set Reminder Alert'}
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
