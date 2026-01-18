// Subscription tier definitions

import { SubscriptionTier } from '@/types/database';

export interface PlanFeature {
  name: string;
  included: boolean;
  limit?: string | number;
}

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
  features: PlanFeature[];
  limits: {
    powerGoals: number;
    minsPerDay: number;
    timeBlockHistoryDays: number;
    routines: number;
    leverageItems: number;
    friendInventory: number;
    northStarMetrics: number;
    accountabilityPartners: number;
  };
  highlights: string[];
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Vision + limited planning to get started',
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      { name: 'Vision & SMART Goal', included: true, limit: 1 },
      { name: 'Power Goals', included: true, limit: 3 },
      { name: 'Daily MINS', included: true, limit: '5/day' },
      { name: 'Weekly Calendar View', included: true },
      { name: 'Basic DRIP Matrix', included: true },
      { name: 'Morning & Evening Reviews', included: true },
      { name: 'Basic Pomodoro Timer', included: true },
      { name: 'Full Planning System', included: false },
      { name: 'History & Sync', included: false },
      { name: 'Leverage System', included: false },
      { name: 'AI Planning', included: false },
      { name: 'Accountability Features', included: false },
    ],
    limits: {
      powerGoals: 3,
      minsPerDay: 5,
      timeBlockHistoryDays: 7,
      routines: 2,
      leverageItems: 0,
      friendInventory: 0,
      northStarMetrics: 1,
      accountabilityPartners: 0,
    },
    highlights: ['1 Vision', '3 Power Goals', 'Weekly view only'],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Full planning, Reviews, History, Sync',
    priceMonthly: 24,
    priceYearly: 149,
    features: [
      { name: 'Vision & SMART Goals', included: true, limit: 'Unlimited' },
      { name: 'Power Goals', included: true, limit: 12 },
      { name: 'Daily MINS', included: true, limit: 'Unlimited' },
      { name: 'Full Planning System', included: true },
      { name: 'Weekly + Bi-weekly + Monthly Views', included: true },
      { name: '3x Daily Reviews', included: true },
      { name: 'Full DRIP Matrix', included: true },
      { name: 'History & Analytics', included: true, limit: '1 year' },
      { name: 'Google Calendar Sync', included: true },
      { name: 'Leverage System', included: true, limit: 10 },
      { name: 'Friend Inventory', included: true, limit: 25 },
      { name: 'Custom Routines', included: true, limit: 5 },
      { name: 'CSV Export', included: true },
      { name: 'AI Planning', included: false },
      { name: 'Accountability Partners', included: false },
      { name: 'Priority Templates', included: false },
    ],
    limits: {
      powerGoals: 12,
      minsPerDay: -1, // Unlimited
      timeBlockHistoryDays: 365,
      routines: 5,
      leverageItems: 10,
      friendInventory: 25,
      northStarMetrics: 5,
      accountabilityPartners: 0,
    },
    highlights: ['Full planning', 'Calendar sync', '1 year history'],
  },
  elite: {
    id: 'elite',
    name: 'Elite',
    description: 'Accountability, AI planning, Weekly review prompts',
    priceMonthly: 49,
    priceYearly: 199,
    features: [
      { name: 'Everything in Pro', included: true },
      { name: 'Unlimited Power Goals', included: true },
      { name: 'Unlimited History', included: true },
      { name: 'AI-Powered Planning', included: true },
      { name: 'AI Goal Suggestions', included: true },
      { name: 'AI Weekly Review Prompts', included: true },
      { name: 'Accountability Partners', included: true, limit: 5 },
      { name: 'Priority Templates Library', included: true },
      { name: 'Unlimited Routines', included: true },
      { name: 'Unlimited Leverage Items', included: true },
      { name: 'Unlimited Friend Inventory', included: true },
      { name: 'PDF Reports', included: true },
      { name: 'API Access', included: true },
      { name: 'Priority Support', included: true },
    ],
    limits: {
      powerGoals: -1, // Unlimited
      minsPerDay: -1,
      timeBlockHistoryDays: -1,
      routines: -1,
      leverageItems: -1,
      friendInventory: -1,
      northStarMetrics: -1,
      accountabilityPartners: 5,
    },
    highlights: ['AI planning', 'Accountability', 'Priority templates'],
  },
  founding_member: {
    id: 'founding_member',
    name: 'Founding Member',
    description: 'Full access through December 31, 2026',
    priceMonthly: 0, // One-time payment, not recurring
    priceYearly: 99, // One-time payment
    features: [
      { name: 'Everything in Elite', included: true },
      { name: 'Unlimited Power Goals', included: true },
      { name: 'Unlimited History', included: true },
      { name: 'AI-Powered Planning', included: true },
      { name: 'AI Goal Suggestions', included: true },
      { name: 'AI Weekly Review Prompts', included: true },
      { name: 'Accountability Partners', included: true, limit: 5 },
      { name: 'Priority Templates Library', included: true },
      { name: 'Unlimited Routines', included: true },
      { name: 'Unlimited Leverage Items', included: true },
      { name: 'Unlimited Friend Inventory', included: true },
      { name: 'PDF Reports', included: true },
      { name: 'API Access', included: true },
      { name: 'Founding Member Badge', included: true },
      { name: 'Priority Support', included: true },
    ],
    limits: {
      powerGoals: -1, // Unlimited
      minsPerDay: -1,
      timeBlockHistoryDays: -1,
      routines: -1,
      leverageItems: -1,
      friendInventory: -1,
      northStarMetrics: -1,
      accountabilityPartners: 5,
    },
    highlights: ['Full access', 'One-time payment', 'Founding Member perks'],
  },
};

// Helper to check if a tier has access to a feature
export function hasFeatureAccess(
  userTier: SubscriptionTier,
  requiredTier: SubscriptionTier
): boolean {
  const tierHierarchy: Record<SubscriptionTier, number> = {
    free: 0,
    pro: 1,
    elite: 2,
    founding_member: 2, // Same level as elite
  };
  return tierHierarchy[userTier] >= tierHierarchy[requiredTier];
}

// Helper to check if user is within limit
export function isWithinLimit(
  userTier: SubscriptionTier,
  limitKey: keyof SubscriptionPlan['limits'],
  currentCount: number
): boolean {
  const limit = SUBSCRIPTION_PLANS[userTier].limits[limitKey];
  if (limit === -1) return true; // Unlimited
  return currentCount < limit;
}
