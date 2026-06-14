import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { syncAllData } from '@/lib/services';

export async function GET(req: NextRequest) {
  try {
    // Run self-healing sync first
    await syncAllData();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const dueStart = searchParams.get('dueStart') || '';
    const dueEnd = searchParams.get('dueEnd') || '';

    // Build query conditions
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    if (dueStart || dueEnd) {
      whereClause.dueDate = {};
      if (dueStart) {
        whereClause.dueDate.gte = new Date(dueStart);
      }
      if (dueEnd) {
        whereClause.dueDate.lte = new Date(dueEnd);
      }
    }

    const assignments = await db.assignment.findMany({
      where: whereClause,
      include: {
        reminders: true
      },
      orderBy: {
        dueDate: 'asc'
      }
    });

    return NextResponse.json({ success: true, data: assignments });
  } catch (error: any) {
    console.error('Fetch assignments API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred while fetching assignments.' },
      { status: 500 }
    );
  }
}
