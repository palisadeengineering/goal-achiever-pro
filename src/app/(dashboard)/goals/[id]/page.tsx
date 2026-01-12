'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import {
  Edit,
  Trash2,
  Star,
  Calendar,
  Target,
  ListTodo,
  TrendingUp,
  CheckCircle2,
  Circle,
  Plus,
  Clock,
  Eye,
  Loader2,
  CalendarPlus,
  Sparkles,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { ROUTES } from '@/constants/routes';
import Link from 'next/link';
import { MilestoneKpiPanel } from '@/components/features/milestone/milestone-kpi-panel';
import { MilestoneTargetsPanel } from '@/components/features/milestone/milestone-targets-panel';
import { AssigneeBadge } from '@/components/features/assignee/assignee-select';
import { TargetGenerationWizard } from '@/components/features/targets/target-generation-wizard';

interface Milestone {
  id: string;
  title: string;
  description?: string;
  targetDate?: string;
  quarter?: number;
  category?: string;
  milestonePeriod: 'monthly' | 'quarterly';
  progressPercentage: number;
  status: 'active' | 'completed' | 'paused' | 'archived';
  visionId?: string;
  visionTitle?: string;
  assigneeName?: string;
  createdAt: string;
}

interface VisionKpi {
  id: string;
  title: string;
  description?: string;
  level: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  targetValue?: string;
  unit?: string;
  trackingMethod?: 'checkbox' | 'numeric';
  bestTime?: string;
  timeRequired?: string;
  whyItMatters?: string;
  currentStreak?: number;
  isCompleted?: boolean;
  todayValue?: number;
}

interface MilestoneKpi {
  id: string;
  milestoneId: string;
  kpiId?: string;
  customKpiName?: string;
  customKpiTarget?: string;
  isAutoLinked: boolean;
  kpi?: VisionKpi;
}

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
  assigneeId?: string;
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

interface MinItem {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  scheduledDate: string;
  durationMinutes: number;
}

const statusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
  paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
  archived: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

