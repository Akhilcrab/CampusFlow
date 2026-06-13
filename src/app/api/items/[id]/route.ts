import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// PUT endpoint to update an item's details (e.g. status)
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Route reminder status updates (isTriggered/isDismissed) to the Reminder model
    if (body.reminderId) {
      await db.reminder.update({
        where: { id: body.reminderId },
        data: {
          isTriggered: body.isTriggered !== undefined ? body.isTriggered : undefined,
          isDismissed: body.isDismissed !== undefined ? body.isDismissed : undefined,
        },
      });
      const updatedItem = await db.extractedItem.findUnique({
        where: { id },
        include: {
          reminders: true,
        },
      });
      return NextResponse.json({ success: true, data: updatedItem });
    }

    // Directly update the item by ID without tenant validation
    const updatedItem = await db.extractedItem.update({
      where: { id },
      data: body,
      include: {
        reminders: true,
      },
    });

    return NextResponse.json({ success: true, data: updatedItem });
  } catch (error: any) {
    console.error('Update item error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred while updating the item.' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to delete an item from the inbox
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Delete child reminders first to prevent orphan errors in MongoDB
    await db.reminder.deleteMany({
      where: { itemId: id },
    });

    // Directly delete the item by ID without tenant validation
    const deletedItem = await db.extractedItem.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Item and associated reminders deleted successfully.',
      data: deletedItem,
    });
  } catch (error: any) {
    console.error('Delete item error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred while deleting the item.' },
      { status: 500 }
    );
  }
}
