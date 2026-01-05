'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Plus,
  Target,
  Trophy,
  Star,
  TrendingUp,
  Calendar,
  Filter,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { GoalsGrid } from '@/components/features/goals/goals-grid';
import { GoalForm, GoalFormData } from '@/components/features/goals/goal-form';

type GoalStatus = 'active' | 'completed' | 'paused' | 'archived';

interface MockGoal {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  quarter: number;
  category: string;
  progressPercentage: number;
  status: GoalStatus;
}

// Mock data - will be replaced with actual data fetching
const mockGoals: MockGoal[] = [
  {
    id: '1',
    title: 'Launch online course',
    description: 'Create and launch a comprehensive online course on productivity systems',
    targetDate: '2026-03-31',
    quarter: 1,
    category: 'business',
    progressPercentage: 35,
    status: 'active',
  },
  {
    id: '2',
    title: 'Run a marathon',
    description: 'Train for and complete my first full marathon',
    targetDate: '2026-06-15',
    quarter: 2,
    category: 'health',
    progressPercentage: 20,
    status: 'active',
  },
  {
    id: '3',
    title: 'Build emergency fund',
    description: 'Save 6 months of expenses in a high-yield savings account',
    targetDate: '2026-12-31',
    quarter: 4,
    category: 'wealth',
    progressPercentage: 60,
    status: 'active',
  },
  {
    id: '4',
    title: 'Write a book',
    description: 'Complete first draft of my book on time management',
    targetDate: '2026-09-30',
    quarter: 3,
    category: 'personal',
    progressPercentage: 10,
    status: 'paused',
  },
  {
    id: '5',
    title: 'Learn Spanish',
    description: 'Achieve B2 level fluency in Spanish',
    targetDate: '2026-12-31',
    quarter: 4,
    category: 'personal',
    progressPercentage: 45,
    status: 'active',
  },
  {
    id: '6',
    title: 'Grow newsletter to 10K',
    description: 'Build email list to 10,000 engaged subscribers',
    targetDate: '2026-06-30',
    quarter: 2,
    category: 'business',
    progressPercentage: 75,
    status: 'active',
  },
];

const mockVisions = [
  { id: 'v1', title: 'Become a recognized thought leader in productivity' },
  { id: 'v2', title: 'Achieve financial independence' },
];

export default function GoalsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [focusedGoalId, setFocusedGoalId] = useState<string>('1');
  const [activeTab, setActiveTab] = useState('all');

  // Calculate stats
  const totalGoals = mockGoals.length;
  const activeGoals = mockGoals.filter(g => g.status === 'active').length;
  const avgProgress = Math.round(
    mockGoals.reduce((sum, g) => sum + g.progressPercentage, 0) / totalGoals
  );
  const focusedGoal = mockGoals.find(g => g.id === focusedGoalId);

  const handleCreateGoal = async (data: GoalFormData) => {
    // TODO: Implement actual creation
    console.log('Creating goal:', data);
    setIsDialogOpen(false);
  };

  const handleEditGoal = (id: string) => {
    // TODO: Implement edit modal
    console.log('Edit goal:', id);
  };

  const handleDeleteGoal = (id: string) => {
    // TODO: Implement delete confirmation
    console.log('Delete goal:', id);
  };

  const handleSetFocus = (id: string) => {
    setFocusedGoalId(id);
  };

  // Filter goals based on tab
  const filteredGoals = mockGoals.filter(goal => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return goal.status === 'active';
    if (activeTab === 'completed') return goal.status === 'completed';
    if (activeTab === 'paused') return goal.status === 'paused';
    // Quarter filters
    if (activeTab === 'q1') return goal.quarter === 1;
    if (activeTab === 'q2') return goal.quarter === 2;
    if (activeTab === 'q3') return goal.quarter === 3;
    if (activeTab === 'q4') return goal.quarter === 4;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Milestones"
        description="Your monthly and quarterly project milestones - focus on the one with the biggest impact"
        actions={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Milestone
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <GoalForm
                visions={mockVisions}
                onSubmit={handleCreateGoal}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        }
      />

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Milestones</p>
                <p className="text-2xl font-bold">{totalGoals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Milestones</p>
                <p className="text-2xl font-bold">{activeGoals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Progress</p>
                <p className="text-2xl font-bold">{avgProgress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Focus</p>
                <p className="text-sm font-medium line-clamp-1">
                  {focusedGoal?.title || 'None set'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Focused Milestone Highlight */}
      {focusedGoal && (
        <Card className="border-2 border-primary/50 bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <CardTitle className="text-lg">Current Focus Milestone</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">{focusedGoal.title}</h3>
                <p className="text-muted-foreground">{focusedGoal.description}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="text-2xl font-bold">{focusedGoal.progressPercentage}%</p>
                </div>
                <div className="w-32">
                  <Progress value={focusedGoal.progressPercentage} className="h-3" />
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-white">
                <Calendar className="h-3 w-3 mr-1" />
                Due: {new Date(focusedGoal.targetDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Badge>
              <Badge variant="outline" className="bg-white">Q{focusedGoal.quarter}</Badge>
              <Badge variant="outline" className="bg-white">{focusedGoal.category}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goals List */}
      <div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="all">All ({mockGoals.length})</TabsTrigger>
              <TabsTrigger value="active">Active ({activeGoals})</TabsTrigger>
              <TabsTrigger value="q1">Q1</TabsTrigger>
              <TabsTrigger value="q2">Q2</TabsTrigger>
              <TabsTrigger value="q3">Q3</TabsTrigger>
              <TabsTrigger value="q4">Q4</TabsTrigger>
            </TabsList>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          <TabsContent value={activeTab}>
            <GoalsGrid
              goals={filteredGoals}
              focusedGoalId={focusedGoalId}
              onEdit={handleEditGoal}
              onDelete={handleDeleteGoal}
              onSetFocus={handleSetFocus}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Milestones Framework Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">About Milestones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Milestones help you break your vision into manageable monthly or quarterly projects.
            Each milestone should be significant enough to move you closer to your vision, with trackable KPIs.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="font-medium text-foreground mb-1">Key Principle</p>
              <p>Focus on the <strong>one milestone</strong> with the biggest impact at any given time.</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="font-medium text-foreground mb-1">MINS Connection</p>
              <p>Break each milestone into daily &amp; weekly MINS (Most Important Next Steps) to make progress.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
