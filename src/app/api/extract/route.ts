import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractAcademicDetails } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, sourceType, sourceName } = body;

    if (!text || !sourceType) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: text and sourceType are required.' },
        { status: 400 }
      );
    }

    // Get current Indian timezone string representation to feed to Gemini
    const currentDateContext = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });

    // Call Gemini API (with local regex fallback inside)
    const result = await extractAcademicDetails(text, currentDateContext);

    // Calculate priority based on deadline relative to now
    let deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days from now
    if (result.deadlineISO) {
      const parsed = new Date(result.deadlineISO);
      if (!isNaN(parsed.getTime())) {
        deadline = parsed;
      }
    }
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    let priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (diffHours <= 0) {
      priority = 'LOW';
    } else if (diffHours < 3) {
      priority = 'CRITICAL';
    } else if (diffHours < 24) {
      priority = 'HIGH';
    } else if (diffHours < 72) { // 3 days
      priority = 'MEDIUM';
    } else {
      priority = 'LOW';
    }

    // Prepare reminders
    const remindersData = [];

    // 1. Immediate Demo reminder (15 seconds from now)
    // This allows the user/judge to experience the browser notification popup immediately during a live demo
    const demoTime = new Date(Date.now() + 15 * 1000);
    if (demoTime < deadline) {
      remindersData.push({ reminderTime: demoTime });
    }

    // 2. Standard warning reminders based on priority
    if (priority === 'CRITICAL' || priority === 'HIGH') {
      const oneHourBefore = new Date(deadline.getTime() - 60 * 60 * 1000);
      if (oneHourBefore > now && Math.abs(oneHourBefore.getTime() - demoTime.getTime()) > 30000) {
        remindersData.push({ reminderTime: oneHourBefore });
      }
    } else if (priority === 'MEDIUM') {
      const oneDayBefore = new Date(deadline.getTime() - 24 * 60 * 60 * 1000);
      if (oneDayBefore > now) {
        remindersData.push({ reminderTime: oneDayBefore });
      }
    } else if (priority === 'LOW') {
      const twoDaysBefore = new Date(deadline.getTime() - 2 * 24 * 60 * 60 * 1000);
      const oneDayBefore = new Date(deadline.getTime() - 24 * 60 * 60 * 1000);
      if (twoDaysBefore > now) {
        remindersData.push({ reminderTime: twoDaysBefore });
      }
      if (oneDayBefore > now && oneDayBefore > twoDaysBefore) {
        remindersData.push({ reminderTime: oneDayBefore });
      }
    }

    // Save item and reminders in a single nested write (without userId scoping)
    const item = await db.extractedItem.create({
      data: {
        title: result.title,
        category: result.category,
        summary: result.summary,
        date: result.date || null,
        time: result.time || null,
        deadline: deadline,
        priority,
        sourceType,
        sourceName: sourceName || null,
        actionRequired: result.actionRequired || null,
        reminders: {
          create: remindersData.map(r => ({
            reminderTime: r.reminderTime,
          }))
        }
      },
      include: {
        reminders: true,
      }
    });
    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    console.error('Extraction API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred during text extraction.' },
      { status: 500 }
    );
  }
}
