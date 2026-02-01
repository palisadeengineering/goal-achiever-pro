'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Plus,
  Target,
  Rocket,
  TrendingUp,
  Star,
  Calendar,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Archive,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Project {
  id: string;
  title: string;
  description: string | null;
  color: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  progress_percentage: number;
  is_focused: boolean;
  target_date: string | null;
  clarity_score: number;
  belief_score: number;
  consistency_score: number;
  created_at: string;
  project_key_results?: Array<{
    id: string;
    name: string;
    progress_percentage: number;
    status: string;
  }>;
}

async function fetchProjects(): Promise<{ projects: Project[] }> {
  const response = await fetch('/api/projects-v2');
  if (!response.ok) throw new Error('Failed to fetch projects');
  return response.json();
}

async function createProject(data: {
  title: string;
  description?: string;
  color?: string;
  targetDate?: string;
}): Promise<{ project: Project }> {
  const response = await fetch('/api/projects-v2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create project');
  return response.json();
}

async function deleteProject(id: string): Promise<void> {
  const response = await fetch(`/api/projects-v2/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete project');
}

async function updateProject(id: string, data: Partial<Project>): Promise<{ project: Project }> {
  const response = await fetch(`/api/projects-v2/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update project');
  return response.json();
}

const PROJECT_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
];

export default function ProjectsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    color: PROJECT_COLORS[0],
    targetDate: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['projects-v2'],
    queryFn: fetchProjects,
  });

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-v2'] });
      setIsCreateOpen(false);
      setNewProject({ title: '', description: '', color: PROJECT_COLORS[0], targetDate: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-v2'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) => updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects-v2'] });
    },
  });

  const projects = data?.projects || [];
  const activeProjects = projects.filter(p => p.status === 'active');
  const focusedProject = projects.find(p => p.is_focused);
  const avgProgress = projects.length > 0
    ? Math.round(projects.reduce((sum, p) => sum + p.progress_percentage, 0) / projects.length)
    : 0;

  const handleCreateProject = () => {
    if (!newProject.title.trim()) return;
    createMutation.mutate({
      title: newProject.title,
      description: newProject.description || undefined,
      color: newProject.color,
      targetDate: newProject.targetDate || undefined,
    });
  };

  const handleSetFocus = (projectId: string) => {
    // Unfocus current focused project
    if (focusedProject && focusedProject.id !== projectId) {
      updateMutation.mutate({ id: focusedProject.id, data: { is_focused: false } as Partial<Project> });
    }
    // Focus new project
    updateMutation.mutate({ id: projectId, data: { is_focused: true } as Partial<Project> });
  };

  const get300Score = (project: Project) => {
    return (project.clarity_score + project.belief_score + project.consistency_score) * 10;
  };

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
        title="Projects"
        description="Your SMART goals with measurable Key Results - focus on one project at a time"
        actions={
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="title">Project Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Grow revenue to $2M"
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="What do you want to achieve?"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="targetDate">Target Date (optional)</Label>
                  <Input
                    id="targetDate"
                    type="date"
                    value={newProject.targetDate}
                    onChange={(e) => setNewProject({ ...newProject, targetDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Color</Label>
                  <div className="flex gap-2 mt-2">
                    {PROJECT_COLORS.map((color) => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          newProject.color === color ? 'border-foreground scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewProject({ ...newProject, color })}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateProject} disabled={createMutation.isPending}>
                    {createMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Create Project
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Rocket className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold">{projects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{activeProjects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
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
                <p className="text-sm text-muted-foreground">Focus</p>
                <p className="text-sm font-medium line-clamp-1">
                  {focusedProject?.title || 'None set'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Focused Project Highlight */}
      {focusedProject && (
        <Card
          className="border-2 cursor-pointer hover:shadow-md transition-shadow"
          style={{ borderColor: focusedProject.color }}
          onClick={() => router.push(`/projects/${focusedProject.id}`)}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <CardTitle className="text-lg">Current Focus</CardTitle>
              </div>
              <Badge
                style={{ backgroundColor: focusedProject.color, color: 'white' }}
              >
                {get300Score(focusedProject)}% 300 Score
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">{focusedProject.title}</h3>
                {focusedProject.description && (
                  <p className="text-muted-foreground line-clamp-2">{focusedProject.description}</p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="text-2xl font-bold">{focusedProject.progress_percentage}%</p>
                </div>
                <div className="w-32">
                  <Progress
                    value={focusedProject.progress_percentage}
                    className="h-3"
                    style={{ '--progress-color': focusedProject.color } as React.CSSProperties}
                  />
                </div>
              </div>
            </div>
            {focusedProject.project_key_results && focusedProject.project_key_results.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {focusedProject.project_key_results.slice(0, 3).map((kr) => (
                  <Badge key={kr.id} variant="outline" className="bg-white">
                    {kr.name}: {kr.progress_percentage}%
                  </Badge>
                ))}
                {focusedProject.project_key_results.length > 3 && (
                  <Badge variant="outline" className="bg-white">
                    +{focusedProject.project_key_results.length - 3} more
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Rocket className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No projects yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first project to start tracking your goals with measurable Key Results
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="cursor-pointer hover:shadow-md transition-shadow group relative"
              onClick={() => router.push(`/projects/${project.id}`)}
            >
              <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-lg"
                style={{ backgroundColor: project.color }}
              />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base line-clamp-1 flex items-center gap-2">
                      {project.is_focused && (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                      )}
                      {project.title}
                    </CardTitle>
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {project.description}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!project.is_focused && (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleSetFocus(project.id);
                        }}>
                          <Star className="h-4 w-4 mr-2" />
                          Set as Focus
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/projects/${project.id}`);
                      }}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          updateMutation.mutate({
                            id: project.id,
                            data: { status: 'archived' } as Partial<Project>,
                          });
                        }}
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this project? This cannot be undone.')) {
                            deleteMutation.mutate(project.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{project.progress_percentage}%</span>
                    </div>
                    <Progress value={project.progress_percentage} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Target className="h-3.5 w-3.5" />
                      <span>
                        {project.project_key_results?.length || 0} Key Results
                      </span>
                    </div>
                    {project.target_date && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {new Date(project.target_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <div
                      className="h-1.5 flex-1 rounded-full"
                      style={{
                        backgroundColor: project.clarity_score >= 7 ? '#22c55e' : project.clarity_score >= 4 ? '#eab308' : '#ef4444',
                        opacity: 0.7,
                      }}
                      title={`Clarity: ${project.clarity_score}/10`}
                    />
                    <div
                      className="h-1.5 flex-1 rounded-full"
                      style={{
                        backgroundColor: project.belief_score >= 7 ? '#22c55e' : project.belief_score >= 4 ? '#eab308' : '#ef4444',
                        opacity: 0.7,
                      }}
                      title={`Belief: ${project.belief_score}/10`}
                    />
                    <div
                      className="h-1.5 flex-1 rounded-full"
                      style={{
                        backgroundColor: project.consistency_score >= 7 ? '#22c55e' : project.consistency_score >= 4 ? '#eab308' : '#ef4444',
                        opacity: 0.7,
                      }}
                      title={`Consistency: ${project.consistency_score}/10`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
