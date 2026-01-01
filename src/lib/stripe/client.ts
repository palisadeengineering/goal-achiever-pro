// Stripe client initialization

import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// Create Stripe client only when secret key is available
// This is null during build time and when env vars aren't set
export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
  : null;

// Stripe price IDs for subscription tiers
export const STRIPE_PRICES = {
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly',
    yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly',
  },
  premium: {
    monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || 'price_premium_monthly',
    yearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || 'price_premium_yearly',
  },
};

// Helper to get price ID
export function getPriceId(
  tier: 'pro' | 'premium',
  interval: 'monthly' | 'yearly'
): string {
  return STRIPE_PRICES[tier][interval];
}
