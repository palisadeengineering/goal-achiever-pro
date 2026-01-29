// Seed script for predefined achievements
// Run with: npx tsx src/lib/db/seed-achievements.ts

import { config } from 'dotenv';
// Load environment variables first
config({ path: '.env.local' });

import { createAdminClient } from '@/lib/supabase/admin';

export const PREDEFINED_ACHIEVEMENTS = [
  // Exploration
  {
    key: 'first_vision',
    name: 'Visionary',
    description: 'Created your first vision',
    category: 'exploration',
    icon_name: 'Eye',
    xp_reward: 50,
    required_value: 1,
  },
  {
    key: 'first_kpi',
    name: 'First Step',
    description: 'Completed your first KPI',
    category: 'exploration',
    icon_name: 'CheckCircle',
    xp_reward: 25,
    required_value: 1,
  },

  // Milestones
  {
    key: 'kpi_10',
    name: 'Getting Started',
    description: 'Completed 10 KPIs',
    category: 'milestone',
    icon_name: 'Trophy',
    xp_reward: 50,
    required_value: 10,
  },
  {
    key: 'kpi_50',
    name: 'Momentum Builder',
    description: 'Completed 50 KPIs',
    category: 'milestone',
    icon_name: 'Zap',
    xp_reward: 100,
    required_value: 50,
  },
  {
    key: 'kpi_100',
    name: 'Century Club',
    description: 'Completed 100 KPIs',
    category: 'milestone',
    icon_name: 'Award',
    xp_reward: 200,
    required_value: 100,
  },
  {
    key: 'kpi_500',
    name: 'Goal Machine',
    description: 'Completed 500 KPIs',
    category: 'milestone',
    icon_name: 'Rocket',
    xp_reward: 500,
    required_value: 500,
  },

  // Streaks
  {
    key: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintained a 7-day streak',
    category: 'streak',
    icon_name: 'Flame',
    xp_reward: 75,
    required_value: 7,
  },
  {
    key: 'streak_30',
    name: 'Monthly Master',
    description: 'Maintained a 30-day streak',
    category: 'streak',
    icon_name: 'Calendar',
    xp_reward: 200,
    required_value: 30,
  },
  {
    key: 'streak_100',
    name: 'Unstoppable',
    description: 'Maintained a 100-day streak',
    category: 'streak',
    icon_name: 'Crown',
    xp_reward: 500,
    required_value: 100,
  },

  // Mastery
  {
    key: 'level_5',
    name: 'Rising Star',
    description: 'Reached level 5',
    category: 'mastery',
    icon_name: 'Star',
    xp_reward: 100,
    required_value: 5,
  },
  {
    key: 'level_10',
    name: 'Achievement Hunter',
    description: 'Reached level 10',
    category: 'mastery',
    icon_name: 'Medal',
    xp_reward: 250,
    required_value: 10,
  },
] as const;

export async function seedAchievements() {
  const adminClient = createAdminClient();

  if (!adminClient) {
    throw new Error('Failed to create admin client. Check environment variables.');
  }

  // Get existing achievements
  const { data: existing, error: fetchError } = await adminClient
    .from('achievements')
    .select('key');

  if (fetchError) {
    throw new Error(`Failed to fetch existing achievements: ${fetchError.message}`);
  }

  const existingKeys = new Set(existing?.map((a) => a.key) || []);
  const toInsert = PREDEFINED_ACHIEVEMENTS.filter((a) => !existingKeys.has(a.key));

  if (toInsert.length === 0) {
    console.log('All achievements already exist. Nothing to seed.');
    return 0;
  }

  const { error: insertError } = await adminClient.from('achievements').insert(toInsert);

  if (insertError) {
    throw new Error(`Failed to insert achievements: ${insertError.message}`);
  }

  console.log(`Seeded ${toInsert.length} achievements successfully.`);
  return toInsert.length;
}

// Run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  seedAchievements()
    .then((count) => {
      console.log(`Done. Seeded ${count} achievements.`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}
