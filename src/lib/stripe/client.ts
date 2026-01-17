// Stripe client initialization

import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// Create Stripe client only when secret key is available
// This is null during build time and when env vars aren't set
export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      typescript: true,
      maxNetworkRetries: 3,
      timeout: 30000,
    })
  : null;

// Stripe price IDs for subscription tiers
export const STRIPE_PRICES = {
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly',
    yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly',
  },
  elite: {
    monthly: process.env.STRIPE_ELITE_MONTHLY_PRICE_ID || 'price_elite_monthly',
    yearly: process.env.STRIPE_ELITE_YEARLY_PRICE_ID || 'price_elite_yearly',
  },
  // One-time Founding Member offer
  foundingMember: process.env.STRIPE_FOUNDING_MEMBER_PRICE_ID || 'price_founding_member',
};

// Helper to get price ID
export function getPriceId(
  tier: 'pro' | 'elite',
  interval: 'monthly' | 'yearly'
): string {
  return STRIPE_PRICES[tier][interval];
}
