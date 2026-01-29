import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';
import { createVisionSchema, updateVisionSchema, deleteVisionSchema, parseWithErrors } from '@/lib/validations';
import { awardXp } from '@/lib/services/gamification';

// Demo user ID - only used in development when DEMO_MODE_ENABLED=true
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

// Ensure the demo user profile exists (for development/demo purposes only)
async function ensureDemoUserProfile(adminClient: ReturnType<typeof createAdminClient>) {
  // Only run in development with demo mode enabled
  if (process.env.NODE_ENV === 'production' || process.env.DEMO_MODE_ENABLED !== 'true') {
    return;
  }

  if (!adminClient) return;

  const { data: existingProfile } = await adminClient
    .from('profiles')
    .select('id')
    .eq('id', DEMO_USER_ID)
    .single();

  if (!existingProfile) {
    await adminClient
      .from('profiles')
      .insert({
        id: DEMO_USER_ID,
        email: 'demo@example.com',
        full_name: 'Demo User',
        subscription_tier: 'elite',
        subscription_status: 'active',
      });
  }
}

export async function GET() {
  try {
    // Authenticate user
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;

    const adminClient = createAdminClient();

    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Fetch user's visions using admin client to bypass RLS (active one first)
    const { data: visions, error } = await adminClient
      .from('visions')
      .select('*')
      .eq('user_id', userId)
      .is('archived_at', null)
      .order('is_active', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching visions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch visions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ visions: visions || [] });
  } catch (error) {
    console.error('Get visions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch visions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log('[Vision API] POST request received');
  try {
    // Authenticate user
    const auth = await getAuthenticatedUser();
    console.log('[Vision API] Auth result:', { isAuthenticated: auth.isAuthenticated, userId: auth.isAuthenticated ? auth.userId : null });
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;

    const adminClient = createAdminClient();

    if (!adminClient) {
      console.error('[Vision API] Admin client creation failed');
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Ensure the demo user profile exists if using demo mode (dev only)
    if (userId === DEMO_USER_ID) {
      await ensureDemoUserProfile(adminClient);
    }

    // Validate request body
    const body = await request.json();
    console.log('[Vision API] Request body:', { title: body.title, hasDescription: !!body.description });
    const validation = parseWithErrors(createVisionSchema, body);
    console.log('[Vision API] Validation result:', { success: validation.success, errors: validation.success ? null : validation.errors });

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, validationErrors: validation.errors },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      specific,
      measurable,
      attainable,
      realistic,
      timeBound,
      targetDate,
      clarityScore,
      beliefScore,
      consistencyScore,
      color,
      affirmationText,
    } = validation.data;

    // If this is the first vision, or we want to set it as active,
    // deactivate other visions first
    await adminClient
      .from('visions')
      .update({ is_active: false })
      .eq('user_id', userId);

    // Create new vision using admin client to bypass RLS
    // Note: time_bound is a date column, use targetDate or timeBound (YYYY-MM-DD format)
    const { data: vision, error } = await adminClient
      .from('visions')
      .insert({
        user_id: userId,
        title,
        description: description || null,
        specific: specific || null,
        measurable: measurable || null,
        attainable: attainable || null,
        realistic: realistic || null,
        time_bound: targetDate || timeBound || null,
        clarity_score: clarityScore || 0,
        belief_score: beliefScore || 0,
        consistency_score: consistencyScore || 0,
        color: color || '#6366f1',
        affirmation_text: affirmationText || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('[Vision API] Database insert error:', error);
      return NextResponse.json(
        { error: 'Failed to create vision' },
        { status: 500 }
      );
    }

    // Award XP for vision creation
    let gamificationResult = null;
    try {
      gamificationResult = await awardXp(userId, 'VISION_CREATED');
    } catch (gamificationError) {
      // Log but don't fail the request
      console.error('Gamification error:', gamificationError);
    }

    console.log('[Vision API] Vision created successfully:', { id: vision?.id, title: vision?.title });
    return NextResponse.json({ vision, gamification: gamificationResult });
  } catch (error) {
    console.error('Create vision error:', error);
    return NextResponse.json(
      { error: 'Failed to create vision' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;

    const adminClient = createAdminClient();

    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validation = parseWithErrors(updateVisionSchema, body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, validationErrors: validation.errors },
        { status: 400 }
      );
    }

    const {
      id,
      title,
      description,
      specific,
      measurable,
      attainable,
      realistic,
      timeBound,
      targetDate,
      clarityScore,
      beliefScore,
      consistencyScore,
      color,
      affirmationText,
    } = validation.data;

    // Update vision using admin client to bypass RLS
    // Note: time_bound is a date column, use targetDate or timeBound (YYYY-MM-DD format)
    const { data: vision, error } = await adminClient
      .from('visions')
      .update({
        title,
        description: description || null,
        specific: specific || null,
        measurable: measurable || null,
        attainable: attainable || null,
        realistic: realistic || null,
        time_bound: targetDate || timeBound || null,
        clarity_score: clarityScore ?? undefined,
        belief_score: beliefScore ?? undefined,
        consistency_score: consistencyScore ?? undefined,
        color: color ?? undefined,
        affirmation_text: affirmationText ?? undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating vision:', error);
      return NextResponse.json(
        { error: 'Failed to update vision' },
        { status: 500 }
      );
    }

    return NextResponse.json({ vision });
  } catch (error) {
    console.error('Update vision error:', error);
    return NextResponse.json(
      { error: 'Failed to update vision' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;

    const adminClient = createAdminClient();

    if (!adminClient) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Validate query params
    const { searchParams } = new URL(request.url);
    const validation = parseWithErrors(deleteVisionSchema, {
      id: searchParams.get('id'),
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error, validationErrors: validation.errors },
        { status: 400 }
      );
    }

    const { id } = validation.data;

    // Archive the vision using admin client to bypass RLS
    const { error } = await adminClient
      .from('visions')
      .update({
        is_active: false,
        archived_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error archiving vision:', error);
      return NextResponse.json(
        { error: 'Failed to archive vision' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Archive vision error:', error);
    return NextResponse.json(
      { error: 'Failed to archive vision' },
      { status: 500 }
    );
  }
}
