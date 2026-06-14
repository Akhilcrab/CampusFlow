import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { syncAllData } from '@/lib/services';

export async function GET(req: NextRequest) {
  try {
    // Run self-healing sync
    await syncAllData();

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // 1. Fetch active assignments
    const activeAssignments = await db.assignment.findMany({
      where: { status: { not: 'Completed' } },
      orderBy: { dueDate: 'asc' }
    });

    // 2. Fetch active placements
    const activePlacements = await db.placement.findMany({
      where: { status: { notIn: ['Selected', 'Rejected'] } },
      orderBy: { deadline: 'asc' }
    });

    // 3. Fetch active extracted items (not completed)
    const activeItems = await db.extractedItem.findMany({
      where: { isCompleted: false },
      orderBy: { deadline: 'asc' }
    });

    const bullets: string[] = [];

    // A. Assignments due soon
    const dueSoonAssignments = activeAssignments.filter(
      asg => new Date(asg.dueDate) <= threeDaysFromNow
    );
    if (dueSoonAssignments.length > 0) {
      const list = dueSoonAssignments
        .map(asg => {
          const daysLeft = Math.ceil((new Date(asg.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const timeLabel = daysLeft === 0 ? 'today' : daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`;
          return `"${asg.title}" (${asg.subject}) due ${timeLabel}`;
        })
        .join(', ');
      bullets.push(`⚠️ **Assignments due soon**: ${list}.`);
    } else if (activeAssignments.length > 0) {
      bullets.push(`✅ No assignments are due in the next 3 days. You have ${activeAssignments.length} total pending assignments.`);
    } else {
      bullets.push('🎉 All assignments are completed! Excellent job.');
    }

    // B. Placements closing soon
    const closingSoonPlacements = activePlacements.filter(
      pl => new Date(pl.deadline) <= threeDaysFromNow
    );
    if (closingSoonPlacements.length > 0) {
      const list = closingSoonPlacements
        .map(pl => {
          const hoursLeft = Math.ceil((new Date(pl.deadline).getTime() - now.getTime()) / (1000 * 60 * 60));
          const timeLabel = hoursLeft <= 24 ? `in ${hoursLeft}h` : `in ${Math.round(hoursLeft / 24)} days`;
          return `${pl.companyName} (${pl.role}) closing ${timeLabel}`;
        })
        .join(', ');
      bullets.push(`💼 **Placements closing soon**: ${list}.`);
    } else if (activePlacements.length > 0) {
      bullets.push(`ℹ️ You have ${activePlacements.length} active placement drives open. Check target deadlines.`);
    }

    // C. Exam updates
    const activeExams = activeItems.filter(item => item.category === 'EXAM');
    if (activeExams.length > 0) {
      const list = activeExams
        .map(ex => {
          const examDate = ex.deadline ? new Date(ex.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'soon';
          return `"${ex.title}" scheduled for ${examDate}`;
        })
        .join(', ');
      bullets.push(`✍️ **Upcoming Exams**: ${list}.`);
    }

    // D. Urgent notices
    const urgentNotices = activeItems.filter(
      item => item.category === 'NOTICE' && (item.userPriority === 'CRITICAL' || item.userPriority === 'HIGH' || (!item.userPriority && (item.priority === 'CRITICAL' || item.priority === 'HIGH')))
    );
    if (urgentNotices.length > 0) {
      const list = urgentNotices.map(n => `"${n.title}"`).join(', ');
      bullets.push(`🔴 **Urgent Notices**: Action required on ${list}.`);
    }

    // E. General summary
    const pendingCount = activeItems.length;
    if (pendingCount > 0) {
      bullets.push(`📋 **Inbox Summary**: You have ${pendingCount} pending updates awaiting your verification and action.`);
    } else {
      bullets.push('🌟 Your academic inbox is completely clear! Keep up the great work.');
    }

    return NextResponse.json({ success: true, bullets });
  } catch (error: any) {
    console.error('Generate summary API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred while generating the daily summary.' },
      { status: 500 }
    );
  }
}
