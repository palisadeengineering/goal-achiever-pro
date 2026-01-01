'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import {
  Edit,
  Trash2,
  Star,
  Calendar,
  Target,
  ListTodo,
  TrendingUp,
  CheckCircle2,
  Circle,
  Plus,
  Clock,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { ROUTES } from '@/constants/routes';

// Mock data - will be replaced with actual data fetching
const mockGoal = {
  id: '1',
  title: 'Launch online course',
  description: 'Create and launch a comprehensive online course on productivity systems. The course will cover time management, goal setting, and the DRIP matrix framework.',
  targetDate: '2026-03-31',
  quarter: 1,
  category: 'business',
  progressPercentage: 35,
  status: 'active' as const,
  visionTitle: 'Become a recognized thought leader in productivity',
  createdAt: '2025-12-01',
};

const mockMins = [
  { id: 'm1', title: 'Outline course curriculum', status: 'completed', date: '2025-12-15' },
  { id: 'm2', title: 'Record module 1 videos', status: 'completed', date: '2025-12-20' },
  { id: 'm3', title: 'Set up course platform', status: 'in_progress', date: '2025-12-31' },
  { id: 'm4', title: 'Create landing page', status: 'pending', date: '2026-01-05' },
  { id: 'm5', title: 'Write email sequence', status: 'pending', date: '2026-01-10' },
  { id: 'm6', title: 'Beta test with 10 users', status: 'pending', date: '2026-01-20' },
];

const mockProgressHistory = [
  { date: '2025-12-01', progress: 5 },
  { date: '2025-12-08', progress: 12 },
  { date: '2025-12-15', progress: 20 },
  { date: '2025-12-22', progress: 28 },
  { date: '2025-12-29', progress: 35 },
];

const statusColors = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  paused: 'bg-yellow-100 text-yellow-800',
  archived: 'bg-gray-100 text-gray-800',
};

export default function GoalDetailPage() {
  const params = useParams();
  const [progress, setProgress] = useState(mockGoal.progressPercentage);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  const completedMins = mockMins.filter(m => m.status === 'completed').length;
  const daysRemaining = Math.ceil(
    (new Date(mockGoal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const handleUpdateProgress = () => {
    // TODO: Save progress update
    console.log('Updating progress to:', progress);
    setIsUpdateDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={mockGoal.title}
        description={mockGoal.description}
        backHref={ROUTES.goals}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <Star className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="text-red-600">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {/* Goal Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold">{mockGoal.progressPercentage}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Days Left</p>
                <p className="text-2xl font-bold">{daysRemaining}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <ListTodo className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">MINS Done</p>
                <p className="text-2xl font-bold">{completedMins}/{mockMins.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quarter</p>
                <p className="text-2xl font-bold">Q{mockGoal.quarter}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Progress</CardTitle>
              <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    Update Progress
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Update Progress</DialogTitle>
                  </DialogHeader>
                  <div className="py-6 space-y-4">
                    <div className="text-center">
                      <p className="text-4xl font-bold">{progress}%</p>
                      <p className="text-muted-foreground">Current Progress</p>
                    </div>
                    <Slider
                      value={[progress]}
                      onValueChange={(value) => setProgress(value[0])}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateProgress}>Save Progress</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Progress value={mockGoal.progressPercentage} className="h-3" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Started: {new Date(mockGoal.createdAt).toLocaleDateString()}</span>
                  <span>Target: {new Date(mockGoal.targetDate).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MINS Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Related MINS</CardTitle>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add MIN
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockMins.map((min) => (
                  <div
                    key={min.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    {min.status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : min.status === 'in_progress' ? (
                      <Circle className="h-5 w-5 text-blue-600 fill-blue-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div className="flex-1">
                      <p className={min.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                        {min.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(min.date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        min.status === 'completed'
                          ? 'bg-green-50 text-green-700'
                          : min.status === 'in_progress'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-gray-50 text-gray-700'
                      }
                    >
                      {min.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Goal Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Goal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <Badge className={statusColors[mockGoal.status]}>
                  {mockGoal.status.charAt(0).toUpperCase() + mockGoal.status.slice(1)}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Category</p>
                <Badge variant="outline">{mockGoal.category}</Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Target Date</p>
                <p className="font-medium">
                  {new Date(mockGoal.targetDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Linked Vision</p>
                <p className="text-sm">{mockGoal.visionTitle}</p>
              </div>
            </CardContent>
          </Card>

          {/* Progress Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Progress Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium mb-1">Break it down</p>
                <p className="text-muted-foreground">
                  Add daily MINS to make consistent progress toward this goal.
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium mb-1">Track weekly</p>
                <p className="text-muted-foreground">
                  Update your progress at least once a week to stay motivated.
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium mb-1">Review & adjust</p>
                <p className="text-muted-foreground">
                  If you&apos;re behind, adjust the target date or scope.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
