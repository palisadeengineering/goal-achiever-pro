import { NextRequest, NextResponse } from 'next/server';
import { getPriceId } from '@/lib/stripe/client';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';
import { createClient } from '@/lib/supabase/server';
import { sanitizeErrorForClient } from '@/lib/utils/api-errors';

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if (!auth.isAuthenticated) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 500 }
    );
  }

  try {
    // Get user email from authenticated session, not from request body
    const supabase = await createClient();
    const email = supabase ? (await supabase.auth.getUser()).data.user?.email : null;

    if (!email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { tier, interval } = body;

    if (!tier || !interval) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const userId = auth.userId;

    if (!['pro', 'elite'].includes(tier)) {
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

    const priceId = getPriceId(tier as 'pro' | 'elite', interval as 'monthly' | 'yearly');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Use fetch directly to avoid SDK connection issues
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode': 'subscription',
        'payment_method_types[0]': 'card',
        'customer_email': email,
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        'success_url': `${appUrl}/settings/subscription?success=true`,
        'cancel_url': `${appUrl}/pricing?canceled=true`,
        'metadata[userId]': userId,
        'metadata[tier]': tier,
        'metadata[interval]': interval,
        'subscription_data[trial_period_days]': '14',
        'subscription_data[metadata][userId]': userId,
        'subscription_data[metadata][tier]': tier,
      }).toString(),
    });

    const data = await response.json();

    if (response.ok && data.url) {
      return NextResponse.json({ url: data.url });
    } else {
      console.error('Stripe checkout error:', data);
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: sanitizeErrorForClient(error, 'create checkout session') },
      { status: 500 }
    );
  }
}
