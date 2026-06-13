'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { ExtractedItemWithReminders } from '@/types';

interface NotificationManagerProps {
  items: ExtractedItemWithReminders[];
  onReminderTriggered: () => void;
}

export default function NotificationManager({ items, onReminderTriggered }: NotificationManagerProps) {
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Request browser notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          console.log('Browser notification permission:', permission);
        });
      }
    }
  }, []);

  const triggerDesktopNotification = (title: string, summary: string, priority: string, category: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notification = new Notification(`CampusFlow: ${title}`, {
          body: `[${priority}] ${category}\n${summary}`,
          tag: 'campusflow-reminder',
        });
        
        notification.onclick = () => {
          window.focus();
        };
      } catch (err) {
        console.error('Failed to trigger native notification:', err);
      }
    }
  };

  // Monitor active items reminders (only trigger system OS notification, no audio)
  useEffect(() => {
    const checkReminders = async () => {
      const now = new Date();
      let triggeredAny = false;

      for (const item of items) {
        if (item.isCompleted) continue;

        for (const reminder of item.reminders) {
          if (reminder.isTriggered || reminder.isDismissed) continue;

          const reminderTime = new Date(reminder.reminderTime);
          
          if (reminderTime <= now) {
            console.log(`Triggering reminder notification: "${item.title}"`);
            
            // Trigger desktop system alert (No audio chimes here!)
            triggerDesktopNotification(
              item.title,
              item.summary,
              item.priority,
              item.category
            );
            
            // Mark the reminder as triggered in database
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
              console.error(`Failed to update reminder ${reminder.id}:`, err);
            }
          }
        }
      }

      if (triggeredAny) {
        onReminderTriggered();
      }
    };

    checkReminders();
    checkIntervalRef.current = setInterval(checkReminders, 10000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [items, onReminderTriggered]);

  return (
    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-gray-200 text-xs text-[#6B7280]">
      <Bell className={`w-3.5 h-3.5 text-[#1677FF] ${items.some(i => i.reminders.some(r => !r.isTriggered)) ? 'animate-bounce' : ''}`} />
      <span className="font-semibold text-[#6B7280]">
        {!mounted ? 'Enable Alerts' : (
          'Notification' in window && Notification.permission === 'granted' 
            ? 'Live Alerts Enabled' 
            : 'Enable Alerts'
        )}
      </span>
    </div>
  );
}
