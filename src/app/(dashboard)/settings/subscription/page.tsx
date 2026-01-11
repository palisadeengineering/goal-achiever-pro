'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Check,
  CreditCard,
  ExternalLink,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { PRICING_TIERS } from '@/lib/stripe/config';
import { ROUTES } from '@/constants/routes';
import { createClient } from '@/lib/supabase/client';

type SubscriptionTier = 'free' | 'pro' | 'elite';

interface Subscription {
  tier: SubscriptionTier;
  status: string;
  stripeCustomerId: string | null;
}

export default function SubscriptionPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isManaging, setIsManaging] = useState(false);
  const [subscription, setSubscription] = useState<Subscription>({
    tier: 'free',
    status: 'active',
    stripeCustomerId: null,
  });
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser) {
        setUser({ id: authUser.id, email: authUser.email || '' });

        // Fetch subscription data
        const response = await fetch('/api/user/subscription');
        if (response.ok) {
          const data = await response.json();
          setSubscription({
            tier: data.tier || 'free',
            status: data.status || 'active',
            stripeCustomerId: data.stripeCustomerId,
          });
        }
      }
      setIsLoadingData(false);
    }

    loadData();
  }, []);

  const currentTier = PRICING_TIERS.find(t => t.id === subscription.tier);
  const isPaid = subscription.tier !== 'free';

  const handleUpgrade = async (tierId: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: tierId,
          interval: 'monthly',
          userId: user.id,
          email: user.email,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!subscription.stripeCustomerId) return;

    setIsManaging(true);
    try {
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: subscription.stripeCustomerId,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error opening portal:', error);
    } finally {
      setIsManaging(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription"
        description="Manage your subscription and billing"
        backHref={ROUTES.settings}
      />

      {/* Success Alert */}
      {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('success') && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Your subscription has been activated! Welcome to Pro.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                {isPaid
                  ? `You're on the ${currentTier?.name} plan`
                  : 'You\'re on the free plan'}
              </CardDescription>
            </div>
            <Badge
              variant={subscription.status === 'active' ? 'default' : 'secondary'}
            >
              {subscription.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{currentTier?.name}</p>
              <p className="text-muted-foreground">
                {currentTier?.monthlyPrice === 0
                  ? 'Free forever'
                  : `$${currentTier?.monthlyPrice}/month`}
              </p>
            </div>
          </div>

        </CardContent>
        {isPaid && subscription.stripeCustomerId && (
          <CardFooter>
            <Button
              variant="outline"
              onClick={handleManageSubscription}
              disabled={isManaging}
            >
              {isManaging ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Manage Subscription
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle>Your Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid md:grid-cols-2 gap-3">
            {currentTier?.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Upgrade Options */}
      {subscription.tier !== 'elite' && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Upgrade Your Plan</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {PRICING_TIERS.filter(t => {
              if (subscription.tier === 'free') return t.id !== 'free';
              if (subscription.tier === 'pro') return t.id === 'elite';
              return false;
            }).map((tier) => (
              <Card key={tier.id} className={tier.highlighted ? 'border-primary' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{tier.name}</CardTitle>
                    {tier.highlighted && <Badge>Popular</Badge>}
                  </div>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">${tier.monthlyPrice}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <ul className="space-y-2 mb-4">
                    {tier.features.slice(0, 5).map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                    {tier.features.length > 5 && (
                      <li className="text-sm text-muted-foreground">
                        +{tier.features.length - 5} more features
                      </li>
                    )}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => handleUpgrade(tier.id)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Upgrade to {tier.name}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Compare Plans Link */}
      <div className="text-center">
        <Link href={ROUTES.pricing}>
          <Button variant="link">
            Compare all plans in detail
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
