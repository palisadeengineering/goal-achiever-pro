'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, Loader2, Check, TrendingUp, Eye, Heart, Target, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  title: string;
  color: string;
  is_focused: boolean;
}

interface CheckinData {
  id: string;
  clarity_score: number;
  belief_score: number;
  consistency_score: number;
  notes: string | null;
  created_at: string;
}

export function ProjectCheckinWidget() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [todayCheckin, setTodayCheckin] = useState<CheckinData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Local state for editing
  const [clarity, setClarity] = useState(5);
  const [belief, setBelief] = useState(5);
  const [consistency, setConsistency] = useState(5);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchTodayCheckin(selectedProjectId);
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects-v2');
      if (!response.ok) throw new Error('Failed to fetch projects');
      const result = await response.json();
      const projectList = result.projects || [];
      setProjects(projectList);

      // Auto-select focused project or first project
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

  const fetchTodayCheckin = async (projectId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/daily-checkins?projectId=${projectId}&date=${today}`);
      if (!response.ok) throw new Error('Failed to fetch check-in');
      const result = await response.json();
      const checkIns = result.checkIns || [];
      const todayData = checkIns.length > 0 ? checkIns[0] : null;

      if (todayData) {
        setTodayCheckin(todayData);
        setClarity(todayData.clarity_score);
        setBelief(todayData.belief_score);
        setConsistency(todayData.consistency_score);
        setHasChanges(false);
      } else {
        setTodayCheckin(null);
        setClarity(5);
        setBelief(5);
        setConsistency(5);
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Error fetching check-in:', error);
      setTodayCheckin(null);
    }
  };

  const handleSliderChange = (setter: (val: number) => void, value: number[]) => {
    setter(value[0]);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!selectedProjectId) {
      toast.error('Please select a project');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/daily-checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProjectId,
          clarityScore: clarity,
          beliefScore: belief,
          consistencyScore: consistency,
        }),
      });

      if (!response.ok) throw new Error('Failed to save check-in');

      const result = await response.json();
      setTodayCheckin(result.checkin);
      setHasChanges(false);

      // Check if XP was awarded
      if (result.xpAwarded && result.xpAwarded > 0) {
        toast.success(
          <div className="flex flex-col gap-1">
            <span>300% check-in saved!</span>
            <span className="text-sm text-yellow-500">+{result.xpAwarded} XP earned</span>
          </div>
        );
      } else {
        toast.success('300% check-in saved!');
      }
    } catch (error) {
      console.error('Error saving check-in:', error);
      toast.error('Failed to save check-in');
    } finally {
      setIsSaving(false);
    }
  };

  const total = (clarity + belief + consistency) * 10; // Convert 1-10 scale to percentage (max 300)
  const totalPercent = Math.round((total / 300) * 100);

  const getScoreColor = (score: number) => {
    if (score >= 250) return 'text-green-500';
    if (score >= 200) return 'text-cyan-500';
    if (score >= 150) return 'text-yellow-500';
    if (score >= 100) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 270) return 'Outstanding';
    if (score >= 240) return 'Excellent';
    if (score >= 200) return 'Good';
    if (score >= 150) return 'Moderate';
    if (score >= 100) return 'Needs Work';
    return 'Low';
  };

  const getLowScorePrompt = () => {
    if (clarity < 7) return { type: 'clarity', message: "Let's get clear - what's your #1 priority today?" };
    if (belief < 7) return { type: 'belief', message: "Remember your wins and progress made so far" };
    if (consistency < 7) return { type: 'consistency', message: "Streak recovery: complete 3 small wins today" };
    return null;
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

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
            <Sparkles className="h-5 w-5 text-purple-500" />
            300% Check-in
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <AlertCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Create a project to start tracking your 300% score
          </p>
        </CardContent>
      </Card>
    );
  }

  const lowScorePrompt = getLowScorePrompt();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            300% Check-in
          </CardTitle>
          {total >= 250 && (
            <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
              <TrendingUp className="h-3 w-3" />
              On Track
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
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

        {/* Score Display */}
        <div className="text-center py-3 bg-muted/30 rounded-lg">
          <div className={cn('text-4xl font-bold', getScoreColor(total))}>
            {total}%
          </div>
          <div className="text-sm text-muted-foreground mt-1">{getScoreLabel(total)}</div>
          {selectedProject && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: selectedProject.color || '#3B82F6' }}
              />
              <span className="text-xs text-muted-foreground">{selectedProject.title}</span>
            </div>
          )}
        </div>

        {/* Low Score Prompt */}
        {lowScorePrompt && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {lowScorePrompt.message}
            </p>
          </div>
        )}

        {/* Sliders */}
        <div className="space-y-4">
          {/* Clarity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm">
                <Eye className="h-4 w-4 text-blue-500" />
                Clarity
              </Label>
              <span className="text-sm font-medium">{clarity}/10</span>
            </div>
            <Slider
              value={[clarity]}
              onValueChange={(v) => handleSliderChange(setClarity, v)}
              min={1}
              max={10}
              step={1}
              className="[&_[role=slider]]:bg-blue-500"
            />
            <p className="text-xs text-muted-foreground">
              Do you know exactly what to do today?
            </p>
          </div>

          {/* Belief */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm">
                <Heart className="h-4 w-4 text-pink-500" />
                Belief
              </Label>
              <span className="text-sm font-medium">{belief}/10</span>
            </div>
            <Slider
              value={[belief]}
              onValueChange={(v) => handleSliderChange(setBelief, v)}
              min={1}
              max={10}
              step={1}
              className="[&_[role=slider]]:bg-pink-500"
            />
            <p className="text-xs text-muted-foreground">
              Do you believe you'll hit your target?
            </p>
          </div>

          {/* Consistency */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-purple-500" />
                Consistency
              </Label>
              <span className="text-sm font-medium">{consistency}/10</span>
            </div>
            <Slider
              value={[consistency]}
              onValueChange={(v) => handleSliderChange(setConsistency, v)}
              min={1}
              max={10}
              step={1}
              className="[&_[role=slider]]:bg-purple-500"
            />
            <p className="text-xs text-muted-foreground">
              Did you show up yesterday?
            </p>
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isSaving || (!hasChanges && todayCheckin !== null)}
          className="w-full"
          variant={hasChanges ? 'default' : 'secondary'}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : todayCheckin && !hasChanges ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Saved Today
            </>
          ) : (
            'Save Check-in'
          )}
        </Button>

        {/* Tip */}
        <p className="text-xs text-muted-foreground text-center">
          Check in each morning to stay aligned with your goals
        </p>
      </CardContent>
    </Card>
  );
}
