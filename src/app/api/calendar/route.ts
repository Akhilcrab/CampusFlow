import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { syncAllData } from '@/lib/services';

export async function GET(req: NextRequest) {
  try {
    // Run self-healing sync
    await syncAllData();

    const { searchParams } = new URL(req.url);
    const eventType = searchParams.get('eventType') || '';

    const whereClause: any = {};
    if (eventType) {
      whereClause.eventType = eventType;
    }

    const events = await db.academicCalendarEvent.findMany({
      where: whereClause,
      orderBy: {
        eventDate: 'asc'
      }
    });

    return NextResponse.json({ success: true, data: events });
  } catch (error: any) {
    console.error('Fetch calendar events API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred while fetching calendar events.' },
      { status: 500 }
    );
  }
}