export default function MilestoneDetailPage() {
  const params = useParams();
  const router = useRouter();
  const milestoneId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [visionKpis, setVisionKpis] = useState<VisionKpi[]>([]);
  const [linkedKpis, setLinkedKpis] = useState<MilestoneKpi[]>([]);
  const [monthlyTargets, setMonthlyTargets] = useState<MonthlyTarget[]>([]);
  const [mins, setMins] = useState<MinItem[]>([]);
  const [progress, setProgress] = useState(0);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTargetWizardOpen, setIsTargetWizardOpen] = useState(false);

  // Fetch milestone data
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch milestone details
        const milestoneRes = await fetch(`/api/milestones/${milestoneId}`);
        if (!milestoneRes.ok) throw new Error('Failed to fetch milestone');
        const { milestone: milestoneData } = await milestoneRes.json();

        // Transform snake_case to camelCase
        const transformedMilestone: Milestone = {
          id: milestoneData.id,
          title: milestoneData.title,
          description: milestoneData.description,
          targetDate: milestoneData.target_date,
          quarter: milestoneData.quarter,
          category: milestoneData.category,
          milestonePeriod: milestoneData.milestone_period || 'quarterly',
          progressPercentage: milestoneData.progress_percentage || 0,
          status: milestoneData.status || 'active',
          visionId: milestoneData.vision_id,
          visionTitle: milestoneData.vision?.title,
          assigneeName: milestoneData.assignee_name,
          createdAt: milestoneData.created_at,
        };
        setMilestone(transformedMilestone);
        setProgress(transformedMilestone.progressPercentage || 0);

        // Fetch vision KPIs if milestone has a vision
        if (transformedMilestone.visionId) {
          const kpisRes = await fetch(`/api/vision-kpis?visionId=${transformedMilestone.visionId}`);
          if (kpisRes.ok) {
            const { kpis } = await kpisRes.json();
            const transformedKpis = (kpis || []).map((kpi: Record<string, unknown>) => ({
              id: kpi.id,
              title: kpi.title,
              description: kpi.description,
              level: kpi.level,
              targetValue: kpi.target_value,
              unit: kpi.unit,
              trackingMethod: kpi.tracking_method,
              bestTime: kpi.best_time,
              timeRequired: kpi.time_required,
              whyItMatters: kpi.why_it_matters,
            }));
            setVisionKpis(transformedKpis);
          }
        }

        // Fetch milestone-linked KPIs
        const linkedRes = await fetch(`/api/milestone-kpis?milestoneId=${milestoneId}`);
        if (linkedRes.ok) {
          const { milestoneKpis } = await linkedRes.json();
          const transformedLinked = (milestoneKpis || []).map((mk: Record<string, unknown>) => ({
            id: mk.id,
            milestoneId: mk.milestone_id,
            kpiId: mk.kpi_id,
            customKpiName: mk.custom_kpi_name,
            customKpiTarget: mk.custom_kpi_target,
            isAutoLinked: mk.is_auto_linked,
            kpi: mk.kpi ? {
              id: (mk.kpi as Record<string, unknown>).id,
              title: (mk.kpi as Record<string, unknown>).title,
              description: (mk.kpi as Record<string, unknown>).description,
              level: (mk.kpi as Record<string, unknown>).level,
              targetValue: (mk.kpi as Record<string, unknown>).target_value,
              unit: (mk.kpi as Record<string, unknown>).unit,
              trackingMethod: (mk.kpi as Record<string, unknown>).tracking_method,
              bestTime: (mk.kpi as Record<string, unknown>).best_time,
              timeRequired: (mk.kpi as Record<string, unknown>).time_required,
              whyItMatters: (mk.kpi as Record<string, unknown>).why_it_matters,
              isCompleted: (mk.kpi as Record<string, unknown>).isCompleted,
              currentStreak: (mk.kpi as Record<string, unknown>).currentStreak,
            } : undefined,
          }));
          setLinkedKpis(transformedLinked);
        }

        // Fetch monthly targets with nested data
        const targetsRes = await fetch(`/api/milestones/${milestoneId}/targets`);
        if (targetsRes.ok) {
          const { targets } = await targetsRes.json();
          const transformedTargets = (targets || []).map((mt: Record<string, unknown>) => ({
            id: mt.id,
            title: mt.title,
            description: mt.description,
            targetMonth: mt.target_month,
            targetYear: mt.target_year,
            status: mt.status || 'pending',
            assigneeName: mt.assignee_name,
            weeklyTargets: ((mt.weekly_targets || []) as Record<string, unknown>[]).map((wt) => ({
              id: wt.id,
              title: wt.title,
              description: wt.description,
              weekNumber: wt.week_number,
              weekStartDate: wt.week_start_date,
              weekEndDate: wt.week_end_date,
              status: wt.status || 'pending',
              assigneeId: wt.assignee_id,
              assigneeName: wt.assignee_name,
              dailyActions: ((wt.daily_actions || []) as Record<string, unknown>[]).map((da) => ({
                id: da.id,
                title: da.title,
                description: da.description,
                actionDate: da.action_date,
                estimatedMinutes: da.estimated_minutes,
                status: da.status || 'pending',
                assigneeName: da.assignee_name,
              })),
            })),
          }));
          setMonthlyTargets(transformedTargets);
        }

        // Fetch MINS linked to this milestone
        const minsRes = await fetch(`/api/mins?powerGoalId=${milestoneId}`);
        if (minsRes.ok) {
          const minsData = await minsRes.json();
          setMins(minsData.mins || minsData || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        // Use mock data for development
        setMilestone({
          id: milestoneId,
          title: 'Launch online course',
          description: 'Create and launch a comprehensive online course on productivity systems',
          targetDate: '2026-03-31',
          quarter: 1,
          category: 'business',
          milestonePeriod: 'quarterly',
          progressPercentage: 35,
          status: 'active',
          visionId: 'v1',
          visionTitle: 'Become a recognized thought leader in productivity',
          createdAt: '2025-12-01',
        });
        setProgress(35);
        // Mock vision KPIs
        setVisionKpis([
          { id: 'kpi1', title: 'Create course content daily', description: '2 hours of focused content creation', level: 'daily', trackingMethod: 'checkbox', bestTime: 'Morning', timeRequired: '2 hours', currentStreak: 5 },
          { id: 'kpi2', title: 'Record one video lesson', description: 'Record and edit one complete lesson', level: 'daily', trackingMethod: 'checkbox', bestTime: 'Afternoon', timeRequired: '3 hours', currentStreak: 3 },
          { id: 'kpi3', title: 'Write weekly newsletter', level: 'weekly', trackingMethod: 'checkbox' },
          { id: 'kpi4', title: 'Complete one module', level: 'monthly', trackingMethod: 'checkbox' },
        ]);
        // Mock linked KPIs
        setLinkedKpis([
          { id: 'mk1', milestoneId, kpiId: 'kpi1', isAutoLinked: true, kpi: { id: 'kpi1', title: 'Create course content daily', description: '2 hours of focused content creation', level: 'daily', trackingMethod: 'checkbox', bestTime: 'Morning', timeRequired: '2 hours', currentStreak: 5, isCompleted: false } },
          { id: 'mk2', milestoneId, kpiId: 'kpi2', isAutoLinked: true, kpi: { id: 'kpi2', title: 'Record one video lesson', description: 'Record and edit one complete lesson', level: 'daily', trackingMethod: 'checkbox', bestTime: 'Afternoon', timeRequired: '3 hours', currentStreak: 3, isCompleted: true } },
        ]);
        // Mock monthly targets
        setMonthlyTargets([
          {
            id: 'mt1',
            title: 'Complete curriculum outline',
            targetMonth: 1,
            targetYear: 2026,
            status: 'completed',
            weeklyTargets: [
              {
                id: 'wt1',
                title: 'Research competitor courses',
                weekNumber: 1,
                weekStartDate: '2026-01-06',
                weekEndDate: '2026-01-12',
                status: 'completed',
                dailyActions: [
                  { id: 'da1', title: 'List top 10 competitors', actionDate: '2026-01-06', status: 'completed', estimatedMinutes: 60 },
                  { id: 'da2', title: 'Analyze course structures', actionDate: '2026-01-07', status: 'completed', estimatedMinutes: 90 },
                ],
              },
              {
                id: 'wt2',
                title: 'Draft module outline',
                weekNumber: 2,
                weekStartDate: '2026-01-13',
                weekEndDate: '2026-01-19',
                status: 'in_progress',
                dailyActions: [
                  { id: 'da3', title: 'Outline Module 1', actionDate: '2026-01-13', status: 'completed', estimatedMinutes: 45 },
                  { id: 'da4', title: 'Outline Module 2', actionDate: '2026-01-14', status: 'pending', estimatedMinutes: 45 },
                ],
              },
            ],
          },
          {
            id: 'mt2',
            title: 'Record all video content',
            targetMonth: 2,
            targetYear: 2026,
            status: 'pending',
            weeklyTargets: [],
          },
        ]);
        // Mock MINS
        setMins([
          { id: 'min1', title: 'Review marketing proposal', status: 'completed', scheduledDate: '2026-01-04', durationMinutes: 45 },
          { id: 'min2', title: 'Record module 2 intro', status: 'in_progress', scheduledDate: '2026-01-05', durationMinutes: 60 },
          { id: 'min3', title: 'Set up course platform', status: 'pending', scheduledDate: '2026-01-06', durationMinutes: 120 },
        ]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [milestoneId]);

  const handleUpdateProgress = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/milestones/${milestoneId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progressPercentage: progress }),
      });
      if (!res.ok) throw new Error('Failed to update progress');
      setMilestone((prev) => prev ? { ...prev, progressPercentage: progress } : null);
      toast.success(`Progress updated: Milestone is now ${progress}% complete`);
      setIsUpdateDialogOpen(false);
    } catch (error) {
      toast.error('Failed to update progress');
    } finally {
      setIsSaving(false);
    }
  };

  // KPI handlers
  const handleLinkKpi = async (kpiId: string) => {
    try {
      const res = await fetch('/api/milestone-kpis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestoneId, kpiId }),
      });
      if (!res.ok) throw new Error('Failed to link KPI');
      const newLink = await res.json();
      const kpi = visionKpis.find((k) => k.id === kpiId);
      setLinkedKpis((prev) => [...prev, { ...newLink, kpi }]);
      toast.success('KPI has been linked to this milestone');
    } catch (error) {
      // Mock add for development
      const kpi = visionKpis.find((k) => k.id === kpiId);
      if (kpi) {
        setLinkedKpis((prev) => [...prev, { id: `mk-${Date.now()}`, milestoneId, kpiId, isAutoLinked: false, kpi }]);
        toast.success('KPI has been linked to this milestone');
      }
    }
  };

  const handleUnlinkKpi = async (milestoneKpiId: string) => {
    try {
      await fetch(`/api/milestone-kpis?id=${milestoneKpiId}`, { method: 'DELETE' });
      setLinkedKpis((prev) => prev.filter((lk) => lk.id !== milestoneKpiId));
      toast.success('KPI unlinked');
    } catch (error) {
      setLinkedKpis((prev) => prev.filter((lk) => lk.id !== milestoneKpiId));
      toast.success('KPI unlinked');
    }
  };

  const handleAddCustomKpi = async (name: string, target: string) => {
    try {
      const res = await fetch('/api/milestone-kpis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestoneId, customKpiName: name, customKpiTarget: target }),
      });
      if (!res.ok) throw new Error('Failed to add custom KPI');
      const newKpi = await res.json();
      setLinkedKpis((prev) => [...prev, newKpi]);
      toast.success('Custom KPI added');
    } catch (error) {
      setLinkedKpis((prev) => [...prev, { id: `mk-${Date.now()}`, milestoneId, customKpiName: name, customKpiTarget: target, isAutoLinked: false }]);
      toast.success('Custom KPI added');
    }
  };

  const handleLogKpi = async (kpiId: string, value: number | boolean, date: string) => {
    try {
      await fetch(`/api/vision-kpis/${kpiId}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: typeof value === 'boolean' ? (value ? 1 : 0) : value, logDate: date, isCompleted: value }),
      });
      // Update local state
      setLinkedKpis((prev) => prev.map((lk) =>
        lk.kpiId === kpiId && lk.kpi
          ? { ...lk, kpi: { ...lk.kpi, isCompleted: !!value, currentStreak: value ? (lk.kpi.currentStreak || 0) + 1 : 0 } }
          : lk
      ));
    } catch (error) {
      // Update local state anyway for demo
      setLinkedKpis((prev) => prev.map((lk) =>
        lk.kpiId === kpiId && lk.kpi
          ? { ...lk, kpi: { ...lk.kpi, isCompleted: !!value } }
          : lk
      ));
    }
  };

  const handleScheduleKpiToCalendar = async (kpi: VisionKpi) => {
    try {
      // Parse the best time if available (e.g., "Morning", "Afternoon")
      const now = new Date();
      const startHour = kpi.bestTime?.toLowerCase().includes('morning') ? 9
        : kpi.bestTime?.toLowerCase().includes('afternoon') ? 14
        : kpi.bestTime?.toLowerCase().includes('evening') ? 18
        : 9;

      now.setHours(startHour, 0, 0, 0);

      // Parse duration from timeRequired (e.g., "2 hours", "30 minutes")
      let durationMs = 60 * 60 * 1000; // Default 1 hour
      if (kpi.timeRequired) {
        const hoursMatch = kpi.timeRequired.match(/(\d+)\s*hour/i);
        const minsMatch = kpi.timeRequired.match(/(\d+)\s*min/i);
        if (hoursMatch) durationMs = parseInt(hoursMatch[1]) * 60 * 60 * 1000;
        else if (minsMatch) durationMs = parseInt(minsMatch[1]) * 60 * 1000;
      }

      const res = await fetch('/api/calendar/google/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: kpi.title,
          description: kpi.description || kpi.whyItMatters || `KPI: ${kpi.title}`,
          start: now.toISOString(),
          end: new Date(now.getTime() + durationMs).toISOString(),
        }),
      });

      if (res.ok) {
        toast.success(`"${kpi.title}" has been added to calendar`);
      } else {
        const error = await res.json();
        if (error.error === 'Not connected to Google Calendar') {
          toast.error('Please connect your Google Calendar first in Settings');
        } else {
          toast.error('Failed to add to calendar');
        }
      }
    } catch (error) {
      toast.error('Failed to add to calendar');
    }
  };

  // Target handlers
  const handleAddMonthlyTarget = async (data: { title: string; description?: string; targetMonth: number; targetYear: number; assigneeName?: string }) => {
    try {
      const res = await fetch(`/api/milestones/${milestoneId}/targets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 'monthly', ...data }),
      });
      if (!res.ok) throw new Error('Failed to add target');
      const { target } = await res.json();
      setMonthlyTargets((prev) => [...prev, { ...target.monthly, weeklyTargets: [] }]);
      toast.success('Monthly target added');
    } catch (error) {
      setMonthlyTargets((prev) => [...prev, { id: `mt-${Date.now()}`, ...data, status: 'pending' as const, weeklyTargets: [] }]);
      toast.success('Monthly target added');
    }
  };

  const handleAddWeeklyTarget = async (monthlyTargetId: string, data: { title: string; description?: string; weekNumber: number; weekStartDate: string; weekEndDate: string; assigneeName?: string }) => {
    try {
      const res = await fetch(`/api/milestones/${milestoneId}/targets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 'weekly', monthlyTargetId, ...data }),
      });
      if (!res.ok) throw new Error('Failed to add target');
      const { target } = await res.json();
      setMonthlyTargets((prev) => prev.map((mt) =>
        mt.id === monthlyTargetId
          ? { ...mt, weeklyTargets: [...mt.weeklyTargets, { ...target.weekly, dailyActions: [] }] }
          : mt
      ));
      toast.success('Weekly target added');
    } catch (error) {
      setMonthlyTargets((prev) => prev.map((mt) =>
        mt.id === monthlyTargetId
          ? { ...mt, weeklyTargets: [...mt.weeklyTargets, { id: `wt-${Date.now()}`, ...data, status: 'pending' as const, dailyActions: [] }] }
          : mt
      ));
      toast.success('Weekly target added');
    }
  };

  const handleAddDailyAction = async (weeklyTargetId: string, data: { title: string; description?: string; actionDate: string; estimatedMinutes?: number; assigneeName?: string }) => {
    try {
      const res = await fetch(`/api/milestones/${milestoneId}/targets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 'daily', weeklyTargetId, ...data }),
      });
      if (!res.ok) throw new Error('Failed to add action');
      const { target } = await res.json();
      setMonthlyTargets((prev) => prev.map((mt) => ({
        ...mt,
        weeklyTargets: mt.weeklyTargets.map((wt) =>
          wt.id === weeklyTargetId
            ? { ...wt, dailyActions: [...wt.dailyActions, target.daily] }
            : wt
        ),
      })));
      toast.success('Daily action added');
    } catch (error) {
      setMonthlyTargets((prev) => prev.map((mt) => ({
        ...mt,
        weeklyTargets: mt.weeklyTargets.map((wt) =>
          wt.id === weeklyTargetId
            ? { ...wt, dailyActions: [...wt.dailyActions, { id: `da-${Date.now()}`, ...data, status: 'pending' as const }] }
            : wt
        ),
      })));
      toast.success('Daily action added');
    }
  };

  const handleUpdateTargetStatus = async (type: 'monthly' | 'weekly' | 'daily', id: string, status: string) => {
    try {
      await fetch(`/api/targets/${type}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      // Continue with local update
    }
    // Update local state
    if (type === 'monthly') {
      setMonthlyTargets((prev) => prev.map((mt) => mt.id === id ? { ...mt, status: status as typeof mt.status } : mt));
    } else if (type === 'weekly') {
      setMonthlyTargets((prev) => prev.map((mt) => ({
        ...mt,
        weeklyTargets: mt.weeklyTargets.map((wt) => wt.id === id ? { ...wt, status: status as typeof wt.status } : wt),
      })));
    } else {
      setMonthlyTargets((prev) => prev.map((mt) => ({
        ...mt,
        weeklyTargets: mt.weeklyTargets.map((wt) => ({
          ...wt,
          dailyActions: wt.dailyActions.map((da) => da.id === id ? { ...da, status: status as typeof da.status } : da),
        })),
      })));
    }
  };

  const handleScheduleTargetToCalendar = async (type: 'monthly' | 'weekly' | 'daily', item: MonthlyTarget | WeeklyTarget | DailyAction) => {
    try {
      let startDate: Date;
      let endDate: Date;

      if (type === 'daily') {
        const daily = item as DailyAction;
        startDate = new Date(daily.actionDate);
        startDate.setHours(9, 0, 0, 0);
        endDate = new Date(startDate.getTime() + (daily.estimatedMinutes || 60) * 60 * 1000);
      } else if (type === 'weekly') {
        const weekly = item as WeeklyTarget;
        startDate = new Date(weekly.weekStartDate);
        startDate.setHours(9, 0, 0, 0);
        endDate = new Date(weekly.weekEndDate);
        endDate.setHours(17, 0, 0, 0);
      } else {
        const monthly = item as MonthlyTarget;
        startDate = new Date(monthly.targetYear, monthly.targetMonth - 1, 1);
        startDate.setHours(9, 0, 0, 0);
        endDate = new Date(monthly.targetYear, monthly.targetMonth, 0);
        endDate.setHours(17, 0, 0, 0);
      }

      const res = await fetch('/api/calendar/google/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: item.title,
          description: item.description || `${type.charAt(0).toUpperCase() + type.slice(1)} target from your milestone`,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        }),
      });

      if (res.ok) {
        toast.success(`"${item.title}" has been added to calendar`);
      } else {
        const error = await res.json();
        if (error.error === 'Not connected to Google Calendar') {
          toast.error('Please connect your Google Calendar first in Settings');
        } else {
          toast.error('Failed to add to calendar');
        }
      }
    } catch (error) {
      toast.error('Failed to add to calendar');
    }
  };

  const handleDeleteTarget = async (type: 'monthly' | 'weekly' | 'daily', id: string) => {
    try {
      await fetch(`/api/targets/${type}/${id}`, { method: 'DELETE' });
    } catch (error) {
      // Continue with local delete
    }
    if (type === 'monthly') {
      setMonthlyTargets((prev) => prev.filter((mt) => mt.id !== id));
    } else if (type === 'weekly') {
      setMonthlyTargets((prev) => prev.map((mt) => ({
        ...mt,
        weeklyTargets: mt.weeklyTargets.filter((wt) => wt.id !== id),
      })));
    } else {
      setMonthlyTargets((prev) => prev.map((mt) => ({
        ...mt,
        weeklyTargets: mt.weeklyTargets.map((wt) => ({
          ...wt,
          dailyActions: wt.dailyActions.filter((da) => da.id !== id),
        })),
      })));
    }
    toast.success('Target deleted');
  };

  const handleUpdateTargetAssignee = async (type: 'monthly' | 'weekly' | 'daily', id: string, assigneeId: string | null, assigneeName: string | null) => {
    try {
      await fetch(`/api/targets/${type}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigneeId, assigneeName }),
      });
      toast.success('Assignee updated');
    } catch (error) {
      console.error('Failed to update assignee:', error);
    }
    // Update local state
    if (type === 'monthly') {
      setMonthlyTargets((prev) => prev.map((mt) => mt.id === id ? { ...mt, assigneeName: assigneeName || undefined } : mt));
    } else if (type === 'weekly') {
      setMonthlyTargets((prev) => prev.map((mt) => ({
        ...mt,
        weeklyTargets: mt.weeklyTargets.map((wt) => wt.id === id ? { ...wt, assigneeId: assigneeId || undefined, assigneeName: assigneeName || undefined } : wt),
      })));
    } else {
      setMonthlyTargets((prev) => prev.map((mt) => ({
        ...mt,
        weeklyTargets: mt.weeklyTargets.map((wt) => ({
          ...wt,
          dailyActions: wt.dailyActions.map((da) => da.id === id ? { ...da, assigneeName: assigneeName || undefined } : da),
        })),
      })));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!milestone) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Milestone not found</p>
        <Button asChild className="mt-4">
          <Link href={ROUTES.goals}>Back to Milestones</Link>
        </Button>
      </div>
    );
  }

  const completedMins = mins.filter((m) => m.status === 'completed').length;
  const daysRemaining = milestone.targetDate
    ? Math.ceil((new Date(milestone.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={milestone.title}
        description={milestone.description}
        backHref={ROUTES.goals}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="icon" title="Set as focus">
              <Star className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" title="Edit milestone">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="text-red-600" title="Delete milestone">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-2xl font-bold">{milestone.progressPercentage}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Days Left</p>
                <p className="text-2xl font-bold">{daysRemaining ?? '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <ListTodo className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">MINS Done</p>
                <p className="text-2xl font-bold">{completedMins}/{mins.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Period</p>
                <p className="text-2xl font-bold capitalize">{milestone.milestonePeriod}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="kpis">KPIs ({linkedKpis.length})</TabsTrigger>
          <TabsTrigger value="targets">Targets</TabsTrigger>
          <TabsTrigger value="mins">MINS ({mins.length})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Progress Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Progress</CardTitle>
                  <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">Update Progress</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update Progress</DialogTitle>
                      </DialogHeader>
                      <div className="py-6 space-y-4">
                        <div className="text-center">
                          <p className="text-4xl font-bold">{progress}%</p>
                          <p className="text-muted-foreground">Current Progress</p>
                        </div>
                        <Slider
                          value={[progress]}
                          onValueChange={(value) => setProgress(value[0])}
                          max={100}
                          step={5}
                        />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>0%</span>
                          <span>50%</span>
                          <span>100%</span>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateProgress} disabled={isSaving}>
                          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Save Progress
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Progress value={milestone.progressPercentage} className="h-3" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Started: {new Date(milestone.createdAt).toLocaleDateString()}</span>
                      {milestone.targetDate && (
                        <span>Target: {new Date(milestone.targetDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* KPI Summary */}
              <MilestoneKpiPanel
                milestoneId={milestoneId}
                visionId={milestone.visionId}
                visionKpis={visionKpis}
                linkedKpis={linkedKpis}
                onLinkKpi={handleLinkKpi}
                onUnlinkKpi={handleUnlinkKpi}
                onAddCustomKpi={handleAddCustomKpi}
                onLogKpi={handleLogKpi}
                onScheduleToCalendar={handleScheduleKpiToCalendar}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Milestone Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <Badge className={statusColors[milestone.status]}>
                      {milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Period</p>
                    <Badge variant="outline" className="capitalize">{milestone.milestonePeriod}</Badge>
                  </div>

                  {milestone.category && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Category</p>
                      <Badge variant="outline" className="capitalize">{milestone.category}</Badge>
                    </div>
                  )}

                  {milestone.quarter && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Quarter</p>
                      <Badge variant="secondary">Q{milestone.quarter}</Badge>
                    </div>
                  )}

                  {milestone.targetDate && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Target Date</p>
                      <p className="font-medium">
                        {new Date(milestone.targetDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  )}

                  {milestone.assigneeName && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Assignee</p>
                      <AssigneeBadge assignee={{ name: milestone.assigneeName }} />
                    </div>
                  )}

                  {milestone.visionTitle && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Linked Vision</p>
                      <Link
                        href={milestone.visionId ? `/vision/${milestone.visionId}` : ROUTES.vision}
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        {milestone.visionTitle}
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tips Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Progress Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium mb-1">Track KPIs Daily</p>
                    <p className="text-muted-foreground">
                      Check off your daily KPIs to build momentum and streaks.
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium mb-1">Schedule to Calendar</p>
                    <p className="text-muted-foreground">
                      Add targets and actions to your calendar to block time.
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium mb-1">Break Down Monthly</p>
                    <p className="text-muted-foreground">
                      Create weekly targets and daily actions for each month.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* KPIs Tab */}
        <TabsContent value="kpis">
          <MilestoneKpiPanel
            milestoneId={milestoneId}
            visionId={milestone.visionId}
            visionKpis={visionKpis}
            linkedKpis={linkedKpis}
            onLinkKpi={handleLinkKpi}
            onUnlinkKpi={handleUnlinkKpi}
            onAddCustomKpi={handleAddCustomKpi}
            onLogKpi={handleLogKpi}
            onScheduleToCalendar={handleScheduleKpiToCalendar}
          />
        </TabsContent>

        {/* Targets Tab */}
        <TabsContent value="targets" className="space-y-4">
          {/* Generate Targets Button */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI Target Generation
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Automatically generate monthly, weekly, and daily targets for this milestone
                  </p>
                </div>
                <Button onClick={() => setIsTargetWizardOpen(true)} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Generate Targets with AI
                </Button>
              </div>
            </CardContent>
          </Card>

          <MilestoneTargetsPanel
            milestoneId={milestoneId}
            monthlyTargets={monthlyTargets}
            onAddMonthlyTarget={handleAddMonthlyTarget}
            onAddWeeklyTarget={handleAddWeeklyTarget}
            onAddDailyAction={handleAddDailyAction}
            onUpdateStatus={handleUpdateTargetStatus}
            onUpdateAssignee={handleUpdateTargetAssignee}
            onScheduleToCalendar={handleScheduleTargetToCalendar}
            onDelete={handleDeleteTarget}
            currentUserName="Me"
          />

          {/* Target Generation Wizard Dialog */}
          <Dialog open={isTargetWizardOpen} onOpenChange={setIsTargetWizardOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Generate Detailed Plan
                </DialogTitle>
              </DialogHeader>
              {milestone && (
                <TargetGenerationWizard
                  powerGoal={{
                    id: milestone.id,
                    title: milestone.title,
                    description: milestone.description,
                    quarter: milestone.quarter || 1,
                    category: milestone.category,
                  }}
                  vision={milestone.visionTitle}
                  targetDate={milestone.targetDate ? new Date(milestone.targetDate) : null}
                  onCancel={() => setIsTargetWizardOpen(false)}
                  onSave={async () => {
                    setIsTargetWizardOpen(false);
                    toast.success('Targets generated and saved successfully!');
                    // Refetch targets
                    try {
                      const targetsRes = await fetch(`/api/milestones/${milestoneId}/targets`);
                      if (targetsRes.ok) {
                        const { targets } = await targetsRes.json();
                        const transformedTargets = (targets || []).map((mt: Record<string, unknown>) => ({
                          id: mt.id,
                          title: mt.title,
                          description: mt.description,
                          targetMonth: mt.target_month,
                          targetYear: mt.target_year,
                          status: mt.status || 'pending',
                          assigneeName: mt.assignee_name,
                          weeklyTargets: ((mt.weekly_targets || []) as Record<string, unknown>[]).map((wt) => ({
                            id: wt.id,
                            title: wt.title,
                            description: wt.description,
                            weekNumber: wt.week_number,
                            weekStartDate: wt.week_start_date,
                            weekEndDate: wt.week_end_date,
                            status: wt.status || 'pending',
                            assigneeId: wt.assignee_id,
                            assigneeName: wt.assignee_name,
                            dailyActions: ((wt.daily_actions || []) as Record<string, unknown>[]).map((da) => ({
                              id: da.id,
                              title: da.title,
                              description: da.description,
                              actionDate: da.action_date,
                              estimatedMinutes: da.estimated_minutes,
                              status: da.status || 'pending',
                              assigneeName: da.assignee_name,
                            })),
                          })),
                        }));
                        setMonthlyTargets(transformedTargets);
                      }
                    } catch (error) {
                      console.error('Error refetching targets:', error);
                    }
                  }}
                />
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* MINS Tab */}
        <TabsContent value="mins">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Related MINS</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href={ROUTES.mins}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add MIN
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {mins.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <ListTodo className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No MINS linked to this milestone</p>
                  <Button variant="link" size="sm" asChild>
                    <Link href={ROUTES.mins}>Create a MIN</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {mins.map((min) => (
                    <div
                      key={min.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      {min.status === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : min.status === 'in_progress' ? (
                        <Circle className="h-5 w-5 text-blue-600 fill-blue-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div className="flex-1">
                        <p className={min.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                          {min.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>{new Date(min.scheduledDate).toLocaleDateString()}</span>
                          <span>{min.durationMinutes} min</span>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          min.status === 'completed'
                            ? 'bg-green-50 text-green-700 dark:bg-green-900/20'
                            : min.status === 'in_progress'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20'
                            : 'bg-gray-50 text-gray-700 dark:bg-gray-800'
                        }
                      >
                        {min.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
