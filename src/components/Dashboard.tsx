'use client';

import React, { useState, useEffect } from 'react';
import { ExtractedItemWithReminders, DashboardStats } from '@/types';
import FileUpload from './FileUpload';
import StatCards from './StatCards';
import ItemCard from './ItemCard';
import NotificationManager from './NotificationManager';
import { Calendar, BookOpen, Layers, RefreshCw } from 'lucide-react';
import { Category } from '@prisma/client';
import { playBellChime } from '@/lib/sound';

export default function Dashboard() {
  // Navigation tabs: 'dashboard' | 'inbox' | 'placements' | 'assignments'
  const [activeNav, setActiveNav] = useState<'dashboard' | 'inbox' | 'placements' | 'assignments'>('dashboard');
  const [items, setItems] = useState<ExtractedItemWithReminders[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  const [stats, setStats] = useState<DashboardStats>({
    totalActive: 0,
    urgentCount: 0,
    completedCount: 0,
    byCategory: {
      ASSIGNMENT: 0,
      EXAM: 0,
      EVENT: 0,
      PLACEMENT: 0,
      NOTICE: 0,
      OTHER: 0,
    }
  });

  const fetchItems = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    try {
      const response = await fetch('/api/items');
      const result = await response.json();
      
      if (response.ok && result.success) {
        setItems(result.data);
        calculateStats(result.data);
      }
    } catch (err) {
      console.error('Failed to load items:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (data: ExtractedItemWithReminders[]) => {
    const active = data.filter(i => !i.isCompleted);
    const completed = data.filter(i => i.isCompleted);
    const urgent = active.filter(i => i.priority === 'CRITICAL' || i.priority === 'HIGH');
    
    const byCategory = {
      ASSIGNMENT: 0,
      EXAM: 0,
      EVENT: 0,
      PLACEMENT: 0,
      NOTICE: 0,
      OTHER: 0,
    };

    active.forEach(item => {
      if (byCategory[item.category] !== undefined) {
        byCategory[item.category]++;
      }
    });

    setStats({
      totalActive: active.length,
      urgentCount: urgent.length,
      completedCount: completed.length,
      byCategory,
    });
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleItemExtracted = () => {
    fetchItems();
  };

  const handleToggleComplete = async (id: string, isCompleted: boolean) => {
    try {
      const response = await fetch(`/api/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted }),
      });
      if (response.ok) {
        setItems(prev => {
          const updated = prev.map(item => item.id === id ? { ...item, isCompleted } : item);
          calculateStats(updated);
          return updated;
        });
        
        if (isCompleted) {
          playBellChime();
        }

        setTimeout(() => fetchItems(), 500);
      }
    } catch (err) {
      console.error('Failed to complete item:', err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const response = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setItems(prev => {
          const filtered = prev.filter(item => item.id !== id);
          calculateStats(filtered);
          return filtered;
        });
      }
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const handleSeedDemo = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/items', { method: 'POST' });
      if (response.ok) {
        await fetchItems();
      }
    } catch (err) {
      console.error('Failed to seed demo database:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReminderTriggered = () => {
    fetchItems();
  };

  // Filter items logic depending on active navigation view
  const filteredItems = items.filter(item => {
    if (activeNav === 'inbox') return !item.isCompleted;
    if (activeNav === 'assignments') return item.category === Category.ASSIGNMENT;
    if (activeNav === 'placements') return item.category === Category.PLACEMENT;
    return true; // dashboard shows all
  });

  return (
    <div className="w-full min-h-screen bg-[#F5F5F7] px-6 py-8 flex flex-col gap-8">
      {/* 1. Floating Top Navigation Bar */}
      <header className="w-full max-w-7xl mx-auto bg-white border border-[#E5E7EB] rounded-[24px] px-6 py-4 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] transition-all">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-[#1677FF] flex items-center justify-center font-black text-white text-sm">
            CF
          </span>
          <span className="font-extrabold text-[#111827] text-base tracking-tight">
            CampusFlow<span className="text-[#1677FF]">.ai</span>
          </span>
        </div>

        {/* Floating rounded link tabs */}
        <nav className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1">
          {[
            { key: 'dashboard', label: 'Dashboard' },
            { key: 'inbox', label: 'Inbox' },
            { key: 'assignments', label: 'Assignments' },
            { key: 'placements', label: 'Placements' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveNav(tab.key as any)}
              className={`text-xs font-bold px-4 py-2 rounded-[16px] transition-all cursor-pointer ${
                activeNav === tab.key
                  ? 'bg-slate-100 text-[#111827]'
                  : 'text-[#6B7280] hover:text-[#111827] hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Live Alerts Status Info */}
        <div className="flex items-center gap-3">
          <NotificationManager items={items} onReminderTriggered={handleReminderTriggered} />
        </div>
      </header>

      {/* 2. Unified Grid Layout Container */}
      <main className="w-full max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* Dynamic Notification Banner (Green section banner) */}
        {items.length > 0 && (
          <div className="w-full bg-[#F0FDF4] border border-[#BBF7D0] rounded-[24px] p-5 flex items-center justify-between text-[#166534] shadow-[0_1px_2px_rgba(0,0,0,0.04)] animate-slide-up">
            <div className="flex items-center gap-3">
              <span className="flex w-2.5 h-2.5 rounded-full bg-[#22C55E] relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75"></span>
              </span>
              <div className="text-xs font-bold flex flex-wrap gap-x-4 gap-y-1">
                <span>📢 3 new notices detected</span>
                <span>•</span>
                <span>TCS Placement deadline tomorrow</span>
                <span>•</span>
                <span>Exam schedule updated</span>
              </div>
            </div>
            <button 
              onClick={() => fetchItems(true)}
              className="text-[11px] font-extrabold hover:underline flex items-center gap-1.5 cursor-pointer text-[#166534]/80 hover:text-[#166534]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Sync Live
            </button>
          </div>
        )}

        {/* 3. Metric Counter Cards */}
        <StatCards stats={stats} />

        {/* 4. Split Workspace Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start w-full">
          
          {/* Left Column: Upload Center (Static block) */}
          <div className="lg:col-span-1 flex flex-col gap-6 lg:sticky lg:top-8">
            <h3 className="text-sm font-extrabold text-[#6B7280] uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#1677FF]" /> Upload Center
            </h3>
            <FileUpload onItemExtracted={handleItemExtracted} />
          </div>

          {/* Right Column: Academic Inbox Feed */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
              <h3 className="text-sm font-extrabold text-[#6B7280] uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#1677FF]" /> Pending Updates — Verify &amp; Approve
              </h3>
              
              {items.length === 0 && !loading && (
                <button
                  onClick={handleSeedDemo}
                  className="cf-btn flex items-center gap-2 bg-[#1677FF] hover:bg-[#1677FF]/90 text-white text-xs px-4 py-2.5 rounded-[16px] transition-all cursor-pointer shadow-sm"
                >
                  Load Sandbox Mock Data
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 cf-card bg-white border border-[#E5E7EB] rounded-[24px]">
                <RefreshCw className="w-8 h-8 text-[#1677FF] animate-spin mb-3" />
                <p className="text-[#6B7280] text-sm">Syncing academic databases...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center cf-card bg-white border border-[#E5E7EB] rounded-[24px] p-8">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 text-[#6B7280] mb-4">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-[#111827] font-bold text-lg">Inbox Clear</h3>
                <p className="text-[#6B7280] text-xs max-w-sm mt-1">
                  Upload text exports or circular screenshots on the left to start extracting details, or load sandbox data.
                </p>
                {items.length === 0 && (
                  <button
                    onClick={handleSeedDemo}
                    className="mt-6 cf-btn flex items-center gap-2 bg-[#1677FF]/10 hover:bg-[#1677FF]/20 border border-[#1677FF]/20 text-[#1677FF] text-xs px-4 py-2.5 rounded-[16px] transition-all"
                  >
                    Load Mock Academic Tasks
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
                {filteredItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onToggleComplete={handleToggleComplete}
                    onDeleteItem={handleDeleteItem}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
