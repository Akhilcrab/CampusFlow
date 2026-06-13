import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Category, Priority } from '@prisma/client';

// Priority sorting helper mapping
const priorityOrder: Record<Priority, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryFilter = searchParams.get('category');
    
    // Fetch all items with reminders (no auth scoping)
    const items = await db.extractedItem.findMany({
      where: categoryFilter ? { category: categoryFilter as Category } : {},
      include: {
        reminders: true,
      },
    });

    // Sort items: Active first, sorted by Urgency (Critical -> High -> Medium -> Low), then Completed at the bottom
    items.sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      const ad = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const bd = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return ad - bd;
    });

    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    console.error('Fetch items API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred while fetching items.' },
      { status: 500 }
    );
  }
}

// POST endpoint to seed mock academic items for demo purposes
export async function POST(req: NextRequest) {
  try {
    const itemsCount = await db.extractedItem.count();
    if (itemsCount > 0) {
      return NextResponse.json({ success: true, message: 'Database already has data. Skipping seed.', count: itemsCount });
    }

    const now = new Date();

    // Mock data deadlines
    const criticalDeadline = new Date(now.getTime() + 2.5 * 60 * 60 * 1000); // 2.5 hours from now
    const highDeadline = new Date(now.getTime() + 18 * 60 * 60 * 1000); // 18 hours from now
    const mediumDeadline = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
    const lowDeadline = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days from now

    // Helper to generate multi-stage reminders
    const getMultiStageReminders = (category: Category, deadline: Date) => {
      const reminders = [{ reminderTime: new Date(now.getTime() + 15 * 1000) }]; // demo reminder (15s from now)
      let offsets: number[] = [];
      if (category === 'ASSIGNMENT') offsets = [12, 3, 1];
      else if (category === 'EXAM') offsets = [24, 12, 3, 1];
      else if (category === 'PLACEMENT') offsets = [48, 24, 12];
      else if (category === 'EVENT') offsets = [24, 3];

      for (const h of offsets) {
        const rTime = new Date(deadline.getTime() - h * 60 * 60 * 1000);
        if (rTime > now && Math.abs(rTime.getTime() - reminders[0].reminderTime.getTime()) > 30000) {
          reminders.push({ reminderTime: rTime });
        }
      }
      return {
        create: reminders.map(r => ({ reminderTime: r.reminderTime }))
      };
    };

    const mockItems = [
      {
        title: 'OS Lab Assignment 4',
        category: Category.ASSIGNMENT,
        summary: 'Implement Page Replacement Algorithms (FIFO, LRU, Optimal) in C/C++. Write a report and submit the code.',
        date: criticalDeadline.toISOString().split('T')[0],
        time: '23:59',
        deadline: criticalDeadline,
        priority: Priority.CRITICAL,
        sourceType: 'whatsapp',
        sourceName: 'OS_Class_Group.txt',
        actionRequired: 'Upload the code zip and PDF report to Google Classroom.',
        priorityExplanation: 'Deadline is critically close (less than 3 hours away).',
        reminders: getMultiStageReminders(Category.ASSIGNMENT, criticalDeadline)
      },
      {
        title: 'TCS Placement Registration',
        category: Category.PLACEMENT,
        summary: 'TCS National Qualifier Test (NQT) portal is closing for placements. Registrations are mandatory to sit for rounds.',
        date: highDeadline.toISOString().split('T')[0],
        time: '18:00',
        deadline: highDeadline,
        priority: Priority.HIGH,
        sourceType: 'screenshot',
        sourceName: 'placement_notice.png',
        actionRequired: 'Fill details and submit application on TCS NextStep portal.',
        priorityExplanation: 'Deadline is within 24 hours.',
        reminders: getMultiStageReminders(Category.PLACEMENT, highDeadline)
      },
      {
        title: 'HackOn Hackathon Submission',
        category: Category.EVENT,
        summary: 'Submit the final project video and github link for the Amazon HackOn MVP. Ensure readme is detailed.',
        date: mediumDeadline.toISOString().split('T')[0],
        time: '12:00',
        deadline: mediumDeadline,
        priority: Priority.MEDIUM,
        sourceType: 'whatsapp',
        sourceName: 'HackOn_Announcements.txt',
        actionRequired: 'Submit video walk-through URL and GitHub repo on Devfolio.',
        priorityExplanation: 'Deadline is within 3 days.',
        reminders: getMultiStageReminders(Category.EVENT, mediumDeadline)
      },
      {
        title: 'Maths Mid-Semester Quiz',
        category: Category.EXAM,
        summary: 'Linear Algebra and Calculus Quiz-2. Syllabus includes Chapters 4, 5, and 6. Formula sheet allowed.',
        date: lowDeadline.toISOString().split('T')[0],
        time: '09:00',
        deadline: lowDeadline,
        priority: Priority.LOW,
        sourceType: 'whatsapp',
        sourceName: 'Class_Updates.txt',
        actionRequired: 'Prepare chapter problems and print formula sheet.',
        priorityExplanation: 'Deadline is more than 3 days away.',
        reminders: getMultiStageReminders(Category.EXAM, lowDeadline)
      }
    ];

    // Create seed items
    for (const item of mockItems) {
      await db.extractedItem.create({
        data: item,
      });
    }

    return NextResponse.json({ success: true, message: 'Mock academic items seeded successfully.' });
  } catch (error: any) {
    console.error('Seeding items error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred while seeding.' },
      { status: 500 }
    );
  }
}
