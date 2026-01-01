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
    description: 'Get started with goal setting basics',
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      { name: 'Vision & SMART Goal', included: true, limit: 1 },
      { name: 'Power Goals', included: true, limit: 3 },
      { name: 'Daily MINS', included: true, limit: '5/day' },
      { name: 'Weekly Calendar View', included: true },
      { name: 'Basic DRIP Matrix', included: true },
      { name: 'Morning & Evening Routines', included: true, limit: 2 },
      { name: 'Basic Pomodoro Timer', included: true },
      { name: 'Bi-weekly Calendar View', included: false },
      { name: 'Monthly Calendar View', included: false },
      { name: 'Leverage System', included: false },
      { name: 'Friend Inventory', included: false },
      { name: 'Data Export', included: false },
      { name: 'Google Calendar Sync', included: false },
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
    description: 'Unlock the full goal achievement system',
    priceMonthly: 12,
    priceYearly: 99,
    features: [
      { name: 'Vision & SMART Goal', included: true, limit: 'Unlimited' },
      { name: 'Power Goals', included: true, limit: 12 },
      { name: 'Daily MINS', included: true, limit: 'Unlimited' },
      { name: 'Weekly Calendar View', included: true },
      { name: 'Bi-weekly Calendar View', included: true },
      { name: 'Full DRIP Matrix Editing', included: true },
      { name: '3x Daily Reviews', included: true },
      { name: 'Custom Routines', included: true, limit: 5 },
      { name: 'Customizable Pomodoro', included: true },
      { name: 'Leverage System', included: true, limit: 10 },
      { name: 'Friend Inventory', included: true, limit: 25 },
      { name: '90-Day History', included: true },
      { name: 'CSV Export', included: true },
      { name: 'Monthly Calendar View', included: false },
      { name: 'Google Calendar Sync', included: false },
      { name: 'Accountability Partners', included: false },
    ],
    limits: {
      powerGoals: 12,
      minsPerDay: -1, // Unlimited
      timeBlockHistoryDays: 90,
      routines: 5,
      leverageItems: 10,
      friendInventory: 25,
      northStarMetrics: 3,
      accountabilityPartners: 0,
    },
    highlights: ['12 Power Goals', 'Bi-weekly view', '90-day history'],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    description: 'Maximum leverage for high achievers',
    priceMonthly: 29,
    priceYearly: 249,
    features: [
      { name: 'Everything in Pro', included: true },
      { name: 'Unlimited Power Goals', included: true },
      { name: 'Monthly Calendar View', included: true },
      { name: 'Unlimited History', included: true },
      { name: 'Unlimited Routines', included: true },
      { name: 'Unlimited Leverage Items', included: true },
      { name: 'Unlimited Friend Inventory', included: true },
      { name: 'Accountability Partners', included: true, limit: 3 },
      { name: 'Google Calendar Sync (Two-way)', included: true },
      { name: 'PDF Reports', included: true },
      { name: 'API Access', included: true },
      { name: 'Priority Support', included: true },
      { name: 'AI Insights', included: true },
    ],
    limits: {
      powerGoals: -1, // Unlimited
      minsPerDay: -1,
      timeBlockHistoryDays: -1,
      routines: -1,
      leverageItems: -1,
      friendInventory: -1,
      northStarMetrics: -1,
      accountabilityPartners: 3,
    },
    highlights: ['Unlimited everything', 'Monthly view', 'Calendar sync'],
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
    premium: 2,
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
