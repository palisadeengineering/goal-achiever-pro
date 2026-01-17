import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  Target,
  Calendar,
  Grid3X3,
  Timer,
  TrendingUp,
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowUp,
  Sparkles,
  Zap,
  Brain,
  Trophy,
  Play,
  Mail,
  Star,
  DollarSign,
  Lightbulb,
  RefreshCw,
  Rocket,
  UserCheck,
  TrendingUp as GrowthIcon,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';

const features = [
  {
    icon: Target,
    title: 'Vision & SMART Goals',
    description: 'Define your north star with the SMART framework and track your 300% Rule.',
    href: ROUTES.vision,
    accentColor: 'from-emerald-500/20 to-teal-500/10',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-600',
  },
  {
    icon: Trophy,
    title: '12 Power Goals',
    description: 'Break your vision into 12 annual projects. Focus on the one with the biggest impact.',
    href: ROUTES.goals,
    accentColor: 'from-amber-500/20 to-orange-500/10',
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-600',
  },
  {
    icon: Calendar,
    title: 'Time & Energy Audit',
    description: 'Track your time in 15-minute blocks. Rate your energy. See where your hours go.',
    href: ROUTES.timeAudit,
    accentColor: 'from-blue-500/20 to-indigo-500/10',
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-600',
  },
  {
    icon: Grid3X3,
    title: 'DRIP Matrix',
    description: 'Categorize activities by money potential and energy. Focus on Production.',
    href: ROUTES.drip,
    accentColor: 'from-violet-500/20 to-purple-500/10',
    iconBg: 'bg-violet-500/10',
    iconColor: 'text-violet-600',
  },
  {
    icon: Timer,
    title: 'Pomodoro & Routines',
    description: '25-minute focused sprints. Morning and evening routines that work.',
    href: ROUTES.routines,
    accentColor: 'from-rose-500/20 to-pink-500/10',
    iconBg: 'bg-rose-500/10',
    iconColor: 'text-rose-600',
  },
  {
    icon: Users,
    title: 'Network & Leverage',
    description: 'Use the 4 C\'s to multiply your impact: Code, Content, Capital, Collaboration.',
    href: ROUTES.leverage,
    accentColor: 'from-cyan-500/20 to-sky-500/10',
    iconBg: 'bg-cyan-500/10',
    iconColor: 'text-cyan-600',
  },
];

const steps = [
  {
    number: '01',
    title: 'Define Direction',
    description: 'Set your vision, 12 power goals, and identify your most important next steps.',
    icon: Target,
  },
  {
    number: '02',
    title: 'Audit Your Time',
    description: 'Track how you spend your time and energy. Identify what to delegate or automate.',
    icon: Calendar,
  },
  {
    number: '03',
    title: 'Create Daily Systems',
    description: 'Build morning routines, use Pomodoro sprints, and review progress 3x daily.',
    icon: Brain,
  },
  {
    number: '04',
    title: 'Create Leverage',
    description: 'Use the 4 C\'s to multiply your output and work smarter, not harder.',
    icon: Zap,
  },
  {
    number: '05',
    title: 'Curate Your Network',
    description: 'Spend time with people who elevate you. Set boundaries with the rest.',
    icon: Users,
  },
  {
    number: '06',
    title: 'Stay on Track',
    description: 'Track your north star metric, use weekly scorecards, find accountability.',
    icon: TrendingUp,
  },
];

const howItWorksSteps = [
  { number: 1, title: 'Set Your Vision', desc: 'Define goals & break into 12 projects' },
  { number: 2, title: 'Audit Your Time', desc: 'Track hours & categorize with DRIP' },
  { number: 3, title: 'Build Systems', desc: 'Create routines & Pomodoro sprints' },
  { number: 4, title: 'Achieve Goals', desc: 'Track progress & celebrate wins', isHighlight: true },
];

