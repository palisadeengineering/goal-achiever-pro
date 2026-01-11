import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { teamMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { CreateTeamMemberInput } from '@/types/team';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) return DEMO_USER_ID;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || DEMO_USER_ID;
}

// GET /api/team - List all team members
export async function GET() {
  try {
    const supabase = await createClient();
    const userId = await getUserId(supabase);

    const members = await db
      .select()
      .from(teamMembers)
      .where(and(
        eq(teamMembers.ownerId, userId),
        eq(teamMembers.isActive, true)
      ))
      .orderBy(teamMembers.name);

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

// POST /api/team - Create a new team member
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const userId = await getUserId(supabase);

    const body: CreateTeamMemberInput = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const [newMember] = await db
      .insert(teamMembers)
      .values({
        ownerId: userId,
        name: body.name,
        email: body.email,
        role: body.role || 'member',
        accessLevel: body.accessLevel || 'limited',
        phone: body.phone,
        title: body.title,
        department: body.department,
        notes: body.notes,
        inviteStatus: 'pending',
        isActive: true,
      })
      .returning();

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error('Error creating team member:', error);
    return NextResponse.json(
      { error: 'Failed to create team member' },
      { status: 500 }
    );
  }
}
