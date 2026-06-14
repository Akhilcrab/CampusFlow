import { db } from './db';
import { Category, Priority } from '@prisma/client';

export async function syncAllData() {
  const now = new Date();

  // 0. Clean up duplicate ExtractedItems
  const allExtractedItems = await db.extractedItem.findMany();
  const seenExtractedItems = new Set<string>();
  for (const item of allExtractedItems) {
    const key = `${item.category}-${item.title.toLowerCase().trim()}-${item.date || ''}`;
    if (seenExtractedItems.has(key)) {
      await db.reminder.deleteMany({ where: { itemId: item.id } });
      await db.extractedItem.delete({ where: { id: item.id } }).catch(() => {});
    } else {
      seenExtractedItems.add(key);
    }
  }

  // 1. Clean up duplicate Assignments
  const allAssignments = await db.assignment.findMany();
  const seenAssignments = new Set<string>();
  for (const asg of allAssignments) {
    const key = asg.title.toLowerCase().trim();
    if (seenAssignments.has(key)) {
      await db.assignmentReminder.deleteMany({ where: { assignmentId: asg.id } });
      await db.assignment.delete({ where: { id: asg.id } }).catch(() => {});
    } else {
      seenAssignments.add(key);
    }
  }

  // 2. Clean up duplicate Placements
  const allPlacements = await db.placement.findMany();
  const seenPlacements = new Set<string>();
  for (const pl of allPlacements) {
    const key = pl.companyName.toLowerCase().trim();
    if (seenPlacements.has(key)) {
      await db.placementApplication.deleteMany({ where: { placementId: pl.id } });
      await db.placement.delete({ where: { id: pl.id } }).catch(() => {});
    } else {
      seenPlacements.add(key);
    }
  }

  // 3. Clean up duplicate AcademicCalendarEvents
  const allEvents = await db.academicCalendarEvent.findMany();
  const seenEvents = new Set<string>();
  for (const ev of allEvents) {
    const dateStr = new Date(ev.eventDate).toISOString().split('T')[0];
    const key = `${ev.eventType}-${ev.eventTitle.toLowerCase().trim()}-${dateStr}`;
    if (seenEvents.has(key)) {
      await db.academicCalendarEvent.delete({ where: { id: ev.id } }).catch(() => {});
    } else {
      seenEvents.add(key);
    }
  }

  // 4. Fetch all remaining ExtractedItems
  const items = await db.extractedItem.findMany({
    include: { reminders: true }
  });

  for (const item of items) {
    const activePriority = item.userPriority || item.priority;
    let assignmentPriority = 'Medium';
    if (activePriority === 'CRITICAL' || activePriority === 'HIGH') {
      assignmentPriority = 'High';
    } else if (activePriority === 'LOW') {
      assignmentPriority = 'Low';
    }

    // A. Sync Assignments
    if (item.category === 'ASSIGNMENT') {
      let assignment = await db.assignment.findFirst({
        where: {
          OR: [
            { sourceReference: item.id },
            { title: item.title }
          ]
        }
      });

      let status = 'Pending';
      if (item.isCompleted) {
        status = 'Completed';
      } else if (item.deadline && new Date(item.deadline) < now) {
        status = 'Overdue';
      }

      // Try to parse subject from title (e.g. "OS Lab Assignment 4" -> "OS Lab")
      let subject = 'General';
      const parts = item.title.split(' ');
      if (parts.length > 0) {
        if (parts[0].toLowerCase() === 'os' || parts[0].toLowerCase() === 'operating') {
          subject = 'Operating Systems';
        } else if (parts[0].toLowerCase() === 'maths' || parts[0].toLowerCase() === 'math') {
          subject = 'Mathematics';
        } else {
          subject = parts[0];
        }
      }

      if (!assignment) {
        await db.assignment.create({
          data: {
            title: item.title,
            subject: subject,
            description: item.summary,
            dueDate: item.deadline || new Date(),
            priority: assignmentPriority,
            status: status,
            sourceType: item.sourceType,
            sourceReference: item.id,
          }
        });
      } else {
        await db.assignment.update({
          where: { id: assignment.id },
          data: {
            status: item.isCompleted ? 'Completed' : (assignment.status === 'Completed' ? 'Completed' : status),
            priority: assignmentPriority,
          }
        });
      }
    }

    // B. Sync Placements
    if (item.category === 'PLACEMENT') {
      let placement = await db.placement.findFirst({
        where: {
          OR: [
            { sourceReference: item.id },
            { companyName: item.title.replace(' Placement Drive', '').replace(' Registration', '') }
          ]
        }
      });

      let companyName = item.title.replace(' Placement Drive', '').replace(' Registration', '');
      if (!companyName) {
        companyName = 'TCS';
      }

      if (!placement) {
        await db.placement.create({
          data: {
            companyName: companyName,
            role: item.title.includes('Registration') ? 'Graduate Engineer Trainee' : 'Software Engineer',
            package: item.title.includes('TCS') ? '7-9 LPA' : 'TBD',
            deadline: item.deadline || new Date(),
            location: 'Pan India',
            eligibilityText: 'CGPA >= 6.5, No active backlogs',
            description: item.summary,
            status: 'Not Applied',
            sourceType: item.sourceType,
            sourceReference: item.id,
          }
        });
      }
    }

    // C. Sync Calendar Events (with duplicate prevention checks)
    let calendarEvent = await db.academicCalendarEvent.findFirst({
      where: {
        OR: [
          { referenceId: item.id },
          { eventTitle: item.title, eventType: item.category.toLowerCase() }
        ]
      }
    });

    if (!calendarEvent) {
      await db.academicCalendarEvent.create({
        data: {
          eventType: item.category.toLowerCase(),
          eventTitle: item.title,
          eventDate: item.deadline || item.createdAt,
          eventTime: item.time || null,
          referenceId: item.id,
          metadata: JSON.stringify({ summary: item.summary, actionRequired: item.actionRequired })
        }
      });
    } else {
      await db.academicCalendarEvent.update({
        where: { id: calendarEvent.id },
        data: {
          eventTitle: item.title,
          eventDate: item.deadline || item.createdAt,
          eventTime: item.time || null
        }
      });
    }
  }

  // Update Overdue status for assignments whose deadline has passed
  const overdueAssignments = await db.assignment.findMany({
    where: {
      status: { not: 'Completed' },
      dueDate: { lt: now }
    }
  });

  for (const asg of overdueAssignments) {
    await db.assignment.update({
      where: { id: asg.id },
      data: { status: 'Overdue' }
    });
  }
}

