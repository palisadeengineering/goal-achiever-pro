'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  TrendingUp,
  Plus,
  Target,
  AlertTriangle,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Loader2,
  ChevronRight,
  History,
  User,
} from 'lucide-react';
import type { KeyResult, KeyResultStatus, CreateKeyResultInput, TeamMember } from '@/types/team';

const STATUS_CONFIG: Record<KeyResultStatus, { label: string; color: string; icon: React.ReactNode }> = {
  on_track: { label: 'On Track', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: <CheckCircle2 className="h-3 w-3" /> },
  at_risk: { label: 'At Risk', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: <AlertTriangle className="h-3 w-3" /> },
  behind: { label: 'Behind', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: <ArrowDown className="h-3 w-3" /> },
  achieved: { label: 'Achieved', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: <Target className="h-3 w-3" /> },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', icon: null },
};

interface Vision {
  id: string;
  title: string;
}

export default function OKRsPage() {
  const [keyResults, setKeyResults] = useState<KeyResult[]>([]);
  const [visions, setVisions] = useState<Vision[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedKR, setSelectedKR] = useState<KeyResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

  // Form state for new KR
  const [formData, setFormData] = useState<CreateKeyResultInput>({
    visionId: '',
    title: '',
    description: '',
    targetValue: 0,
    startValue: 0,
    unit: '$',
    assigneeId: '',
    assigneeName: '',
    quarter: currentQuarter,
    year: currentYear,
    successCriteria: '',
  });

  // Form state for updating progress
  const [updateData, setUpdateData] = useState({
    currentValue: 0,
    status: 'on_track' as KeyResultStatus,
    confidenceLevel: 70,
    notes: '',
  });

  const fetchData = useCallback(async () => {
    try {
      const [krsRes, visionsRes, teamRes] = await Promise.all([
        fetch('/api/key-results'),
        fetch('/api/visions'),
        fetch('/api/team'),
      ]);

      if (krsRes.ok) {
        const data = await krsRes.json();
        setKeyResults(data);
      }
      if (visionsRes.ok) {
        const data = await visionsRes.json();
        setVisions(data);
      }
      if (teamRes.ok) {
        const data = await teamRes.json();
        setTeamMembers(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setFormData({
      visionId: visions[0]?.id || '',
      title: '',
      description: '',
      targetValue: 0,
      startValue: 0,
      unit: '$',
      assigneeId: '',
      assigneeName: '',
      quarter: currentQuarter,
      year: currentYear,
      successCriteria: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/key-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Key Result created');
        setIsDialogOpen(false);
        resetForm();
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create Key Result');
      }
    } catch (error) {
      console.error('Error creating Key Result:', error);
      toast.error('Failed to create Key Result');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKR) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/key-results/${selectedKR.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentValue: updateData.currentValue,
          status: updateData.status,
          confidenceLevel: updateData.confidenceLevel,
          updateNotes: updateData.notes,
        }),
      });

      if (response.ok) {
        toast.success('Progress updated');
        setIsUpdateDialogOpen(false);
        setSelectedKR(null);
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update progress');
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openUpdateDialog = (kr: KeyResult) => {
    setSelectedKR(kr);
    setUpdateData({
      currentValue: Number(kr.currentValue),
      status: kr.status,
      confidenceLevel: kr.confidenceLevel,
      notes: '',
    });
    setIsUpdateDialogOpen(true);
  };

  // Group key results by quarter
  const groupedByQuarter = keyResults.reduce((acc, kr) => {
    const key = `Q${kr.quarter || currentQuarter} ${kr.year || currentYear}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(kr);
    return acc;
  }, {} as Record<string, KeyResult[]>);

  // Calculate stats
  const stats = {
    total: keyResults.length,
    onTrack: keyResults.filter((kr) => kr.status === 'on_track').length,
    atRisk: keyResults.filter((kr) => kr.status === 'at_risk').length,
    behind: keyResults.filter((kr) => kr.status === 'behind').length,
    achieved: keyResults.filter((kr) => kr.status === 'achieved').length,
    avgProgress: keyResults.length > 0
      ? Math.round(keyResults.reduce((sum, kr) => sum + kr.progressPercentage, 0) / keyResults.length)
      : 0,
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === '$') return `$${value.toLocaleString()}`;
    if (unit === '%') return `${value}%`;
    return `${value.toLocaleString()} ${unit}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Key Results"
        description="Track measurable outcomes and progress toward your vision"
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total KRs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.onTrack}</p>
              <p className="text-sm text-muted-foreground">On Track</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.atRisk}</p>
              <p className="text-sm text-muted-foreground">At Risk</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.behind}</p>
              <p className="text-sm text-muted-foreground">Behind</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.avgProgress}%</p>
              <p className="text-sm text-muted-foreground">Avg Progress</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Results List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Key Results by Quarter</CardTitle>
            <CardDescription>
              Track progress on your most important measurable outcomes
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Key Result
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Create Key Result</DialogTitle>
                  <DialogDescription>
                    Define a measurable outcome that shows progress toward your vision.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="vision">Vision *</Label>
                    <Select
                      value={formData.visionId}
                      onValueChange={(value) => setFormData({ ...formData, visionId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a vision" />
                      </SelectTrigger>
                      <SelectContent>
                        {visions.map((vision) => (
                          <SelectItem key={vision.id} value={vision.id}>
                            {vision.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="title">Key Result Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Reach $10,000 MRR"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="What does success look like?"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="startValue">Start Value</Label>
                      <Input
                        id="startValue"
                        type="number"
                        value={formData.startValue}
                        onChange={(e) => setFormData({ ...formData, startValue: Number(e.target.value) })}
                        placeholder="0"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="targetValue">Target Value *</Label>
                      <Input
                        id="targetValue"
                        type="number"
                        value={formData.targetValue}
                        onChange={(e) => setFormData({ ...formData, targetValue: Number(e.target.value) })}
                        placeholder="10000"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="unit">Unit *</Label>
                      <Select
                        value={formData.unit}
                        onValueChange={(value) => setFormData({ ...formData, unit: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="$">$ (Dollars)</SelectItem>
                          <SelectItem value="%">% (Percentage)</SelectItem>
                          <SelectItem value="users">Users</SelectItem>
                          <SelectItem value="customers">Customers</SelectItem>
                          <SelectItem value="count">Count</SelectItem>
                          <SelectItem value="hours">Hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="quarter">Quarter</Label>
                      <Select
                        value={formData.quarter?.toString()}
                        onValueChange={(value) => setFormData({ ...formData, quarter: Number(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Q1</SelectItem>
                          <SelectItem value="2">Q2</SelectItem>
                          <SelectItem value="3">Q3</SelectItem>
                          <SelectItem value="4">Q4</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="year">Year</Label>
                      <Select
                        value={formData.year?.toString()}
                        onValueChange={(value) => setFormData({ ...formData, year: Number(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={(currentYear - 1).toString()}>{currentYear - 1}</SelectItem>
                          <SelectItem value={currentYear.toString()}>{currentYear}</SelectItem>
                          <SelectItem value={(currentYear + 1).toString()}>{currentYear + 1}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {teamMembers.length > 0 && (
                    <div className="grid gap-2">
                      <Label htmlFor="assignee">Owner (Optional)</Label>
                      <Select
                        value={formData.assigneeId}
                        onValueChange={(value) => {
                          const member = teamMembers.find((m) => m.id === value);
                          setFormData({
                            ...formData,
                            assigneeId: value,
                            assigneeName: member?.name || '',
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select owner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No owner</SelectItem>
                          {teamMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor="successCriteria">Success Criteria</Label>
                    <Textarea
                      id="successCriteria"
                      value={formData.successCriteria}
                      onChange={(e) => setFormData({ ...formData, successCriteria: e.target.value })}
                      placeholder="How will you know this is achieved?"
                      rows={2}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Key Result
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : keyResults.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Key Results yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first Key Result to start tracking measurable progress toward your vision.
              </p>
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Key Result
              </Button>
            </div>
          ) : (
            <Tabs defaultValue={`Q${currentQuarter} ${currentYear}`}>
              <TabsList>
                {Object.keys(groupedByQuarter).map((quarter) => (
                  <TabsTrigger key={quarter} value={quarter}>
                    {quarter}
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.entries(groupedByQuarter).map(([quarter, krs]) => (
                <TabsContent key={quarter} value={quarter} className="mt-4 space-y-4">
                  {krs.map((kr) => (
                    <Card key={kr.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => openUpdateDialog(kr)}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{kr.title}</h4>
                              <Badge className={STATUS_CONFIG[kr.status].color}>
                                {STATUS_CONFIG[kr.status].icon}
                                <span className="ml-1">{STATUS_CONFIG[kr.status].label}</span>
                              </Badge>
                            </div>
                            {kr.description && (
                              <p className="text-sm text-muted-foreground mb-3">{kr.description}</p>
                            )}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">
                                  {formatValue(Number(kr.currentValue), kr.unit)} / {formatValue(Number(kr.targetValue), kr.unit)}
                                </span>
                              </div>
                              <Progress value={kr.progressPercentage} className="h-2" />
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{kr.progressPercentage}% complete</span>
                                <span>Confidence: {kr.confidenceLevel}%</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {kr.assigneeName && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <User className="h-3 w-3" />
                                {kr.assigneeName}
                              </div>
                            )}
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Update Progress Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedKR && (
            <form onSubmit={handleUpdate}>
              <DialogHeader>
                <DialogTitle>Update Progress</DialogTitle>
                <DialogDescription>
                  {selectedKR.title}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Current Progress</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={updateData.currentValue}
                      onChange={(e) => setUpdateData({ ...updateData, currentValue: Number(e.target.value) })}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground">
                      / {formatValue(Number(selectedKR.targetValue), selectedKR.unit)}
                    </span>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select
                    value={updateData.status}
                    onValueChange={(value: KeyResultStatus) => setUpdateData({ ...updateData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="on_track">On Track</SelectItem>
                      <SelectItem value="at_risk">At Risk</SelectItem>
                      <SelectItem value="behind">Behind</SelectItem>
                      <SelectItem value="achieved">Achieved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Confidence Level: {updateData.confidenceLevel}%</Label>
                  <Input
                    type="range"
                    min="0"
                    max="100"
                    value={updateData.confidenceLevel}
                    onChange={(e) => setUpdateData({ ...updateData, confidenceLevel: Number(e.target.value) })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Update Notes</Label>
                  <Textarea
                    value={updateData.notes}
                    onChange={(e) => setUpdateData({ ...updateData, notes: e.target.value })}
                    placeholder="What changed? Any blockers or wins?"
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUpdateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Update Progress
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
