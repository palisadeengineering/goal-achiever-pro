'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Check, X, Target, ArrowLeft } from 'lucide-react';
import { PRICING_TIERS, FEATURE_COMPARISON } from '@/lib/stripe/config';
import { ROUTES } from '@/constants/routes';

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Target className="h-6 w-6 text-primary" />
            <span>Goal Achiever Pro</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="container py-16 px-4">
        {/* Hero */}
        <div className="text-center mb-12">
          <Badge className="mb-4">Pricing</Badge>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Choose Your Path to Success
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start free and upgrade as you grow. All plans include a 14-day free trial.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <Label htmlFor="billing-toggle" className={!isYearly ? 'font-medium' : 'text-muted-foreground'}>
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <Label htmlFor="billing-toggle" className={isYearly ? 'font-medium' : 'text-muted-foreground'}>
              Yearly
              <Badge variant="secondary" className="ml-2">Save 30%</Badge>
            </Label>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {PRICING_TIERS.map((tier) => (
            <Card
              key={tier.id}
              className={`relative ${
                tier.highlighted
                  ? 'border-2 border-primary shadow-lg scale-105'
                  : ''
              }`}
            >
              {tier.highlighted && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              <CardHeader>
                <CardTitle>{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-bold">
                    ${isYearly ? Math.round(tier.yearlyPrice / 12) : tier.monthlyPrice}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                  {isYearly && tier.yearlyPrice > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Billed ${tier.yearlyPrice}/year
                    </p>
                  )}
                </div>

                <ul className="space-y-3">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Link href={tier.id === 'free' ? ROUTES.signup : ROUTES.signup} className="w-full">
                  <Button
                    className="w-full"
                    variant={tier.highlighted ? 'default' : 'outline'}
                  >
                    {tier.cta}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-center mb-8">
            Feature Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full max-w-4xl mx-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-4">Feature</th>
                  <th className="text-center py-4 px-4">Free</th>
                  <th className="text-center py-4 px-4 bg-primary/5">Pro</th>
                  <th className="text-center py-4 px-4">Premium</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(FEATURE_COMPARISON).map(([feature, tiers]) => (
                  <tr key={feature} className="border-b">
                    <td className="py-3 px-4 text-sm">{feature}</td>
                    <td className="py-3 px-4 text-center">
                      {renderFeatureValue(tiers.free)}
                    </td>
                    <td className="py-3 px-4 text-center bg-primary/5">
                      {renderFeatureValue(tiers.pro)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {renderFeatureValue(tiers.premium)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Can I switch plans anytime?</h3>
              <p className="text-muted-foreground">
                Yes! You can upgrade, downgrade, or cancel your subscription at any time.
                Changes take effect at your next billing cycle.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-muted-foreground">
                All paid plans include a 14-day free trial. No credit card required to start.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground">
                We accept all major credit cards (Visa, MasterCard, American Express) through Stripe.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I get a refund?</h3>
              <p className="text-muted-foreground">
                If you&apos;re not satisfied within the first 30 days, contact us for a full refund.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <h2 className="text-2xl font-bold mb-4">
            Ready to Achieve Your Goals?
          </h2>
          <p className="text-muted-foreground mb-6">
            Start your journey today with our free plan. No credit card required.
          </p>
          <Link href={ROUTES.signup}>
            <Button size="lg">Get Started Free</Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 mt-20">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Goal Achiever Pro. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function renderFeatureValue(value: boolean | string) {
  if (value === true) {
    return <Check className="h-5 w-5 text-green-500 mx-auto" />;
  }
  if (value === false) {
    return <X className="h-5 w-5 text-muted-foreground mx-auto" />;
  }
  return <span className="text-sm">{value}</span>;
}
