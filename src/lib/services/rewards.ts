// Rewards Service - Check triggers and unlock rewards
import { createClient } from '@/lib/supabase/server';

export type RewardTriggerType = 'milestone' | 'key_result' | 'xp_threshold';

/**
 * Check if any rewards should be unlocked based on trigger
 * Returns array of reward IDs that were unlocked
 */
export async function checkRewardTriggers(
  userId: string,
  triggerType: RewardTriggerType,
  triggerId?: string
): Promise<string[]> {
  const supabase = await createClient();
  if (!supabase) {
    throw new Error('Database connection failed');
  }

  const unlockedRewardIds: string[] = [];

  if (triggerType === 'milestone' && triggerId) {
    // Check if milestone was completed
    const { data: milestone } = await supabase
      .from('milestones_v2')
      .select('id, status')
      .eq('id', triggerId)
      .single();

    if (milestone?.status === 'completed') {
      // Find rewards linked to this milestone
      const { data: rewards } = await supabase
        .from('rewards')
        .select('id, status')
        .eq('user_id', userId)
        .eq('trigger_type', 'milestone')
        .eq('trigger_id', triggerId)
        .eq('status', 'locked');

      if (rewards) {
        for (const reward of rewards) {
          await unlockReward(supabase, reward.id);
          unlockedRewardIds.push(reward.id);
        }
      }
    }
  }

  if (triggerType === 'key_result' && triggerId) {
    // Check if KR hit 100%
    const { data: kr } = await supabase
      .from('project_key_results')
      .select('id, status, progress_percentage')
      .eq('id', triggerId)
      .single();

    if (kr?.status === 'completed' || kr?.progress_percentage >= 100) {
      // Find rewards linked to this KR
      const { data: rewards } = await supabase
        .from('rewards')
        .select('id, status')
        .eq('user_id', userId)
        .eq('trigger_type', 'key_result')
        .eq('trigger_id', triggerId)
        .eq('status', 'locked');

      if (rewards) {
        for (const reward of rewards) {
          await unlockReward(supabase, reward.id);
          unlockedRewardIds.push(reward.id);
        }
      }
    }
  }

  if (triggerType === 'xp_threshold') {
    // Check user's total XP against threshold-based rewards
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_xp')
      .eq('id', userId)
      .single();

    if (profile) {
      // Find XP threshold rewards that should be unlocked
      const { data: rewards } = await supabase
        .from('rewards')
        .select('id, trigger_value, status')
        .eq('user_id', userId)
        .eq('trigger_type', 'xp_threshold')
        .eq('status', 'locked');

      if (rewards) {
        for (const reward of rewards) {
          if (reward.trigger_value && profile.total_xp >= Number(reward.trigger_value)) {
            await unlockReward(supabase, reward.id);
            unlockedRewardIds.push(reward.id);
          }
        }
      }
    }
  }

  return unlockedRewardIds;
}

/**
 * Unlock a single reward
 */
async function unlockReward(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rewardId: string
): Promise<void> {
  if (!supabase) return;

  await supabase
    .from('rewards')
    .update({
      status: 'unlocked',
      unlocked_at: new Date().toISOString(),
      progress_percentage: 100,
      updated_at: new Date().toISOString(),
    })
    .eq('id', rewardId);
}

/**
 * Get reward progress for display
 */
export async function getRewardProgress(
  userId: string,
  rewardId: string
): Promise<{ current: number; target: number; percentage: number } | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: reward } = await supabase
    .from('rewards')
    .select('*')
    .eq('id', rewardId)
    .eq('user_id', userId)
    .single();

  if (!reward) return null;

  let current = 0;
  let target = 100;

  if (reward.trigger_type === 'milestone') {
    const { data: milestone } = await supabase
      .from('milestones_v2')
      .select('progress_percentage')
      .eq('id', reward.trigger_id)
      .single();

    if (milestone) {
      current = milestone.progress_percentage;
      target = 100;
    }
  } else if (reward.trigger_type === 'key_result') {
    const { data: kr } = await supabase
      .from('project_key_results')
      .select('current_value, target_value, starting_value')
      .eq('id', reward.trigger_id)
      .single();

    if (kr) {
      current = Number(kr.current_value) - Number(kr.starting_value);
      target = Number(kr.target_value) - Number(kr.starting_value);
    }
  } else if (reward.trigger_type === 'xp_threshold') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_xp')
      .eq('id', userId)
      .single();

    if (profile) {
      current = profile.total_xp || 0;
      target = Number(reward.trigger_value) || 1;
    }
  }

  const percentage = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  return { current, target, percentage };
}

/**
 * Check all XP threshold rewards after XP is awarded
 * Call this after awarding XP to auto-unlock eligible rewards
 */
export async function checkXpRewards(userId: string): Promise<string[]> {
  return checkRewardTriggers(userId, 'xp_threshold');
}

/**
 * Get unlocked but unclaimed rewards
 */
export async function getUnclaimedRewards(userId: string): Promise<Array<{
  id: string;
  name: string;
  description: string | null;
  estimatedValue: number | null;
  unlockedAt: string | null;
}>> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data: rewards, error } = await supabase
    .from('rewards')
    .select('id, name, description, estimated_value, unlocked_at')
    .eq('user_id', userId)
    .eq('status', 'unlocked')
    .order('unlocked_at', { ascending: false });

  if (error || !rewards) {
    return [];
  }

  return rewards.map(r => ({
    id: r.id,
    name: r.name,
    description: r.description,
    estimatedValue: r.estimated_value,
    unlockedAt: r.unlocked_at,
  }));
}
