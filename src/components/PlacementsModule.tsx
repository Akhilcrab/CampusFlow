'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Briefcase, DollarSign, MapPin, Search, Filter, AlertTriangle, CheckCircle, RefreshCw, X, Edit, Info, Sparkles } from 'lucide-react';

interface PlacementApplication {
  id: string;
  status: string;
  appliedAt?: string;
  interviewDate?: string;
  notes?: string;
}

interface Placement {
  id: string;
  companyName: string;
  role: string;
  package: string;
  deadline: string;
  location: string;
  eligibilityText: string;
  description: string;
  status: 'Interested' | 'Applied' | 'Rejected' | 'Selected' | 'Not Applied';
  sourceType: string;
  sourceReference?: string;
  applications: PlacementApplication[];
}

export default function PlacementsModule({ onUpdate }: { onUpdate?: () => void }) {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<string>('deadline-asc'); // 'deadline-asc' | 'deadline-desc' | 'company-asc'
  
  // Banner state
  const [showUrgentBanner, setShowUrgentBanner] = useState<boolean>(true);
  
  // Detail Editor Modal State
  const [editingPlacement, setEditingPlacement] = useState<Placement | null>(null);
  const [appStatus, setAppStatus] = useState<string>('Interested');
  const [interviewDate, setInterviewDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [modalSuccess, setModalSuccess] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchPlacements = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/placements');
      const data = await res.json();
      if (res.ok && data.success) {
        setPlacements(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch placements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlacements();
    // Check session storage to see if user dismissed the banner previously
    const dismissed = sessionStorage.getItem('placement-banner-dismissed');
    if (dismissed === 'true') {
      setShowUrgentBanner(false);
    }
  }, []);

  const handleQuickStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/placements/${id}/application`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchPlacements();
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleOpenEditModal = (placement: Placement) => {
    setEditingPlacement(placement);
    
    // Check if application exists
    const app = placement.applications && placement.applications[0];
    setAppStatus(app ? app.status : placement.status !== 'Not Applied' ? placement.status : 'Interested');
    
    if (app && app.interviewDate) {
      // Format datetime-local string
      const dateObj = new Date(app.interviewDate);
      const tzOffset = dateObj.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(dateObj.getTime() - tzOffset)).toISOString().slice(0, 16);
      setInterviewDate(localISOTime);
    } else {
      setInterviewDate('');
    }
    
    setNotes(app && app.notes ? app.notes : '');
    setModalSuccess(false);
  };

  const handleSaveDetails = async () => {
    if (!editingPlacement) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/placements/${editingPlacement.id}/application`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: appStatus,
          interviewDate: interviewDate || null,
          notes
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setModalSuccess(true);
        setTimeout(() => {
          setEditingPlacement(null);
          setModalSuccess(false);
          fetchPlacements();
          if (onUpdate) onUpdate();
        }, 1200);
      }
    } catch (err) {
      console.error('Failed to save details:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const dismissBanner = () => {
    setShowUrgentBanner(false);
    sessionStorage.setItem('placement-banner-dismissed', 'true');
  };

  // Calculations for remaining time
  const getDeadlineUrgency = (deadlineStr: string) => {
    const due = new Date(deadlineStr);
    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    const diffHrs = diffMs / (1000 * 60 * 60);

    if (diffMs < 0) {
      return { text: 'Closed', level: 'closed', class: 'text-gray-500 bg-gray-50 dark:bg-gray-800' };
    }
    if (diffHrs < 24) {
      return { text: `Closing in ${Math.round(diffHrs)} hours!`, level: 'critical', class: 'text-red-650 bg-red-50 dark:bg-red-950/20 border-red-150 animate-pulse border' };
    }
    if (diffHrs < 72) {
      return { text: `Closing in ${Math.round(diffHrs / 24)} days!`, level: 'warning', class: 'text-orange-650 bg-orange-50 dark:bg-orange-950/20 border-orange-150 border' };
    }
    return { text: `Closing in ${Math.round(diffHrs / 24)} days`, level: 'safe', class: 'text-emerald-650 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-150 border' };
  };

  // Determine if there are critical placements (deadline < 3 days)
  const urgentPlacements = placements.filter(pl => {
    if (pl.status === 'Selected' || pl.status === 'Rejected') return false;
    const urgency = getDeadlineUrgency(pl.deadline);
    return urgency.level === 'critical' || urgency.level === 'warning';
  });

  // Calculate Application tracker stats
  const stats = {
    Interested: 0,
    Applied: 0,
    Interview: 0,
    Selected: 0,
    Rejected: 0
  };

  placements.forEach(pl => {
    const app = pl.applications && pl.applications[0];
    const status = app ? app.status : pl.status;
    if (status === 'Interested') stats.Interested++;
    else if (status === 'Applied') stats.Applied++;
    else if (status === 'Interview Scheduled') stats.Interview++;
    else if (status === 'Selected' || status === 'Offer Received') stats.Selected++;
    else if (status === 'Rejected') stats.Rejected++;
  });

  // Filter & Sort
  const filteredPlacements = placements
    .filter(pl => {
      const matchesSearch =
        pl.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pl.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pl.description.toLowerCase().includes(searchQuery.toLowerCase());

      const app = pl.applications && pl.applications[0];
      const activeStatus = app ? app.status : pl.status;

      let matchesStatus = true;
      if (statusFilter !== 'all') {
        if (statusFilter === 'Not Applied') {
          matchesStatus = activeStatus === 'Not Applied';
        } else {
          matchesStatus = activeStatus === statusFilter;
        }
      }

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortOrder === 'deadline-asc') {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      if (sortOrder === 'deadline-desc') {
        return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
      }
      if (sortOrder === 'company-asc') {
        return a.companyName.localeCompare(b.companyName);
      }
      return 0;
    });

  return (
    <div className="w-full flex flex-col gap-6">

      {/* Module 4: Top Banner Alert for urgent placement */}
      {showUrgentBanner && urgentPlacements.length > 0 && (
        <div className="w-full bg-red-50 dark:bg-red-950/15 border border-red-200 dark:border-red-900/40 rounded-[24px] p-5 flex items-center justify-between text-red-750 dark:text-red-400 shadow-[0_1px_2px_rgba(0,0,0,0.04)] animate-slide-up">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <div className="text-xs font-extrabold flex flex-wrap gap-x-4">
              <span>⚠️ Placement Closing Soon: {urgentPlacements[0].companyName} deadline is in less than {new Date(urgentPlacements[0].deadline).getTime() - Date.now() < 24 * 60 * 60 * 1000 ? '24 hours' : '3 days'}!</span>
            </div>
          </div>
          <button
            onClick={dismissBanner}
            className="w-7 h-7 rounded-full bg-red-100/50 dark:bg-red-950/30 flex items-center justify-center text-red-650 hover:bg-red-100 cursor-pointer active:scale-95 transition-all"
            title="Dismiss Alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Module 5: Application Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: '🌟 Interested', count: stats.Interested, color: 'border-blue-200 text-blue-600 bg-blue-500/[0.02] dark:bg-blue-500/[0.01]' },
          { label: '📝 Applied', count: stats.Applied, color: 'border-amber-200 text-amber-600 bg-amber-500/[0.02] dark:bg-amber-500/[0.01]' },
          { label: '📅 Interviews', count: stats.Interview, color: 'border-purple-200 text-purple-600 bg-purple-500/[0.02] dark:bg-purple-500/[0.01]' },
          { label: '🎉 Selected', count: stats.Selected, color: 'border-emerald-200 text-emerald-600 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.01]' },
          { label: '❌ Rejected', count: stats.Rejected, color: 'border-red-200 text-red-500 bg-red-500/[0.02] dark:bg-red-500/[0.01]' }
        ].map(item => (
          <div
            key={item.label}
            className={`cf-card bg-white dark:bg-slate-900 border rounded-[20px] p-4 flex flex-col justify-center items-center shadow-xs ${item.color}`}
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {item.label}
            </span>
            <span className="text-xl font-black mt-1">
              {item.count}
            </span>
          </div>
        ))}
      </div>

      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#111827] dark:text-slate-100 flex items-center gap-2 tracking-tight">
            💼 Placements Center
          </h2>
          <p className="text-[#6B7280] dark:text-gray-400 text-xs mt-1">
            Track active recruitment drives, applications progress, and upcoming interview calls
          </p>
        </div>
        <button
          onClick={fetchPlacements}
          className="cf-btn bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs px-4 py-2 rounded-[16px] text-gray-700 dark:text-slate-200 font-bold flex items-center gap-2 self-start cursor-pointer active:scale-95 transition-all shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Placements
        </button>
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-[24px] shadow-sm">
        
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search company or role..."
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
            <option value="Not Applied">Not Applied</option>
            <option value="Interested">Interested</option>
            <option value="Applied">Applied</option>
            <option value="Interview Scheduled">Interview Scheduled</option>
            <option value="Selected">Selected</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* Sort Order */}
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gray-400" />
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            className="w-full p-2.5 rounded-[16px] border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-xs text-[#111827] dark:text-slate-200 focus:outline-none focus:border-[#1677FF] cursor-pointer"
          >
            <option value="deadline-asc">Urgency (Default)</option>
            <option value="deadline-desc">Latest Deadline First</option>
            <option value="company-asc">Company Name (A-Z)</option>
          </select>
        </div>

      </div>

      {/* Placement List Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-[24px]">
          <RefreshCw className="w-8 h-8 text-[#1677FF] animate-spin mb-3" />
          <p className="text-[#6B7280] dark:text-gray-400 text-sm">Syncing Placement Data...</p>
        </div>
      ) : filteredPlacements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-[24px] p-8">
          <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800/40 flex items-center justify-center text-gray-400 mb-4">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="text-[#111827] dark:text-slate-100 font-bold text-lg">No Placements Found</h3>
          <p className="text-[#6B7280] dark:text-gray-450 text-xs max-w-sm mt-1">
            Check back later, or upload circular screenshots containing recruitment details on the left.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
          {filteredPlacements.map(pl => {
            const urgency = getDeadlineUrgency(pl.deadline);
            const app = pl.applications && pl.applications[0];
            const activeStatus = app ? app.status : pl.status;

            return (
              <div
                key={pl.id}
                className={`cf-card bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800/80 rounded-[24px] p-6 flex flex-col justify-between shadow-sm relative transition-all duration-200 ${
                  activeStatus === 'Selected' ? 'border-l-4 border-l-emerald-500' :
                  activeStatus === 'Rejected' ? 'border-l-4 border-l-red-500 opacity-60' :
                  activeStatus === 'Interview Scheduled' ? 'border-l-4 border-l-purple-500' :
                  activeStatus === 'Applied' ? 'border-l-4 border-l-amber-500' : ''
                }`}
              >
                <div>
                  
                  {/* Badges */}
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                    <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-green-50 dark:bg-green-950/20 text-[#22C55E] border border-green-150 dark:border-green-900/40">
                      {pl.companyName}
                    </span>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      activeStatus === 'Selected' || activeStatus === 'Offer Received' ? 'bg-emerald-50 text-emerald-650 dark:bg-emerald-950/20' :
                      activeStatus === 'Rejected' ? 'bg-red-50 text-red-600 dark:bg-red-950/20' :
                      activeStatus === 'Interview Scheduled' ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/20 animate-pulse' :
                      activeStatus === 'Applied' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20' :
                      activeStatus === 'Interested' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20' :
                      'bg-gray-50 text-gray-500 dark:bg-gray-800'
                    }`}>
                      {activeStatus}
                    </span>
                  </div>

                  <h3 className="text-sm font-extrabold text-[#111827] dark:text-slate-100">
                    {pl.role}
                  </h3>
                  
                  {/* Metadata fields */}
                  <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 mt-3 bg-slate-50 dark:bg-slate-800/30 p-3.5 rounded-[16px] border border-slate-100/50 dark:border-slate-800/50">
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 font-semibold">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Package: <span className="font-extrabold text-gray-800 dark:text-slate-200">{pl.package}</span>
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" /> Location: <span className="font-extrabold text-gray-800 dark:text-slate-200">{pl.location}</span>
                    </div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 col-span-2 flex items-start gap-1.5 font-semibold">
                      <Info className="w-3.5 h-3.5 text-[#1677FF] mt-0.5" /> Eligibility: <span className="font-bold text-gray-800 dark:text-slate-200 leading-snug">{pl.eligibilityText}</span>
                    </div>
                  </div>

                  <p className="text-[#6B7280] dark:text-gray-400 text-xs mt-3 leading-relaxed">
                    {pl.description}
                  </p>

                  {/* Interview Call and Notes panel */}
                  {app && (app.interviewDate || app.notes) && (
                    <div className="mt-4 p-3 bg-purple-500/[0.02] border border-purple-200/50 dark:border-purple-900/30 rounded-[16px]">
                      {app.interviewDate && (
                        <div className="text-[11px] text-purple-750 dark:text-purple-400 font-extrabold flex items-center gap-1.5 mb-1">
                          <Calendar className="w-3.5 h-3.5" /> Interview Call: {new Date(app.interviewDate).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                      {app.notes && (
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                          <span className="font-bold text-gray-400">Notes:</span> {app.notes}
                        </div>
                      )}
                    </div>
                  )}

                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  
                  {/* Deadline info */}
                  <div className="flex flex-col gap-0.5">
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full ${urgency.class}`}>
                      {urgency.text}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold ml-1.5 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Registration Close: {new Date(pl.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  {/* Action Panel */}
                  <div className="flex items-center gap-2">
                    {/* Status change actions */}
                    {activeStatus === 'Not Applied' ? (
                      <>
                        <button
                          onClick={() => handleQuickStatusChange(pl.id, 'Interested')}
                          className="cf-btn border border-blue-200 text-blue-600 bg-blue-50 text-[10px] px-2.5 py-2 rounded-[12px] font-extrabold cursor-pointer active:scale-95 transition-all"
                        >
                          ⭐ Interested
                        </button>
                        <button
                          onClick={() => handleQuickStatusChange(pl.id, 'Applied')}
                          className="cf-btn bg-[#1677FF] hover:bg-[#1677FF]/90 text-white text-[10px] px-2.5 py-2 rounded-[12px] font-extrabold cursor-pointer active:scale-95 transition-all shadow-xs"
                        >
                          📝 Apply
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Edit details button */}
                        <button
                          onClick={() => handleOpenEditModal(pl)}
                          className="w-8.5 h-8.5 rounded-[12px] border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                          title="Edit Interview Date / Notes"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <select
                          value={activeStatus}
                          onChange={e => handleQuickStatusChange(pl.id, e.target.value)}
                          className="text-[10px] font-extrabold px-2 py-2 rounded-[12px] bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-[#111827] dark:text-slate-200 focus:outline-none cursor-pointer"
                        >
                          <option value="Interested">⭐ Interested</option>
                          <option value="Applied">📝 Applied</option>
                          <option value="Interview Scheduled">📅 Interview</option>
                          <option value="Selected">🎉 Selected</option>
                          <option value="Rejected">❌ Rejected</option>
                        </select>
                      </>
                    )}
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Edit Placement Application Details Modal */}
      {editingPlacement && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[28px] p-6 max-w-sm w-full shadow-2xl relative flex flex-col gap-4 animate-slide-up">
            
            <button
              onClick={() => setEditingPlacement(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center border border-gray-200 dark:border-slate-800 text-gray-400 hover:bg-slate-50 cursor-pointer active:scale-95 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-slate-100">
                ✏️ Update Application Tracker
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 leading-snug">
                Track interview schedule and notes for {editingPlacement.companyName}
              </p>
            </div>

            {/* Status Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">
                Application Status
              </label>
              <select
                value={appStatus}
                onChange={e => setAppStatus(e.target.value)}
                className="w-full p-2.5 rounded-[14px] border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-xs text-[#111827] dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="Interested">⭐ Interested</option>
                <option value="Applied">📝 Applied</option>
                <option value="Interview Scheduled">📅 Interview Scheduled</option>
                <option value="Selected">🎉 Selected (Offer Received)</option>
                <option value="Rejected">❌ Rejected</option>
              </select>
            </div>

            {/* Interview Date Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">
                Interview Date & Time
              </label>
              <input
                type="datetime-local"
                value={interviewDate}
                onChange={e => setInterviewDate(e.target.value)}
                className="w-full p-2.5 rounded-[14px] border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-xs text-[#111827] dark:text-slate-200 focus:outline-none"
              />
            </div>

            {/* Notes Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">
                Application Notes / Syllabus
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Round 1: DSA coding quiz, focus on trees and dynamic programming."
                rows={3}
                className="w-full p-2.5 rounded-[14px] border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-xs text-[#111827] dark:text-slate-200 focus:outline-none resize-none"
              />
            </div>

            {/* Success State */}
            {modalSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-150 dark:border-emerald-900/50 rounded-[14px] text-emerald-650 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Details successfully saved!</span>
              </div>
            )}

            <button
              onClick={handleSaveDetails}
              disabled={actionLoading || modalSuccess}
              className="cf-btn bg-[#1677FF] hover:bg-[#1677FF]/90 text-white text-xs py-3 rounded-[16px] font-bold mt-2 shadow-sm cursor-pointer disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {actionLoading ? 'Saving...' : 'Save Tracker Info'}
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
