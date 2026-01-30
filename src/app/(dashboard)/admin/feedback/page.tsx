'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
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
  Bug,
  Lightbulb,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  ExternalLink,
  Image as ImageIcon,
  MessageSquare,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';

interface FeedbackItem {
  id: string;
  user_id: string;
  feedback_type: 'bug' | 'feature' | 'improvement' | 'general';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'wont_fix';
  current_url: string | null;
  user_agent: string | null;
  screen_resolution: string | null;
  screenshot_url: string | null;
  admin_response: string | null;
  responded_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  profiles: {
    email: string;
    full_name: string | null;
  } | null;
}

const typeIcons = {
  bug: <Bug className="w-4 h-4" />,
  feature: <Lightbulb className="w-4 h-4" />,
  improvement: <Sparkles className="w-4 h-4" />,
  general: <AlertCircle className="w-4 h-4" />,
};

const typeColors = {
  bug: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  feature: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  improvement: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  general: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

const statusIcons = {
  open: <AlertCircle className="w-4 h-4" />,
  in_progress: <Clock className="w-4 h-4" />,
  resolved: <CheckCircle className="w-4 h-4" />,
  closed: <XCircle className="w-4 h-4" />,
  wont_fix: <XCircle className="w-4 h-4" />,
};

const statusColors = {
  open: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  closed: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  wont_fix: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<FeedbackItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  const [newStatus, setNewStatus] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [summary, setSummary] = useState<{ total: number; byStatus: Record<string, number> }>({
    total: 0,
    byStatus: {},
  });

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterType !== 'all') params.append('type', filterType);

      const response = await fetch(`/api/feedback?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setFeedback(data.feedback || []);
        setSummary(data.summary || { total: 0, byStatus: {} });
      }
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [filterStatus, filterType]);

  const openDetail = (item: FeedbackItem) => {
    setSelectedItem(item);
    setAdminResponse(item.admin_response || '');
    setNewStatus(item.status);
    setIsDetailOpen(true);
  };

  const updateFeedback = async () => {
    if (!selectedItem) return;

    setUpdating(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedItem.id,
          status: newStatus,
          adminResponse: adminResponse || undefined,
        }),
      });

      if (response.ok) {
        await fetchFeedback();
        setIsDetailOpen(false);
      }
    } catch (error) {
      console.error('Failed to update feedback:', error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Beta Feedback"
        description="View and manage feedback from beta testers"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{summary.total}</div>
            <div className="text-sm text-gray-500">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{summary.byStatus?.open || 0}</div>
            <div className="text-sm text-gray-500">Open</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{summary.byStatus?.in_progress || 0}</div>
            <div className="text-sm text-gray-500">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{summary.byStatus?.resolved || 0}</div>
            <div className="text-sm text-gray-500">Resolved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-gray-600">{summary.byStatus?.closed || 0}</div>
            <div className="text-sm text-gray-500">Closed</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="wont_fix">Won&apos;t Fix</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="bug">Bug</SelectItem>
                <SelectItem value="feature">Feature</SelectItem>
                <SelectItem value="improvement">Improvement</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchFeedback}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback Items</CardTitle>
          <CardDescription>Click on an item to view details and respond</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : feedback.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No feedback found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {feedback.map((item) => (
                <div
                  key={item.id}
                  onClick={() => openDetail(item)}
                  className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={typeColors[item.feedback_type]}>
                          {typeIcons[item.feedback_type]}
                          <span className="ml-1 capitalize">{item.feedback_type}</span>
                        </Badge>
                        <Badge className={statusColors[item.status]}>
                          {statusIcons[item.status]}
                          <span className="ml-1 capitalize">{item.status.replace('_', ' ')}</span>
                        </Badge>
                        <Badge className={priorityColors[item.priority]}>
                          {item.priority}
                        </Badge>
                        {item.screenshot_url && (
                          <Badge variant="outline">
                            <ImageIcon className="w-3 h-3 mr-1" />
                            Screenshot
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {item.description?.split('\n')[0]}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>{item.profiles?.email || 'Unknown user'}</span>
                        <span>{format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}</span>
                        {item.current_url && (
                          <span className="truncate max-w-[200px]">{item.current_url}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedItem && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={typeColors[selectedItem.feedback_type]}>
                    {typeIcons[selectedItem.feedback_type]}
                    <span className="ml-1 capitalize">{selectedItem.feedback_type}</span>
                  </Badge>
                  <Badge className={priorityColors[selectedItem.priority]}>
                    {selectedItem.priority}
                  </Badge>
                </div>
                <DialogTitle>{selectedItem.title}</DialogTitle>
                <DialogDescription>
                  From {selectedItem.profiles?.email || 'Unknown'} on{' '}
                  {format(new Date(selectedItem.created_at), 'PPpp')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Description */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Description</h4>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm whitespace-pre-wrap">
                    {selectedItem.description}
                  </div>
                </div>

                {/* Screenshot */}
                {selectedItem.screenshot_url && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Screenshot</h4>
                    <a
                      href={selectedItem.screenshot_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={selectedItem.screenshot_url}
                        alt="Screenshot"
                        className="rounded-lg border max-h-64 w-auto"
                      />
                      <span className="text-xs text-indigo-600 flex items-center gap-1 mt-1">
                        <ExternalLink className="w-3 h-3" />
                        Open full size
                      </span>
                    </a>
                  </div>
                )}

                {/* Context Info */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Context</h4>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-xs space-y-1">
                    {selectedItem.current_url && (
                      <div>
                        <strong>URL:</strong> {selectedItem.current_url}
                      </div>
                    )}
                    {selectedItem.screen_resolution && (
                      <div>
                        <strong>Screen:</strong> {selectedItem.screen_resolution}
                      </div>
                    )}
                    {selectedItem.user_agent && (
                      <div className="truncate">
                        <strong>Browser:</strong> {selectedItem.user_agent}
                      </div>
                    )}
                  </div>
                </div>

                {/* Update Status */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Update Status</h4>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="wont_fix">Won&apos;t Fix</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Admin Response */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Admin Response (optional)</h4>
                  <Textarea
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    placeholder="Add a response to the user..."
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={updateFeedback} disabled={updating}>
                  {updating ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
