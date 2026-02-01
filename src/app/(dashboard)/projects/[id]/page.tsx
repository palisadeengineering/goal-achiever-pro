'use client';

import { useState, use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Plus,
  Target,
  Milestone,
  CheckSquare,
  TrendingUp,
  Calendar,
  Loader2,
  ArrowLeft,
  Star,
  Trophy,
  Pencil,
  Trash2,
  Save,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface KeyResult {
  id: string;
  name: string;
  description: string | null;
  target_value: number;
  current_value: number;
  starting_value: number;
  unit_type: string;
  unit_label: string | null;
  progress_percentage: number;
  status: string;
}

interface MilestoneV2 {
  id: string;
  title: string;
  description: string | null;
  quarter: number | null;
  year: number | null;
  target_date: string | null;
  progress_percentage: number;
  status: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  scheduled_date: string | null;
  estimated_minutes: number;
}

interface ProjectWithRelations {
  id: string;
  title: string;
  description: string | null;
  color: string;
  specific: string | null;
  measurable: string | null;
  attainable: string | null;
  realistic: string | null;
  time_bound: string | null;
  start_date: string | null;
  target_date: string | null;
  clarity_score: number;
  belief_score: number;
  consistency_score: number;
  progress_percentage: number;
  is_focused: boolean;
  status: string;
  affirmation_text: string | null;
  keyResults: KeyResult[];
  milestones: MilestoneV2[];
  tasks: Task[];
  todayCheckIn: {
    clarity_score: number;
    belief_score: number;
    consistency_score: number;
    total_score: number;
  } | null;
}

async function fetchProject(id: string): Promise<{ project: ProjectWithRelations }> {
  const response = await fetch(`/api/projects-v2/${id}`);
  if (!response.ok) throw new Error('Failed to fetch project');
  return response.json();
}

async function updateProject(id: string, data: Record<string, unknown>): Promise<{ project: ProjectWithRelations }> {
  const response = await fetch(`/api/projects-v2/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update project');
  return response.json();
}

async function createKeyResult(data: {
  projectId: string;
  name: string;
  targetValue: number;
  unitType?: string;
  unitLabel?: string;
}): Promise<{ keyResult: KeyResult }> {
  const response = await fetch('/api/project-key-results', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create key result');
  return response.json();
}

async function updateKeyResult(id: string, data: Record<string, unknown>): Promise<{ keyResult: KeyResult }> {
  const response = await fetch(`/api/project-key-results/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update key result');
  return response.json();
}

async function submitCheckIn(data: {
  projectId: string;
  clarityScore: number;
  beliefScore: number;
  consistencyScore: number;
}): Promise<unknown> {
  const response = await fetch('/api/daily-checkins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to submit check-in');
  return response.json();
}

export default function ProjectHubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    specific: '',
    measurable: '',
    attainable: '',
    realistic: '',
    timeBound: '',
    affirmationText: '',
  });

  const [checkInScores, setCheckInScores] = useState({
    clarity: 7,
    belief: 7,
    consistency: 7,
  });

  const [isAddKROpen, setIsAddKROpen] = useState(false);
  const [newKR, setNewKR] = useState({
    name: '',
    targetValue: 100,
    unitType: 'number',
    unitLabel: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['project-v2', id],
    queryFn: () => fetchProject(id),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-v2', id] });
      setIsEditing(false);
    },
  });

  const createKRMutation = useMutation({
    mutationFn: createKeyResult,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-v2', id] });
      setIsAddKROpen(false);
      setNewKR({ name: '', targetValue: 100, unitType: 'number', unitLabel: '' });
    },
  });

  const updateKRMutation = useMutation({
    mutationFn: ({ krId, data }: { krId: string; data: Record<string, unknown> }) => updateKeyResult(krId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-v2', id] });
    },
  });

  const checkInMutation = useMutation({
    mutationFn: submitCheckIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-v2', id] });
    },
  });

  const project = data?.project;

  const handleStartEditing = () => {
    if (project) {
      setEditForm({
        title: project.title,
        description: project.description || '',
        specific: project.specific || '',
        measurable: project.measurable || '',
        attainable: project.attainable || '',
        realistic: project.realistic || '',
        timeBound: project.time_bound || '',
        affirmationText: project.affirmation_text || '',
      });
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    updateMutation.mutate(editForm);
  };

  const handleSubmitCheckIn = () => {
    checkInMutation.mutate({
      projectId: id,
      clarityScore: checkInScores.clarity,
      beliefScore: checkInScores.belief,
      consistencyScore: checkInScores.consistency,
    });
  };

  const handleCreateKR = () => {
    if (!newKR.name.trim()) return;
    createKRMutation.mutate({
      projectId: id,
      name: newKR.name,
      targetValue: newKR.targetValue,
      unitType: newKR.unitType,
      unitLabel: newKR.unitLabel || undefined,
    });
  };

  const handleUpdateKRValue = (krId: string, currentValue: number) => {
    updateKRMutation.mutate({ krId, data: { currentValue } });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground mb-4">Project not found</p>
        <Button variant="outline" onClick={() => router.push('/projects')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
      </div>
    );
  }

  const totalScore = (project.clarity_score + project.belief_score + project.consistency_score) * 10;
  const completedTasks = project.tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = project.tasks.filter(t => t.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Custom Header with Edit Mode Support */}
      <div className="flex flex-col gap-4 pb-4 md:pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3 md:gap-4 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 mt-1"
              onClick={() => router.push('/projects')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div
              className="w-4 h-4 rounded-full shrink-0 mt-2"
              style={{ backgroundColor: project.color }}
            />
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="text-xl font-bold mb-2"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-bold tracking-tight">{project.title}</h1>
                  {project.is_focused && (
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  )}
                </div>
              )}
              {isEditing ? (
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Project description..."
                  className="mt-2"
                />
              ) : (
                <p className="text-sm md:text-base text-muted-foreground">
                  {project.description || 'No description'}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={handleStartEditing}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Progress</p>
              <p className="text-2xl font-bold">{project.progress_percentage}%</p>
              <Progress value={project.progress_percentage} className="h-2 mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">300% Score</p>
              <p className="text-2xl font-bold">{totalScore}%</p>
              <div className="flex gap-1 mt-2">
                <div className="h-2 flex-1 rounded-full bg-blue-500" style={{ opacity: project.clarity_score / 10 }} />
                <div className="h-2 flex-1 rounded-full bg-purple-500" style={{ opacity: project.belief_score / 10 }} />
                <div className="h-2 flex-1 rounded-full bg-green-500" style={{ opacity: project.consistency_score / 10 }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Key Results</p>
              <p className="text-2xl font-bold">{project.keyResults.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {project.keyResults.filter(kr => kr.status === 'completed').length} completed
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Milestones</p>
              <p className="text-2xl font-bold">{project.milestones.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {project.milestones.filter(m => m.status === 'completed').length} completed
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Tasks</p>
              <p className="text-2xl font-bold">{completedTasks}/{project.tasks.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {pendingTasks} pending
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 300% Check-In Card */}
      <Card className="border-2" style={{ borderColor: project.color }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Daily 300% Check-In
          </CardTitle>
          <CardDescription>
            Rate your clarity, belief, and consistency today (1-10 each, max 300%)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {project.todayCheckIn ? (
            <div className="text-center py-4">
              <p className="text-4xl font-bold" style={{ color: project.color }}>
                {project.todayCheckIn.total_score}%
              </p>
              <p className="text-muted-foreground mt-2">
                Clarity: {project.todayCheckIn.clarity_score} | Belief: {project.todayCheckIn.belief_score} | Consistency: {project.todayCheckIn.consistency_score}
              </p>
              <p className="text-sm text-muted-foreground mt-2">Already checked in today</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Clarity - Do you know exactly what to do?</Label>
                  <span className="font-bold">{checkInScores.clarity}</span>
                </div>
                <Slider
                  value={[checkInScores.clarity]}
                  onValueChange={([v]) => setCheckInScores({ ...checkInScores, clarity: v })}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Belief - Do you believe you&apos;ll hit your target?</Label>
                  <span className="font-bold">{checkInScores.belief}</span>
                </div>
                <Slider
                  value={[checkInScores.belief]}
                  onValueChange={([v]) => setCheckInScores({ ...checkInScores, belief: v })}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Consistency - Did you show up yesterday?</Label>
                  <span className="font-bold">{checkInScores.consistency}</span>
                </div>
                <Slider
                  value={[checkInScores.consistency]}
                  onValueChange={([v]) => setCheckInScores({ ...checkInScores, consistency: v })}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="text-2xl font-bold">
                    {(checkInScores.clarity + checkInScores.belief + checkInScores.consistency) * 10}%
                  </p>
                  <p className="text-sm text-muted-foreground">Total Score</p>
                </div>
                <Button onClick={handleSubmitCheckIn} disabled={checkInMutation.isPending}>
                  {checkInMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Submit Check-In
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs for Key Results, Milestones, Tasks, SMART */}
      <Tabs defaultValue="key-results">
        <TabsList>
          <TabsTrigger value="key-results">
            <Target className="h-4 w-4 mr-2" />
            Key Results ({project.keyResults.length})
          </TabsTrigger>
          <TabsTrigger value="milestones">
            <Milestone className="h-4 w-4 mr-2" />
            Milestones ({project.milestones.length})
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <CheckSquare className="h-4 w-4 mr-2" />
            Tasks ({project.tasks.length})
          </TabsTrigger>
          <TabsTrigger value="smart">
            <TrendingUp className="h-4 w-4 mr-2" />
            SMART Goal
          </TabsTrigger>
        </TabsList>

        {/* Key Results Tab */}
        <TabsContent value="key-results" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Key Results</h3>
            <Dialog open={isAddKROpen} onOpenChange={setIsAddKROpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Key Result
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Key Result</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      placeholder="e.g., Monthly Recurring Revenue"
                      value={newKR.name}
                      onChange={(e) => setNewKR({ ...newKR, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Target Value</Label>
                    <Input
                      type="number"
                      value={newKR.targetValue}
                      onChange={(e) => setNewKR({ ...newKR, targetValue: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Unit Label (optional)</Label>
                    <Input
                      placeholder="e.g., $, users, %"
                      value={newKR.unitLabel}
                      onChange={(e) => setNewKR({ ...newKR, unitLabel: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddKROpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateKR} disabled={createKRMutation.isPending}>
                      Create
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {project.keyResults.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No key results yet. Add measurable outcomes to track your progress.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {project.keyResults.map((kr) => (
                <Card key={kr.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{kr.name}</h4>
                        {kr.description && (
                          <p className="text-sm text-muted-foreground">{kr.description}</p>
                        )}
                      </div>
                      <Badge variant={kr.status === 'completed' ? 'default' : 'secondary'}>
                        {kr.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>
                          {kr.unit_label || ''}{Number(kr.current_value).toLocaleString()} / {kr.unit_label || ''}{Number(kr.target_value).toLocaleString()}
                        </span>
                        <span className="font-medium">{kr.progress_percentage}%</span>
                      </div>
                      <Progress value={kr.progress_percentage} className="h-2" />
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          type="number"
                          placeholder="Update value"
                          className="w-32 h-8"
                          defaultValue={kr.current_value}
                          onBlur={(e) => {
                            const newValue = Number(e.target.value);
                            if (newValue !== kr.current_value) {
                              handleUpdateKRValue(kr.id, newValue);
                            }
                          }}
                        />
                        <span className="text-sm text-muted-foreground">
                          Update current value
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Milestones</h3>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Milestone
            </Button>
          </div>

          {project.milestones.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No milestones yet. Add quarterly checkpoints to track major achievements.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {project.milestones.map((milestone) => (
                <Card key={milestone.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{milestone.title}</h4>
                        {milestone.description && (
                          <p className="text-sm text-muted-foreground">{milestone.description}</p>
                        )}
                        <div className="flex gap-2 mt-2">
                          {milestone.quarter && (
                            <Badge variant="outline">Q{milestone.quarter}</Badge>
                          )}
                          {milestone.target_date && (
                            <Badge variant="outline">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(milestone.target_date).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{milestone.progress_percentage}%</p>
                        <Badge variant={milestone.status === 'completed' ? 'default' : 'secondary'}>
                          {milestone.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Tasks</h3>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>

          {project.tasks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No tasks yet. Break down your project into actionable tasks.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {project.tasks.map((task) => (
                <Card key={task.id} className={task.status === 'completed' ? 'opacity-60' : ''}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckSquare
                          className={`h-5 w-5 ${
                            task.status === 'completed' ? 'text-green-500' : 'text-muted-foreground'
                          }`}
                        />
                        <div>
                          <p className={task.status === 'completed' ? 'line-through' : ''}>
                            {task.title}
                          </p>
                          {task.scheduled_date && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(task.scheduled_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            task.priority === 'urgent' ? 'destructive' :
                            task.priority === 'high' ? 'default' :
                            'secondary'
                          }
                        >
                          {task.priority}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {task.estimated_minutes}m
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* SMART Goal Tab */}
        <TabsContent value="smart" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SMART Goal Definition</CardTitle>
              <CardDescription>
                Define your goal using the SMART framework for clarity and accountability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <Label className="font-semibold">S - Specific</Label>
                    <Textarea
                      placeholder="What exactly do you want to achieve?"
                      value={editForm.specific}
                      onChange={(e) => setEditForm({ ...editForm, specific: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="font-semibold">M - Measurable</Label>
                    <Textarea
                      placeholder="How will you measure success?"
                      value={editForm.measurable}
                      onChange={(e) => setEditForm({ ...editForm, measurable: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="font-semibold">A - Attainable</Label>
                    <Textarea
                      placeholder="Is this goal achievable? What resources do you need?"
                      value={editForm.attainable}
                      onChange={(e) => setEditForm({ ...editForm, attainable: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="font-semibold">R - Realistic</Label>
                    <Textarea
                      placeholder="Is this goal relevant to your bigger vision?"
                      value={editForm.realistic}
                      onChange={(e) => setEditForm({ ...editForm, realistic: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="font-semibold">T - Time-Bound</Label>
                    <Input
                      type="date"
                      value={editForm.timeBound}
                      onChange={(e) => setEditForm({ ...editForm, timeBound: e.target.value })}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label className="font-semibold text-blue-600">S - Specific</Label>
                    <p className="mt-1 text-muted-foreground">
                      {project.specific || 'Not defined yet'}
                    </p>
                  </div>
                  <div>
                    <Label className="font-semibold text-green-600">M - Measurable</Label>
                    <p className="mt-1 text-muted-foreground">
                      {project.measurable || 'Not defined yet'}
                    </p>
                  </div>
                  <div>
                    <Label className="font-semibold text-yellow-600">A - Attainable</Label>
                    <p className="mt-1 text-muted-foreground">
                      {project.attainable || 'Not defined yet'}
                    </p>
                  </div>
                  <div>
                    <Label className="font-semibold text-orange-600">R - Realistic</Label>
                    <p className="mt-1 text-muted-foreground">
                      {project.realistic || 'Not defined yet'}
                    </p>
                  </div>
                  <div>
                    <Label className="font-semibold text-red-600">T - Time-Bound</Label>
                    <p className="mt-1 text-muted-foreground">
                      {project.time_bound
                        ? new Date(project.time_bound).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'Not defined yet'}
                    </p>
                  </div>
                </>
              )}

              {project.affirmation_text && (
                <div className="pt-4 border-t">
                  <Label className="font-semibold text-purple-600">Affirmation</Label>
                  <p className="mt-1 italic text-muted-foreground">
                    &ldquo;{project.affirmation_text}&rdquo;
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
