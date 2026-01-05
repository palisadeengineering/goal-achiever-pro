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
  CheckCircle2,
  Clock,
  Target,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { MinsList } from '@/components/features/mins/mins-list';
import { MinForm, MinFormData } from '@/components/features/mins/min-form';
import type { DripQuadrant } from '@/types/database';

type MinStatus = 'pending' | 'in_progress' | 'completed';

interface MockMin {
  id: string;
  title: string;
  description?: string;
  scheduledTime?: string;
  durationMinutes: number;
  priority: number;
  status: MinStatus;
  dripQuadrant?: DripQuadrant;
  powerGoalTitle?: string;
}

// Mock data
const mockMins: MockMin[] = [
  {
    id: '1',
    title: 'Review marketing proposal',
    description: 'Go through the Q1 marketing plan and provide feedback',
    scheduledTime: '09:00',
    durationMinutes: 45,
    priority: 1,
    status: 'completed',
    dripQuadrant: 'production',
    powerGoalTitle: 'Launch online course',
  },
  {
    id: '2',
    title: 'Record module 2 intro video',
    description: 'Script is ready, just need to record and edit',
    scheduledTime: '10:00',
    durationMinutes: 60,
    priority: 1,
    status: 'in_progress',
    dripQuadrant: 'production',
    powerGoalTitle: 'Launch online course',
  },
  {
    id: '3',
    title: 'Reply to client emails',
    scheduledTime: '11:30',
    durationMinutes: 30,
    priority: 2,
    status: 'pending',
    dripQuadrant: 'delegation',
  },
  {
    id: '4',
    title: 'Weekly team meeting prep',
    durationMinutes: 15,
    priority: 3,
    status: 'pending',
    dripQuadrant: 'replacement',
  },
  {
    id: '5',
    title: '30-min run (marathon training)',
    scheduledTime: '17:00',
    durationMinutes: 30,
    priority: 2,
    status: 'pending',
    dripQuadrant: 'investment',
    powerGoalTitle: 'Run a marathon',
  },
  {
    id: '6',
    title: 'Read industry newsletter',
    durationMinutes: 15,
    priority: 4,
    status: 'pending',
    dripQuadrant: 'investment',
  },
];

const mockPowerGoals = [
  { id: 'g1', title: 'Launch online course' },
  { id: 'g2', title: 'Run a marathon' },
  { id: 'g3', title: 'Build emergency fund' },
];

