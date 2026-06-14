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
    const sortBy = searchParams.get('sortBy') || 'deadline'; // 'deadline' | 'company'
    const sortOrder = searchParams.get('sortOrder') || 'asc'; // 'asc' | 'desc'

    // Build query conditions
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { role: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    const placements = await db.placement.findMany({
      where: whereClause,
      include: {
        applications: true
      },
      orderBy: {
        [sortBy]: sortOrder
      }
    });

    return NextResponse.json({ success: true, data: placements });
  } catch (error: any) {
    console.error('Fetch placements API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred while fetching placements.' },
      { status: 500 }
    );
  }
}
