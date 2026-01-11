import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { keyResults, keyResultUpdates, teamMembers } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { CreateKeyResultInput } from '@/types/team';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) return DEMO_USER_ID;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || DEMO_USER_ID;
}

// GET /api/key-results - List all key results
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const userId = await getUserId(supabase);

    const { searchParams } = new URL(request.url);
    const visionId = searchParams.get('visionId');
    const quarter = searchParams.get('quarter');
    const year = searchParams.get('year');
    const assigneeId = searchParams.get('assigneeId');

    let query = db
      .select({
        keyResult: keyResults,
        assignee: teamMembers,
      })
      .from(keyResults)
      .leftJoin(teamMembers, eq(keyResults.assigneeId, teamMembers.id))
      .where(and(
        eq(keyResults.userId, userId),
        eq(keyResults.isActive, true)
      ))
      .orderBy(desc(keyResults.createdAt))
      .$dynamic();

    // Apply filters
    if (visionId) {
      query = query.where(eq(keyResults.visionId, visionId));
    }
    if (quarter && year) {
      query = query.where(and(
        eq(keyResults.quarter, parseInt(quarter)),
        eq(keyResults.year, parseInt(year))
      ));
    }
    if (assigneeId) {
      query = query.where(eq(keyResults.assigneeId, assigneeId));
    }

    const results = await query;

    // Transform to include assignee in the key result
    const transformedResults = results.map(({ keyResult, assignee }) => ({
      ...keyResult,
      assignee: assignee || undefined,
    }));

    return NextResponse.json(transformedResults);
  } catch (error) {
    console.error('Error fetching key results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch key results' },
      { status: 500 }
    );
  }
}

// POST /api/key-results - Create a new key result
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const userId = await getUserId(supabase);

    const body: CreateKeyResultInput = await request.json();

    if (!body.visionId || !body.title || !body.targetValue || !body.unit) {
      return NextResponse.json(
        { error: 'visionId, title, targetValue, and unit are required' },
        { status: 400 }
      );
    }

    // Calculate initial progress percentage
    const currentValue = 0;
    const startValue = body.startValue || 0;
    const progressPercentage = body.targetValue > startValue
      ? Math.round(((currentValue - startValue) / (body.targetValue - startValue)) * 100)
      : 0;

    const [newKeyResult] = await db
      .insert(keyResults)
      .values({
        userId,
        visionId: body.visionId,
        powerGoalId: body.powerGoalId,
        title: body.title,
        description: body.description,
        targetValue: body.targetValue.toString(),
        currentValue: '0',
        startValue: (body.startValue || 0).toString(),
        unit: body.unit,
        assigneeId: body.assigneeId,
        assigneeName: body.assigneeName,
        quarter: body.quarter,
        year: body.year,
        dueDate: body.dueDate,
        status: 'on_track',
        progressPercentage,
        confidenceLevel: 70,
        successCriteria: body.successCriteria,
        notes: body.notes,
        isActive: true,
      })
      .returning();

    return NextResponse.json(newKeyResult, { status: 201 });
  } catch (error) {
    console.error('Error creating key result:', error);
    return NextResponse.json(
      { error: 'Failed to create key result' },
      { status: 500 }
    );
  }
}
