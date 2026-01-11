'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, ChevronDown, ChevronUp, Pencil, Trash2, GripVertical, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { VisionWizardData, MonthlyProject } from '../vision-wizard';

interface MonthlyProjectsStepProps {
  data: VisionWizardData;
  updateData: (updates: Partial<VisionWizardData>) => void;
}

export function MonthlyProjectsStep({ data, updateData }: MonthlyProjectsStepProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedProject, setExpandedProject] = useState<number | null>(null);
  const [editingProject, setEditingProject] = useState<number | null>(null);
  const [hasGeneratedOnce, setHasGeneratedOnce] = useState(false);

  // Check if we have what we need to generate
  const canGenerate = data.title && data.targetDate;
  const hasProjects = data.monthlyProjects && data.monthlyProjects.length > 0;

  // Auto-generate on first mount if we have data but no projects
  useEffect(() => {
    if (canGenerate && !hasProjects && !hasGeneratedOnce && !isGenerating) {
      handleGenerate();
    }
  }, []); // Only run on mount

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) {
      toast.error('Please add a vision title and target date first');
      return;
    }

    setIsGenerating(true);
    setHasGeneratedOnce(true);

    try {
      const response = await fetch('/api/ai/generate-monthly-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visionTitle: data.title,
          deadline: data.targetDate,
          oneYearGoal: data.measurable || data.specific || data.title,
          smartGoals: {
            specific: data.specific,
            measurable: data.measurable,
            attainable: data.attainable,
            realistic: data.realistic,
            timeBound: data.timeBound,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate projects');
      }

      const result = await response.json();

      if (result.projects && Array.isArray(result.projects)) {
        updateData({
          monthlyProjects: result.projects,
          projectsSummary: result.summary,
          criticalPath: result.criticalPath,
        });
        toast.success(`Generated ${result.projects.length} monthly projects`);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Failed to generate projects:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate projects');
    } finally {
      setIsGenerating(false);
    }
  }, [canGenerate, data, updateData]);

  const handleUpdateProject = (index: number, updates: Partial<MonthlyProject>) => {
    if (!data.monthlyProjects) return;

    const updatedProjects = [...data.monthlyProjects];
    updatedProjects[index] = { ...updatedProjects[index], ...updates };
    updateData({ monthlyProjects: updatedProjects });
  };

  const handleDeleteProject = (index: number) => {
    if (!data.monthlyProjects) return;

    const updatedProjects = data.monthlyProjects.filter((_, i) => i !== index);
    updateData({ monthlyProjects: updatedProjects });
    setEditingProject(null);
    setExpandedProject(null);
    toast.success('Project removed');
  };

  const toggleExpand = (index: number) => {
    setExpandedProject(expandedProject === index ? null : index);
    if (editingProject !== index) {
      setEditingProject(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            AI-generated monthly projects based on your vision and deadline
          </p>
          {hasProjects && (
            <p className="text-sm font-medium mt-1">
              {data.monthlyProjects?.length} projects until {data.targetDate ? new Date(data.targetDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'deadline'}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={isGenerating || !canGenerate}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : hasProjects ? (
            <RefreshCw className="h-4 w-4 mr-2" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          {isGenerating ? 'Generating...' : hasProjects ? 'Regenerate' : 'Generate Projects'}
        </Button>
      </div>

      {/* Loading state */}
      {isGenerating && !hasProjects && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg font-medium">Generating your roadmap...</p>
          <p className="text-sm text-muted-foreground">
            AI is creating monthly projects tailored to your vision
          </p>
        </div>
      )}

      {/* Empty state */}
      {!hasProjects && !isGenerating && (
        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
          <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No projects generated yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            {canGenerate
              ? 'Click "Generate Projects" to create your monthly roadmap'
              : 'Please complete the Vision step first (title and target date required)'}
          </p>
          {canGenerate && (
            <Button onClick={handleGenerate}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Projects
            </Button>
          )}
        </div>
      )}

      {/* Summary */}
      {data.projectsSummary && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <p className="text-sm">{data.projectsSummary}</p>
            {data.criticalPath && data.criticalPath.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Critical Milestones:</p>
                <div className="flex flex-wrap gap-2">
                  {data.criticalPath.map((milestone, i) => (
                    <span key={i} className="text-xs bg-primary/10 px-2 py-1 rounded">
                      {milestone}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Projects List */}
      {hasProjects && (
        <div className="space-y-3">
          {data.monthlyProjects?.map((project, index) => (
            <Card
              key={index}
              className={`transition-all ${expandedProject === index ? 'ring-2 ring-primary/50' : ''}`}
            >
              <CardContent className="p-4">
                {/* Project Header */}
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GripVertical className="h-4 w-4 cursor-grab" />
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {project.monthName} {project.year}
                      </span>
                    </div>

                    {editingProject === index ? (
                      <Input
                        value={project.title}
                        onChange={(e) => handleUpdateProject(index, { title: e.target.value })}
                        className="mt-2"
                        placeholder="Project title"
                      />
                    ) : (
                      <h4 className="font-medium mt-1">{project.title}</h4>
                    )}

                    {!expandedProject || expandedProject !== index ? (
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                        {project.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        if (editingProject === index) {
                          setEditingProject(null);
                        } else {
                          setEditingProject(index);
                          setExpandedProject(index);
                        }
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleExpand(index)}
                    >
                      {expandedProject === index ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedProject === index && (
                  <div className="mt-4 pl-14 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Description</Label>
                      {editingProject === index ? (
                        <Textarea
                          value={project.description}
                          onChange={(e) => handleUpdateProject(index, { description: e.target.value })}
                          rows={2}
                          placeholder="What this month accomplishes"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">{project.description}</p>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs">Key Milestone</Label>
                        {editingProject === index ? (
                          <Input
                            value={project.keyMilestone}
                            onChange={(e) => handleUpdateProject(index, { keyMilestone: e.target.value })}
                            placeholder="Main deliverable"
                          />
                        ) : (
                          <p className="text-sm">{project.keyMilestone}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Success Metric</Label>
                        {editingProject === index ? (
                          <Input
                            value={project.successMetric}
                            onChange={(e) => handleUpdateProject(index, { successMetric: e.target.value })}
                            placeholder="How to measure success"
                          />
                        ) : (
                          <p className="text-sm">{project.successMetric}</p>
                        )}
                      </div>
                    </div>

                    {project.targetValue && (
                      <div className="space-y-2">
                        <Label className="text-xs">Target Value</Label>
                        {editingProject === index ? (
                          <Input
                            value={project.targetValue}
                            onChange={(e) => handleUpdateProject(index, { targetValue: e.target.value })}
                            placeholder="Specific target"
                          />
                        ) : (
                          <p className="text-sm font-medium">{project.targetValue}</p>
                        )}
                      </div>
                    )}

                    {editingProject === index && (
                      <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProject(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingProject(null)}
                        >
                          Done Editing
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tips */}
      {hasProjects && (
        <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
          <p className="font-medium mb-1">Tips:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Click the expand button to see full project details</li>
            <li>Click the pencil icon to edit any project</li>
            <li>Projects will be saved as monthly targets when you complete the wizard</li>
          </ul>
        </div>
      )}
    </div>
  );
}
