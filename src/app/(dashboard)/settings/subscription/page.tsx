'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Check,
  CreditCard,
  Calendar,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { PRICING_TIERS } from '@/lib/stripe/config';
import { ROUTES } from '@/constants/routes';

type SubscriptionTier = 'free' | 'pro' | 'premium';

interface MockSubscription {
  tier: SubscriptionTier;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
}

// Mock user subscription data
const mockSubscription: MockSubscription = {
  tier: 'free',
  status: 'active',
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  stripeCustomerId: null,
};

export default function SubscriptionPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isManaging, setIsManaging] = useState(false);

  const currentTier = PRICING_TIERS.find(t => t.id === mockSubscription.tier);
  const isPaid = mockSubscription.tier !== 'free';

  const handleUpgrade = async (tierId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: tierId,
          interval: 'monthly',
          userId: 'mock-user-id',
          email: 'user@example.com',
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
    if (!mockSubscription.stripeCustomerId) return;

    setIsManaging(true);
    try {
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: mockSubscription.stripeCustomerId,
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
              variant={mockSubscription.status === 'active' ? 'default' : 'secondary'}
            >
              {mockSubscription.status}
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

          {mockSubscription.currentPeriodEnd && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {mockSubscription.cancelAtPeriodEnd ? (
                <span>
                  Your plan will be canceled on{' '}
                  {new Date(mockSubscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              ) : (
                <span>
                  Next billing date:{' '}
                  {new Date(mockSubscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              )}
            </div>
          )}

          {mockSubscription.cancelAtPeriodEnd && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your subscription will be canceled at the end of the current billing period.
                You can reactivate anytime before then.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        {isPaid && mockSubscription.stripeCustomerId && (
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
      {mockSubscription.tier !== 'premium' && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Upgrade Your Plan</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {PRICING_TIERS.filter(t => {
              if (mockSubscription.tier === 'free') return t.id !== 'free';
              if (mockSubscription.tier === 'pro') return t.id === 'premium';
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
