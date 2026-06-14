import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: assignmentId } = await params;
    const body = await req.json();
    const { reminderType, reminderDate } = body;

    if (!reminderType || !reminderDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: reminderType and reminderDate are required.' },
        { status: 400 }
      );
    }

    const rDate = new Date(reminderDate);
    if (isNaN(rDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid reminder date format.' },
        { status: 400 }
      );
    }

    // Validation: If selected reminder date is in the past, return error.
    if (rDate.getTime() < Date.now()) {
      return NextResponse.json(
        { success: false, error: 'Reminder date cannot be in the past.' },
        { status: 400 }
      );
    }

    // Check if assignment exists
    const assignment = await db.assignment.findUnique({
      where: { id: assignmentId }
    });

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found.' },
        { status: 404 }
      );
    }

    // Create the reminder
    const reminder = await db.assignmentReminder.create({
      data: {
        assignmentId,
        reminderType,
        reminderDate: rDate,
        enabled: true
      }
    });

    return NextResponse.json({ success: true, data: reminder });
  } catch (error: any) {
    console.error('Create assignment reminder error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred while setting the reminder.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: assignmentId } = await params;
    
    const reminders = await db.assignmentReminder.findMany({
      where: { assignmentId },
      orderBy: { reminderDate: 'asc' }
    });

    return NextResponse.json({ success: true, data: reminders });
  } catch (error: any) {
    console.error('Fetch assignment reminders error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred while fetching reminders.' },
      { status: 500 }
    );
  }
}
