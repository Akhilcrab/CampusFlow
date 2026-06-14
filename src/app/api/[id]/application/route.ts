import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: placementId } = await params;

    const application = await db.placementApplication.findUnique({
      where: { placementId }
    });

    return NextResponse.json({ success: true, data: application });
  } catch (error: any) {
    console.error('Fetch placement application error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred while fetching application status.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: placementId } = await params;
    const body = await req.json();
    const { status, interviewDate, notes } = body;

    const validStatuses = [
      'Interested',
      'Applied',
      'Interview Scheduled',
      'Rejected',
      'Selected',
      'Offer Received'
    ];

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid application status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const parsedInterviewDate = interviewDate ? new Date(interviewDate) : null;
    if (parsedInterviewDate && isNaN(parsedInterviewDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid interview date format.' },
        { status: 400 }
      );
    }

    // Upsert the PlacementApplication
    const application = await db.placementApplication.upsert({
      where: { placementId },
      update: {
        status,
        interviewDate: parsedInterviewDate,
        notes: notes !== undefined ? notes : undefined,
        appliedAt: status === 'Applied' && !body.appliedAt ? new Date() : undefined
      },
      create: {
        placementId,
        status,
        interviewDate: parsedInterviewDate,
        notes: notes || '',
        appliedAt: status === 'Applied' ? new Date() : null
      }
    });

    // Map Application Status back to Placement Status
    // Placement statuses: Interested, Applied, Rejected, Selected, Not Applied
    let placementStatus = 'Not Applied';
    if (status === 'Interested') placementStatus = 'Interested';
    else if (status === 'Applied' || status === 'Interview Scheduled') placementStatus = 'Applied';
    else if (status === 'Rejected') placementStatus = 'Rejected';
    else if (status === 'Selected' || status === 'Offer Received') placementStatus = 'Selected';

    // Update Placement status
    await db.placement.update({
      where: { id: placementId },
      data: { status: placementStatus }
    });

    return NextResponse.json({ success: true, data: application });
  } catch (error: any) {
    console.error('Update placement application error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred while updating application status.' },
      { status: 500 }
    );
  }
}
