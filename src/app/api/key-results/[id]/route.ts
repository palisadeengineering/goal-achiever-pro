import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { keyResults, keyResultUpdates, teamMembers, profiles } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { UpdateKeyResultInput } from '@/types/team';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) return DEMO_USER_ID;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || DEMO_USER_ID;
}

// GET /api/key-results/[id] - Get a single key result with updates
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const userId = await getUserId(supabase);
    const { id } = await params;

    // Get the key result with assignee
    const [result] = await db
      .select({
        keyResult: keyResults,
        assignee: teamMembers,
      })
      .from(keyResults)
      .leftJoin(teamMembers, eq(keyResults.assigneeId, teamMembers.id))
      .where(and(
        eq(keyResults.id, id),
        eq(keyResults.userId, userId)
      ));

    if (!result) {
      return NextResponse.json(
        { error: 'Key result not found' },
        { status: 404 }
      );
    }

    // Get updates history
    const updates = await db
      .select()
      .from(keyResultUpdates)
      .where(eq(keyResultUpdates.keyResultId, id))
      .orderBy(desc(keyResultUpdates.createdAt))
      .limit(50);

    return NextResponse.json({
      ...result.keyResult,
      assignee: result.assignee || undefined,
      updates,
    });
  } catch (error) {
    console.error('Error fetching key result:', error);
    return NextResponse.json(
      { error: 'Failed to fetch key result' },
      { status: 500 }
    );
  }
}

// PUT /api/key-results/[id] - Update a key result
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const userId = await getUserId(supabase);
    const { id } = await params;

    const body: UpdateKeyResultInput & { updateNotes?: string } = await request.json();

    // Get current values for history
    const [current] = await db
      .select()
      .from(keyResults)
      .where(and(
        eq(keyResults.id, id),
        eq(keyResults.userId, userId)
      ));

    if (!current) {
      return NextResponse.json(
        { error: 'Key result not found' },
        { status: 404 }
      );
    }

    // Get user name for update record
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, userId));

    // Prepare update values
    const updateValues: Record<string, unknown> = {
      ...body,
      updatedAt: new Date(),
    };

    // Recalculate progress if currentValue or targetValue changed
    if (body.currentValue !== undefined || body.targetValue !== undefined) {
      const newCurrentValue = body.currentValue ?? Number(current.currentValue);
      const newTargetValue = body.targetValue ?? Number(current.targetValue);
      const startValue = Number(current.startValue);

      if (newTargetValue > startValue) {
        updateValues.progressPercentage = Math.min(100, Math.max(0,
          Math.round(((newCurrentValue - startValue) / (newTargetValue - startValue)) * 100)
        ));
      }
    }

    // Update numeric fields to string for decimal columns
    if (updateValues.currentValue !== undefined) {
      updateValues.currentValue = updateValues.currentValue.toString();
    }
    if (updateValues.targetValue !== undefined) {
      updateValues.targetValue = updateValues.targetValue.toString();
    }

    // Remove updateNotes from the main update
    const updateNotes = body.updateNotes;
    delete updateValues.updateNotes;

    const [updatedKeyResult] = await db
      .update(keyResults)
      .set(updateValues)
      .where(and(
        eq(keyResults.id, id),
        eq(keyResults.userId, userId)
      ))
      .returning();

    // Create update record if value or status changed
    if (body.currentValue !== undefined || body.status !== undefined) {
      await db.insert(keyResultUpdates).values({
        keyResultId: id,
        previousValue: current.currentValue,
        newValue: body.currentValue?.toString() ?? current.currentValue,
        previousStatus: current.status,
        newStatus: body.status ?? current.status,
        notes: updateNotes,
        updatedBy: userId,
        updatedByName: profile?.fullName || profile?.email || 'Unknown',
      });
    }

    return NextResponse.json(updatedKeyResult);
  } catch (error) {
    console.error('Error updating key result:', error);
    return NextResponse.json(
      { error: 'Failed to update key result' },
      { status: 500 }
    );
  }
}

// DELETE /api/key-results/[id] - Soft delete a key result
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const userId = await getUserId(supabase);
    const { id } = await params;

    const [deletedKeyResult] = await db
      .update(keyResults)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(and(
        eq(keyResults.id, id),
        eq(keyResults.userId, userId)
      ))
      .returning();

    if (!deletedKeyResult) {
      return NextResponse.json(
        { error: 'Key result not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting key result:', error);
    return NextResponse.json(
      { error: 'Failed to delete key result' },
      { status: 500 }
    );
  }
}
