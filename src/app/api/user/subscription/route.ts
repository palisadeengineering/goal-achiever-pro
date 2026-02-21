import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_status, stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching subscription:', error);
      return NextResponse.json(
        { tier: 'free', status: 'active', stripeCustomerId: null }
      );
    }

    return NextResponse.json({
      tier: profile?.subscription_tier || 'free',
      status: profile?.subscription_status || 'active',
      stripeCustomerId: profile?.stripe_customer_id || null,
    });
  } catch (error) {
    console.error('Error in subscription API:', error);
    return NextResponse.json(
      { tier: 'free', status: 'active', stripeCustomerId: null }
    );
  }
}
