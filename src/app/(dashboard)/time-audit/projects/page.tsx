'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FolderKanban,
  Link2,
  Link2Off,
  MoreVertical,
  Archive,
  Trash2,
  Pencil,
  Clock,
  CalendarDays,
  Search,
  Plus,
  Loader2,
  Target,
  Palette,
} from 'lucide-react';
import { Label } from '@/components/ui/label';

interface DetectedProject {
  id: string;
  name: string;
  normalizedName: string;
  color: string;
  powerGoalId: string | null;
  powerGoalTitle: string | null;
  totalMinutes: number;
  eventCount: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PowerGoal {
  id: string;
  title: string;
  quarter: number;
}

const COLOR_OPTIONS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#f43f5e', // rose
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
];

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<DetectedProject[]>([]);
  const [powerGoals, setPowerGoals] = useState<PowerGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // Edit dialog state
  const [editingProject, setEditingProject] = useState<DetectedProject | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editPowerGoalId, setEditPowerGoalId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Create dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState(COLOR_OPTIONS[0]);
  const [newProjectGoalId, setNewProjectGoalId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch(`/api/detected-projects?includeArchived=${showArchived}`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  }, [showArchived]);

  // Fetch power goals
  const fetchPowerGoals = useCallback(async () => {
    try {
      const response = await fetch('/api/power-goals');
      if (response.ok) {
        const data = await response.json();
        setPowerGoals(data.powerGoals || []);
      }
    } catch (error) {
      console.error('Failed to fetch power goals:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchProjects(), fetchPowerGoals()]).finally(() => {
      setLoading(false);
    });
  }, [fetchProjects, fetchPowerGoals]);

  // Filter projects by search query
  const filteredProjects = projects.filter((project) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      project.name.toLowerCase().includes(query) ||
      (project.powerGoalTitle && project.powerGoalTitle.toLowerCase().includes(query))
    );
  });

  // Open edit dialog
  const openEditDialog = (project: DetectedProject) => {
    setEditingProject(project);
    setEditName(project.name);
    setEditColor(project.color);
    setEditPowerGoalId(project.powerGoalId);
  };

  // Save project edits
  const saveProjectEdits = async () => {
    if (!editingProject) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/detected-projects/${editingProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          color: editColor,
          powerGoalId: editPowerGoalId,
        }),
      });

      if (response.ok) {
        await fetchProjects();
        setEditingProject(null);
      }
    } catch (error) {
      console.error('Failed to save project:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Create new project
  const createProject = async () => {
    if (!newProjectName.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch('/api/detected-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName.trim(),
          color: newProjectColor,
          powerGoalId: newProjectGoalId,
        }),
      });

      if (response.ok) {
        await fetchProjects();
        setShowCreateDialog(false);
        setNewProjectName('');
        setNewProjectColor(COLOR_OPTIONS[0]);
        setNewProjectGoalId(null);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Archive/unarchive project
  const toggleArchive = async (project: DetectedProject) => {
    try {
      const response = await fetch(`/api/detected-projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isArchived: !project.isArchived,
        }),
      });

      if (response.ok) {
        await fetchProjects();
      }
    } catch (error) {
      console.error('Failed to toggle archive:', error);
    }
  };

  // Delete project
  const deleteProject = async (project: DetectedProject) => {
    if (!confirm(`Are you sure you want to delete "${project.name}"? This will unlink all associated time blocks.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/detected-projects/${project.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchProjects();
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  // Quick link/unlink power goal
  const quickLinkGoal = async (project: DetectedProject, goalId: string | null) => {
    try {
      const response = await fetch(`/api/detected-projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          powerGoalId: goalId,
        }),
      });

      if (response.ok) {
        await fetchProjects();
      }
    } catch (error) {
      console.error('Failed to link goal:', error);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Manage detected projects and link them to Power Goals"
        actions={
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showArchived ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setShowArchived(!showArchived)}
              >
                <Archive className="h-4 w-4 mr-2" />
                {showArchived ? 'Hide Archived' : 'Show Archived'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      {loading ? (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading projects...
            </div>
          </CardContent>
        </Card>
      ) : filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              {searchQuery
                ? 'No projects match your search.'
                : 'No projects found. Projects are automatically created when you track time with AI classification.'}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className={project.isArchived ? 'opacity-60' : ''}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: project.color + '20' }}
                    >
                      <FolderKanban
                        className="h-4 w-4"
                        style={{ color: project.color }}
                      />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base font-medium truncate">
                        {project.name}
                      </CardTitle>
                      {project.isArchived && (
                        <Badge variant="secondary" className="mt-1 text-xs">
                          Archived
                        </Badge>
                      )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(project)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleArchive(project)}>
                        <Archive className="h-4 w-4 mr-2" />
                        {project.isArchived ? 'Unarchive' : 'Archive'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => deleteProject(project)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent>
                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatMinutes(project.totalMinutes)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>{project.eventCount} blocks</span>
                  </div>
                </div>

                {/* Power Goal Link */}
                <div className="pt-3 border-t">
                  {project.powerGoalId ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Target className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                        <span className="text-sm truncate">{project.powerGoalTitle}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => quickLinkGoal(project, null)}
                        className="h-7 text-xs text-muted-foreground"
                      >
                        <Link2Off className="h-3 w-3 mr-1" />
                        Unlink
                      </Button>
                    </div>
                  ) : (
                    <Select
                      value=""
                      onValueChange={(v) => quickLinkGoal(project, v)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Link2 className="h-3.5 w-3.5" />
                          <span>Link to Power Goal...</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {powerGoals.map((goal) => (
                          <SelectItem key={goal.id} value={goal.id}>
                            Q{goal.quarter}: {goal.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Project Dialog */}
      <Dialog open={!!editingProject} onOpenChange={(open) => !open && setEditingProject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update project details and link to a Power Goal
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Project name"
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 rounded-lg transition-all ${
                      editColor === color
                        ? 'ring-2 ring-offset-2 ring-primary scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setEditColor(color)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Link to Power Goal</Label>
              <Select
                value={editPowerGoalId || 'none'}
                onValueChange={(v) => setEditPowerGoalId(v === 'none' ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a Power Goal..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">No link</span>
                  </SelectItem>
                  {powerGoals.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id}>
                      Q{goal.quarter}: {goal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProject(null)}>
              Cancel
            </Button>
            <Button onClick={saveProjectEdits} disabled={isSaving || !editName.trim()}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>
              Manually create a project to track time against
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">Name</Label>
              <Input
                id="new-name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g., Website Redesign"
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 rounded-lg transition-all ${
                      newProjectColor === color
                        ? 'ring-2 ring-offset-2 ring-primary scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewProjectColor(color)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Link to Power Goal (optional)</Label>
              <Select
                value={newProjectGoalId || 'none'}
                onValueChange={(v) => setNewProjectGoalId(v === 'none' ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a Power Goal..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">No link</span>
                  </SelectItem>
                  {powerGoals.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id}>
                      Q{goal.quarter}: {goal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createProject} disabled={isCreating || !newProjectName.trim()}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
