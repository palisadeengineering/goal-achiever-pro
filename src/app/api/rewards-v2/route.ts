import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

// GET /api/rewards-v2 - List all rewards for user
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'locked', 'unlocked', 'claimed'
    const triggerType = searchParams.get('triggerType'); // 'milestone', 'key_result', 'xp_threshold'

    let query = supabase
      .from('rewards')
      .select(`
        *,
        reward_claims (
          id,
          claimed_at,
          note
        )
      `)
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    if (triggerType) {
      query = query.eq('trigger_type', triggerType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching rewards:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update progress for each reward
    const rewardsWithProgress = await Promise.all(
      (data || []).map(async (reward) => {
        let currentProgress = 0;
        let progressPercentage = 0;

        if (reward.trigger_type === 'milestone') {
          // Get milestone progress
          const { data: milestone } = await supabase
            .from('milestones_v2')
            .select('progress_percentage, status')
            .eq('id', reward.trigger_id)
            .single();

          if (milestone) {
            progressPercentage = milestone.progress_percentage;
            currentProgress = milestone.status === 'completed' ? 100 : progressPercentage;
          }
        } else if (reward.trigger_type === 'key_result') {
          // Get KR progress
          const { data: kr } = await supabase
            .from('project_key_results')
            .select('progress_percentage, status')
            .eq('id', reward.trigger_id)
            .single();

          if (kr) {
            progressPercentage = kr.progress_percentage;
            currentProgress = kr.status === 'completed' ? 100 : progressPercentage;
          }
        } else if (reward.trigger_type === 'xp_threshold') {
          // Get user's total XP
          const { data: profile } = await supabase
            .from('profiles')
            .select('total_xp')
            .eq('id', userId)
            .single();

          if (profile && reward.trigger_value) {
            currentProgress = profile.total_xp || 0;
            progressPercentage = Math.min(
              100,
              Math.round((currentProgress / Number(reward.trigger_value)) * 100)
            );
          }
        }

        return {
          ...reward,
          current_progress: currentProgress,
          progress_percentage: progressPercentage,
        };
      })
    );

    return NextResponse.json({ rewards: rewardsWithProgress });
  } catch (error) {
    console.error('GET /api/rewards-v2 error:', error);
    return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 });
  }
}

// POST /api/rewards-v2 - Create a new reward
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const body = await request.json();

    const {
      name,
      description,
      imageUrl,
      estimatedValue,
      triggerType,
      triggerId,
      triggerValue,
      sortOrder,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!triggerType) {
      return NextResponse.json({ error: 'Trigger type is required' }, { status: 400 });
    }

    if (triggerType === 'xp_threshold' && !triggerValue) {
      return NextResponse.json({ error: 'XP threshold value is required' }, { status: 400 });
    }

    if ((triggerType === 'milestone' || triggerType === 'key_result') && !triggerId) {
      return NextResponse.json({ error: 'Trigger ID is required for milestone/key_result rewards' }, { status: 400 });
    }

    // Get max sort order
    const { data: existingRewards } = await supabase
      .from('rewards')
      .select('sort_order')
      .eq('user_id', userId)
      .order('sort_order', { ascending: false })
      .limit(1);

    const maxSortOrder = existingRewards?.[0]?.sort_order ?? -1;

    const { data, error } = await supabase
      .from('rewards')
      .insert({
        user_id: userId,
        name: name.trim(),
        description: description || null,
        image_url: imageUrl || null,
        estimated_value: estimatedValue || null,
        trigger_type: triggerType,
        trigger_id: triggerId || null,
        trigger_value: triggerValue || null,
        progress_percentage: 0,
        current_progress: 0,
        status: 'locked',
        sort_order: sortOrder ?? maxSortOrder + 1,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating reward:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reward: data }, { status: 201 });
  } catch (error) {
    console.error('POST /api/rewards-v2 error:', error);
    return NextResponse.json({ error: 'Failed to create reward' }, { status: 500 });
  }
}
