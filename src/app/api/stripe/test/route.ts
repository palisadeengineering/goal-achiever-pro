import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';

export async function GET() {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured', envCheck: {
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
      keyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 10),
    }});
  }

  try {
    // Simple test - list products (should be fast)
    const products = await stripe.products.list({ limit: 1 });
    return NextResponse.json({
      success: true,
      productCount: products.data.length,
      stripeReachable: true
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      error: 'Stripe API test failed',
      details: errorMessage,
      envCheck: {
        hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
        keyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 10),
      }
    });
  }
}
