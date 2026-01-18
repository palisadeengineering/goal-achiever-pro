'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { GoalsGrid } from '@/components/features/goals/goals-grid';
import { GoalForm, GoalFormData } from '@/components/features/goals/goal-form';
import { ShareButton } from '@/components/features/sharing';

type GoalStatus = 'active' | 'completed' | 'paused' | 'archived';

interface PowerGoal {
  id: string;
  title: string;
  description: string | null;
  target_date: string | null;
  quarter: number;
  category: string | null;
  progress_percentage: number;
  status: GoalStatus;
  vision_id: string | null;
}

interface Vision {
  id: string;
  title: string;
}

interface GoalForGrid {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  quarter: number;
  category: string;
  progressPercentage: number;
  status: GoalStatus;
}

// Fetch power goals
async function fetchPowerGoals(): Promise<{ powerGoals: PowerGoal[] }> {
  const response = await fetch('/api/power-goals');
  if (!response.ok) {
    throw new Error('Failed to fetch power goals');
  }
  return response.json();
}

// Fetch visions
async function fetchVisions(): Promise<{ visions: Vision[] }> {
  const response = await fetch('/api/visions');
  if (!response.ok) {
    throw new Error('Failed to fetch visions');
  }
  return response.json();
}

// Create power goal
async function createPowerGoal(data: GoalFormData): Promise<{ powerGoals: PowerGoal[] }> {
  const response = await fetch('/api/power-goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      powerGoals: [{
        title: data.title,
        description: data.description,
        quarter: data.quarter,
        category: data.category,
        targetDate: data.targetDate,
      }],
      visionId: data.visionId,
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to create power goal');
  }
  return response.json();
}

// Update power goal
async function updatePowerGoal(data: {
  id: string;
  title?: string;
  description?: string;
  quarter?: number;
  category?: string;
  targetDate?: string;
  progressPercentage?: number;
  status?: GoalStatus;
}): Promise<{ powerGoal: PowerGoal }> {
  const response = await fetch('/api/power-goals', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update power goal');
  }
  return response.json();
}

// Delete power goal
async function deletePowerGoal(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/power-goals?id=${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete power goal');
  }
  return response.json();
}

export default function GoalsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [focusedGoalId, setFocusedGoalId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  // Fetch power goals
  const { data: goalsData, isLoading: goalsLoading } = useQuery({
    queryKey: ['powerGoals'],
    queryFn: fetchPowerGoals,
  });

  // Fetch visions
  const { data: visionsData, isLoading: visionsLoading } = useQuery({
    queryKey: ['visions'],
    queryFn: fetchVisions,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createPowerGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['powerGoals'] });
      setIsDialogOpen(false);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: updatePowerGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['powerGoals'] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deletePowerGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['powerGoals'] });
    },
  });

  const powerGoals = goalsData?.powerGoals || [];
  const visions = visionsData?.visions || [];

  // Transform power goals for the grid
  const transformedGoals: GoalForGrid[] = powerGoals.map(goal => ({
    id: goal.id,
    title: goal.title,
    description: goal.description || '',
    targetDate: goal.target_date || '',
    quarter: goal.quarter,
    category: goal.category || 'general',
    progressPercentage: goal.progress_percentage || 0,
    status: goal.status as GoalStatus,
  }));

  // Set focused goal to first active goal if not set
  const effectiveFocusedGoalId = focusedGoalId || transformedGoals.find(g => g.status === 'active')?.id || null;

  // Calculate stats
  const totalGoals = transformedGoals.length;
  const activeGoals = transformedGoals.filter(g => g.status === 'active').length;
  const avgProgress = totalGoals > 0
    ? Math.round(transformedGoals.reduce((sum, g) => sum + g.progressPercentage, 0) / totalGoals)
    : 0;
  const focusedGoal = transformedGoals.find(g => g.id === effectiveFocusedGoalId);

  const handleCreateGoal = async (data: GoalFormData) => {
    createMutation.mutate(data);
  };

  const handleEditGoal = (id: string) => {
    // For now, just log - could open edit dialog
    console.log('Edit goal:', id);
  };

  const handleDeleteGoal = (id: string) => {
    if (confirm('Are you sure you want to delete this milestone?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSetFocus = (id: string) => {
    setFocusedGoalId(id);
  };

  // Filter goals based on tab
  const filteredGoals = transformedGoals.filter(goal => {
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

  const isLoading = goalsLoading || visionsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Milestones"
        description="Your monthly and quarterly project milestones - focus on the one with the biggest impact"
        actions={
          <div className="flex items-center gap-2">
            <ShareButton tabName="goals" />
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Milestone
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <GoalForm
                  visions={visions.map(v => ({ id: v.id, title: v.title }))}
                  onSubmit={handleCreateGoal}
                  onCancel={() => setIsDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
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
              <div className="h-10 w-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-cyan-600" />
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
              {focusedGoal.targetDate && (
                <Badge variant="outline" className="bg-white">
                  <Calendar className="h-3 w-3 mr-1" />
                  Due: {new Date(focusedGoal.targetDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Badge>
              )}
              <Badge variant="outline" className="bg-white">Q{focusedGoal.quarter}</Badge>
              <Badge variant="outline" className="bg-white">{focusedGoal.category}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goals List */}
      <div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
              <TabsList className="inline-flex w-max sm:w-auto">
                <TabsTrigger value="all">All ({transformedGoals.length})</TabsTrigger>
                <TabsTrigger value="active">Active ({activeGoals})</TabsTrigger>
                <TabsTrigger value="q1">Q1</TabsTrigger>
                <TabsTrigger value="q2">Q2</TabsTrigger>
                <TabsTrigger value="q3">Q3</TabsTrigger>
                <TabsTrigger value="q4">Q4</TabsTrigger>
              </TabsList>
            </div>
            <Button variant="outline" size="sm" className="w-fit">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          <TabsContent value={activeTab}>
            {filteredGoals.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Target className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No milestones yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Create your first milestone to start tracking your progress
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Milestone
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <GoalsGrid
                goals={filteredGoals}
                focusedGoalId={effectiveFocusedGoalId || ''}
                onEdit={handleEditGoal}
                onDelete={handleDeleteGoal}
                onSetFocus={handleSetFocus}
              />
            )}
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
