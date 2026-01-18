'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import {
  Target,
  CheckCircle2,
  ArrowRight,
  Play,
  Sparkles,
  Clock,
  Calendar,
  BarChart3,
  Timer,
  Users,
  FileText,
  Gift,
  Shield,
  Zap,
  Loader2,
  ChevronDown,
  Star,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { createClient } from '@/lib/supabase/client';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email || '' });
      }
    });
  }, []);

  const handleGetAccess = async () => {
    // Not logged in - redirect to signup first
    if (!user) {
      router.push(`${ROUTES.signup}?redirect=/offer&product=founding-member`);
      return;
    }

    // Logged in - create checkout session
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/create-founding-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Checkout error:', data.error);
        setLoading(false);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setLoading(false);
    }
  };

  const coreFeatures = [
    {
      icon: Target,
      title: 'Goal Clarity Setup',
      description: 'Turn vague intentions into a focused 2026 plan.',
      items: [
        'Guided flow to define 1-3 specific 2026 goals',
        'Vision prompts and visualization exercises',
        'Simple "Goals Board" you can export to phone/desktop',
      ],
    },
    {
      icon: Clock,
      title: 'Time & Energy Audit',
      description: 'See exactly where your week is going and what needs to change.',
      items: [
        '7-day, 15-minute time logging workflow',
        'Green / Yellow / Red energy tagging',
        'Clear prompts to delete, delegate, or redesign tasks',
      ],
    },
    {
      icon: Timer,
      title: 'Execution Engine',
      description: 'Turn your goals into daily, repeatable actions.',
      items: [
        '90-Minute Attack planner for your most important work',
        'Built-in focus timers and distraction-free mode',
        'Daily MINS checklist tied directly to your goals',
      ],
    },
    {
      icon: Calendar,
      title: '12-Month Roadmap Builder',
      description: 'Make the whole year feel achievable, not overwhelming.',
      items: [
        'Break your goals into quarterly "power projects"',
        'See exactly what you\'re focused on this month, week, and today',
      ],
    },
  ];

  const bonuses = [
    {
      icon: Zap,
      title: 'Leverage Pack for High Achievers',
      description: 'Templates and prompts to use Code, Content, Capital, and Collaboration to get more done with less effort.',
      items: [
        '10/80/10 delegation worksheets',
        'NET Time ideas list for stacking habits and work',
      ],
    },
    {
      icon: Users,
      title: 'Network & Boundaries Toolkit',
      description: 'Curate a higher-performance environment.',
      items: [
        'Friend/contact inventory workflow using four simple questions',
        'Conversation scripts and prompts for setting new boundaries',
      ],
    },
    {
      icon: FileText,
      title: 'Accountability & Forcing Functions Vault',
      description: 'Make your goals non-negotiable instead of "nice to have."',
      items: [
        'Library of financial, social, and environmental stake ideas',
        'Auto-generated "Goal Achievement Contract" PDF',
      ],
    },
  ];

  const faqs = [
    {
      q: 'What exactly do I get access to?',
      a: 'You get full access to Goal Achiever Pro through December 31, 2026. This includes all current features (vision planning, time audit, DRIP matrix, routines, reviews, analytics) plus all updates and new features we release during that period.',
    },
    {
      q: 'Is this a subscription?',
      a: 'No. This is a one-time payment of $99 for access through the end of 2026. No recurring charges, no surprises.',
    },
    {
      q: 'What if I already have an account?',
      a: 'Great! Just sign in before purchasing and your Founding Member access will be applied to your existing account.',
    },
    {
      q: 'What happens after December 31, 2026?',
      a: 'As a Founding Member, you\'ll get preferred pricing on any future subscription plans. We\'ll reach out before your access expires with options.',
    },
    {
      q: 'Is there a refund policy?',
      a: 'Absolutely. Try Goal Achiever Pro for 30 days. If you don\'t feel at least 2x clearer on your goals and more in control of your week, email us and we\'ll refund you in full. No questions asked.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5 font-semibold group">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center group-hover:scale-105 transition-transform">
              <Target className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">Goal Achiever Pro</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            {user ? (
              <Link href={ROUTES.dashboard}>
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link href={ROUTES.login}>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Sign in
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-dot-pattern opacity-50" />
          <div className="absolute inset-0 bg-hero-gradient" />

          {/* Decorative circles */}
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />

          <div className="container max-w-4xl relative">
            <ScrollReveal animation="fade-up">
              <div className="flex flex-col items-center text-center">
                <Badge className="mb-8 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 px-5 py-2 text-sm">
                  <Gift className="h-4 w-4 mr-2" />
                  Founding Member Offer
                </Badge>

                <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
                  Goal Achiever Pro
                </h1>

                <p className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-gradient-primary mb-8">
                  The System To Actually Achieve Your Goals By 2026
                </p>

                <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed">
                  Turn proven time audits, vision planning, and daily execution frameworks into one simple app that keeps you on track, even when motivation fades.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                  <Button
                    size="lg"
                    className="btn-lift gap-2 font-semibold text-base px-10 py-6 text-lg"
                    onClick={handleGetAccess}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Start Your 2026 Goal System
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </Button>
                  <Link href="#walkthrough">
                    <Button size="lg" variant="outline" className="gap-2 font-semibold text-base px-8 py-6 group">
                      <Play className="h-5 w-5 group-hover:scale-110 transition-transform" />
                      Watch Walkthrough
                    </Button>
                  </Link>
                </div>

                <p className="text-sm text-muted-foreground mb-10">
                  Founding Member access, backed by a 30-day money-back guarantee.
                </p>

                {/* Credibility strip */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 md:gap-10">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">Time audit & energy management</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Target className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">Vision to daily actions</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">Accountability & tracking</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* 3 Quick Benefits */}
        <section className="py-16 px-4 bg-muted/30 border-y">
          <div className="container max-w-4xl">
            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              <ScrollReveal animation="fade-up" delay={0}>
                <div className="flex flex-col items-center text-center">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-5 shadow-lg shadow-primary/20">
                    <CheckCircle2 className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">Get clear on what you want</h3>
                  <p className="text-muted-foreground">Turn it into 1-3 concrete, measurable goals for 2026.</p>
                </div>
              </ScrollReveal>
              <ScrollReveal animation="fade-up" delay={100}>
                <div className="flex flex-col items-center text-center">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-5 shadow-lg shadow-primary/20">
                    <CheckCircle2 className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">Audit and redesign your time</h3>
                  <p className="text-muted-foreground">So your calendar finally matches your priorities.</p>
                </div>
              </ScrollReveal>
              <ScrollReveal animation="fade-up" delay={200}>
                <div className="flex flex-col items-center text-center">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-5 shadow-lg shadow-primary/20">
                    <CheckCircle2 className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">Install daily systems</h3>
                  <p className="text-muted-foreground">Progress happens automatically, not just on &ldquo;good&rdquo; days.</p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* What You Get Section */}
        <section className="py-24 px-4">
          <div className="container max-w-5xl">
            <ScrollReveal>
              <div className="flex flex-col items-center text-center mb-16">
                <Badge className="mb-5 bg-primary/10 text-primary border-0 px-4 py-1.5">What You Get</Badge>
                <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                  Inside Goal Achiever Pro
                </h2>
                <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed">
                  Goal Achiever Pro isn&apos;t another to-do app. It&apos;s a complete goal execution system that walks you from &ldquo;no clear plan&rdquo; to &ldquo;I know exactly what to do today&rdquo; and keeps you there.
                </p>
              </div>
            </ScrollReveal>

            {/* Core System */}
            <div className="mb-20">
              <ScrollReveal>
                <div className="flex justify-center mb-10">
                  <span className="px-6 py-3 bg-primary/10 rounded-full font-display text-lg font-semibold">
                    Core Goal Achiever System
                  </span>
                </div>
              </ScrollReveal>

              <div className="grid md:grid-cols-2 gap-8">
                {coreFeatures.map((feature, index) => (
                  <ScrollReveal key={feature.title} animation="fade-up" delay={index * 75}>
                    <Card className="h-full border-2 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                      <CardContent className="p-8">
                        <div className="flex flex-col items-center text-center">
                          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6">
                            <feature.icon className="h-8 w-8 text-primary" />
                          </div>
                          <h4 className="font-display font-bold text-xl mb-3">{feature.title}</h4>
                          <p className="text-muted-foreground mb-5">{feature.description}</p>
                          <ul className="space-y-3 w-full">
                            {feature.items.map((item, i) => (
                              <li key={i} className="flex items-center gap-3 text-sm">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                                <span className="text-left">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                ))}
              </div>
            </div>

            {/* Bonuses */}
            <div>
              <ScrollReveal>
                <div className="flex justify-center mb-10">
                  <span className="px-6 py-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full font-display text-lg font-semibold inline-flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Founding Member Bonuses
                  </span>
                </div>
              </ScrollReveal>

              <div className="grid md:grid-cols-3 gap-6">
                {bonuses.map((bonus, index) => (
                  <ScrollReveal key={bonus.title} animation="fade-up" delay={index * 75}>
                    <Card className="h-full border-2 border-amber-500/20 bg-gradient-to-b from-amber-50/50 to-transparent dark:from-amber-950/20 dark:to-transparent hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center">
                          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center mb-5">
                            <bonus.icon className="h-7 w-7 text-amber-600 dark:text-amber-400" />
                          </div>
                          <h4 className="font-display font-bold text-lg mb-3">{bonus.title}</h4>
                          <p className="text-sm text-muted-foreground mb-4">{bonus.description}</p>
                          <ul className="space-y-2 w-full">
                            {bonus.items.map((item, i) => (
                              <li key={i} className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                <span className="text-left">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Pricing & Guarantee Block */}
        <section className="py-24 px-4 bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />

          {/* Decorative elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />

          <ScrollReveal animation="fade-up">
            <div className="container max-w-2xl relative flex flex-col items-center text-center">
              <Badge className="mb-8 bg-white/20 text-white border-0 px-5 py-2">
                <Sparkles className="h-4 w-4 mr-2" />
                Limited Founding Member Spots
              </Badge>

              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                Founding Member 2026 Access
              </h2>

              <div className="mb-8">
                <div className="flex items-baseline justify-center gap-3">
                  <span className="font-display text-7xl md:text-8xl font-bold">$99</span>
                  <span className="text-xl text-primary-foreground/70">one-time</span>
                </div>
                <p className="text-primary-foreground/80 mt-3 text-lg">
                  All features and updates through <strong>December 31, 2026</strong>
                </p>
              </div>

              <Button
                size="lg"
                variant="secondary"
                className="btn-lift gap-2 font-semibold text-lg px-10 py-6 mb-10"
                onClick={handleGetAccess}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Get Founding Member Access
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>

              {/* Guarantee */}
              <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-sm max-w-xl w-full">
                <div className="flex flex-col items-center gap-4 mb-4">
                  <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center">
                    <Shield className="h-7 w-7" />
                  </div>
                  <span className="font-display font-bold text-xl">30-Day Money-Back Guarantee</span>
                </div>
                <p className="text-primary-foreground/80 leading-relaxed">
                  Try Goal Achiever Pro for 30 days. If you don&apos;t feel at least 2x clearer on your goals and more in control of your week, email us and we&apos;ll refund you in full. No questions asked.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* FAQ Section */}
        <section className="py-24 px-4">
          <div className="container max-w-2xl">
            <ScrollReveal>
              <div className="flex flex-col items-center text-center mb-12">
                <Badge className="mb-5" variant="outline">FAQ</Badge>
                <h2 className="font-display text-3xl md:text-4xl font-bold">
                  Frequently Asked Questions
                </h2>
              </div>
            </ScrollReveal>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <ScrollReveal key={index} animation="fade-up" delay={index * 50}>
                  <Card className="border-2 overflow-hidden">
                    <button
                      className="w-full p-6 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    >
                      <h3 className="font-display font-semibold text-left">{faq.q}</h3>
                      <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${openFaq === index ? 'rotate-180' : ''}`} />
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ${openFaq === index ? 'max-h-48' : 'max-h-0'}`}>
                      <div className="px-6 pb-6 pt-0">
                        <p className="text-muted-foreground leading-relaxed text-center">{faq.a}</p>
                      </div>
                    </div>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 bg-muted/30 border-t">
          <div className="container max-w-2xl">
            <ScrollReveal animation="fade-up">
              <div className="flex flex-col items-center text-center">
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-6 w-6 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-5">
                  Ready to Make 2026 Your Year?
                </h2>
                <p className="text-muted-foreground text-lg mb-8 max-w-lg">
                  Join as a Founding Member and get the complete system to achieve your goals.
                </p>
                <Button
                  size="lg"
                  className="btn-lift gap-2 font-semibold text-lg px-10 py-6"
                  onClick={handleGetAccess}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Get Founding Member Access - $99
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </Button>
                <p className="text-sm text-muted-foreground mt-6">
                  One-time payment. 30-day money-back guarantee.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="container px-4 flex flex-col items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Target className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold">Goal Achiever Pro</span>
          </div>
          <nav className="flex gap-8 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          </nav>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Goal Achiever Pro. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
