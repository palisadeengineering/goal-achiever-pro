import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const PRO_TIPS = [
  // Productivity Wisdom
  {
    category: 'productivity_tip',
    content: "You don't get what you want. You get what you focus on.",
    source: null,
    timeOfDay: ['morning'],
  },
  {
    category: 'productivity_tip',
    content: "100% clarity, 100% belief, 100% of the time.",
    source: null,
    timeOfDay: ['morning'],
  },
  {
    category: 'productivity_tip',
    content: "You don't rise to the level of your goals—you fall to the level of your standards.",
    source: null,
    timeOfDay: ['morning', 'evening'],
  },
  {
    category: 'productivity_tip',
    content: "The extremities expand the capacities.",
    source: null,
    timeOfDay: ['morning'],
  },
  {
    category: 'productivity_tip',
    content: "Complexity is easy. Simplicity is hard.",
    source: null,
    timeOfDay: null,
  },
  {
    category: 'productivity_tip',
    content: "We don't need to be taught—we need to be reminded.",
    source: null,
    timeOfDay: null,
  },
  {
    category: 'productivity_tip',
    content: "Write it down. If you don't write it down, you won't remember it.",
    source: null,
    timeOfDay: ['morning'],
  },
  {
    category: 'productivity_tip',
    content: "Treat every person you talk to as someone who will buy.",
    source: null,
    timeOfDay: ['morning', 'afternoon'],
  },
  {
    category: 'productivity_tip',
    content: "Stop making it about you. Start making it about them.",
    source: null,
    timeOfDay: null,
  },
  {
    category: 'productivity_tip',
    content: "Reclaim your time by delegating tasks that drain your energy.",
    source: null,
    timeOfDay: ['afternoon'],
  },

  // Actionable Tips
  {
    category: 'actionable',
    content: "Review your vision 3 times today: morning, midday, and evening.",
    source: null,
    timeOfDay: ['morning'],
  },
  {
    category: 'actionable',
    content: "Complete your non-negotiables before checking email or social media.",
    source: null,
    timeOfDay: ['morning'],
  },
  {
    category: 'actionable',
    content: "Ask yourself: Is this task Delegation, Replacement, Investment, or Production?",
    source: null,
    timeOfDay: ['afternoon'],
  },
  {
    category: 'actionable',
    content: "Schedule your most important work during your peak energy hours.",
    source: null,
    timeOfDay: ['morning'],
  },
  {
    category: 'actionable',
    content: "End your day by writing tomorrow's top 3 priorities.",
    source: null,
    timeOfDay: ['evening'],
  },
  {
    category: 'actionable',
    content: "Track your time in 15-minute blocks to understand where your hours go.",
    source: null,
    timeOfDay: ['afternoon'],
  },

  // Motivational Quotes
  {
    category: 'quote',
    content: "The only way to do great work is to love what you do.",
    source: 'Steve Jobs',
    timeOfDay: ['morning'],
  },
  {
    category: 'quote',
    content: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    source: 'Winston Churchill',
    timeOfDay: ['evening'],
  },
  {
    category: 'quote',
    content: "What you do today can improve all your tomorrows.",
    source: 'Ralph Marston',
    timeOfDay: ['morning'],
  },
  {
    category: 'quote',
    content: "The future depends on what you do today.",
    source: 'Mahatma Gandhi',
    timeOfDay: ['morning', 'afternoon'],
  },
];

export async function POST() {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Check if tips already exist
    const { data: existing, error: checkError } = await supabase
      .from('pro_tips')
      .select('id')
      .limit(1);

    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    if (existing && existing.length > 0) {
      return NextResponse.json({
        message: 'Pro tips already seeded',
        count: existing.length
      });
    }

    // Insert tips
    const { data, error } = await supabase
      .from('pro_tips')
      .insert(PRO_TIPS.map(tip => ({
        category: tip.category,
        content: tip.content,
        source: tip.source,
        time_of_day: tip.timeOfDay,
        is_active: true,
        display_count: 0,
      })))
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Pro tips seeded successfully',
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Failed to seed pro tips' }, { status: 500 });
  }
}
