import { Category, Priority } from '@prisma/client';

export interface ExtractedItemWithReminders {
  id: string;
  title: string;
  category: Category;
  summary: string;
  date?: string | null;
  time?: string | null;
  deadline?: string | null; // ISO string returned from API
  priority: Priority;
  sourceType: string;
  sourceName?: string | null;
  actionRequired?: string | null;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  reminders: Reminder[];
}

export interface Reminder {
  id: string;
  itemId: string;
  reminderTime: string; // ISO string
  isTriggered: boolean;
  isDismissed: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalActive: number;
  urgentCount: number; // Critical + High
  completedCount: number;
  byCategory: {
    ASSIGNMENT: number;
    EXAM: number;
    EVENT: number;
    PLACEMENT: number;
    NOTICE: number;
    OTHER: number;
  };
}