export async function createAssignmentOrPlacementFromAI(item: any, aiResponse: any) {
  const now = new Date();
  const activePriority = item.userPriority || item.priority;
  let assignmentPriority = 'Medium';
  if (activePriority === 'CRITICAL' || activePriority === 'HIGH') {
    assignmentPriority = 'High';
  } else if (activePriority === 'LOW') {
    assignmentPriority = 'Low';
  }

  if (item.category === 'ASSIGNMENT') {
    let status = 'Pending';
    if (item.isCompleted) {
      status = 'Completed';
    } else if (item.deadline && new Date(item.deadline) < now) {
      status = 'Overdue';
    }

    const subject = aiResponse.subject || item.title.split(' ')[0] || 'General';

    let existingAssignment = await db.assignment.findFirst({
      where: {
        OR: [
          { sourceReference: item.id },
          { title: item.title }
        ]
      }
    });

    if (!existingAssignment) {
      await db.assignment.create({
        data: {
          title: item.title,
          subject: subject,
          description: item.summary,
          dueDate: item.deadline || new Date(),
          priority: assignmentPriority,
          status: status,
          sourceType: item.sourceType,
          sourceReference: item.id,
        }
      });
    }
  } else if (item.category === 'PLACEMENT') {
    const companyName = aiResponse.companyName || item.title.replace(' Placement Drive', '').replace(' Registration', '') || 'Company';
    const role = aiResponse.role || 'Software Engineer';
    const pkg = aiResponse.package || 'TBD';
    const location = aiResponse.location || 'Pan India';
    const eligibilityText = aiResponse.eligibilityText || 'CGPA >= 6.5, No active backlogs';

    let existingPlacement = await db.placement.findFirst({
      where: {
        OR: [
          { sourceReference: item.id },
          { companyName: companyName }
        ]
      }
    });

    if (!existingPlacement) {
      await db.placement.create({
        data: {
          companyName,
          role,
          package: pkg,
          deadline: item.deadline || new Date(),
          location,
          eligibilityText,
          description: item.summary,
          status: 'Not Applied',
          sourceType: item.sourceType,
          sourceReference: item.id,
        }
      });
    }
  }

  // Create calendar event (with check to prevent duplicates)
  let existingCalendarEvent = await db.academicCalendarEvent.findFirst({
    where: {
      OR: [
        { referenceId: item.id },
        { eventTitle: item.title, eventType: item.category.toLowerCase() }
      ]
    }
  });

  if (!existingCalendarEvent) {
    await db.academicCalendarEvent.create({
      data: {
        eventType: item.category.toLowerCase(),
        eventTitle: item.title,
        eventDate: item.deadline || item.createdAt,
        eventTime: item.time || null,
        referenceId: item.id,
        metadata: JSON.stringify({ summary: item.summary, actionRequired: item.actionRequired })
      }
    });
  }
}
