import { NextResponse } from 'next/server';

export async function GET() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    return NextResponse.json({ error: 'Stripe not configured' });
  }

  try {
    // Test using raw fetch to bypass SDK
    const response = await fetch('https://api.stripe.com/v1/products?limit=1', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data = await response.json();

    if (response.ok) {
      return NextResponse.json({
        success: true,
        method: 'raw_fetch',
        productCount: data.data?.length || 0,
        stripeReachable: true
      });
    } else {
      return NextResponse.json({
        error: 'Stripe API error',
        status: response.status,
        details: data.error?.message || 'Unknown error'
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      error: 'Fetch failed',
      details: errorMessage,
    });
  }
}
