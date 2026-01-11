import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { teamMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { UpdateTeamMemberInput } from '@/types/team';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) return DEMO_USER_ID;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || DEMO_USER_ID;
}

// GET /api/team/[id] - Get a single team member
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const userId = await getUserId(supabase);
    const { id } = await params;

    const [member] = await db
      .select()
      .from(teamMembers)
      .where(and(
        eq(teamMembers.id, id),
        eq(teamMembers.ownerId, userId)
      ));

    if (!member) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error('Error fetching team member:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team member' },
      { status: 500 }
    );
  }
}

// PUT /api/team/[id] - Update a team member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const userId = await getUserId(supabase);
    const { id } = await params;

    const body: UpdateTeamMemberInput = await request.json();

    const [updatedMember] = await db
      .update(teamMembers)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(and(
        eq(teamMembers.id, id),
        eq(teamMembers.ownerId, userId)
      ))
      .returning();

    if (!updatedMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error('Error updating team member:', error);
    return NextResponse.json(
      { error: 'Failed to update team member' },
      { status: 500 }
    );
  }
}

// DELETE /api/team/[id] - Soft delete a team member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const userId = await getUserId(supabase);
    const { id } = await params;

    const [deletedMember] = await db
      .update(teamMembers)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(and(
        eq(teamMembers.id, id),
        eq(teamMembers.ownerId, userId)
      ))
      .returning();

    if (!deletedMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting team member:', error);
    return NextResponse.json(
      { error: 'Failed to delete team member' },
      { status: 500 }
    );
  }
}
