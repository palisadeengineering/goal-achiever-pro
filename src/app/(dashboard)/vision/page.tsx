'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { SmartGoalEditor } from '@/components/features/vision/smart-goal-editor';
import { ThreeHundredPercentTracker } from '@/components/features/vision/three-hundred-percent-tracker';
import { AIProjectPlanner } from '@/components/features/vision/ai-project-planner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Target, Trophy, Clock } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

// Mock data - will be replaced with actual data fetching
const mockVision = {
  title: 'Build a location-independent $500K/year business by December 2026',
  description: 'Create a business that allows me to work from anywhere while generating consistent revenue through digital products and coaching.',
  specific: 'Launch and scale an online coaching business with digital courses, generating $500K annual revenue while maintaining freedom to travel.',
  measurable: 'Track monthly revenue (target: $41,666/month), number of coaching clients (target: 20 active), course sales (target: 100/month).',
  attainable: 'I have 10 years of industry expertise, a growing audience of 50K, and proven coaching skills from beta clients.',
  realistic: 'This aligns with my desire for freedom and impact. I\'m willing to dedicate 40 focused hours/week to make this happen.',
  timeBound: new Date('2026-12-31'),
};

const mock300Percent = {
  clarity: 85,
  belief: 72,
  consistency: 68,
};

const mockPowerGoals = [
  { id: '1', title: 'Launch flagship course', progress: 65, quarter: 'Q1' },
  { id: '2', title: 'Build email list to 10K', progress: 45, quarter: 'Q1' },
  { id: '3', title: 'Hire virtual assistant', progress: 100, quarter: 'Q1' },
  { id: '4', title: 'Create content system', progress: 30, quarter: 'Q2' },
];

export default function VisionPage() {
  const completedGoals = mockPowerGoals.filter(g => g.progress === 100).length;

  const [visionData, setVisionData] = useState<{
    title: string;
    description: string;
    specific: string;
    measurable: string;
    attainable: string;
    realistic: string;
    timeBound: Date | null;
  }>({
    title: mockVision.title,
    description: mockVision.description,
    specific: mockVision.specific,
    measurable: mockVision.measurable,
    attainable: mockVision.attainable,
    realistic: mockVision.realistic,
    timeBound: mockVision.timeBound,
  });

  const handleVisionSave = (data: {
    title: string;
    description: string;
    specific: string;
    measurable: string;
    attainable: string;
    realistic: string;
    timeBound: Date | null;
  }) => {
    setVisionData(data);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vision"
        description="Your north star - the big picture goal that guides everything"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Vision Editor */}
        <div className="lg:col-span-2 space-y-6">
          <SmartGoalEditor initialData={mockVision} onSave={handleVisionSave} />

          {/* AI Project Planner */}
          <AIProjectPlanner
            vision={visionData.title}
            smartGoals={{
              specific: visionData.specific,
              measurable: visionData.measurable,
              attainable: visionData.attainable,
              realistic: visionData.realistic,
            }}
            targetDate={visionData.timeBound}
          />

          {/* Power Goals Preview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  Power Goals
                </CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href={ROUTES.goals}>
                    View All
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  12 annual projects aligned with your vision
                </p>
                <Badge variant="secondary">
                  {completedGoals}/12 Complete
                </Badge>
              </div>

              <div className="space-y-3">
                {mockPowerGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{goal.title}</p>
                        <Badge variant="outline" className="text-xs">
                          {goal.quarter}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-10">
                          {goal.progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button className="w-full mt-4" asChild>
                <Link href={ROUTES.goalNew}>
                  Add Power Goal
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 300% Tracker & Tips */}
        <div className="space-y-6">
          <ThreeHundredPercentTracker {...mock300Percent} />

          {/* Daily Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Daily Visualization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Review your vision 3 times daily to maintain clarity and focus:
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-sm">Morning</span>
                  <Badge variant="outline">6:00 AM</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-sm">Midday</span>
                  <Badge variant="outline">12:00 PM</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-sm">Evening</span>
                  <Badge variant="outline">8:00 PM</Badge>
                </div>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link href={ROUTES.reviews}>
                  Start Review
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Pro Tips */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Pro Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Set your vision as your phone and laptop wallpaper
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Print it out and put it where you&apos;ll see it daily
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Visualize the outcome in detail - your mind thinks in pictures
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  Ask daily: &quot;Does this move me toward my vision?&quot;
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
