'use client';

import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter, Clock, Info, CheckCircle, RefreshCw, X, BookOpen, AlertTriangle } from 'lucide-react';

interface CalendarEvent {
  id: string;
  eventType: string;
  eventTitle: string;
  eventDate: string;
  eventTime?: string;
  referenceId?: string;
  metadata?: string;
}

export default function CalendarModule() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/calendar');
      const data = await res.json();
      if (res.ok && data.success) {
        setEvents(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Calendar Grid Math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const daysArray = [];

  // Previous month padding
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    daysArray.push({
      day: prevMonthTotalDays - i,
      isCurrentMonth: false,
      date: new Date(year, month - 1, prevMonthTotalDays - i)
    });
  }

  // Current month days
  for (let i = 1; i <= totalDays; i++) {
    daysArray.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(year, month, i)
    });
  }

  // Next month padding to fill grid (6 rows * 7 days = 42 cells)
  const remainingCells = 42 - daysArray.length;
  for (let i = 1; i <= remainingCells; i++) {
    daysArray.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(year, month + 1, i)
    });
  }

  // Format helper
  const getEventsForDate = (date: Date) => {
    return events.filter(evt => {
      const evtDate = new Date(evt.eventDate);
      const isSameDay =
        evtDate.getDate() === date.getDate() &&
        evtDate.getMonth() === date.getMonth() &&
        evtDate.getFullYear() === date.getFullYear();

      const matchesFilter = eventTypeFilter === 'all' || evt.eventType === eventTypeFilter;

      return isSameDay && matchesFilter;
    });
  };

  const getCategoryColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'assignment':
        return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'placement':
        return 'bg-emerald-500 hover:bg-emerald-600 text-white';
      case 'exam':
        return 'bg-red-500 hover:bg-red-600 text-white';
      case 'event':
        return 'bg-purple-500 hover:bg-purple-600 text-white';
      case 'notice':
        return 'bg-amber-500 hover:bg-amber-600 text-white';
      default:
        return 'bg-slate-500 hover:bg-slate-600 text-white';
    }
  };

  const getCategoryBorder = (type: string) => {
    switch (type.toLowerCase()) {
      case 'assignment':
        return 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/20';
      case 'placement':
        return 'border-emerald-500 text-emerald-650 bg-emerald-50 dark:bg-emerald-950/20';
      case 'exam':
        return 'border-red-500 text-red-600 bg-red-50 dark:bg-red-950/20';
      case 'event':
        return 'border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-950/20';
      case 'notice':
        return 'border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/20';
      default:
        return 'border-slate-500 text-slate-600 bg-slate-50';
    }
  };

  // Agenda items filter & group
  const agendaEvents = events
    .filter(evt => eventTypeFilter === 'all' || evt.eventType === eventTypeFilter)
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

  // Extract parsed metadata from event
  const getEventMeta = (evt: CalendarEvent) => {
    try {
      if (evt.metadata) {
        return JSON.parse(evt.metadata);
      }
    } catch (e) {}
    return { summary: 'No details available', actionRequired: '' };
  };

  return (
    <div className="w-full flex flex-col gap-6">

      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#111827] dark:text-slate-100 flex items-center gap-2 tracking-tight">
            📅 Academic Calendar
          </h2>
          <p className="text-[#6B7280] dark:text-gray-400 text-xs mt-1">
            Unified chronological schedule of assignments, exam schedules, and placement deadlines
          </p>
        </div>

        {/* View Switcher and Navigation */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-[14px]">
            <button
              onClick={() => setViewMode('month')}
              className={`text-xs px-3 py-1.5 rounded-[10px] font-bold transition-all ${
                viewMode === 'month' ? 'bg-white dark:bg-slate-700 text-[#111827] dark:text-slate-100 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Month Grid
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`text-xs px-3 py-1.5 rounded-[10px] font-bold transition-all ${
                viewMode === 'agenda' ? 'bg-white dark:bg-slate-700 text-[#111827] dark:text-slate-100 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Agenda List
            </button>
          </div>

          <button
            onClick={fetchEvents}
            className="cf-btn bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 p-2.5 rounded-[12px] text-gray-700 dark:text-slate-200 cursor-pointer active:scale-95 transition-all"
            title="Refresh Calendar"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filters and Month Navigator */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-[24px] shadow-sm">
        
        {/* Month Selector */}
        {viewMode === 'month' && (
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevMonth}
              className="w-8 h-8 rounded-full border border-gray-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 text-gray-650 cursor-pointer active:scale-95 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-black text-gray-800 dark:text-slate-200 min-w-[120px] text-center">
              {currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={handleNextMonth}
              className="w-8 h-8 rounded-full border border-gray-200 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 text-gray-650 cursor-pointer active:scale-95 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="text-[10px] font-black uppercase px-2.5 py-1.5 rounded-[10px] border border-gray-200 dark:border-slate-800 hover:bg-slate-50 text-gray-600 dark:text-slate-350 cursor-pointer active:scale-95 transition-all"
            >
              Today
            </button>
          </div>
        )}

        {viewMode === 'agenda' && (
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-black text-gray-800 dark:text-slate-200">
              Agenda View: Upcoming Tasks & Events
            </span>
          </div>
        )}

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <select
            value={eventTypeFilter}
            onChange={e => setEventTypeFilter(e.target.value)}
            className="p-2 rounded-[14px] border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-xs text-[#111827] dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="assignment">📚 Assignments</option>
            <option value="placement">💼 Placements</option>
            <option value="exam">✍️ Exams</option>
            <option value="event">🎉 Events</option>
            <option value="notice">📢 Notices</option>
          </select>
        </div>

      </div>

      {/* Calendar Grid or Agenda list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-[24px]">
          <RefreshCw className="w-8 h-8 text-[#1677FF] animate-spin mb-3" />
          <p className="text-[#6B7280] dark:text-gray-400 text-sm">Syncing Schedule...</p>
        </div>
      ) : viewMode === 'month' ? (
        /* Month View Grid */
        <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-[24px] p-4 shadow-sm overflow-hidden flex flex-col gap-1">
          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800/80 pb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-center text-[10px] font-black uppercase tracking-wider text-gray-400">
                {d}
              </div>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1">
            {daysArray.map((cell, idx) => {
              const dayEvents = getEventsForDate(cell.date);
              const isToday =
                cell.date.getDate() === new Date().getDate() &&
                cell.date.getMonth() === new Date().getMonth() &&
                cell.date.getFullYear() === new Date().getFullYear();

              return (
                <div
                  key={idx}
                  className={`min-h-[90px] border border-slate-100/50 dark:border-slate-800/40 rounded-[14px] p-1.5 flex flex-col justify-between transition-all duration-150 ${
                    cell.isCurrentMonth ? 'bg-slate-50/[0.3] dark:bg-slate-900' : 'bg-gray-50/20 dark:bg-slate-950/20 opacity-35'
                  } ${isToday ? 'border-2 border-[#1677FF]/60 bg-blue-50/10' : ''}`}
                >
                  {/* Day Number */}
                  <span className={`text-[10px] font-extrabold w-5 h-5 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-[#1677FF] text-white' : 'text-gray-700 dark:text-slate-355'
                  }`}>
                    {cell.day}
                  </span>

                  {/* Events list */}
                  <div className="flex flex-col gap-1 mt-1 overflow-y-auto max-h-[60px] no-scrollbar">
                    {dayEvents.map(evt => (
                      <button
                        key={evt.id}
                        onClick={() => setSelectedEvent(evt)}
                        className={`text-[9px] font-black text-left px-1.5 py-0.5 rounded-full truncate cursor-pointer active:scale-95 transition-all ${getCategoryColor(
                          evt.eventType
                        )}`}
                      >
                        {evt.eventTitle}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Agenda View List */
        <div className="flex flex-col gap-4">
          {agendaEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-[24px] p-8">
              <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-gray-400 mb-4">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-[#111827] dark:text-slate-100 font-bold text-lg">No Upcoming Events</h3>
              <p className="text-[#6B7280] dark:text-gray-450 text-xs max-w-sm mt-1">
                There are no scheduled events or assignments matching your filters.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-[24px] p-5 shadow-sm">
              {agendaEvents.map(evt => {
                const meta = getEventMeta(evt);
                const isOverdue = new Date(evt.eventDate) < new Date() && evt.eventType.toLowerCase() === 'assignment';

                return (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className={`p-4 rounded-[20px] border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center justify-between gap-4 cursor-pointer transition-all duration-150`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${getCategoryColor(evt.eventType).split(' ')[0]}`} />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-extrabold text-[#111827] dark:text-slate-100">
                          {evt.eventTitle}
                        </span>
                        <span className="text-[10px] text-gray-400 font-semibold truncate max-w-lg">
                          {meta.summary}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {isOverdue && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100 flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" /> Overdue
                        </span>
                      )}
                      <div className="text-[10px] text-gray-500 font-bold text-right">
                        <div>{new Date(evt.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        {evt.eventTime && <div className="text-[9px] text-gray-400 mt-0.5 flex items-center justify-end gap-1"><Clock className="w-2.5 h-2.5" /> {evt.eventTime}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Event Details Popup Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[28px] p-6 max-w-sm w-full shadow-2xl relative flex flex-col gap-4 animate-slide-up">
            
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center border border-gray-200 dark:border-slate-800 text-gray-400 hover:bg-slate-50 cursor-pointer active:scale-95 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Category Indicator */}
            <div>
              <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${getCategoryBorder(selectedEvent.eventType)}`}>
                {selectedEvent.eventType}
              </span>
              <h3 className="text-sm font-black text-gray-900 dark:text-slate-100 mt-3.5 leading-snug">
                {selectedEvent.eventTitle}
              </h3>
            </div>

            {/* Event Time Info */}
            <div className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-[16px] border border-slate-100 dark:border-slate-800">
              <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 font-semibold">
                <CalendarIcon className="w-3.5 h-3.5 text-[#1677FF]" /> Date: <span className="font-extrabold text-gray-800 dark:text-slate-200">{new Date(selectedEvent.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              {selectedEvent.eventTime && (
                <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-[#1677FF]" /> Target Time: <span className="font-extrabold text-gray-800 dark:text-slate-200">{selectedEvent.eventTime}</span>
                </div>
              )}
            </div>

            {/* Summary details */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">
                Summary Description
              </span>
              <p className="text-xs text-gray-650 dark:text-gray-400 leading-relaxed bg-slate-50/50 dark:bg-slate-800/10 p-3 rounded-[16px] border border-slate-100/50 dark:border-slate-800/50">
                {getEventMeta(selectedEvent).summary}
              </p>
            </div>

            {/* Action Required details */}
            {getEventMeta(selectedEvent).actionRequired && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">
                  ⚡ Next Action Step
                </span>
                <p className="text-xs text-gray-700 dark:text-slate-200 leading-relaxed font-bold bg-amber-500/[0.03] border border-amber-200/50 dark:border-amber-900/30 p-3 rounded-[16px] flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>{getEventMeta(selectedEvent).actionRequired}</span>
                </p>
              </div>
            )}

            <button
              onClick={() => setSelectedEvent(null)}
              className="cf-btn bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs py-3 rounded-[16px] font-bold mt-2 cursor-pointer active:scale-95 transition-all flex items-center justify-center"
            >
              Close Details
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