export default function MinsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [mins, setMins] = useState(mockMins);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeScopeFilter, setTimeScopeFilter] = useState<'all' | 'daily' | 'weekly'>('all');

  // Calculate stats
  const totalMins = mins.length;
  const completedMins = mins.filter((m) => m.status === 'completed').length;
  const completionRate = totalMins > 0 ? Math.round((completedMins / totalMins) * 100) : 0;
  const totalMinutes = mins.reduce((sum, m) => sum + m.durationMinutes, 0);
  const completedMinutes = mins
    .filter((m) => m.status === 'completed')
    .reduce((sum, m) => sum + m.durationMinutes, 0);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const handleToggleComplete = (id: string, completed: boolean) => {
    setMins((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, status: completed ? 'completed' : 'pending' }
          : m
      )
    );
  };

  const handleAddMin = async (data: MinFormData) => {
    const newMin: MockMin = {
      id: `new-${Date.now()}`,
      title: data.title,
      description: data.description,
      scheduledTime: data.scheduledTime,
      durationMinutes: data.durationMinutes,
      priority: data.priority,
      status: 'pending',
      dripQuadrant: data.dripQuadrant as DripQuadrant | undefined,
    };
    setMins((prev) => [...prev, newMin]);
  };

  const handleEditMin = (id: string) => {
    console.log('Edit MIN:', id);
  };

  const handleDeleteMin = (id: string) => {
    setMins((prev) => prev.filter((m) => m.id !== id));
  };

  const handleStartPomodoro = (id: string) => {
    console.log('Start Pomodoro for:', id);
    setMins((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, status: 'in_progress' } : m
      )
    );
  };

  // Filter mins by status
  const pendingMins = mins.filter((m) => m.status === 'pending');
  const inProgressMins = mins.filter((m) => m.status === 'in_progress');
  const completedMinsList = mins.filter((m) => m.status === 'completed');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily & Weekly MINS"
        description="Most Important Next Steps - your daily & weekly action items"
        actions={
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add MIN
          </Button>
        }
      />

      {/* Date Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => navigateDate('prev')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <h2 className="text-lg font-semibold">{formatDate(selectedDate)}</h2>
          {isToday(selectedDate) && (
            <Badge variant="secondary">Today</Badge>
          )}
        </div>
        <Button variant="outline" size="icon" onClick={() => navigateDate('next')}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total MINS</p>
                <p className="text-2xl font-bold">{totalMins}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedMins}/{totalMins}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time Planned</p>
                <p className="text-2xl font-bold">
                  {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Zap className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completion</p>
                <p className="text-2xl font-bold">{completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Daily Progress</span>
            <span className="text-sm text-muted-foreground">
              {completedMinutes} of {totalMinutes} minutes completed
            </span>
          </div>
          <Progress value={completionRate} className="h-3" />
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Time Scope Filter */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={timeScopeFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeScopeFilter('all')}
            >
              All MINS
            </Button>
            <Button
              variant={timeScopeFilter === 'daily' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeScopeFilter('daily')}
            >
              Daily
            </Button>
            <Button
              variant={timeScopeFilter === 'weekly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeScopeFilter('weekly')}
            >
              Weekly
            </Button>
          </div>

          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All ({mins.length})</TabsTrigger>
              <TabsTrigger value="pending">
                To Do ({pendingMins.length})
              </TabsTrigger>
              <TabsTrigger value="in_progress">
                In Progress ({inProgressMins.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Done ({completedMinsList.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <MinsList
                mins={mins}
                onToggleComplete={handleToggleComplete}
                onEdit={handleEditMin}
                onDelete={handleDeleteMin}
                onStartPomodoro={handleStartPomodoro}
              />
            </TabsContent>

            <TabsContent value="pending">
              <MinsList
                mins={pendingMins}
                onToggleComplete={handleToggleComplete}
                onEdit={handleEditMin}
                onDelete={handleDeleteMin}
                onStartPomodoro={handleStartPomodoro}
                emptyMessage="All caught up! No pending MINS."
              />
            </TabsContent>

            <TabsContent value="in_progress">
              <MinsList
                mins={inProgressMins}
                onToggleComplete={handleToggleComplete}
                onEdit={handleEditMin}
                onDelete={handleDeleteMin}
                emptyMessage="Nothing in progress. Start a Pomodoro session!"
              />
            </TabsContent>

            <TabsContent value="completed">
              <MinsList
                mins={completedMinsList}
                onToggleComplete={handleToggleComplete}
                onEdit={handleEditMin}
                onDelete={handleDeleteMin}
                emptyMessage="No completed MINS yet today."
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Add */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quick Add</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setIsFormOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New MIN
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                From Calendar
              </Button>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">MINS Best Practices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium mb-1">Start with 3-5 MINS</p>
                <p className="text-muted-foreground">
                  Focus on your most important tasks. Quality over quantity.
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium mb-1">Use Pomodoro</p>
                <p className="text-muted-foreground">
                  25-minute focused sprints help you make progress on each MIN.
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium mb-1">Link to Milestones</p>
                <p className="text-muted-foreground">
                  Connect MINS to your Milestones for better tracking.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Linked Milestones Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Linked Milestones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {mockPowerGoals.slice(0, 3).map((goal) => {
                const linkedMins = mins.filter(
                  (m) => m.powerGoalTitle === goal.title
                );
                const completed = linkedMins.filter(
                  (m) => m.status === 'completed'
                ).length;
                return (
                  <div key={goal.id} className="flex items-center justify-between">
                    <span className="text-sm truncate flex-1">{goal.title}</span>
                    <Badge variant="outline">
                      {completed}/{linkedMins.length}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add MIN Form */}
      <MinForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        powerGoals={mockPowerGoals}
        onSubmit={handleAddMin}
      />
    </div>
  );
}
