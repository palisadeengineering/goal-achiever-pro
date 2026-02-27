// Stripe configuration and pricing tiers
// Everything is free during MVP / PMF phase

export interface PricingTier {
  id: 'free' | 'pro' | 'elite';
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  highlighted?: boolean;
  cta: string;
  badge?: string;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Beta',
    description: 'Full access to all features during beta',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      'Time Audit & AI Categorization',
      'Value Matrix (DRIP) Analysis',
      'Weekly, Bi-weekly & Monthly Calendar Views',
      'Analytics & Insights Dashboard',
      'AI Coaching & Activity Classification',
      'Leverage System (4 C\'s)',
      'Network Audit',
      'Team Sharing & Collaboration',
      'Google Calendar Sync',
      'Tags & Smart Suggestions',
    ],
    highlighted: true,
    cta: 'Get Started Free',
    badge: 'Currently Free During Beta',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Advanced features for power users',
    monthlyPrice: 24,
    yearlyPrice: 149,
    features: [
      'Everything in Beta, plus:',
      'Priority Support',
      'Advanced Export (CSV + PDF)',
      'Extended History & Analytics',
      'Custom Integrations',
    ],
    cta: 'Coming Soon',
    badge: 'Coming Soon',
  },
  {
    id: 'elite',
    name: 'Elite',
    description: 'For teams and enterprises',
    monthlyPrice: 49,
    yearlyPrice: 199,
    features: [
      'Everything in Pro, plus:',
      'Team Management',
      'API Access',
      'Dedicated Support',
      'Custom Onboarding',
    ],
    cta: 'Coming Soon',
    badge: 'Coming Soon',
  },
];

// Feature comparison matrix - reflects MVP features
export const FEATURE_COMPARISON: Record<string, { free: boolean | string; pro: boolean | string; elite: boolean | string }> = {
  'Time Audit (Weekly)': { free: true, pro: true, elite: true },
  'Time Audit (Bi-weekly & Monthly)': { free: true, pro: true, elite: true },
  'Value Matrix (DRIP)': { free: true, pro: true, elite: true },
  'AI Activity Classification': { free: true, pro: true, elite: true },
  'AI Coaching Nudges': { free: true, pro: true, elite: true },
  'Analytics & Insights': { free: true, pro: true, elite: true },
  'Leverage System (4 C\'s)': { free: true, pro: true, elite: true },
  'Network Audit': { free: true, pro: true, elite: true },
  'Team Sharing': { free: true, pro: true, elite: true },
  'Google Calendar Sync': { free: true, pro: true, elite: true },
  'Tags & Smart Suggestions': { free: true, pro: true, elite: true },
  'Export Reports': { free: 'CSV', pro: 'CSV + PDF', elite: 'CSV + PDF' },
  'Priority Support': { free: false, pro: true, elite: true },
  'API Access': { free: false, pro: false, elite: true },
};