const testimonials = [
  {
    quote: 'This system completely transformed how I approach my goals. The DRIP matrix helped me focus on what truly matters.',
    author: 'Sarah K.',
    role: 'Startup Founder',
    initials: 'SK',
    gradient: 'from-emerald-400 to-emerald-600',
  },
  {
    quote: "I've tried dozens of productivity apps. This is the first one that actually helped me stick to my goals long-term.",
    author: 'Michael R.',
    role: 'Business Coach',
    initials: 'MR',
    gradient: 'from-blue-400 to-blue-600',
  },
  {
    quote: 'The time audit feature alone saved me 10+ hours per week. Now I focus only on high-impact activities.',
    author: 'Jennifer T.',
    role: 'Agency Owner',
    initials: 'JT',
    gradient: 'from-violet-400 to-violet-600',
  },
];

function StarRating() {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
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
            <Link href={ROUTES.pricing} className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Pricing
            </Link>
            <ThemeToggle />
            <Link href={ROUTES.login}>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Sign in
              </Button>
            </Link>
            <Link href={ROUTES.offer}>
              <Button size="sm" className="btn-lift font-semibold">
                Get Access
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 px-4 overflow-hidden">
          {/* Background patterns */}
          <div className="absolute inset-0 bg-dot-pattern opacity-50" />
          <div className="absolute inset-0 bg-hero-gradient" />

          <div className="container max-w-6xl relative">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left: Content */}
              <div className="text-center lg:text-left">
                <ScrollReveal animation="fade-up">
                  <Badge
                    className="mb-6 bg-primary/10 text-primary hover:bg-primary/15 border-0 px-4 py-1.5"
                    variant="secondary"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Based on Dan Martell&apos;s Framework
                  </Badge>
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={100}>
                  <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
                    Achieve Your{' '}
                    <span className="underline-scribble text-gradient-primary">Goals</span>
                    <br className="hidden sm:block" />
                    <span className="sm:hidden"> </span>
                    in 2026
                  </h1>
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={200}>
                  <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                    Picture December 31st, 2026. You finally stuck to your goals.
                    Your income is higher than ever. You&apos;re in the best shape of your life.
                    <strong className="text-foreground font-semibold"> Make it happen.</strong>
                  </p>
                </ScrollReveal>

                <ScrollReveal animation="fade-up" delay={300}>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                    <Link href={ROUTES.offer}>
                      <Button size="lg" className="btn-lift gap-2 font-semibold text-base px-8 w-full sm:w-auto">
                        Get Founding Member Access <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="#how-it-works">
                      <Button size="lg" variant="outline" className="gap-2 font-semibold text-base w-full sm:w-auto group">
                        <Play className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        See How It Works
                      </Button>
                    </Link>
                  </div>
                </ScrollReveal>

                {/* Trust Badges */}
                <ScrollReveal animation="fade-up" delay={400}>
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mt-10">
                    <div className="trust-badge">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Free to start</span>
                    </div>
                    <div className="trust-badge">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>No credit card</span>
                    </div>
                    <div className="trust-badge">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>Cancel anytime</span>
                    </div>
                  </div>
                </ScrollReveal>
              </div>

              {/* Right: Visual/Stats */}
              {/* Mobile: Simplified stats row */}
              <ScrollReveal animation="fade-up" delay={450} className="lg:hidden">
                <div className="flex justify-center gap-6 pt-4">
                  <div className="text-center">
                    <p className="font-display font-bold text-2xl number-display text-primary">
                      <AnimatedCounter value={2340} suffix="+" duration={1500} />
                    </p>
                    <p className="text-xs text-muted-foreground">Active Users</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display font-bold text-2xl number-display text-primary">
                      <AnimatedCounter value={12847} duration={1500} delay={200} />
                    </p>
                    <p className="text-xs text-muted-foreground">Goals Achieved</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display font-bold text-2xl number-display text-primary">
                      <AnimatedCounter value={95} suffix="%" duration={1500} delay={400} />
                    </p>
                    <p className="text-xs text-muted-foreground">Success Rate</p>
                  </div>
                </div>
              </ScrollReveal>

              {/* Desktop: Full visual card */}
              <ScrollReveal animation="fade-in" delay={300} className="hidden lg:block">
                <div className="relative">
                  {/* Floating stats cards */}
                  <div className="absolute -top-4 -left-4 animate-float z-10">
                    <Card className="shadow-lg border-2">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Goals Achieved</p>
                          <p className="font-display font-bold text-xl number-display">
                            <AnimatedCounter value={12847} duration={2000} />
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="absolute -bottom-4 -right-4 animate-float delay-200 z-10">
                    <Card className="shadow-lg border-2">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Active Users</p>
                          <p className="font-display font-bold text-xl number-display">
                            <AnimatedCounter value={2340} suffix="+" duration={2000} delay={200} />
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Main visual card */}
                  <Card className="shadow-2xl border-2 overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-primary via-blue-500 to-violet-500" />
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-display font-bold text-lg">Your Progress</span>
                          <Badge variant="secondary" className="bg-primary/10 text-primary">On Track</Badge>
                        </div>

                        {/* Progress bars */}
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1.5">
                              <span className="text-muted-foreground">Vision Clarity</span>
                              <span className="font-semibold number-display">92%</span>
                            </div>
                            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full w-[92%] bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full animate-progress-fill" style={{ animationDelay: '0.5s' }} />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1.5">
                              <span className="text-muted-foreground">Time Optimized</span>
                              <span className="font-semibold number-display">78%</span>
                            </div>
                            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full w-[78%] bg-gradient-to-r from-blue-500 to-blue-400 rounded-full animate-progress-fill" style={{ animationDelay: '0.7s' }} />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1.5">
                              <span className="text-muted-foreground">Weekly Goals</span>
                              <span className="font-semibold number-display">85%</span>
                            </div>
                            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full w-[85%] bg-gradient-to-r from-violet-500 to-violet-400 rounded-full animate-progress-fill" style={{ animationDelay: '0.9s' }} />
                            </div>
                          </div>
                        </div>

                        {/* Quick stats */}
                        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                          <div className="text-center">
                            <p className="font-display font-bold text-2xl number-display text-primary">8</p>
                            <p className="text-xs text-muted-foreground">Goals Set</p>
                          </div>
                          <div className="text-center">
                            <p className="font-display font-bold text-2xl number-display text-emerald-600 dark:text-emerald-400">5</p>
                            <p className="text-xs text-muted-foreground">Completed</p>
                          </div>
                          <div className="text-center">
                            <p className="font-display font-bold text-2xl number-display text-blue-600 dark:text-blue-400">12h</p>
                            <p className="text-xs text-muted-foreground">Saved/Week</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 px-4 border-t bg-muted/30">
          <div className="container max-w-5xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-14">
                <Badge className="mb-4 bg-primary/10 text-primary border-0">Simple Process</Badge>
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                  How It Works
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Four simple steps to transform your productivity
                </p>
              </div>
            </ScrollReveal>

            {/* Desktop Timeline */}
            <div className="hidden md:block">
              <div className="relative max-w-4xl mx-auto">
                {/* Connection line */}
                <div className="absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-primary/20 via-primary to-emerald-500 -translate-y-1/2" />

                <div className="grid grid-cols-4 gap-4 relative">
                  {howItWorksSteps.map((step, index) => (
                    <ScrollReveal key={step.number} animation="fade-up" delay={index * 100}>
                      <div className="relative group flex flex-col items-center">
                        <div className={`w-full h-full bg-background border-2 rounded-xl p-5 text-center hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1 ${
                          step.isHighlight
                            ? 'border-emerald-400 dark:border-emerald-600 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/50 shadow-md'
                            : 'border-primary/20 hover:border-primary/50'
                        }`}>
                          <div className={`inline-flex items-center justify-center h-10 w-10 rounded-full text-sm font-bold mb-3 group-hover:scale-110 transition-transform ${
                            step.isHighlight
                              ? 'bg-emerald-600 text-white'
                              : 'bg-primary text-primary-foreground'
                          }`}>
                            {step.isHighlight ? <Trophy className="h-5 w-5" /> : step.number}
                          </div>
                          <h4 className={`font-display font-semibold mb-1.5 ${
                            step.isHighlight ? 'text-emerald-800 dark:text-emerald-200' : ''
                          }`}>{step.title}</h4>
                          <p className={`text-xs leading-relaxed ${
                            step.isHighlight ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground'
                          }`}>{step.desc}</p>
                        </div>
                        {index < howItWorksSteps.length - 1 && (
                          <ArrowRight className="absolute top-1/2 -right-2.5 h-5 w-5 text-primary -translate-y-1/2 z-10" />
                        )}
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Timeline */}
            <div className="md:hidden space-y-4">
              {howItWorksSteps.map((step, index) => (
                <ScrollReveal key={step.number} animation="slide-right" delay={index * 100}>
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-bold ${
                      step.isHighlight
                        ? 'bg-emerald-600 text-white'
                        : 'bg-primary text-primary-foreground'
                    }`}>
                      {step.isHighlight ? <Trophy className="h-5 w-5" /> : step.number}
                    </div>
                    <div className="pt-1">
                      <h4 className={`font-display font-semibold mb-0.5 ${
                        step.isHighlight ? 'text-emerald-800 dark:text-emerald-200' : ''
                      }`}>{step.title}</h4>
                      <p className={`text-sm ${
                        step.isHighlight ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground'
                      }`}>{step.desc}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4">
          <div className="container max-w-6xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-14">
                <Badge className="mb-4 bg-primary/10 text-primary border-0">Complete Toolkit</Badge>
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                  Everything You Need to Succeed
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  A complete system based on Dan Martell&apos;s proven goal achievement framework.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <ScrollReveal key={feature.title} animation="fade-up" delay={index * 75}>
                  <Link href={feature.href}>
                    <Card className="card-hover-lift border-2 cursor-pointer h-full group overflow-hidden">
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.accentColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                      <CardContent className="pt-6 relative">
                        <div className={`h-12 w-12 rounded-xl ${feature.iconBg} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                          <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                        </div>
                        <h3 className="font-display font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                        <div className="flex items-center gap-1 mt-4 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          Learn more <ArrowRight className="h-3.5 w-3.5" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="py-20 px-4 bg-muted/30 border-y">
          <div className="container max-w-5xl mx-auto">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
              <ScrollReveal animation="fade-up" delay={0}>
                <div className="text-center">
                  <p className="font-display font-bold text-4xl md:text-5xl number-display text-primary mb-2">
                    <AnimatedCounter value={2340} suffix="+" />
                  </p>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                </div>
              </ScrollReveal>
              <ScrollReveal animation="fade-up" delay={100}>
                <div className="text-center">
                  <p className="font-display font-bold text-4xl md:text-5xl number-display text-primary mb-2">
                    <AnimatedCounter value={12847} />
                  </p>
                  <p className="text-sm text-muted-foreground">Goals Achieved</p>
                </div>
              </ScrollReveal>
              <ScrollReveal animation="fade-up" delay={200}>
                <div className="text-center">
                  <p className="font-display font-bold text-4xl md:text-5xl number-display text-primary mb-2">
                    <AnimatedCounter value={95} suffix="%" />
                  </p>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                </div>
              </ScrollReveal>
              <ScrollReveal animation="fade-up" delay={300}>
                <div className="text-center">
                  <p className="font-display font-bold text-4xl md:text-5xl number-display text-primary mb-2">
                    <AnimatedCounter value={4.9} decimals={1} />
                  </p>
                  <p className="text-sm text-muted-foreground">User Rating</p>
                </div>
              </ScrollReveal>
            </div>

            {/* Testimonials */}
            <ScrollReveal>
              <div className="text-center mb-10">
                <Badge className="mb-4 bg-primary/10 text-primary border-0">What Users Say</Badge>
                <h2 className="font-display text-2xl md:text-3xl font-bold">
                  Trusted by Ambitious Entrepreneurs
                </h2>
              </div>
            </ScrollReveal>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <ScrollReveal key={testimonial.author} animation="fade-up" delay={index * 100}>
                  <Card className="border-2 hover:border-primary/30 transition-colors h-full">
                    <CardContent className="pt-6">
                      <StarRating />
                      <p className="text-sm text-muted-foreground my-4 leading-relaxed">
                        &ldquo;{testimonial.quote}&rdquo;
                      </p>
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white font-semibold text-sm`}>
                          {testimonial.initials}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{testimonial.author}</p>
                          <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* 6-Step Framework Section */}
        <section className="py-20 px-4">
          <div className="container max-w-6xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-14">
                <Badge className="mb-4" variant="outline">The 6-Step Framework</Badge>
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                  Your Blueprint for Success
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Follow this proven system to transform your goals from dreams into reality.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {steps.map((step, index) => (
                <ScrollReveal key={step.number} animation="fade-up" delay={index * 75}>
                  <div className="relative group">
                    <div className="font-display text-7xl font-bold text-primary/5 absolute -top-6 -left-2 group-hover:text-primary/10 transition-colors">
                      {step.number}
                    </div>
                    <div className="relative pt-8 pl-4">
                      <div className="h-11 w-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-lg">
                        <step.icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-display font-semibold text-lg mb-2">{step.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* DRIP Matrix Section */}
        <section className="py-24 px-4 bg-muted/30">
          <div className="container max-w-5xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-16">
                <Badge className="mb-4" variant="outline">The DRIP Matrix</Badge>
                <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
                  Know Where to Spend Your Time
                </h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  Categorize every activity by how much money it makes and how much it energizes you.
                </p>
              </div>
            </ScrollReveal>

            {/* Matrix with proper axes */}
            <div className="max-w-4xl mx-auto">
              <div className="flex">
                {/* Y-Axis */}
                <div className="flex flex-col items-center justify-center pr-4 md:pr-6">
                  <div className="flex flex-col items-center gap-2 mb-4">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <ArrowUp className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="writing-mode-vertical text-sm font-semibold text-muted-foreground tracking-wider" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                    MAKES YOU MONEY
                  </div>
                </div>

                {/* Main Grid */}
                <div className="flex-1">
                  <div className="grid grid-cols-2 border-2 border-border rounded-xl overflow-hidden">
                    {/* Top Left - Replacement */}
                    <ScrollReveal animation="fade-up" delay={0}>
                      <div className="border-r border-b border-border bg-amber-50/50 dark:bg-amber-950/20">
                        {/* Header Bar */}
                        <div className="bg-amber-400 dark:bg-amber-500 px-4 py-2 flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 text-amber-900" />
                          <span className="font-bold text-amber-900">Replacement</span>
                        </div>
                        {/* Content */}
                        <div className="p-4 md:p-5 min-h-[180px]">
                          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-3">High $ • Low Energy</p>
                          <ul className="space-y-1.5 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                              <span className="text-amber-500 mt-0.5">•</span>
                              <span>Repetitive client tasks</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-amber-500 mt-0.5">•</span>
                              <span>Administrative work</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-amber-500 mt-0.5">•</span>
                              <span>Data entry & reports</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-amber-500 mt-0.5">•</span>
                              <span>Email management</span>
                            </li>
                          </ul>
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 font-medium">→ Automate or systematize</p>
                        </div>
                      </div>
                    </ScrollReveal>

                    {/* Top Right - Production */}
                    <ScrollReveal animation="fade-up" delay={100}>
                      <div className="border-b border-border bg-emerald-50/50 dark:bg-emerald-950/20 relative">
                        {/* Highlight glow */}
                        <div className="absolute inset-0 bg-emerald-400/5 dark:bg-emerald-400/10" />
                        {/* Header Bar */}
                        <div className="bg-emerald-500 dark:bg-emerald-600 px-4 py-2 flex items-center justify-between relative">
                          <div className="flex items-center gap-2">
                            <Rocket className="h-4 w-4 text-white" />
                            <span className="font-bold text-white">Production</span>
                          </div>
                          <Badge className="bg-white/20 text-white text-[10px] border-0">PRIORITY</Badge>
                        </div>
                        {/* Content */}
                        <div className="p-4 md:p-5 min-h-[180px] relative">
                          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-3">High $ • High Energy</p>
                          <ul className="space-y-1.5 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                              <span className="text-emerald-500 mt-0.5">•</span>
                              <span>Strategic client meetings</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-emerald-500 mt-0.5">•</span>
                              <span>Business development</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-emerald-500 mt-0.5">•</span>
                              <span>High-impact decisions</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-emerald-500 mt-0.5">•</span>
                              <span>Revenue-generating work</span>
                            </li>
                          </ul>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-3 font-medium">→ Maximize time here!</p>
                        </div>
                      </div>
                    </ScrollReveal>

                    {/* Bottom Left - Delegation */}
                    <ScrollReveal animation="fade-up" delay={200}>
                      <div className="border-r border-border bg-blue-50/50 dark:bg-blue-950/20">
                        {/* Header Bar */}
                        <div className="bg-blue-400 dark:bg-blue-500 px-4 py-2 flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-blue-900" />
                          <span className="font-bold text-blue-900">Delegation</span>
                        </div>
                        {/* Content */}
                        <div className="p-4 md:p-5 min-h-[180px]">
                          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-3">Low $ • Low Energy</p>
                          <ul className="space-y-1.5 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>Scheduling & calendar</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>Basic customer support</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>Routine maintenance</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>Filing & organization</span>
                            </li>
                          </ul>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-3 font-medium">→ Delegate or eliminate</p>
                        </div>
                      </div>
                    </ScrollReveal>

                    {/* Bottom Right - Investment */}
                    <ScrollReveal animation="fade-up" delay={300}>
                      <div className="bg-orange-50/50 dark:bg-orange-950/20">
                        {/* Header Bar */}
                        <div className="bg-orange-400 dark:bg-orange-500 px-4 py-2 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-orange-900" />
                          <span className="font-bold text-orange-900">Investment</span>
                        </div>
                        {/* Content */}
                        <div className="p-4 md:p-5 min-h-[180px]">
                          <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 mb-3">Low $ • High Energy</p>
                          <ul className="space-y-1.5 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                              <span className="text-orange-500 mt-0.5">•</span>
                              <span>Learning & development</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-orange-500 mt-0.5">•</span>
                              <span>Health & fitness</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-orange-500 mt-0.5">•</span>
                              <span>Relationship building</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-orange-500 mt-0.5">•</span>
                              <span>Personal projects</span>
                            </li>
                          </ul>
                          <p className="text-xs text-orange-600 dark:text-orange-400 mt-3 font-medium">→ Keep for growth</p>
                        </div>
                      </div>
                    </ScrollReveal>
                  </div>

                  {/* X-Axis */}
                  <div className="flex items-center justify-center gap-3 mt-4">
                    <span className="text-sm font-semibold text-muted-foreground tracking-wider">LIGHTS YOU UP</span>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-primary to-primary/90 text-primary-foreground relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />

          <ScrollReveal animation="fade-up">
            <div className="container max-w-3xl mx-auto text-center relative">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                Ready to Make 2026 Your Best Year Ever?
              </h2>
              <p className="text-primary-foreground/80 mb-8 text-lg">
                Join as a Founding Member and get the complete goal achievement system for just $99.
              </p>
              <Link href={ROUTES.offer}>
                <Button size="lg" variant="secondary" className="btn-lift gap-2 font-semibold text-base px-8">
                  Get Founding Member Access <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 bg-muted/30">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2.5 font-semibold mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <Target className="h-4.5 w-4.5 text-primary-foreground" />
                </div>
                <span className="font-display font-bold">Goal Achiever Pro</span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Built for ambitious entrepreneurs who want to achieve their goals with clarity and focus.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-display font-semibold mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href={ROUTES.pricing} className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href={ROUTES.login} className="hover:text-foreground transition-colors">Login</Link></li>
                <li><Link href={ROUTES.signup} className="hover:text-foreground transition-colors">Sign Up</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-display font-semibold mb-4">Resources</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><Link href={ROUTES.guide} className="hover:text-foreground transition-colors">Getting Started</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Support</Link></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="font-display font-semibold mb-4">Stay Updated</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Get productivity tips and updates.
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="you@email.com"
                    className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <Button size="sm" className="flex-shrink-0">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Goal Achiever Pro. All rights reserved.
            </p>
            <nav className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
