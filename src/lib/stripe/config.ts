// Stripe configuration and pricing tiers

export interface PricingTier {
  id: 'free' | 'pro' | 'elite';
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  highlighted?: boolean;
  cta: string;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Vision + limited planning to get started',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      'Vision & SMART Goal Setting',
      '3 Impact Projects',
      'Daily MINS (5 per day)',
      'Weekly Time Audit View',
      'Basic Value Matrix',
      'Pomodoro Timer',
      'Morning & Evening Reviews',
    ],
    cta: 'Get Started Free',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Full planning, Reviews, History, Sync',
    monthlyPrice: 24,
    yearlyPrice: 149,
    features: [
      'Everything in Free, plus:',
      '12 Impact Projects',
      'Unlimited MINS',
      'Full Calendar Views (Weekly, Bi-weekly, Monthly)',
      '3x Daily Reviews',
      'Google Calendar Sync',
      '1 Year History & Analytics',
      'Leverage System (4 C\'s)',
      'Network Audit',
      'Export Reports',
    ],
    highlighted: true,
    cta: 'Start Pro Trial',
  },
  {
    id: 'elite',
    name: 'Elite',
    description: 'Accountability, AI planning, Weekly review prompts',
    monthlyPrice: 49,
    yearlyPrice: 199,
    features: [
      'Everything in Pro, plus:',
      'Unlimited Impact Projects',
      'AI-Powered Planning',
      'AI Goal Suggestions',
      'AI Weekly Review Prompts',
      'Accountability Partners (5)',
      'Priority Templates Library',
      'Unlimited History',
      'PDF Reports',
      'API Access',
      'Priority Support',
    ],
    cta: 'Start Elite Trial',
  },
];

// Feature comparison matrix
export const FEATURE_COMPARISON = {
  'Vision & SMART Goals': { free: true, pro: true, elite: true },
  'Impact Projects': { free: '3', pro: '12', elite: 'Unlimited' },
  'Daily MINS': { free: '5/day', pro: 'Unlimited', elite: 'Unlimited' },
  'Time Audit - Weekly': { free: true, pro: true, elite: true },
  'Time Audit - Bi-weekly': { free: false, pro: true, elite: true },
  'Time Audit - Monthly': { free: false, pro: true, elite: true },
  'Value Matrix': { free: 'Basic', pro: 'Full', elite: 'Full + AI' },
  'Pomodoro Timer': { free: true, pro: true, elite: true },
  'Morning Review': { free: true, pro: true, elite: true },
  'Midday Review': { free: false, pro: true, elite: true },
  'Evening Review': { free: true, pro: true, elite: true },
  'Google Calendar Sync': { free: false, pro: true, elite: true },
  'History & Analytics': { free: '7 days', pro: '1 year', elite: 'Unlimited' },
  'Leverage System': { free: false, pro: true, elite: true },
  'Network Audit': { free: false, pro: true, elite: true },
  'Export Reports': { free: false, pro: 'CSV', elite: 'CSV + PDF' },
  'AI Planning': { free: false, pro: false, elite: true },
  'AI Weekly Review Prompts': { free: false, pro: false, elite: true },
  'Accountability Partners': { free: false, pro: false, elite: '5' },
  'Priority Templates': { free: false, pro: false, elite: true },
  'API Access': { free: false, pro: false, elite: true },
  'Priority Support': { free: false, pro: false, elite: true },
};
