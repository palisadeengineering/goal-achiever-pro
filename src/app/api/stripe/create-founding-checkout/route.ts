import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/api-auth';
import { createClient } from '@/lib/supabase/server';

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
    const userId = auth.userId;

    if (!email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Founding Member price ID - set this in your Stripe dashboard
    // Create a one-time $99 product called "Founding Member 2026 Access"
    const foundingMemberPriceId = process.env.STRIPE_FOUNDING_MEMBER_PRICE_ID || 'price_founding_member';

    // Use fetch directly to create a one-time payment checkout session
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode': 'payment',
        'payment_method_types[0]': 'card',
        'customer_email': email,
        'line_items[0][price]': foundingMemberPriceId,
        'line_items[0][quantity]': '1',
        'success_url': `${appUrl}/settings/subscription?success=true&founding=true`,
        'cancel_url': `${appUrl}/offer?canceled=true`,
        'metadata[userId]': userId,
        'metadata[product]': 'founding_member_2026',
        'metadata[accessExpires]': '2026-12-31',
        'allow_promotion_codes': 'true',
      }).toString(),
    });

    const data = await response.json();

    if (response.ok && data.url) {
      return NextResponse.json({ url: data.url });
    } else {
      console.error('Stripe checkout error:', data);
      return NextResponse.json(
        { error: 'Failed to create checkout session', details: data.error?.message || 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: errorMessage },
      { status: 500 }
    );
  }
}
