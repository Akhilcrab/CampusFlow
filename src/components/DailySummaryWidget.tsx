'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, AlertCircle, ChevronRight } from 'lucide-react';

export default function DailySummaryWidget({ updateTrigger = 0 }: { updateTrigger?: number }) {
  const [bullets, setBullets] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const fetchSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/summary');
      const data = await res.json();
      if (res.ok && data.success) {
        setBullets(data.bullets);
      } else {
        setError(data.error || 'Failed to load summary briefing.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to connect to the summary service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [updateTrigger]);

  const parseBoldText = (text: string) => {
    // Basic markdown bold parser (**text**)
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="font-extrabold text-[#111827] dark:text-slate-100">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="cf-card bg-gradient-to-tr from-blue-50/50 via-white to-indigo-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-850/30 border border-[#E5E7EB] dark:border-slate-800 rounded-[28px] p-6 shadow-sm relative overflow-hidden transition-all duration-300">
      
      {/* Background soft glow decoration */}
      <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-blue-400/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-indigo-400/5 blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100/60 dark:bg-blue-950/40 flex items-center justify-center border border-blue-200/50 dark:border-blue-900/40">
            <Sparkles className="w-4.5 h-4.5 text-[#1677FF]" />
          </div>
          <div>
            <h3 className="text-xs font-black text-gray-900 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
              AI Daily Briefing
              <span className="text-[9px] font-extrabold tracking-wider bg-blue-500/10 text-[#1677FF] px-2 py-0.5 rounded-full border border-blue-200/30">Deterministic</span>
            </h3>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold mt-0.5">
              Consolidated actionable intelligence from academic logs
            </p>
          </div>
        </div>

        <button
          onClick={fetchSummary}
          disabled={loading}
          className="w-8 h-8 rounded-full border border-gray-200 dark:border-slate-800 text-gray-500 hover:text-gray-900 bg-white dark:bg-slate-900 flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-50 transition-all shadow-xs"
          title="Refresh Summary"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {loading ? (
          <div className="flex flex-col gap-2.5 py-2">
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-[8px] w-11/12 animate-pulse" />
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-[8px] w-10/12 animate-pulse" />
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-[8px] w-8/12 animate-pulse" />
          </div>
        ) : error ? (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-150 dark:border-red-900/40 rounded-[16px] text-red-650 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4.5 h-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : bullets.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-xs py-2">
            No active briefings found. Load mock tasks to populate the briefing summaries.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {bullets.map((bullet, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 text-xs text-gray-650 dark:text-gray-400 leading-relaxed font-medium"
              >
                <ChevronRight className="w-3.5 h-3.5 text-[#1677FF] shrink-0 mt-1" />
                <span>{parseBoldText(bullet)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
