'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Target,
  Users,
  RefreshCw,
  TrendingUp,
  Zap,
  Clock,
  Calendar,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  Battery,
  BatteryLow,
  BatteryMedium,
  Youtube,
  ExternalLink,
  Play,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function GuidePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="How-To Guide"
        description="Master the Value Matrix framework and become a productivity powerhouse"
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="value">Value Matrix Framework</TabsTrigger>
          <TabsTrigger value="time-audit">Time Audit</TabsTrigger>
          <TabsTrigger value="energy">Energy Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="tips">Pro Tips</TabsTrigger>
          <TabsTrigger value="videos" className="gap-1.5">
            <Youtube className="h-4 w-4" />
            Videos
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                What is Goal Achiever Pro?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Goal Achiever Pro is built on the proven Value Matrix framework for
                time optimization. It helps entrepreneurs and high-performers
                identify where their time goes and strategically reclaim it.
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="font-medium mb-2">The Core Principle:</p>
                <p className="text-muted-foreground">
                  &quot;You don&apos;t need more time. You need to make better decisions about
                  the time you have.&quot;
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>The 6-Step Process</CardTitle>
              <CardDescription>
                Follow this sequence to transform your productivity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { step: 1, title: 'Complete a Time Audit', description: 'Track every 15-minute block for 2 weeks' },
                  { step: 2, title: 'Categorize with Value Matrix', description: 'Label each activity by quadrant' },
                  { step: 3, title: 'Rate Your Energy', description: 'Mark what energizes vs drains you' },
                  { step: 4, title: 'Identify Patterns', description: 'Review your analytics dashboard' },
                  { step: 5, title: 'Create a Replacement Plan', description: 'Delegate or automate low-value tasks' },
                  { step: 6, title: 'Protect Your Production Time', description: 'Schedule and guard your best hours' },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Start</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Week 1-2: Track Everything
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Go to Time Audit daily</li>
                    <li>Log every 15-minute block</li>
                    <li>Don&apos;t judge, just observe</li>
                    <li>Be brutally honest</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Week 3+: Optimize
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Review Analytics weekly</li>
                    <li>Identify patterns</li>
                    <li>Start delegating D&R tasks</li>
                    <li>Protect your Production time</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Value Matrix Framework Tab */}
        <TabsContent value="value" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>The Value Matrix Framework</CardTitle>
              <CardDescription>
                Every task you do falls into one of four quadrants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Value Matrix stands for Delegation, Replacement, Investment, and Production.
                Understanding which quadrant your activities fall into is the key to
                buying back your time.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {/* Delegation */}
                <div className="border-2 border-purple-500/30 rounded-lg p-4 bg-purple-500/5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-purple-600">Delegation</h3>
                      <p className="text-xs text-muted-foreground">Low skill, Draining energy</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Tasks you don&apos;t do well AND don&apos;t enjoy. These should be
                    delegated immediately.
                  </p>
                  <div className="space-y-1">
                    <p className="text-xs font-medium">Examples:</p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside">
                      <li>Administrative tasks</li>
                      <li>Data entry</li>
                      <li>Scheduling meetings</li>
                      <li>Basic customer support</li>
                    </ul>
                  </div>
                  <div className="mt-3 p-2 bg-purple-500/10 rounded text-xs">
                    <strong>Action:</strong> Hire, outsource, or eliminate these tasks
                  </div>
                </div>

                {/* Replacement */}
                <div className="border-2 border-orange-500/30 rounded-lg p-4 bg-orange-500/5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-orange-500/20">
                      <RefreshCw className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-orange-600">Replacement</h3>
                      <p className="text-xs text-muted-foreground">High skill, Draining energy</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Tasks you&apos;re good at but don&apos;t enjoy. Train someone else
                    or create systems.
                  </p>
                  <div className="space-y-1">
                    <p className="text-xs font-medium">Examples:</p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside">
                      <li>Repetitive technical work</li>
                      <li>Project management</li>
                      <li>Quality control</li>
                      <li>Process documentation</li>
                    </ul>
                  </div>
                  <div className="mt-3 p-2 bg-orange-500/10 rounded text-xs">
                    <strong>Action:</strong> Create SOPs, train team members, automate
                  </div>
                </div>

                {/* Investment */}
                <div className="border-2 border-blue-500/30 rounded-lg p-4 bg-blue-500/5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-600">Investment</h3>
                      <p className="text-xs text-muted-foreground">Low skill, Energizing</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Activities you enjoy but need to improve at. These build your
                    future capabilities.
                  </p>
                  <div className="space-y-1">
                    <p className="text-xs font-medium">Examples:</p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside">
                      <li>Learning new skills</li>
                      <li>Strategic thinking</li>
                      <li>Relationship building</li>
                      <li>Personal development</li>
                    </ul>
                  </div>
                  <div className="mt-3 p-2 bg-blue-500/10 rounded text-xs">
                    <strong>Action:</strong> Schedule dedicated learning time
                  </div>
                </div>

                {/* Production */}
                <div className="border-2 border-cyan-500/30 rounded-lg p-4 bg-cyan-500/5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-cyan-500/20">
                      <Zap className="h-5 w-5 text-cyan-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-cyan-600">Production</h3>
                      <p className="text-xs text-muted-foreground">High skill, Energizing</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Your &quot;Sweet Spot&quot; - tasks you&apos;re great at AND love doing.
                    This is where magic happens.
                  </p>
                  <div className="space-y-1">
                    <p className="text-xs font-medium">Examples:</p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside">
                      <li>Core creative work</li>
                      <li>High-level strategy</li>
                      <li>Key client relationships</li>
                      <li>Innovation & problem-solving</li>
                    </ul>
                  </div>
                  <div className="mt-3 p-2 bg-cyan-500/10 rounded text-xs">
                    <strong>Action:</strong> Maximize and protect this time
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                The $1000/Hour Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                For every task, ask yourself: &quot;Would I pay someone $1000/hour to do
                this?&quot; If no, it&apos;s probably not Production work.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-cyan-500/10 p-4 rounded-lg">
                  <p className="font-medium text-cyan-600 mb-2">$1000/Hour Activities</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Closing major deals</li>
                    <li>Strategic partnerships</li>
                    <li>Product vision</li>
                    <li>Key hiring decisions</li>
                  </ul>
                </div>
                <div className="bg-red-500/10 p-4 rounded-lg">
                  <p className="font-medium text-red-600 mb-2">$10-50/Hour Activities</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>Checking email constantly</li>
                    <li>Social media management</li>
                    <li>Calendar management</li>
                    <li>Basic research</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Audit Tab */}
        <TabsContent value="time-audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                How to Do a Time Audit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Navigate to Time Audit</p>
                    <p className="text-sm text-muted-foreground">
                      Go to the Time Audit page from the sidebar. You&apos;ll see a weekly
                      calendar view.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Click on a Time Block</p>
                    <p className="text-sm text-muted-foreground">
                      Click any 15-minute slot on the calendar. A dialog will appear
                      to log your activity.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Enter Activity Details</p>
                    <p className="text-sm text-muted-foreground">
                      Describe what you did (e.g., &quot;Client call with ABC Corp&quot;)
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <p className="font-medium">Select Value Quadrant</p>
                    <p className="text-sm text-muted-foreground">
                      Choose: Delegation (pink), Replacement (orange), Investment
                      (indigo), or Production (cyan)
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    5
                  </div>
                  <div>
                    <p className="font-medium">Rate Your Energy</p>
                    <p className="text-sm text-muted-foreground">
                      How did this activity make you feel? Green (energized), Yellow
                      (neutral), or Red (drained)
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    6
                  </div>
                  <div>
                    <p className="font-medium">Set Duration</p>
                    <p className="text-sm text-muted-foreground">
                      Adjust the duration slider (15 min to 4 hours). Activities can
                      span multiple blocks.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Google Calendar Integration</CardTitle>
              <CardDescription>
                Import your existing calendar events for faster tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="font-medium mb-2">How it works:</p>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Click &quot;Sync Calendar&quot; on the Time Audit page</li>
                  <li>Connect your Google account (one-time setup)</li>
                  <li>Your calendar events appear on the time grid</li>
                  <li>Click &quot;Categorize Events&quot; to assign Value + Energy ratings</li>
                  <li>The system learns your patterns for future suggestions</li>
                </ol>
              </div>
              <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-lg">
                <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  <strong>Pro tip:</strong> After categorizing similar events a few times,
                  the system will auto-suggest categories. Use &quot;Apply to All Similar&quot;
                  to categorize recurring meetings instantly.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Common Mistakes to Avoid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { wrong: 'Waiting until end of day to log', right: 'Log in real-time or every hour' },
                  { wrong: 'Being vague ("worked on stuff")', right: 'Be specific ("Reviewed Q4 budget proposal")' },
                  { wrong: 'Only tracking work time', right: 'Track everything including breaks' },
                  { wrong: 'Categorizing based on what "should" be', right: 'Categorize based on reality (your actual skill + energy)' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-center">
                    <div className="flex-1 p-3 bg-red-500/10 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm line-through text-muted-foreground">{item.wrong}</span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 p-3 bg-cyan-500/10 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-cyan-500" />
                        <span className="text-sm">{item.right}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Energy Management Tab */}
        <TabsContent value="energy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Battery className="h-5 w-5 text-primary" />
                Understanding Energy Ratings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                Your energy is just as important as your time. Some tasks drain you
                even if they&apos;re quick. Others energize you even when they&apos;re hard.
              </p>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="border-2 border-cyan-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Battery className="h-5 w-5 text-cyan-500" />
                    <h3 className="font-semibold text-cyan-600">Energizing (Green)</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Activities that fill your cup. You feel more alive after doing them.
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>You lose track of time</li>
                    <li>You feel accomplished after</li>
                    <li>You&apos;d do it for free</li>
                    <li>You think about it off-work</li>
                  </ul>
                </div>

                <div className="border-2 border-yellow-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BatteryMedium className="h-5 w-5 text-yellow-500" />
                    <h3 className="font-semibold text-yellow-600">Neutral (Yellow)</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Activities that neither drain nor energize. Necessary but mundane.
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>You don&apos;t mind doing it</li>
                    <li>No strong feelings either way</li>
                    <li>Could automate without loss</li>
                    <li>Part of normal routine</li>
                  </ul>
                </div>

                <div className="border-2 border-red-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BatteryLow className="h-5 w-5 text-red-500" />
                    <h3 className="font-semibold text-red-600">Draining (Red)</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Activities that deplete your energy. You feel tired or stressed after.
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>You procrastinate on it</li>
                    <li>You feel relief when done</li>
                    <li>You dread seeing it on calendar</li>
                    <li>You need recovery time after</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Energy Balance</CardTitle>
              <CardDescription>
                Aim for a positive energy balance each day
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-muted-foreground">
                  <strong>Energy Balance = Energizing time - Draining time</strong>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Check your Analytics dashboard to see your energy balance over time.
                  A consistently negative balance leads to burnout.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <p className="font-medium text-cyan-600 mb-2">Positive Balance (+20% or more)</p>
                  <p className="text-sm text-muted-foreground">
                    Great! You&apos;re spending most time on activities that fuel you.
                    Keep protecting this.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="font-medium text-red-600 mb-2">Negative Balance (-20% or less)</p>
                  <p className="text-sm text-muted-foreground">
                    Warning sign. Review your Delegation and Replacement quadrants.
                    What can you offload?
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Energy Optimization Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    title: 'Schedule draining tasks for after energizing ones',
                    description: 'Stack meetings after creative work, not before',
                  },
                  {
                    title: 'Don\'t start your day with red tasks',
                    description: 'Your willpower is highest in the morning - use it on Production',
                  },
                  {
                    title: 'Batch similar energy tasks together',
                    description: 'Context-switching is draining. Group calls, admin, creative work separately',
                  },
                  {
                    title: 'Take breaks between draining tasks',
                    description: 'A 10-minute walk can reset your energy between tough meetings',
                  },
                ].map((tip, i) => (
                  <div key={i} className="flex gap-3 items-start p-3 bg-muted/50 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-cyan-500 mt-0.5" />
                    <div>
                      <p className="font-medium">{tip.title}</p>
                      <p className="text-sm text-muted-foreground">{tip.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Understanding Your Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                After tracking for at least a week, your Analytics dashboard reveals
                powerful insights about where your time really goes.
              </p>

              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Production Percentage</h4>
                  <p className="text-sm text-muted-foreground">
                    What % of your tracked time is in the Production quadrant (cyan).
                    Aim for 50%+ as a leader. World-class performers often hit 70-80%.
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Weekly Trends Chart</h4>
                  <p className="text-sm text-muted-foreground">
                    Track how your Value distribution changes over time. Watch for:
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                    <li>Production trending up (good!)</li>
                    <li>Delegation trending down as you hire/automate</li>
                    <li>Dips during busy seasons (expected, but recover quickly)</li>
                  </ul>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Value Distribution Pie Chart</h4>
                  <p className="text-sm text-muted-foreground">
                    Visual breakdown of time across all four quadrants. If D+R
                    (Delegation + Replacement) is more than 40%, prioritize offloading.
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Productivity Heatmap</h4>
                  <p className="text-sm text-muted-foreground">
                    See which hours and days you&apos;re most active. Use this to:
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                    <li>Block your peak hours for Production work</li>
                    <li>Schedule meetings during lower-energy times</li>
                    <li>Identify patterns (maybe Fridays are always low?)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interpreting Your Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-cyan-500/10 rounded-lg">
                  <p className="font-medium text-cyan-600">Green Flags</p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                    <li>Production % increasing week over week</li>
                    <li>Energy balance consistently positive</li>
                    <li>Clear peak hours identified and protected</li>
                    <li>D+R tasks decreasing as you delegate</li>
                  </ul>
                </div>

                <div className="p-4 bg-red-500/10 rounded-lg">
                  <p className="font-medium text-red-600">Red Flags</p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                    <li>Production % below 30%</li>
                    <li>Energy balance negative for 2+ weeks</li>
                    <li>Most activity during suboptimal hours</li>
                    <li>Delegation quadrant growing, not shrinking</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pro Tips Tab */}
        <TabsContent value="tips" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Productivity Principles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {[
                  {
                    principle: 'The Replacement Ladder',
                    description: 'Hire in this order: Admin → Delivery → Marketing → Sales. Each frees up more of YOUR time.',
                  },
                  {
                    principle: 'Perfect Week',
                    description: 'Design your ideal week first, then protect it. Schedule Production time before anything else.',
                  },
                  {
                    principle: '10-80-10 Rule',
                    description: 'Spend 10% of time defining work, 80% letting others do it, 10% reviewing. Stop being the doer.',
                  },
                  {
                    principle: 'Camcorder Method',
                    description: 'Record yourself doing a task, then hand that video to someone else. Instant training material.',
                  },
                  {
                    principle: 'Energy Audit First',
                    description: 'Before delegating, check if the task drains YOU. Your unique energy profile determines what to keep.',
                  },
                ].map((item, i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <p className="font-semibold text-primary">{item.principle}</p>
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Common Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <p className="font-medium">How long should I track before seeing results?</p>
                  <p className="text-sm text-muted-foreground">
                    2 weeks minimum. The first week often has &quot;observer effect&quot; - you
                    behave differently because you&apos;re watching. Week 2 shows true patterns.
                  </p>
                </div>
                <div>
                  <p className="font-medium">What if I can&apos;t delegate anything yet?</p>
                  <p className="text-sm text-muted-foreground">
                    Start by identifying what COULD be delegated. The awareness alone changes
                    behavior. Then look for automation tools or batch similar tasks.
                  </p>
                </div>
                <div>
                  <p className="font-medium">Should I track weekends?</p>
                  <p className="text-sm text-muted-foreground">
                    Optional, but recommended if you work weekends. It helps identify if
                    you&apos;re burning out or if weekend work is actually Production time.
                  </p>
                </div>
                <div>
                  <p className="font-medium">I&apos;m a solopreneur. Does Value Matrix still apply?</p>
                  <p className="text-sm text-muted-foreground">
                    Absolutely. Focus on Investment time to build skills that turn D&R tasks
                    into automated systems or low-cost outsourcing.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Your Action Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4 items-start p-4 bg-primary/5 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">This Week</p>
                    <p className="text-sm text-muted-foreground">
                      Complete a full time audit. Log every block. No judgment.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 items-start p-4 bg-primary/5 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Next Week</p>
                    <p className="text-sm text-muted-foreground">
                      Review analytics. Identify your #1 draining task to eliminate or delegate.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 items-start p-4 bg-primary/5 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Week 3+</p>
                    <p className="text-sm text-muted-foreground">
                      Block 2 hours of Production time daily. Treat it like a meeting with your CEO.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Videos Tab - Productivity Video Resources */}
        <TabsContent value="videos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Youtube className="h-5 w-5 text-red-500" />
                Productivity Video Resources
              </CardTitle>
              <CardDescription>
                Learn productivity strategies from leading entrepreneurs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 p-4 rounded-lg mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
                    <Youtube className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <p className="font-medium">Productivity YouTube Channels</p>
                    <p className="text-sm text-muted-foreground">
                      Discover videos on productivity, delegation, and scaling your business
                    </p>
                  </div>
                  <a
                    href="https://www.youtube.com/results?search_query=time+management+productivity"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                  >
                    Explore
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verified YouTube Videos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Play className="h-5 w-5 text-red-500" />
                Featured Videos
              </CardTitle>
              <CardDescription>
                Curated videos covering key time optimization concepts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    title: 'Time Management for Entrepreneurs',
                    description: 'Learn how to reclaim your time and grow your business with proven strategies',
                    url: 'https://www.youtube.com/results?search_query=entrepreneur+time+management',
                    topic: 'Time Optimization',
                  },
                  {
                    title: 'Effective Daily Routines',
                    description: 'Discover time management systems and daily routines used by successful entrepreneurs',
                    url: 'https://www.youtube.com/results?search_query=entrepreneur+morning+routine',
                    topic: 'Routines',
                  },
                  {
                    title: 'Productivity Habits That Work',
                    description: 'The habits and behaviors that transform productivity and help you achieve more',
                    url: 'https://www.youtube.com/results?search_query=productivity+habits+entrepreneurs',
                    topic: 'Productivity',
                  },
                  {
                    title: 'Delegation and Scaling Your Business',
                    description: 'Learn delegation strategies, hiring tips, and how to scale effectively',
                    url: 'https://www.youtube.com/results?search_query=delegation+scaling+business',
                    topic: 'Business Growth',
                  },
                  {
                    title: 'Finding Your Purpose and Energy',
                    description: 'How to discover what energizes you and align your work with your purpose',
                    url: 'https://www.youtube.com/results?search_query=find+purpose+entrepreneur',
                    topic: 'Energy & Purpose',
                  },
                ].map((video, i) => (
                  <a
                    key={i}
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                      <Play className="h-5 w-5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium group-hover:text-primary transition-colors">{video.title}</p>
                      <p className="text-sm text-muted-foreground">{video.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-muted px-2 py-1 rounded">{video.topic}</span>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Topic Search Sections */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Value Matrix Framework */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-4 w-4 text-primary" />
                  Value Matrix Framework
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { topic: 'Time Value Matrix', query: 'time value matrix productivity' },
                    { topic: 'High-Value Activities', query: 'high value activities entrepreneur' },
                    { topic: 'Calculate Your Hourly Rate', query: 'calculate hourly rate entrepreneur' },
                    { topic: '$1000/Hour Activities', query: '1000 dollar hour activities' },
                  ].map((item, i) => (
                    <a
                      key={i}
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(item.query)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors group text-sm"
                    >
                      <Search className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="flex-1 group-hover:text-primary transition-colors">{item.topic}</span>
                      <span className="text-xs text-muted-foreground">YouTube Search</span>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Delegation & Hiring */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4 text-purple-500" />
                  Delegation & Hiring
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { topic: 'The Replacement Ladder', query: 'replacement ladder hiring entrepreneur' },
                    { topic: 'Creating SOPs', query: 'create SOP standard operating procedure' },
                    { topic: 'How to Hire Your First VA', query: 'hire virtual assistant entrepreneur' },
                    { topic: 'Effective Delegation', query: 'delegation rules entrepreneur' },
                  ].map((item, i) => (
                    <a
                      key={i}
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(item.query)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors group text-sm"
                    >
                      <Search className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="flex-1 group-hover:text-primary transition-colors">{item.topic}</span>
                      <span className="text-xs text-muted-foreground">YouTube Search</span>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Time & Energy */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Time & Energy Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { topic: 'Perfect Week Planning', query: 'perfect week planning entrepreneur' },
                    { topic: 'Time Audit How-To', query: 'time audit productivity' },
                    { topic: 'Energy Management', query: 'energy management entrepreneur' },
                    { topic: 'Morning Routines', query: 'morning routine successful entrepreneur' },
                  ].map((item, i) => (
                    <a
                      key={i}
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(item.query)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors group text-sm"
                    >
                      <Search className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="flex-1 group-hover:text-primary transition-colors">{item.topic}</span>
                      <span className="text-xs text-muted-foreground">YouTube Search</span>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Business Growth */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-cyan-500" />
                  Business Growth & Scaling
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { topic: 'Scaling Your Business', query: 'scale business entrepreneur' },
                    { topic: 'SaaS Growth Strategies', query: 'SaaS growth strategies' },
                    { topic: 'Building Systems', query: 'business systems scaling' },
                    { topic: 'Founder Mindset', query: 'founder mindset entrepreneur' },
                  ].map((item, i) => (
                    <a
                      key={i}
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(item.query)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors group text-sm"
                    >
                      <Search className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="flex-1 group-hover:text-primary transition-colors">{item.topic}</span>
                      <span className="text-xs text-muted-foreground">YouTube Search</span>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Book & Additional Resources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Book & Additional Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <a
                  href="https://www.amazon.com/s?k=time+management+books+entrepreneurs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium group-hover:text-primary transition-colors">Productivity Books</p>
                      <p className="text-xs text-muted-foreground">Recommended Reading</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Discover top-rated books on time management, productivity, and business growth
                  </p>
                </a>

                <a
                  href="https://www.youtube.com/results?search_query=entrepreneur+productivity+tips"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium group-hover:text-primary transition-colors">Productivity Channels</p>
                      <p className="text-xs text-muted-foreground">Video Resources</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Learn about SaaS Academy coaching and access free tools like the Next Hire Focuser worksheet
                  </p>
                </a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
