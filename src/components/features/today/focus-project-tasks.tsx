'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Target,
  Loader2,
  Clock,
  AlertCircle,
  CheckCircle2,
  Plus,
  Star,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Project {
  id: string;
  title: string;
  color: string;
  is_focused: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  estimated_minutes: number | null;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduled_date: string | null;
  project_id: string;
  milestone_id: string | null;
}

interface FocusProjectTasksProps {
  onTaskComplete?: (taskId: string, xpAwarded: number) => void;
}

export function FocusProjectTasks({ onTaskComplete }: FocusProjectTasksProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchTasks(selectedProjectId);
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects-v2');
      if (!response.ok) throw new Error('Failed to fetch projects');
      const result = await response.json();
      const projectList = result.projects || [];
      setProjects(projectList);

      // Auto-select focused project
      const focusedProject = projectList.find((p: Project) => p.is_focused);
      if (focusedProject) {
        setSelectedProjectId(focusedProject.id);
      } else if (projectList.length > 0) {
        setSelectedProjectId(projectList[0].id);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTasks = useCallback(async (projectId: string) => {
    setIsLoadingTasks(true);
    try {
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(
        `/api/tasks-v2?projectId=${projectId}&scheduledDate=${today}`
      );
      if (!response.ok) throw new Error('Failed to fetch tasks');
      const result = await response.json();
      const taskList = result.tasks || [];
      // Sort: high priority first, then pending, then in_progress
      const sorted = taskList.sort((a: Task, b: Task) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        const statusOrder = { in_progress: 0, pending: 1, completed: 2 };
        if (a.status === 'completed' && b.status !== 'completed') return 1;
        if (b.status === 'completed' && a.status !== 'completed') return -1;
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return statusOrder[a.status] - statusOrder[b.status];
      });
      setTasks(sorted);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setIsLoadingTasks(false);
    }
  }, []);

  const handleToggleComplete = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    setCompletingIds((prev) => new Set(prev).add(task.id));

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );

    try {
      const response = await fetch(`/api/tasks-v2/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update task');

      const result = await response.json();

      if (newStatus === 'completed') {
        // Check if XP was awarded
        if (result.xpAwarded && result.xpAwarded > 0) {
          toast.success(
            <div className="flex flex-col gap-1">
              <span>Task completed!</span>
              <span className="text-sm text-yellow-500">+{result.xpAwarded} XP earned</span>
            </div>
          );
          onTaskComplete?.(task.id, result.xpAwarded);
        } else {
          toast.success('Task completed!');
        }
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
      // Revert optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t))
      );
    } finally {
      setCompletingIds((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const totalCount = tasks.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const totalMinutes = tasks
    .filter((t) => t.status !== 'completed')
    .reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Focus Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <AlertCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            Create a project to start tracking tasks
          </p>
          <Link href="/projects">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Focus Tasks
          </CardTitle>
          {totalCount > 0 && (
            <Badge variant="secondary">
              {completedCount}/{totalCount}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Project Selector */}
        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: project.color || '#3B82F6' }}
                  />
                  <span>{project.title}</span>
                  {project.is_focused && (
                    <Badge variant="secondary" className="text-xs ml-1">
                      Focused
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Progress Bar */}
        {totalCount > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Today's progress</span>
              <span className="font-medium">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
            {totalMinutes > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>~{Math.round(totalMinutes / 60)}h {totalMinutes % 60}m remaining</span>
              </div>
            )}
          </div>
        )}

        {/* Task List */}
        {isLoadingTasks ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-6">
            <Target className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              No tasks scheduled for today
            </p>
            <Link href={`/projects/${selectedProjectId}`}>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Tasks
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border transition-all',
                  task.status === 'completed'
                    ? 'bg-muted/20 border-muted'
                    : 'bg-background hover:border-primary/30'
                )}
              >
                <Checkbox
                  checked={task.status === 'completed'}
                  onCheckedChange={() => handleToggleComplete(task)}
                  disabled={completingIds.has(task.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        task.status === 'completed' && 'line-through text-muted-foreground'
                      )}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {task.priority !== 'low' && (
                        <Badge className={cn('text-xs', getPriorityColor(task.priority))}>
                          {task.priority}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {task.description && (
                    <p
                      className={cn(
                        'text-xs text-muted-foreground mt-0.5 line-clamp-1',
                        task.status === 'completed' && 'line-through'
                      )}
                    >
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                    {task.estimated_minutes && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{task.estimated_minutes}m</span>
                      </div>
                    )}
                    {task.status === 'completed' && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Done</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        {selectedProject && tasks.length > 0 && (
          <div className="flex gap-2 pt-2 border-t">
            <Link href={`/projects/${selectedProjectId}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <Target className="h-4 w-4 mr-2" />
                View Project
              </Button>
            </Link>
            <Link href={`/projects/${selectedProjectId}?tab=tasks`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
