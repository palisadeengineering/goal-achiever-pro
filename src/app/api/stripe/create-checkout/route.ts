import { NextRequest, NextResponse } from 'next/server';
import { stripe, getPriceId } from '@/lib/stripe/client';

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { tier, interval, userId, email } = body;

    if (!tier || !interval || !userId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['pro', 'premium'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier' },
        { status: 400 }
      );
    }

    if (!['monthly', 'yearly'].includes(interval)) {
      return NextResponse.json(
        { error: 'Invalid interval' },
        { status: 400 }
      );
    }

    const priceId = getPriceId(tier as 'pro' | 'premium', interval as 'monthly' | 'yearly');

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/subscription?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: {
        userId,
        tier,
        interval,
      },
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          userId,
          tier,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: errorMessage },
      { status: 500 }
    );
  }
}
