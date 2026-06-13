'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Bell, BellOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { ExtractedItemWithReminders } from '@/types';

interface NotificationManagerProps {
  items: ExtractedItemWithReminders[];
  onReminderTriggered: () => void;
}

export default function NotificationManager({ items, onReminderTriggered }: NotificationManagerProps) {
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showStatusTooltip, setShowStatusTooltip] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const showNotification = (title: string, body: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          body,
          tag: 'campusflow-reminder',
          icon: '/favicon.ico',
        });
        
        notification.onclick = () => {
          window.focus();
        };
      } catch (err) {
        console.error('Failed to trigger native notification:', err);
      }
    }
  };

  const handleRequestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setAlertMessage({ type: 'error', text: 'Notifications are not supported in this browser.' });
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        setAlertMessage({ type: 'success', text: '✅ Notifications Enabled successfully!' });
        showNotification('CampusFlow', 'Notifications enabled successfully.');
      } else if (result === 'denied') {
        setAlertMessage({ 
          type: 'error', 
          text: '🔕 Notification permission denied. Please clear permission settings in your browser address bar to re-enable alerts.' 
        });
      }
      
      // Auto-clear message after 5 seconds
      setTimeout(() => setAlertMessage(null), 6000);
    } catch (err) {
      console.error('Error requesting notification permission:', err);
    }
  };

  const getReminderText = (item: ExtractedItemWithReminders, reminderTime: Date) => {
    if (!item.deadline) {
      return {
        title: '📚 Academic Update',
        body: `${item.title} requires action soon.`
      };
    }

    const deadline = new Date(item.deadline);
    const diffMs = deadline.getTime() - reminderTime.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));

    // Handle immediate demo reminders
    if (diffMs > 0 && diffHours <= 0.5) {
      return {
        title: `🔔 Demo Alert: ${item.category}`,
        body: `${item.title} deadline simulation active.`
      };
    }

    if (diffHours === 1) {
      return {
        title: '🔴 Final Reminder',
        body: `${item.title} due in 1 hour.`
      };
    }

    if (diffHours === 3) {
      return {
        title: '🚨 Urgent Reminder',
        body: `${item.title} due in 3 hours.`
      };
    }

    const catLabel = item.category.charAt(0) + item.category.slice(1).toLowerCase();
    return {
      title: `📚 ${catLabel} Due Soon`,
      body: `${item.title} due in ${diffHours} hours.`
    };
  };

  // Monitor active items reminders
  useEffect(() => {
    const checkReminders = async () => {
      if (permission !== 'granted') return;
      
      const now = new Date();
      let triggeredAny = false;

      for (const item of items) {
        if (item.isCompleted) continue;

        for (const reminder of item.reminders) {
          if (reminder.isTriggered || reminder.isDismissed) continue;

          const reminderTime = new Date(reminder.reminderTime);
          
          if (reminderTime <= now) {
            console.log(`Triggering scheduled reminder: "${item.title}"`);
            
            // Generate semantic title & body based on category rules
            const { title, body } = getReminderText(item, reminderTime);
            
            // Fire native notification
            showNotification(title, body);
            
            // Mark the reminder as triggered in the database
            try {
              const res = await fetch(`/api/items/${item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  reminderId: reminder.id,
                  isTriggered: true,
                }),
              });
              
              if (res.ok) {
                triggeredAny = true;
              }
            } catch (err) {
              console.error(`Failed to update reminder status for ${reminder.id}:`, err);
            }
          }
        }
      }

      if (triggeredAny) {
        onReminderTriggered();
      }
    };

    if (mounted) {
      checkReminders();
      checkIntervalRef.current = setInterval(checkReminders, 10000);
    }

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [items, onReminderTriggered, permission, mounted]);

  if (!mounted) return null;

  return (
    <div className="relative flex items-center gap-3">
      {/* Alert toast info */}
      {alertMessage && (
        <div 
          className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2 text-xs font-bold animate-slide-up bg-white dark:bg-slate-900 ${
            alertMessage.type === 'success' 
              ? 'border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400' 
              : 'border-red-200 text-red-700 dark:border-red-800 dark:text-red-400'
          }`}
        >
          {alertMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          )}
          <span>{alertMessage.text}</span>
          <button 
            onClick={() => setAlertMessage(null)} 
            className="ml-2 hover:opacity-70 text-[10px] uppercase font-black"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Trigger Badge/Button */}
      {permission === 'granted' ? (
        <div 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-400 cursor-pointer select-none transition-all"
          onClick={() => {
            showNotification('CampusFlow', 'Alert system check active.');
            setAlertMessage({ type: 'success', text: '🔔 Notifications are active and live syncing.' });
            setTimeout(() => setAlertMessage(null), 3000);
          }}
          title="Notifications are fully enabled. Click to test."
        >
          <Bell className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
          <span className="font-extrabold">🔔 Enabled</span>
        </div>
      ) : permission === 'denied' ? (
        <div 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-400 cursor-pointer select-none transition-all"
          onClick={() => {
            setAlertMessage({ 
              type: 'error', 
              text: '🔕 Notifications are blocked. Please reset site permissions in your browser configurations.' 
            });
            setTimeout(() => setAlertMessage(null), 5000);
          }}
          title="Notification permission has been blocked. Click for help."
        >
          <BellOff className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
          <span className="font-extrabold">🔕 Disabled</span>
        </div>
      ) : (
        <button
          onClick={handleRequestPermission}
          className="cf-btn flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 text-xs text-gray-700 dark:text-gray-200 cursor-pointer active:scale-95 transition-all shadow-sm"
        >
          <Bell className="w-3.5 h-3.5 text-[#1677FF]" />
          <span className="font-bold">Enable Notifications</span>
        </button>
      )}
    </div>
  );
}
