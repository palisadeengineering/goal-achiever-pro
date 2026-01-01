// Stripe configuration and pricing tiers

export interface PricingTier {
  id: 'free' | 'pro' | 'premium';
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
    description: 'Get started with goal achievement basics',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      'Vision & SMART Goal Setting',
      '3 Power Goals',
      'Daily MINS (5 per day)',
      'Weekly Time Audit View',
      'Basic DRIP Matrix',
      'Pomodoro Timer',
      'Morning & Evening Reviews',
    ],
    cta: 'Get Started Free',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For serious goal achievers',
    monthlyPrice: 12,
    yearlyPrice: 99,
    features: [
      'Everything in Free, plus:',
      '12 Power Goals',
      'Unlimited MINS',
      'Weekly + Bi-weekly Time Views',
      'Advanced DRIP Analysis',
      'Leverage System (4 C\'s)',
      'Network Audit',
      'Midday Reviews',
      'Export Reports',
      'Priority Support',
    ],
    highlighted: true,
    cta: 'Start Pro Trial',
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Maximum productivity & accountability',
    monthlyPrice: 29,
    yearlyPrice: 249,
    features: [
      'Everything in Pro, plus:',
      'Monthly Time Audit View',
      'Accountability Partner Matching',
      'AI-Powered Insights',
      'Custom Routines',
      'Team Collaboration (Coming Soon)',
      'White-glove Onboarding',
      'Weekly Strategy Calls',
    ],
    cta: 'Start Premium Trial',
  },
];

// Feature comparison matrix
export const FEATURE_COMPARISON = {
  'Vision & SMART Goals': { free: true, pro: true, premium: true },
  'Power Goals': { free: '3', pro: '12', premium: 'Unlimited' },
  'Daily MINS': { free: '5/day', pro: 'Unlimited', premium: 'Unlimited' },
  'Time Audit - Weekly': { free: true, pro: true, premium: true },
  'Time Audit - Bi-weekly': { free: false, pro: true, premium: true },
  'Time Audit - Monthly': { free: false, pro: false, premium: true },
  'DRIP Matrix': { free: 'Basic', pro: 'Advanced', premium: 'Advanced + AI' },
  'Pomodoro Timer': { free: true, pro: true, premium: true },
  'Morning Review': { free: true, pro: true, premium: true },
  'Midday Review': { free: false, pro: true, premium: true },
  'Evening Review': { free: true, pro: true, premium: true },
  'Leverage System': { free: false, pro: true, premium: true },
  'Network Audit': { free: false, pro: true, premium: true },
  'Export Reports': { free: false, pro: true, premium: true },
  'Accountability Partners': { free: false, pro: false, premium: true },
  'AI Insights': { free: false, pro: false, premium: true },
  'Priority Support': { free: false, pro: true, premium: true },
};
