import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractAcademicDetails } from '@/lib/gemini';
import { createAssignmentOrPlacementFromAI } from '@/lib/services';

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
    const demoTime = new Date(Date.now() + 15 * 1000);
    if (demoTime < deadline) {
      remindersData.push({ reminderTime: demoTime });
    }

    // 2. Standard multi-stage reminders based on category rules
    let offsets: number[] = [];
    if (result.category === 'ASSIGNMENT') {
      offsets = [12, 3, 1];
    } else if (result.category === 'EXAM') {
      offsets = [24, 12, 3, 1];
    } else if (result.category === 'PLACEMENT') {
      offsets = [48, 24, 12];
    } else if (result.category === 'EVENT') {
      offsets = [24, 3];
    } else {
      offsets = [24, 1];
    }

    for (const h of offsets) {
      const rTime = new Date(deadline.getTime() - h * 60 * 60 * 1000);
      if (rTime > now && Math.abs(rTime.getTime() - demoTime.getTime()) > 30000) {
        remindersData.push({ reminderTime: rTime });
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

    // Create high-fidelity assignment/placement record
    try {
      await createAssignmentOrPlacementFromAI(item, result);
    } catch (err) {
      console.error('Failed to create helper models from AI response:', err);
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    console.error('Extraction API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred during text extraction.' },
      { status: 500 }
    );
  }
}
