import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, priority } = body;

    // Validate status values if provided
    const validStatuses = ['Pending', 'In Progress', 'Completed', 'Overdue'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate priority values if provided
    const validPriorities = ['High', 'Medium', 'Low'];
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json(
        { success: false, error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` },
        { status: 400 }
      );
    }

    // Update the assignment
    const updatedAssignment = await db.assignment.update({
      where: { id },
      data: {
        status: status || undefined,
        priority: priority || undefined
      },
      include: {
        reminders: true
      }
    });

    // Keep ExtractedItem isCompleted field in sync!
    if (updatedAssignment.sourceReference && status) {
      await db.extractedItem.update({
        where: { id: updatedAssignment.sourceReference },
        data: {
          isCompleted: status === 'Completed'
        }
      }).catch(err => console.error('Failed to sync item completion:', err));
    }

    return NextResponse.json({ success: true, data: updatedAssignment });
  } catch (error: any) {
    console.error('Update assignment error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred while updating the assignment.' },
      { status: 500 }
    );
  }
}
