import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    const validStatuses = ['Interested', 'Applied', 'Rejected', 'Selected', 'Not Applied'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const updatedPlacement = await db.placement.update({
      where: { id },
      data: { status: status || undefined },
      include: {
        applications: true
      }
    });

    // Also update associated PlacementApplication status to keep them in sync
    if (status) {
      await db.placementApplication.upsert({
        where: { placementId: id },
        update: { status },
        create: {
          placementId: id,
          status,
          notes: ''
        }
      });
      
      // Keep ExtractedItem isCompleted in sync!
      if (updatedPlacement.sourceReference) {
        await db.extractedItem.update({
          where: { id: updatedPlacement.sourceReference },
          data: {
            isCompleted: status === 'Selected' || status === 'Rejected'
          }
        }).catch(err => console.error('Failed to sync item completion:', err));
      }
    }

    return NextResponse.json({ success: true, data: updatedPlacement });
  } catch (error: any) {
    console.error('Update placement error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred while updating the placement.' },
      { status: 500 }
    );
  }
}
