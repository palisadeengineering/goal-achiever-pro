'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  CheckCircle2,
  Clock,
  Target,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { MinsList } from '@/components/features/mins/mins-list';
import { MinForm, MinFormData } from '@/components/features/mins/min-form';
import { ShareButton } from '@/components/features/sharing';
import { useMins, useCreateMin, useUpdateMin, useDeleteMin, useToggleMinComplete, type Min } from '@/lib/hooks';
import { useImpactProjects } from '@/lib/hooks/use-impact-projects';
import type { ValueQuadrant } from '@/types/database';

// Transform API response to component props
function transformMinToProps(min: Min) {
  return {
    id: min.id,
    title: min.title,
    description: min.description || undefined,
    scheduledTime: min.scheduled_time || undefined,
    durationMinutes: min.duration_minutes,
    priority: min.priority,
    status: min.status,
    valueQuadrant: min.drip_quadrant as ValueQuadrant | undefined,
    impactProjectTitle: min.impact_projects?.title,
  };
}

export default function MinsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeScopeFilter, setTimeScopeFilter] = useState<'all' | 'daily' | 'weekly'>('all');

  const dateString = selectedDate.toISOString().split('T')[0];

  // Fetch MINS for selected date
  const {
    data: mins = [],
    isLoading,
    isError,
    error,
  } = useMins({
    date: dateString,
    timeScope: timeScopeFilter === 'all' ? undefined : timeScopeFilter,
  });

  // Fetch impact projects for the form dropdown
  const { data: impactProjects = [] } = useImpactProjects();

  // Mutations
  const createMin = useCreateMin();
  const updateMin = useUpdateMin();
  const deleteMin = useDeleteMin();
  const toggleComplete = useToggleMinComplete();

  // Transform impact projects for the form
  const formImpactProjects = useMemo(() => {
    return impactProjects.map((p) => ({
      id: p.id,
      title: p.title,
    }));
  }, [impactProjects]);

  // Transform mins for the list component
  const transformedMins = useMemo(() => {
    return mins.map(transformMinToProps);
  }, [mins]);

  // Calculate stats
  const totalMins = mins.length;
  const completedMins = mins.filter((m) => m.status === 'completed').length;
  const completionRate = totalMins > 0 ? Math.round((completedMins / totalMins) * 100) : 0;
  const totalMinutes = mins.reduce((sum, m) => sum + m.duration_minutes, 0);
  const completedMinutes = mins
    .filter((m) => m.status === 'completed')
    .reduce((sum, m) => sum + m.duration_minutes, 0);

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
    const min = mins.find((m) => m.id === id);
    const isCurrentlyCompleted = min?.status === 'completed';
    toggleComplete.mutate(id, isCurrentlyCompleted);
  };

  const handleAddMin = async (data: MinFormData) => {
    await createMin.mutateAsync({
      title: data.title,
      description: data.description || undefined,
      scheduledDate: data.scheduledDate,
      scheduledTime: data.scheduledTime || undefined,
      durationMinutes: data.durationMinutes,
      priority: data.priority,
      timeScope: data.timeScope,
      weekStartDate: data.weekStartDate || undefined,
      weekEndDate: data.weekEndDate || undefined,
      valueQuadrant: data.valueQuadrant || undefined,
      impactProjectId: data.impactProjectId || undefined,
    });
  };

  const handleEditMin = (id: string) => {
    // TODO: Implement edit functionality
    console.log('Edit MIN:', id);
  };

  const handleDeleteMin = (id: string) => {
    deleteMin.mutate(id);
  };

  const handleStartPomodoro = (id: string) => {
    // Set status to in_progress
    updateMin.mutate({
      id,
      status: 'in_progress',
    });
  };

  // Filter mins by status
  const pendingMins = transformedMins.filter((m) => m.status === 'pending');
  const inProgressMins = transformedMins.filter((m) => m.status === 'in_progress');
  const completedMinsList = transformedMins.filter((m) => m.status === 'completed');

  // Impact projects summary for sidebar
  const impactProjectSummary = useMemo(() => {
    const projectMap = new Map<string, { title: string; total: number; completed: number }>();

    mins.forEach((min) => {
      if (min.impact_projects) {
        const projectId = min.impact_projects.id;
        const existing = projectMap.get(projectId) || {
          title: min.impact_projects.title,
          total: 0,
          completed: 0,
        };
        existing.total += 1;
        if (min.status === 'completed') {
          existing.completed += 1;
        }
        projectMap.set(projectId, existing);
      }
    });

    return Array.from(projectMap.values()).slice(0, 3);
  }, [mins]);

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Daily & Weekly MINS"
          description="Most Important Next Steps - your daily & weekly action items"
        />
        <Card className="p-6">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load MINS: {error?.message || 'Unknown error'}</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily & Weekly MINS"
        description="Most Important Next Steps - your daily & weekly action items"
        actions={
          <div className="flex items-center gap-2">
            <ShareButton tabName="mins" />
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add MIN
            </Button>
          </div>
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
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total MINS</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{totalMins}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{completedMins}/{totalMins}</p>
                )}
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
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <p className="text-2xl font-bold">
                    {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
                  </p>
                )}
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
                {isLoading ? (
                  <Skeleton className="h-8 w-14" />
                ) : (
                  <p className="text-2xl font-bold">{completionRate}%</p>
                )}
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
      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Time Scope Filter */}
          <div className="flex flex-wrap gap-2 mb-4">
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

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <Tabs defaultValue="all">
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-4 scrollbar-hide">
                <TabsList className="inline-flex w-max sm:w-auto">
                  <TabsTrigger value="all">All ({transformedMins.length})</TabsTrigger>
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
              </div>

              <TabsContent value="all">
                <MinsList
                  mins={transformedMins}
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
          )}
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
                <p className="font-medium mb-1">Link to Impact Projects</p>
                <p className="text-muted-foreground">
                  Connect MINS to your Impact Projects for better tracking.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Linked Impact Projects Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Linked Impact Projects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
                </div>
              ) : impactProjectSummary.length > 0 ? (
                impactProjectSummary.map((project, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm truncate flex-1">{project.title}</span>
                    <Badge variant="outline">
                      {project.completed}/{project.total}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No linked projects for today
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add MIN Form */}
      <MinForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        impactProjects={formImpactProjects}
        onSubmit={handleAddMin}
      />
    </div>
  );
}
