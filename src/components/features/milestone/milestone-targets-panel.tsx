'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Calendar,
  CalendarPlus,
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AssigneeSelect, AssigneeBadge, type Assignee } from '@/components/features/assignee/assignee-select';

interface DailyAction {
  id: string;
  title: string;
  description?: string;
  actionDate: string;
  estimatedMinutes?: number;
  status: 'pending' | 'in_progress' | 'completed';
  assigneeName?: string;
}

interface WeeklyTarget {
  id: string;
  title: string;
  description?: string;
  weekNumber: number;
  weekStartDate: string;
  weekEndDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  assigneeName?: string;
  dailyActions: DailyAction[];
}

interface MonthlyTarget {
  id: string;
  title: string;
  description?: string;
  targetMonth: number;
  targetYear: number;
  status: 'pending' | 'in_progress' | 'completed';
  assigneeName?: string;
  weeklyTargets: WeeklyTarget[];
}

interface MilestoneTargetsPanelProps {
  milestoneId: string;
  monthlyTargets: MonthlyTarget[];
  onAddMonthlyTarget: (data: { title: string; description?: string; targetMonth: number; targetYear: number; assigneeName?: string }) => Promise<void>;
  onAddWeeklyTarget: (monthlyTargetId: string, data: { title: string; description?: string; weekNumber: number; weekStartDate: string; weekEndDate: string; assigneeName?: string }) => Promise<void>;
  onAddDailyAction: (weeklyTargetId: string, data: { title: string; description?: string; actionDate: string; estimatedMinutes?: number; assigneeName?: string }) => Promise<void>;
  onUpdateStatus: (type: 'monthly' | 'weekly' | 'daily', id: string, status: string) => Promise<void>;
  onScheduleToCalendar: (type: 'monthly' | 'weekly' | 'daily', item: MonthlyTarget | WeeklyTarget | DailyAction) => Promise<void>;
  onDelete: (type: 'monthly' | 'weekly' | 'daily', id: string) => Promise<void>;
  currentUserName?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function MilestoneTargetsPanel({
  milestoneId,
  monthlyTargets,
  onAddMonthlyTarget,
  onAddWeeklyTarget,
  onAddDailyAction,
  onUpdateStatus,
  onScheduleToCalendar,
  onDelete,
  currentUserName = 'Me',
}: MilestoneTargetsPanelProps) {
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  const [isAddMonthlyOpen, setIsAddMonthlyOpen] = useState(false);
  const [addWeeklyFor, setAddWeeklyFor] = useState<string | null>(null);
  const [addDailyFor, setAddDailyFor] = useState<string | null>(null);
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const [schedulingItems, setSchedulingItems] = useState<Set<string>>(new Set());

  // Form states
  const [newMonthly, setNewMonthly] = useState({ title: '', description: '', targetMonth: new Date().getMonth() + 1, targetYear: new Date().getFullYear(), assignee: null as Assignee | null });
  const [newWeekly, setNewWeekly] = useState({ title: '', description: '', weekNumber: 1, weekStartDate: '', weekEndDate: '', assignee: null as Assignee | null });
  const [newDaily, setNewDaily] = useState({ title: '', description: '', actionDate: '', estimatedMinutes: 30, assignee: null as Assignee | null });

  const toggleExpanded = (set: Set<string>, setter: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleStatus = async (type: 'monthly' | 'weekly' | 'daily', id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    setLoadingItems((prev) => new Set(prev).add(id));
    try {
      await onUpdateStatus(type, id, newStatus);
    } finally {
      setLoadingItems((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleSchedule = async (type: 'monthly' | 'weekly' | 'daily', item: MonthlyTarget | WeeklyTarget | DailyAction) => {
    setSchedulingItems((prev) => new Set(prev).add(item.id));
    try {
      await onScheduleToCalendar(type, item);
    } finally {
      setSchedulingItems((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const handleAddMonthlyTarget = async () => {
    if (newMonthly.title.trim()) {
      await onAddMonthlyTarget({
        title: newMonthly.title.trim(),
        description: newMonthly.description.trim() || undefined,
        targetMonth: newMonthly.targetMonth,
        targetYear: newMonthly.targetYear,
        assigneeName: newMonthly.assignee?.name,
      });
      setNewMonthly({ title: '', description: '', targetMonth: new Date().getMonth() + 1, targetYear: new Date().getFullYear(), assignee: null });
      setIsAddMonthlyOpen(false);
    }
  };

  const handleAddWeeklyTarget = async (monthlyTargetId: string) => {
    if (newWeekly.title.trim() && newWeekly.weekStartDate && newWeekly.weekEndDate) {
      await onAddWeeklyTarget(monthlyTargetId, {
        title: newWeekly.title.trim(),
        description: newWeekly.description.trim() || undefined,
        weekNumber: newWeekly.weekNumber,
        weekStartDate: newWeekly.weekStartDate,
        weekEndDate: newWeekly.weekEndDate,
        assigneeName: newWeekly.assignee?.name,
      });
      setNewWeekly({ title: '', description: '', weekNumber: 1, weekStartDate: '', weekEndDate: '', assignee: null });
      setAddWeeklyFor(null);
    }
  };

  const handleAddDailyAction = async (weeklyTargetId: string) => {
    if (newDaily.title.trim() && newDaily.actionDate) {
      await onAddDailyAction(weeklyTargetId, {
        title: newDaily.title.trim(),
        description: newDaily.description.trim() || undefined,
        actionDate: newDaily.actionDate,
        estimatedMinutes: newDaily.estimatedMinutes,
        assigneeName: newDaily.assignee?.name,
      });
      setNewDaily({ title: '', description: '', actionDate: '', estimatedMinutes: 30, assignee: null });
      setAddDailyFor(null);
    }
  };

  // Stats
  const totalMonthly = monthlyTargets.length;
  const completedMonthly = monthlyTargets.filter((m) => m.status === 'completed').length;
  const totalWeekly = monthlyTargets.reduce((sum, m) => sum + m.weeklyTargets.length, 0);
  const completedWeekly = monthlyTargets.reduce((sum, m) => sum + m.weeklyTargets.filter((w) => w.status === 'completed').length, 0);
  const totalDaily = monthlyTargets.reduce((sum, m) => sum + m.weeklyTargets.reduce((ws, w) => ws + w.dailyActions.length, 0), 0);
  const completedDaily = monthlyTargets.reduce((sum, m) => sum + m.weeklyTargets.reduce((ws, w) => ws + w.dailyActions.filter((d) => d.status === 'completed').length, 0), 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Targets Breakdown
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddMonthlyOpen(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Monthly
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-2 bg-muted/50 rounded-lg">
            <p className="text-lg font-bold">{completedMonthly}/{totalMonthly}</p>
            <p className="text-xs text-muted-foreground">Monthly</p>
          </div>
          <div className="p-2 bg-muted/50 rounded-lg">
            <p className="text-lg font-bold">{completedWeekly}/{totalWeekly}</p>
            <p className="text-xs text-muted-foreground">Weekly</p>
          </div>
          <div className="p-2 bg-muted/50 rounded-lg">
            <p className="text-lg font-bold">{completedDaily}/{totalDaily}</p>
            <p className="text-xs text-muted-foreground">Daily</p>
          </div>
        </div>

        {/* Targets Tree */}
        {monthlyTargets.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No targets yet</p>
            <Button variant="link" size="sm" onClick={() => setIsAddMonthlyOpen(true)}>
              Add your first monthly target
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {monthlyTargets.map((monthly) => (
              <Collapsible
                key={monthly.id}
                open={expandedMonths.has(monthly.id)}
                onOpenChange={() => toggleExpanded(expandedMonths, setExpandedMonths, monthly.id)}
              >
                <div className={cn(
                  'rounded-lg border transition-colors',
                  monthly.status === 'completed' && 'bg-green-50/50 border-green-200 dark:bg-green-900/10'
                )}>
                  {/* Monthly Target Header */}
                  <CollapsibleTrigger asChild>
                    <button className="w-full p-3 flex items-center gap-3 hover:bg-muted/30 transition-colors rounded-t-lg">
                      {expandedMonths.has(monthly.id) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      {loadingItems.has(monthly.id) ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <div onClick={(e) => { e.stopPropagation(); handleToggleStatus('monthly', monthly.id, monthly.status); }}>
                          {monthly.status === 'completed' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600 cursor-pointer" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-primary" />
                          )}
                        </div>
                      )}
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {MONTH_NAMES[monthly.targetMonth - 1]} {monthly.targetYear}
                          </Badge>
                          <span className={cn('font-medium text-sm', monthly.status === 'completed' && 'line-through text-muted-foreground')}>
                            {monthly.title}
                          </span>
                        </div>
                        {monthly.assigneeName && (
                          <AssigneeBadge assignee={{ name: monthly.assigneeName }} size="sm" />
                        )}
                      </div>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSchedule('monthly', monthly)}
                          disabled={schedulingItems.has(monthly.id)}
                        >
                          {schedulingItems.has(monthly.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CalendarPlus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </button>
                  </CollapsibleTrigger>

                  {/* Weekly Targets */}
                  <CollapsibleContent>
                    <div className="px-3 pb-3 space-y-2">
                      <div className="ml-8 border-l-2 pl-3 space-y-2">
                        {monthly.weeklyTargets.map((weekly) => (
                          <Collapsible
                            key={weekly.id}
                            open={expandedWeeks.has(weekly.id)}
                            onOpenChange={() => toggleExpanded(expandedWeeks, setExpandedWeeks, weekly.id)}
                          >
                            <div className={cn(
                              'rounded-lg border bg-card',
                              weekly.status === 'completed' && 'bg-green-50/30 border-green-200 dark:bg-green-900/5'
                            )}>
                              <CollapsibleTrigger asChild>
                                <button className="w-full p-2 flex items-center gap-2 hover:bg-muted/20 transition-colors text-sm">
                                  {expandedWeeks.has(weekly.id) ? (
                                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                  )}
                                  {loadingItems.has(weekly.id) ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <div onClick={(e) => { e.stopPropagation(); handleToggleStatus('weekly', weekly.id, weekly.status); }}>
                                      {weekly.status === 'completed' ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-600 cursor-pointer" />
                                      ) : (
                                        <Circle className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary" />
                                      )}
                                    </div>
                                  )}
                                  <Badge variant="outline" className="text-xs">W{weekly.weekNumber}</Badge>
                                  <span className={cn('flex-1 text-left', weekly.status === 'completed' && 'line-through text-muted-foreground')}>
                                    {weekly.title}
                                  </span>
                                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => handleSchedule('weekly', weekly)}
                                      disabled={schedulingItems.has(weekly.id)}
                                    >
                                      {schedulingItems.has(weekly.id) ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <CalendarPlus className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </div>
                                </button>
                              </CollapsibleTrigger>

                              {/* Daily Actions */}
                              <CollapsibleContent>
                                <div className="px-2 pb-2 space-y-1">
                                  <div className="ml-6 space-y-1">
                                    {weekly.dailyActions.map((daily) => (
                                      <div
                                        key={daily.id}
                                        className={cn(
                                          'flex items-center gap-2 p-2 rounded text-xs',
                                          daily.status === 'completed' ? 'bg-green-50 dark:bg-green-900/10' : 'bg-muted/30'
                                        )}
                                      >
                                        {loadingItems.has(daily.id) ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Checkbox
                                            checked={daily.status === 'completed'}
                                            onCheckedChange={() => handleToggleStatus('daily', daily.id, daily.status)}
                                          />
                                        )}
                                        <span className={cn('flex-1', daily.status === 'completed' && 'line-through text-muted-foreground')}>
                                          {daily.title}
                                        </span>
                                        <span className="text-muted-foreground">
                                          {new Date(daily.actionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </span>
                                        {daily.estimatedMinutes && (
                                          <span className="flex items-center gap-1 text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            {daily.estimatedMinutes}m
                                          </span>
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 w-5 p-0"
                                          onClick={() => handleSchedule('daily', daily)}
                                          disabled={schedulingItems.has(daily.id)}
                                        >
                                          {schedulingItems.has(daily.id) ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <CalendarPlus className="h-3 w-3" />
                                          )}
                                        </Button>
                                      </div>
                                    ))}
                                    {/* Add Daily Action */}
                                    {addDailyFor === weekly.id ? (
                                      <div className="p-2 border rounded-lg space-y-2">
                                        <Input
                                          placeholder="Daily action title"
                                          value={newDaily.title}
                                          onChange={(e) => setNewDaily((p) => ({ ...p, title: e.target.value }))}
                                          autoFocus
                                          className="text-xs h-7"
                                        />
                                        <div className="flex gap-2">
                                          <Input
                                            type="date"
                                            value={newDaily.actionDate}
                                            onChange={(e) => setNewDaily((p) => ({ ...p, actionDate: e.target.value }))}
                                            className="text-xs h-7"
                                          />
                                          <Input
                                            type="number"
                                            placeholder="Min"
                                            value={newDaily.estimatedMinutes}
                                            onChange={(e) => setNewDaily((p) => ({ ...p, estimatedMinutes: parseInt(e.target.value) || 30 }))}
                                            className="text-xs h-7 w-16"
                                          />
                                        </div>
                                        <div className="flex gap-2">
                                          <Button variant="outline" size="sm" className="flex-1 h-6 text-xs" onClick={() => setAddDailyFor(null)}>Cancel</Button>
                                          <Button size="sm" className="flex-1 h-6 text-xs" onClick={() => handleAddDailyAction(weekly.id)}>Add</Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full h-6 text-xs"
                                        onClick={() => setAddDailyFor(weekly.id)}
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add Daily Action
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </CollapsibleContent>
                            </div>
                          </Collapsible>
                        ))}
                        {/* Add Weekly Target */}
                        {addWeeklyFor === monthly.id ? (
                          <div className="p-3 border rounded-lg space-y-2">
                            <Input
                              placeholder="Weekly target title"
                              value={newWeekly.title}
                              onChange={(e) => setNewWeekly((p) => ({ ...p, title: e.target.value }))}
                              autoFocus
                            />
                            <div className="grid grid-cols-3 gap-2">
                              <Input
                                type="number"
                                placeholder="Week #"
                                value={newWeekly.weekNumber}
                                onChange={(e) => setNewWeekly((p) => ({ ...p, weekNumber: parseInt(e.target.value) || 1 }))}
                                min={1}
                                max={5}
                              />
                              <Input
                                type="date"
                                value={newWeekly.weekStartDate}
                                onChange={(e) => setNewWeekly((p) => ({ ...p, weekStartDate: e.target.value }))}
                                placeholder="Start"
                              />
                              <Input
                                type="date"
                                value={newWeekly.weekEndDate}
                                onChange={(e) => setNewWeekly((p) => ({ ...p, weekEndDate: e.target.value }))}
                                placeholder="End"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="flex-1" onClick={() => setAddWeeklyFor(null)}>Cancel</Button>
                              <Button size="sm" className="flex-1" onClick={() => handleAddWeeklyTarget(monthly.id)}>Add</Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={() => setAddWeeklyFor(monthly.id)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Weekly Target
                          </Button>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add Monthly Target Dialog */}
      <Dialog open={isAddMonthlyOpen} onOpenChange={setIsAddMonthlyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Monthly Target</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                placeholder="What do you want to achieve this month?"
                value={newMonthly.title}
                onChange={(e) => setNewMonthly((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Additional details..."
                value={newMonthly.description}
                onChange={(e) => setNewMonthly((p) => ({ ...p, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Month</Label>
                <select
                  className="w-full h-10 px-3 rounded-md border bg-background"
                  value={newMonthly.targetMonth}
                  onChange={(e) => setNewMonthly((p) => ({ ...p, targetMonth: parseInt(e.target.value) }))}
                >
                  {MONTH_NAMES.map((month, idx) => (
                    <option key={month} value={idx + 1}>{month}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  type="number"
                  value={newMonthly.targetYear}
                  onChange={(e) => setNewMonthly((p) => ({ ...p, targetYear: parseInt(e.target.value) }))}
                  min={2024}
                  max={2030}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <AssigneeSelect
                value={newMonthly.assignee}
                onChange={(a) => setNewMonthly((p) => ({ ...p, assignee: a }))}
                currentUserName={currentUserName}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMonthlyOpen(false)}>Cancel</Button>
            <Button onClick={handleAddMonthlyTarget} disabled={!newMonthly.title.trim()}>Add Target</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
