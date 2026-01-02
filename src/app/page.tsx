import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Target,
  Calendar,
  Grid3X3,
  Timer,
  TrendingUp,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  Brain,
  Trophy,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';

const features = [
  {
    icon: Target,
    title: 'Vision & SMART Goals',
    description: 'Define your north star with the SMART framework and track your 300% Rule (Clarity + Belief + Consistency).',
    href: ROUTES.vision,
  },
  {
    icon: Trophy,
    title: '12 Power Goals',
    description: 'Break your vision into 12 annual projects. Focus on the one with the biggest impact.',
    href: ROUTES.goals,
  },
  {
    icon: Calendar,
    title: 'Time & Energy Audit',
    description: 'Track your time in 15-minute blocks. Rate your energy. See where your hours really go.',
    href: ROUTES.timeAudit,
  },
  {
    icon: Grid3X3,
    title: 'DRIP Matrix',
    description: 'Categorize activities by money potential and energy. Focus on Production, delegate the rest.',
    href: ROUTES.drip,
  },
  {
    icon: Timer,
    title: 'Pomodoro & Routines',
    description: '25-minute focused sprints. Morning and evening routines. Build systems that work.',
    href: ROUTES.routines,
  },
  {
    icon: Users,
    title: 'Network & Leverage',
    description: 'Audit your relationships. Use the 4 C\'s (Code, Content, Capital, Collaboration) to multiply your impact.',
    href: ROUTES.leverage,
  },
];

