'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, Loader2, ChevronDown, ChevronUp, Calendar, Target, CheckCircle2, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TargetGenerationWizard } from '@/components/features/targets';
import { toast } from 'sonner';

interface Project {
  title: string;
  description: string;
  quarter: number;
  category: string;
  dependencies: string[];
  keyMilestones: string[];
}

interface ProjectPlan {
  projects: Project[];
  summary: string;
  criticalPath: string[];
}

interface AIProjectPlannerProps {
  vision: string;
  visionId?: string;
  smartGoals?: {
    specific?: string;
    measurable?: string;
    attainable?: string;
    realistic?: string;
  };
  targetDate?: Date | null;
  onProjectsGenerated?: (projects: Project[]) => void;
  onImpactProjectsSaved?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  health: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200 border-cyan-300 dark:border-cyan-700',
  wealth: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700',
  relationships: 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200 border-pink-300 dark:border-pink-700',
  career: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700',
  business: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700',
  personal: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700',
};

const QUARTER_LABELS = ['Q1', 'Q2', 'Q3', 'Q4'];

export function AIProjectPlanner({
  vision,
  visionId,
  smartGoals,
  targetDate,
  onProjectsGenerated,
  onImpactProjectsSaved,
}: AIProjectPlannerProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<ProjectPlan | null>(null);
  const [expandedQuarters, setExpandedQuarters] = useState<number[]>([1, 2, 3, 4]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const handleGenerateTargets = (project: Project) => {
    setSelectedProject(project);
    setIsWizardOpen(true);
  };

  const handleWizardClose = () => {
    setIsWizardOpen(false);
    setSelectedProject(null);
  };

  const handleSaveAsImpactProjects = async () => {
    if (!plan?.projects?.length) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/power-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visionId,
          impactProjects: plan.projects.map((project) => ({
            title: project.title,
            description: project.description,
            quarter: project.quarter,
            category: project.category,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save impact projects');
      }

      const result = await response.json();
      toast.success(`Saved ${result.saved} Impact Projects successfully!`);
      onImpactProjectsSaved?.();
    } catch (err) {
      console.error('Save impact projects error:', err);
      toast.error('Failed to save Impact Projects. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleQuarter = (quarter: number) => {
    setExpandedQuarters((prev) =>
      prev.includes(quarter)
        ? prev.filter((q) => q !== quarter)
        : [...prev, quarter]
    );
  };

  const generateProjects = async () => {
    if (!vision) {
      setError('Please create your vision first');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vision,
          smartGoals,
          targetDate: targetDate?.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate project plan');
      }

      const result: ProjectPlan = await response.json();
      setPlan(result);
      onProjectsGenerated?.(result.projects);
    } catch (err) {
      console.error('Project Generation Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate project plan');
    } finally {
      setIsGenerating(false);
    }
  };

  const getProjectsByQuarter = (quarter: number) => {
    return plan?.projects.filter((p) => p.quarter === quarter) || [];
  };

  if (!plan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Project Planner
          </CardTitle>
          <CardDescription>
            Generate a 12-month roadmap with quarterly Impact Projects aligned to your vision
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-6 border-2 border-dashed rounded-xl text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Ready to plan your year?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                AI will create 12 Impact Projects (3 per quarter) based on your vision and SMART goals
              </p>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                {error}
              </div>
            )}

            <Button
              onClick={generateProjects}
              disabled={isGenerating || !vision}
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Plan...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate 12-Month Plan
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              12-Month Roadmap
            </CardTitle>
            <CardDescription className="mt-1">
              {plan.summary}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={generateProjects}
            disabled={isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Regenerate
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {QUARTER_LABELS.map((label, index) => {
          const quarter = index + 1;
          const projects = getProjectsByQuarter(quarter);
          const isExpanded = expandedQuarters.includes(quarter);

          return (
            <div key={quarter} className="border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleQuarter(quarter)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono">
                    {label}
                  </Badge>
                  <span className="font-medium">
                    {projects.length} Impact Projects
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t p-4 space-y-3">
                  {projects.map((project, idx) => (
                    <div
                      key={idx}
                      className="p-4 border rounded-lg bg-muted/20 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium">{project.title}</h4>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs capitalize',
                            CATEGORY_COLORS[project.category] || 'bg-gray-100'
                          )}
                        >
                          {project.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {project.description}
                      </p>
                      {project.keyMilestones.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            Key Milestones:
                          </span>
                          <ul className="space-y-1">
                            {project.keyMilestones.map((milestone, mIdx) => (
                              <li
                                key={mIdx}
                                className="flex items-center gap-2 text-sm"
                              >
                                <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
                                {milestone}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="pt-2 border-t mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerateTargets(project)}
                          className="w-full gap-2"
                        >
                          <ListTodo className="h-4 w-4" />
                          Generate Detailed Plan
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div className="pt-4 flex justify-end">
          <Button
            className="gap-2"
            onClick={handleSaveAsImpactProjects}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Save as Impact Projects
              </>
            )}
          </Button>
        </div>
      </CardContent>

      {/* Target Generation Wizard Dialog */}
      <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-primary" />
              Generate Detailed Plan
            </DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <TargetGenerationWizard
              impactProject={{
                id: `temp-${selectedProject.title.toLowerCase().replace(/\s+/g, '-')}`,
                title: selectedProject.title,
                description: selectedProject.description,
                quarter: selectedProject.quarter,
                category: selectedProject.category,
                keyMilestones: selectedProject.keyMilestones,
              }}
              vision={vision}
              smartGoals={smartGoals}
              targetDate={targetDate}
              onCancel={handleWizardClose}
              onSave={() => {
                handleWizardClose();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
