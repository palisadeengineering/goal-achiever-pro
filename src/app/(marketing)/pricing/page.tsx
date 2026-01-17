'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Target, ArrowLeft, ArrowRight, Sparkles, Zap, Loader2 } from 'lucide-react';
import { PRICING_TIERS, FEATURE_COMPARISON } from '@/lib/stripe/config';
import { ROUTES } from '@/constants/routes';
import { createClient } from '@/lib/supabase/client';

export default function PricingPage() {
  const router = useRouter();
  const [isYearly, setIsYearly] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email || '' });
      }
    });
  }, []);

  const handleSubscribe = async (tierId: string) => {
    // Free tier - just go to signup/dashboard
    if (tierId === 'free') {
      router.push(user ? ROUTES.dashboard : ROUTES.signup);
      return;
    }

    // Not logged in - redirect to signup first
    if (!user) {
      router.push(`${ROUTES.signup}?redirect=/pricing&tier=${tierId}`);
      return;
    }

    // Logged in - create checkout session
    setLoadingTier(tierId);
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: tierId,
          interval: isYearly ? 'yearly' : 'monthly',
          userId: user.id,
          email: user.email,
        }),
      });

      const data = await response.json();
      if (data.url) {
        // External redirect to Stripe checkout - router.push doesn't work for external URLs
        // eslint-disable-next-line react-hooks/immutability
        window.location.href = data.url;
      } else {
        console.error('Checkout error:', data.error);
        setLoadingTier(null);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setLoadingTier(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5 font-semibold group">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center group-hover:scale-105 transition-transform">
              <Target className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">Goal Achiever Pro</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="container py-20 px-4">
        {/* Hero */}
        <div className="text-center mb-16">
          <Badge className="mb-6 bg-primary/10 text-primary border-0 px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Simple Pricing
          </Badge>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Choose Your Path to Success
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start free and upgrade as you grow. All plans include a 14-day free trial.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mt-10 p-1 bg-muted/50 rounded-full w-fit mx-auto">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                !isYearly
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                isYearly
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Yearly
              <Badge variant="success" size="sm">Save 30%</Badge>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {PRICING_TIERS.map((tier, index) => (
            <Card
              key={tier.id}
              className={`relative card-hover-lift ${
                tier.highlighted
                  ? 'border-2 border-primary shadow-xl ring-2 ring-primary/20 ring-offset-2 md:scale-105'
                  : 'border-2'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="shadow-md px-4 py-1">
                    <Zap className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="font-display text-xl">{tier.name}</CardTitle>
                <CardDescription className="text-sm">{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="pb-6">
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-5xl font-bold number-display">
                      ${isYearly ? Math.round(tier.yearlyPrice / 12) : tier.monthlyPrice}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  {isYearly && tier.yearlyPrice > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Billed ${tier.yearlyPrice}/year
                    </p>
                  )}
                  {tier.monthlyPrice === 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Free forever
                    </p>
                  )}
                </div>

                <ul className="space-y-3">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-0">
                <Button
                  className={`w-full btn-lift font-semibold ${tier.highlighted ? '' : ''}`}
                  variant={tier.highlighted ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => handleSubscribe(tier.id)}
                  disabled={loadingTier === tier.id}
                >
                  {loadingTier === tier.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {tier.cta}
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="mt-16 md:mt-24">
          <div className="text-center mb-6 md:mb-10">
            <Badge className="mb-4" variant="outline">Compare Plans</Badge>
            <h2 className="font-display text-2xl md:text-3xl font-bold">
              Feature Comparison
            </h2>
            <p className="text-sm text-muted-foreground mt-2 md:hidden">
              ← Scroll to compare →
            </p>
          </div>
          <div className="overflow-x-auto rounded-xl border bg-card -mx-4 md:mx-0 scrollbar-hide">
            <table className="w-full min-w-[600px] md:min-w-0 md:max-w-4xl mx-auto">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-3 px-4 md:py-4 md:px-6 font-display font-semibold text-sm md:text-base sticky left-0 bg-muted/30 z-10">Feature</th>
                  <th className="text-center py-3 px-3 md:py-4 md:px-6 font-display font-semibold text-sm md:text-base">Free</th>
                  <th className="text-center py-3 px-3 md:py-4 md:px-6 font-display font-semibold text-sm md:text-base bg-primary/5">
                    <div className="flex items-center justify-center gap-1 md:gap-2">
                      Pro
                      <Badge size="sm" className="bg-primary text-[10px] md:text-xs">Popular</Badge>
                    </div>
                  </th>
                  <th className="text-center py-3 px-3 md:py-4 md:px-6 font-display font-semibold text-sm md:text-base">Elite</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(FEATURE_COMPARISON).map(([feature, tiers], index) => (
                  <tr key={feature} className={`border-b last:border-0 ${index % 2 === 0 ? '' : 'bg-muted/20'}`}>
                    <td className={`py-3 px-4 md:py-4 md:px-6 text-xs md:text-sm font-medium sticky left-0 z-10 ${index % 2 === 0 ? 'bg-card' : 'bg-muted/20'}`}>{feature}</td>
                    <td className="py-3 px-3 md:py-4 md:px-6 text-center">
                      {renderFeatureValue(tiers.free)}
                    </td>
                    <td className="py-3 px-3 md:py-4 md:px-6 text-center bg-primary/5">
                      {renderFeatureValue(tiers.pro)}
                    </td>
                    <td className="py-3 px-3 md:py-4 md:px-6 text-center">
                      {renderFeatureValue(tiers.elite)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-24 max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <Badge className="mb-4" variant="outline">FAQ</Badge>
            <h2 className="font-display text-2xl md:text-3xl font-bold">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="grid gap-6">
            {[
              {
                q: 'Can I switch plans anytime?',
                a: 'Yes! You can upgrade, downgrade, or cancel your subscription at any time. Changes take effect at your next billing cycle.',
              },
              {
                q: 'Is there a free trial?',
                a: 'All paid plans include a 14-day free trial. No credit card required to start.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards (Visa, MasterCard, American Express) through Stripe.',
              },
              {
                q: 'Can I get a refund?',
                a: "If you're not satisfied within the first 30 days, contact us for a full refund.",
              },
            ].map((faq, index) => (
              <Card key={index} className="border-2">
                <CardContent className="pt-6">
                  <h3 className="font-display font-semibold text-lg mb-2">{faq.q}</h3>
                  <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-24 text-center py-16 px-8 bg-gradient-to-br from-primary to-primary/90 rounded-2xl text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
          <div className="relative">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Ready to Achieve Your Goals?
            </h2>
            <p className="text-primary-foreground/80 mb-8 text-lg max-w-xl mx-auto">
              Start your journey today with our free plan. No credit card required.
            </p>
            <Link href={ROUTES.signup}>
              <Button size="lg" variant="secondary" className="btn-lift gap-2 font-semibold text-base px-8">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-8">
        <div className="container px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
              <Target className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-sm">Goal Achiever Pro</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Goal Achiever Pro. All rights reserved.
          </p>
          <nav className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function renderFeatureValue(value: boolean | string) {
  if (value === true) {
    return (
      <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
        <Check className="h-3.5 w-3.5 text-emerald-600" />
      </div>
    );
  }
  if (value === false) {
    return (
      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center mx-auto">
        <X className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    );
  }
  return <span className="text-sm font-medium">{value}</span>;
}