const steps = [
  {
    number: '01',
    title: 'Define Direction',
    description: 'Set your vision, 12 power goals, and identify your most important next steps (MINS).',
    icon: Target,
  },
  {
    number: '02',
    title: 'Audit Your Time',
    description: 'Track how you spend your time and energy. Identify what to delegate, automate, or focus on.',
    icon: Calendar,
  },
  {
    number: '03',
    title: 'Create Daily Systems',
    description: 'Build morning routines, use Pomodoro sprints, and review your progress 3x daily.',
    icon: Brain,
  },
  {
    number: '04',
    title: 'Create Leverage',
    description: 'Use the 4 C\'s to multiply your output: Code, Content, Capital, and Collaboration.',
    icon: Zap,
  },
  {
    number: '05',
    title: 'Curate Your Network',
    description: 'Audit your relationships. Spend time with people who elevate you, set boundaries with the rest.',
    icon: Users,
  },
  {
    number: '06',
    title: 'Stay on Track',
    description: 'Track your north star metric, use weekly scorecards, and find an accountability partner.',
    icon: TrendingUp,
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Target className="h-6 w-6 text-primary" />
            <span>Goal Achiever Pro</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href={ROUTES.pricing} className="text-sm text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
            <Link href={ROUTES.login}>
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href={ROUTES.signup}>
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
          <div className="container max-w-4xl text-center">
            <Badge className="mb-4" variant="secondary">
              <Sparkles className="h-3 w-3 mr-1" />
              Based on Dan Martell&apos;s Framework
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Achieve Your Goals in 2026
              <br />
              <span className="text-primary">with Clarity</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Picture December 31st, 2026. You&apos;re looking back at the year and you finally stuck to your goals.
              Your income is higher than ever. You&apos;re in the best shape of your life.
              <strong className="text-foreground"> Make it happen.</strong>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={ROUTES.signup}>
                <Button size="lg" className="gap-2">
                  Start Free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline">
                  See How It Works
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-8 mt-12 text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm">Free to start</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm">No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm">Cancel anytime</span>
              </div>
            </div>

            {/* How It Works Flow Diagram */}
            <div className="mt-16 pt-12 border-t w-full">
              <h3 className="text-lg font-semibold text-muted-foreground mb-10 text-center">How It Works</h3>

              {/* Desktop Flow - Horizontal boxes with arrows */}
              <div className="hidden md:flex items-center justify-center gap-0">
                {/* Step 1 */}
                <div className="flex items-center">
                  <div className="border-2 border-primary rounded-lg p-4 bg-background shadow-sm w-[180px] text-center">
                    <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-bold mb-2">1</div>
                    <h4 className="font-semibold text-sm mb-1">Set Your Vision</h4>
                    <p className="text-xs text-muted-foreground">Define goals & break into 12 projects</p>
                  </div>
                  <ArrowRight className="h-6 w-6 text-primary mx-2 flex-shrink-0" />
                </div>

                {/* Step 2 */}
                <div className="flex items-center">
                  <div className="border-2 border-primary rounded-lg p-4 bg-background shadow-sm w-[180px] text-center">
                    <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-bold mb-2">2</div>
                    <h4 className="font-semibold text-sm mb-1">Audit Your Time</h4>
                    <p className="text-xs text-muted-foreground">Track hours & categorize with DRIP</p>
                  </div>
                  <ArrowRight className="h-6 w-6 text-primary mx-2 flex-shrink-0" />
                </div>

                {/* Step 3 */}
                <div className="flex items-center">
                  <div className="border-2 border-primary rounded-lg p-4 bg-background shadow-sm w-[180px] text-center">
                    <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-bold mb-2">3</div>
                    <h4 className="font-semibold text-sm mb-1">Build Systems</h4>
                    <p className="text-xs text-muted-foreground">Create routines & Pomodoro sprints</p>
                  </div>
                  <ArrowRight className="h-6 w-6 text-primary mx-2 flex-shrink-0" />
                </div>

                {/* Step 4 */}
                <div className="border-2 border-green-600 rounded-lg p-4 bg-green-50 shadow-sm w-[180px] text-center">
                  <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-green-600 text-white mb-2">
                    <Trophy className="h-4 w-4" />
                  </div>
                  <h4 className="font-semibold text-sm mb-1 text-green-800">Achieve Goals</h4>
                  <p className="text-xs text-green-700">Track progress & celebrate wins</p>
                </div>
              </div>

              {/* Mobile Flow - Vertical boxes with arrows */}
              <div className="md:hidden flex flex-col items-center gap-0">
                {/* Step 1 */}
                <div className="border-2 border-primary rounded-lg p-4 bg-background shadow-sm w-full max-w-[280px] text-center">
                  <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-bold mb-2">1</div>
                  <h4 className="font-semibold text-sm mb-1">Set Your Vision</h4>
                  <p className="text-xs text-muted-foreground">Define goals & break into 12 projects</p>
                </div>
                <ArrowRight className="h-6 w-6 text-primary my-2 rotate-90" />

                {/* Step 2 */}
                <div className="border-2 border-primary rounded-lg p-4 bg-background shadow-sm w-full max-w-[280px] text-center">
                  <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-bold mb-2">2</div>
                  <h4 className="font-semibold text-sm mb-1">Audit Your Time</h4>
                  <p className="text-xs text-muted-foreground">Track hours & categorize with DRIP</p>
                </div>
                <ArrowRight className="h-6 w-6 text-primary my-2 rotate-90" />

                {/* Step 3 */}
                <div className="border-2 border-primary rounded-lg p-4 bg-background shadow-sm w-full max-w-[280px] text-center">
                  <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-bold mb-2">3</div>
                  <h4 className="font-semibold text-sm mb-1">Build Systems</h4>
                  <p className="text-xs text-muted-foreground">Create routines & Pomodoro sprints</p>
                </div>
                <ArrowRight className="h-6 w-6 text-primary my-2 rotate-90" />

                {/* Step 4 */}
                <div className="border-2 border-green-600 rounded-lg p-4 bg-green-50 shadow-sm w-full max-w-[280px] text-center">
                  <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-green-600 text-white mb-2">
                    <Trophy className="h-4 w-4" />
                  </div>
                  <h4 className="font-semibold text-sm mb-1 text-green-800">Achieve Goals</h4>
                  <p className="text-xs text-green-700">Track progress & celebrate wins</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                Everything You Need to Achieve Your Goals
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                A complete system based on Dan Martell&apos;s proven goal achievement framework,
                including the DRIP Matrix for time management.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <Link key={feature.title} href={feature.href}>
                  <Card className="border-2 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                    <CardContent className="pt-6">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                        <feature.icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 6-Step Framework Section */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container">
            <div className="text-center mb-12">
              <Badge className="mb-4">The 6-Step Framework</Badge>
              <h2 className="text-3xl font-bold mb-4">
                Your Blueprint for Success
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Follow this proven system to transform your goals from dreams into reality.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {steps.map((step) => (
                <div key={step.number} className="relative">
                  <div className="text-6xl font-bold text-primary/10 absolute -top-4 -left-2">
                    {step.number}
                  </div>
                  <div className="relative pt-8 pl-4">
                    <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center mb-3">
                      <step.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DRIP Matrix Section */}
        <section className="py-20 px-4">
          <div className="container max-w-4xl">
            <div className="text-center mb-12">
              <Badge className="mb-4" variant="outline">The DRIP Matrix</Badge>
              <h2 className="text-3xl font-bold mb-4">
                Know Where to Spend Your Time
              </h2>
              <p className="text-muted-foreground">
                Categorize every activity by how much money it makes and how much it energizes you.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="border-2 border-orange-300 bg-orange-50">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-orange-800">Replacement</h3>
                  <p className="text-sm text-orange-700">High $, Low Energy</p>
                  <p className="text-xs text-orange-600 mt-2">Automate or systematize</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-green-300 bg-green-50">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-green-800">Production</h3>
                  <p className="text-sm text-green-700">High $, High Energy</p>
                  <p className="text-xs text-green-600 mt-2">Your sweet spot! Focus here.</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-purple-300 bg-purple-50">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-purple-800">Delegation</h3>
                  <p className="text-sm text-purple-700">Low $, Low Energy</p>
                  <p className="text-xs text-purple-600 mt-2">Delegate to others</p>
                </CardContent>
              </Card>
              <Card className="border-2 border-blue-300 bg-blue-50">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-blue-800">Investment</h3>
                  <p className="text-sm text-blue-700">Low $, High Energy</p>
                  <p className="text-xs text-blue-600 mt-2">Keep for long-term growth</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-primary text-primary-foreground">
          <div className="container max-w-3xl text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Make 2026 Your Best Year Ever?
            </h2>
            <p className="text-primary-foreground/80 mb-8">
              Join thousands of goal achievers using this system to transform their lives.
              Start free, upgrade when you&apos;re ready.
            </p>
            <Link href={ROUTES.signup}>
              <Button size="lg" variant="secondary" className="gap-2">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="font-semibold">Goal Achiever Pro</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Goal Achiever Pro. All rights reserved.
            </p>
            <nav className="flex gap-4 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground">Terms</Link>
              <Link href="/contact" className="hover:text-foreground">Contact</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
