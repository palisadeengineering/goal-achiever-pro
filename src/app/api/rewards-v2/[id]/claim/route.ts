import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';

// POST /api/rewards-v2/[id]/claim - Claim an unlocked reward
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
    const { note } = body;

    // Get reward and verify it's unlocked
    const { data: reward, error: rewardError } = await supabase
      .from('rewards')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (rewardError || !reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
    }

    if (reward.status === 'locked') {
      return NextResponse.json({ error: 'Reward is still locked' }, { status: 400 });
    }

    if (reward.status === 'claimed') {
      return NextResponse.json({ error: 'Reward has already been claimed' }, { status: 400 });
    }

    // Create claim record
    const { data: claim, error: claimError } = await supabase
      .from('reward_claims')
      .insert({
        user_id: userId,
        reward_id: id,
        claimed_at: new Date().toISOString(),
        reward_name: reward.name,
        reward_description: reward.description,
        reward_value: reward.estimated_value,
        note: note || null,
      })
      .select()
      .single();

    if (claimError) {
      console.error('Error creating claim:', claimError);
      return NextResponse.json({ error: claimError.message }, { status: 500 });
    }

    // Update reward status to claimed
    const { data: updatedReward, error: updateError } = await supabase
      .from('rewards')
      .update({
        status: 'claimed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating reward status:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      claim,
      reward: updatedReward,
    });
  } catch (error) {
    console.error('POST /api/rewards-v2/[id]/claim error:', error);
    return NextResponse.json({ error: 'Failed to claim reward' }, { status: 500 });
  }
}

// GET /api/rewards-v2/[id]/claim - Get claim history for a reward
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const auth = await getAuthenticatedUser();
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const userId = auth.userId;

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Verify reward belongs to user
    const { data: reward } = await supabase
      .from('rewards')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
    }

    const { data: claims, error } = await supabase
      .from('reward_claims')
      .select('*')
      .eq('reward_id', id)
      .order('claimed_at', { ascending: false });

    if (error) {
      console.error('Error fetching claims:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ claims });
  } catch (error) {
    console.error('GET /api/rewards-v2/[id]/claim error:', error);
    return NextResponse.json({ error: 'Failed to fetch claims' }, { status: 500 });
  }
}
