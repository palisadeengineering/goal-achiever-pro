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
  Clock,
  BarChart3,
  Timer,
  Users,
  FileText,
  Gift,
  Shield,
  Zap,
  Loader2,
  ChevronDown,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Lock,
  CreditCard,
  Mail,
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
    if (!user) {
      router.push(`${ROUTES.signup}?redirect=/offer&product=founding-member`);
      return;
    }

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

  const valueStack = [
    {
      title: 'The 48-Hour Time Audit System',
      value: 2000,
      description: '15-minute block tracking, energy tagging, automatic DRIP matrix categorization, and clear reports showing exactly where your money leaks are.',
      anchor: 'What a coach charges to walk you through your first time audit',
    },
    {
      title: 'The Clarity-to-Revenue Goal System',
      value: 1500,
      description: 'Vision → Power Goals → Monthly → Weekly → Daily breakdown. 12 annual "Power Projects" aligned to revenue outcomes with AI-assisted goal refinement.',
      anchor: 'What a strategist charges for annual planning',
    },
    {
      title: 'The Daily Execution Engine',
      value: 1500,
      description: 'MINs (Most Important Next Steps) tied directly to your goals. 90-minute attack planner, morning/evening routines, and built-in focus timer.',
      anchor: 'What a productivity coach charges for 3 months of accountability',
    },
    {
      title: 'The Delegation & Leverage Playbook',
      value: 1000,
      description: '10/80/10 delegation templates, 4 C\'s tracking (Code, Content, Capital, Collaboration), and task replacement workflows.',
      anchor: 'What operators charge to audit your delegation gaps',
    },
  ];

  const bonuses = [
    {
      icon: Users,
      title: 'Network Audit Toolkit',
      value: 500,
      description: 'The 4-question framework to evaluate every relationship in your business life. Know who\'s lifting you up and who\'s dragging you down.',
    },
    {
      icon: FileText,
      title: 'Accountability Contract Generator',
      value: 500,
      description: 'Auto-generated "Goal Achievement Contracts" with financial and social stakes built in. Make your goals non-negotiable.',
    },
    {
      icon: Zap,
      title: 'Lifetime Updates Through 2026',
      value: 997,
      description: 'Every new feature, template, and improvement we ship—included at no extra cost.',
    },
  ];

  const totalValue = valueStack.reduce((acc, item) => acc + item.value, 0) + bonuses.reduce((acc, item) => acc + item.value, 0);

  const faqs = [
    {
      q: "I don't have time to learn another tool.",
      a: "Good—you shouldn't have to. Goal Achiever Pro isn't a complex system you need to \"learn.\" It's a guided workflow. Open it, follow the prompts, get clarity. Your first time audit takes 15 minutes to set up, then you just log as you go. Most users complete their first full audit in 48 hours of real time—not 48 hours of work.",
    },
    {
      q: 'How is this different from Notion templates or Asana?',
      a: "Those are blank canvases. They don't tell you what to do—they just give you a place to put things. You still have to figure out how to run a time audit, how to categorize tasks into the DRIP matrix, how to connect it all to your goals. Goal Achiever Pro is the implementation layer. It guides you through the Buy Back Your Time methodology step by step. You're not building a system—you're following one.",
    },
    {
      q: "I already have a coach / I'm in a mastermind.",
      a: "Perfect—this will make that investment work harder. Coaches give you insight. Masterminds give you accountability. But what happens between calls? Goal Achiever Pro is the execution system that captures the work in between. It's the reason your next coaching call starts with \"I actually did the thing\" instead of \"I meant to, but...\"",
    },
    {
      q: "What if I've already tried time tracking and quit?",
      a: "You quit because tracking alone is pointless. Knowing you spent 3 hours on email doesn't change anything. Goal Achiever Pro ties every time block to the DRIP matrix and your revenue goals. You're not just tracking—you're getting immediate feedback on whether that hour was a $20 task or a $1,000 task. That feedback loop is what makes it stick.",
    },
    {
      q: 'What happens after I pay?',
      a: "Instant access. You'll get login credentials immediately and can start your time audit today. No waiting, no drip-fed content, no \"module 1 unlocks next week.\" The full system is available from day one.",
    },
    {
      q: 'Is this a subscription?',
      a: "$397 is a one-time payment for Founding Member access through December 31, 2026. Every feature, every update, every improvement we ship during that time—included. After 2026, Founding Members get preferred pricing on whatever comes next.",
    },
  ];

  const CTAButton = ({ variant = 'default', className = '' }: { variant?: 'default' | 'secondary'; className?: string }) => (
    <Button
      size="lg"
      variant={variant}
      className={`btn-lift gap-2 font-semibold text-base px-8 ${className}`}
      onClick={handleGetAccess}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          Get Founding Member Access
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </Button>
  );

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
        {/* ==================== SECTION 1: HERO ==================== */}
        <section className="relative py-16 md:py-24 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-dot-pattern opacity-50" />
          <div className="absolute inset-0 bg-hero-gradient" />

          <div className="container max-w-4xl relative">
            <ScrollReveal animation="fade-up">
              <div className="text-center">
                <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 px-4 py-1.5">
                  <Target className="h-3.5 w-3.5 mr-1.5" />
                  For Entrepreneurs Who Read &ldquo;Buy Back Your Time&rdquo;
                </Badge>

                <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
                  You Read Buy Back Your Time.
                  <br />
                  <span className="text-gradient-primary">But You Never Actually Did The Time Audit.</span>
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
                  You know the DRIP matrix. You know you should audit your time. You know scattered focus is costing you revenue. But the book is collecting dust and you&apos;re still doing <span className="text-foreground font-medium">$20/hour tasks</span> instead of <span className="text-foreground font-medium">$1,000/hour work</span>.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
                  <CTAButton />
                </div>

                <p className="text-sm text-muted-foreground mb-8">
                  <span className="font-semibold text-foreground">$397 one-time</span> &middot; Get clarity on your #1 revenue lever in 14 days or full refund
                </p>

                {/* Credibility strip */}
                <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Built on Dan Martell&apos;s methodology</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Complete your first time audit in 48 hours</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* ==================== SECTION 2: COST OF INACTION ==================== */}
        <section className="py-16 md:py-20 px-4 bg-muted/30 border-y">
          <div className="container max-w-4xl">
            <ScrollReveal>
              <div className="text-center mb-12">
                <Badge variant="outline" className="mb-4 border-destructive/30 text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                  The Real Cost of &ldquo;I&apos;ll Do It Later&rdquo;
                </Badge>
              </div>
            </ScrollReveal>

            <div className="space-y-6 mb-10">
              <ScrollReveal animation="fade-up" delay={0}>
                <div className="flex gap-4 items-start">
                  <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">10+ hours/week on tasks you should have delegated months ago</h3>
                    <p className="text-muted-foreground">That&apos;s 500+ hours a year doing $20/hour work instead of $1,000/hour work.</p>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal animation="fade-up" delay={100}>
                <div className="flex gap-4 items-start">
                  <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Revenue goals stuck at the same plateau</h3>
                    <p className="text-muted-foreground">Not because you&apos;re not working hard enough. Because you&apos;re working on the wrong things.</p>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal animation="fade-up" delay={200}>
                <div className="flex gap-4 items-start">
                  <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <Target className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">The guilt of knowing exactly what you should do... and not doing it</h3>
                    <p className="text-muted-foreground">You&apos;ve got the book. You&apos;ve watched the videos. The framework makes perfect sense. But life keeps getting in the way.</p>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            <ScrollReveal animation="fade-up" delay={300}>
              <Card className="border-2 border-muted-foreground/20 bg-muted/50">
                <CardContent className="pt-6 pb-6">
                  <p className="text-lg italic text-center text-muted-foreground">
                    &ldquo;I read Buy Back Your Time 18 months ago. Said I&apos;d do the time audit &apos;next quarter.&apos; That was 6 quarters ago.&rdquo;
                  </p>
                  <p className="text-center text-sm text-muted-foreground mt-3">— Sound familiar?</p>
                </CardContent>
              </Card>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={400}>
              <p className="text-center text-lg mt-10 text-foreground">
                The problem isn&apos;t knowledge. <span className="font-semibold">You already know what to do.</span>
                <br />
                The problem is you don&apos;t have a system that forces you to actually do it.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* ==================== SECTION 3: THE SOLUTION ==================== */}
        <section className="py-16 md:py-20 px-4">
          <div className="container max-w-4xl">
            <ScrollReveal>
              <div className="text-center mb-12">
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                  Introducing Goal Achiever Pro
                </h2>
                <p className="text-xl text-muted-foreground">
                  The Implementation System That Buy Back Your Time Was Missing
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-up">
              <div className="prose prose-lg dark:prose-invert max-w-none text-center mb-12">
                <p className="text-muted-foreground">
                  Dan Martell gave you the methodology. The DRIP matrix. The time audit framework. The concept of $1,000/hour work.
                </p>
                <p className="text-muted-foreground">
                  But he didn&apos;t give you a system to actually implement it week after week.
                </p>
                <p className="text-foreground font-semibold text-xl">
                  Goal Achiever Pro is that system.
                </p>
              </div>
            </ScrollReveal>

            {/* Three Pillars */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <ScrollReveal animation="fade-up" delay={0}>
                <Card className="h-full border-2 text-center">
                  <CardContent className="pt-8 pb-8">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Clock className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-display text-xl font-bold mb-2">1. Audit</h3>
                    <p className="text-muted-foreground">
                      Complete your first time audit in 48 hours. See exactly where your hours go and which ones are costing you money.
                    </p>
                  </CardContent>
                </Card>
              </ScrollReveal>

              <ScrollReveal animation="fade-up" delay={100}>
                <Card className="h-full border-2 text-center">
                  <CardContent className="pt-8 pb-8">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-display text-xl font-bold mb-2">2. Align</h3>
                    <p className="text-muted-foreground">
                      Map your time to the DRIP matrix. Identify what to Delegate, Replace, Invest in, and Produce.
                    </p>
                  </CardContent>
                </Card>
              </ScrollReveal>

              <ScrollReveal animation="fade-up" delay={200}>
                <Card className="h-full border-2 text-center">
                  <CardContent className="pt-8 pb-8">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Timer className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-display text-xl font-bold mb-2">3. Execute</h3>
                    <p className="text-muted-foreground">
                      Turn clarity into daily action. Know exactly what to work on today to hit your revenue goals.
                    </p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            </div>

            <ScrollReveal animation="fade-up" delay={300}>
              <p className="text-center text-lg text-muted-foreground">
                This isn&apos;t theory. It&apos;s the implementation layer that takes Buy Back Your Time off your shelf and into your calendar.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* ==================== SECTION 4: VALUE STACK ==================== */}
        <section className="py-16 md:py-20 px-4 bg-muted/30 border-y">
          <div className="container max-w-5xl">
            <ScrollReveal>
              <div className="text-center mb-6">
                <Badge className="mb-4 bg-primary/10 text-primary border-0">What You Get</Badge>
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                  Everything Inside Goal Achiever Pro
                </h2>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-up">
              <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
                If you hired a coach to walk you through this implementation, you&apos;d pay <span className="text-foreground font-semibold">$5,000–$15,000</span>. Here&apos;s what&apos;s included:
              </p>
            </ScrollReveal>

            {/* Core System */}
            <div className="space-y-6 mb-12">
              {valueStack.map((item, index) => (
                <ScrollReveal key={item.title} animation="fade-up" delay={index * 75}>
                  <Card className="border-2">
                    <CardContent className="pt-6 pb-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-display font-bold text-lg">{item.title}</h3>
                            <Badge variant="secondary" className="font-mono">${item.value.toLocaleString()} value</Badge>
                          </div>
                          <p className="text-muted-foreground mb-2">{item.description}</p>
                          <p className="text-sm text-muted-foreground italic">{item.anchor}: ${item.value.toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>

            {/* Bonuses */}
            <ScrollReveal>
              <h3 className="font-display text-xl font-semibold mb-6 text-center">
                <span className="px-4 py-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full">
                  <Gift className="h-4 w-4 inline mr-2" />
                  Founding Member Bonuses
                </span>
              </h3>
            </ScrollReveal>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {bonuses.map((bonus, index) => (
                <ScrollReveal key={bonus.title} animation="fade-up" delay={index * 75}>
                  <Card className="h-full border-2 border-amber-500/20 bg-amber-50/30 dark:bg-amber-950/10">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                          <bonus.icon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <Badge variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-400 font-mono">
                          ${bonus.value} value
                        </Badge>
                      </div>
                      <h4 className="font-display font-semibold mb-2">{bonus.title}</h4>
                      <p className="text-sm text-muted-foreground">{bonus.description}</p>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>

            {/* Value Summary */}
            <ScrollReveal animation="fade-up">
              <Card className="border-2 border-primary/30 bg-primary/5">
                <CardContent className="pt-6 pb-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="font-display font-bold text-xl mb-1">Total Value</h3>
                      <p className="text-muted-foreground">Everything listed above</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-4xl font-bold text-primary">${totalValue.toLocaleString()}+</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </section>

        {/* ==================== SECTION 5: PRICING & GUARANTEE ==================== */}
        <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-primary to-primary/90 text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />

          <div className="container max-w-3xl relative">
            <ScrollReveal animation="fade-up">
              <div className="text-center mb-10">
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">Your Investment</h2>

                {/* Price Anchors */}
                <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm mb-8 text-left">
                  <p className="font-semibold mb-4 text-center">What entrepreneurs typically pay for this level of implementation support:</p>
                  <div className="space-y-2 max-w-md mx-auto">
                    <div className="flex justify-between">
                      <span className="text-primary-foreground/80">One-on-one productivity coach</span>
                      <span className="font-semibold">$5,000–$15,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-primary-foreground/80">Mastermind with accountability</span>
                      <span className="font-semibold">$10,000–$25,000/yr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-primary-foreground/80">Executive assistant for systems</span>
                      <span className="font-semibold">$50,000+/yr</span>
                    </div>
                  </div>
                </div>

                {/* Price Reveal */}
                <div className="mb-6">
                  <p className="text-primary-foreground/70 mb-2">Goal Achiever Pro Founding Member Access</p>
                  <div className="flex items-baseline justify-center gap-3">
                    <span className="text-2xl text-primary-foreground/50 line-through">${totalValue.toLocaleString()} value</span>
                    <span className="font-display text-6xl md:text-7xl font-bold">$397</span>
                  </div>
                  <p className="text-primary-foreground/80 mt-2">
                    One-time payment &middot; Less than what you&apos;d pay a coach for a single session
                  </p>
                </div>

                <CTAButton variant="secondary" className="mb-4" />

                <p className="text-sm text-primary-foreground/70 mb-10">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  Founding Member pricing ends at 500 members. After that, it&apos;s $997/year.
                </p>
              </div>
            </ScrollReveal>

            {/* Guarantee */}
            <ScrollReveal animation="fade-up" delay={100}>
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Shield className="h-8 w-8" />
                    <h3 className="font-display font-bold text-2xl">The &ldquo;Clarity In 14 Days&rdquo; Guarantee</h3>
                  </div>
                  <div className="text-primary-foreground/90 space-y-4 max-w-2xl mx-auto">
                    <p>Here&apos;s the deal:</p>
                    <p>Complete your first time audit inside Goal Achiever Pro. Follow the system for 14 days.</p>
                    <p>If you don&apos;t have crystal-clear visibility into:</p>
                    <ul className="space-y-1 ml-4">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-300 mt-0.5 flex-shrink-0" />
                        <span>Where your time is actually going</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-300 mt-0.5 flex-shrink-0" />
                        <span>Which tasks are costing you revenue</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-300 mt-0.5 flex-shrink-0" />
                        <span>Exactly what you should be working on today</span>
                      </li>
                    </ul>
                    <p>...email us and we&apos;ll refund every penny. <span className="font-semibold">No questions. No hoops.</span></p>
                    <p className="text-sm text-primary-foreground/70 italic">
                      This guarantee exists because the system works. We&apos;re not selling motivation—we&apos;re selling implementation.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>
          </div>
        </section>

        {/* ==================== SECTION 6: FAQ ==================== */}
        <section className="py-16 md:py-20 px-4">
          <div className="container max-w-2xl">
            <ScrollReveal>
              <div className="text-center mb-10">
                <Badge variant="outline" className="mb-4">Common Questions</Badge>
                <h2 className="font-display text-2xl md:text-3xl font-bold">
                  Frequently Asked Questions
                </h2>
              </div>
            </ScrollReveal>

            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <ScrollReveal key={index} animation="fade-up" delay={index * 50}>
                  <Card className="border-2">
                    <button
                      className="w-full text-left p-5 flex items-center justify-between gap-4"
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    >
                      <h3 className="font-display font-semibold">{faq.q}</h3>
                      <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform flex-shrink-0 ${openFaq === index ? 'rotate-180' : ''}`} />
                    </button>
                    {openFaq === index && (
                      <div className="px-5 pb-5 pt-0">
                        <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
                      </div>
                    )}
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== SECTION 7: FINAL CTA ==================== */}
        <section className="py-16 md:py-20 px-4 bg-muted/30 border-t">
          <div className="container max-w-3xl">
            <ScrollReveal animation="fade-up">
              <div className="text-center mb-10">
                <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">
                  You Already Know What To Do. Now Do It.
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  You read the book. You understand the framework. You know that auditing your time, categorizing by the DRIP matrix, and focusing on $1,000/hour work is the path to scaling revenue without scaling stress.
                </p>
                <p className="text-lg text-foreground font-medium mt-4">
                  The only thing standing between you and results is implementation.
                </p>
                <p className="text-xl font-semibold text-primary mt-4">
                  Stop letting a $15 book collect dust while it costs you $15,000 in lost focus.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={100}>
              <Card className="border-2 mb-8">
                <CardContent className="pt-6 pb-6">
                  <h3 className="font-display font-bold text-xl mb-4 text-center">Goal Achiever Pro — Founding Member Access</h3>
                  <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 mb-6 max-w-lg mx-auto">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>48-Hour Time Audit System</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>DRIP Matrix Categorization</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>Clarity-to-Revenue Goal System</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>Daily Execution Engine</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>Delegation & Leverage Playbook</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>Network Audit Toolkit</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>Accountability Contracts</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span>All updates through Dec 2026</span>
                    </div>
                  </div>
                  <div className="text-center mb-4">
                    <p className="text-sm text-muted-foreground line-through">${totalValue.toLocaleString()}+ value</p>
                    <p className="font-display text-4xl font-bold">$397 <span className="text-base font-normal text-muted-foreground">one-time</span></p>
                  </div>
                  <div className="flex justify-center mb-4">
                    <CTAButton />
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span>14-Day Clarity Guarantee — See results or get a full refund</span>
                  </div>
                </CardContent>
              </Card>
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={200}>
              <p className="text-center text-sm text-muted-foreground mb-6">
                Founding Member pricing closes at 500 members. After that, it&apos;s $997/year.
              </p>
              <p className="text-center text-lg font-medium text-muted-foreground italic">
                The entrepreneurs who win aren&apos;t the ones who read the most books.
                <br />
                <span className="text-foreground">They&apos;re the ones who implement.</span>
              </p>
            </ScrollReveal>
          </div>
        </section>
      </main>

      {/* ==================== FOOTER ==================== */}
      <footer className="border-t py-8">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center md:items-start gap-1">
              <div className="flex items-center gap-2.5">
                <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
                  <Target className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <span className="font-display font-semibold text-sm">Goal Achiever Pro</span>
              </div>
              <p className="text-xs text-muted-foreground">The implementation system for Buy Back Your Time.</p>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span>Secure payments via Stripe</span>
            </div>

            <nav className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            </nav>
          </div>
          <div className="mt-6 pt-6 border-t text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Goal Achiever Pro. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
