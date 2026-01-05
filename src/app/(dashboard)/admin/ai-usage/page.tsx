'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Cpu,
  DollarSign,
  Activity,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { format } from 'date-fns';

interface AIUsageData {
  dateRange: {
    start: string;
    end: string;
    days: number;
  };
  totals: {
    totalRequests: number;
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalTokens: number;
    totalCostCents: number;
    totalCostDollars: string;
    successfulRequests: number;
    failedRequests: number;
  };
  byDay: Array<{
    date: string;
    requests: number;
    tokens: number;
    costCents: number;
  }>;
  byEndpoint: Array<{
    endpoint: string;
    requests: number;
    tokens: number;
    costCents: number;
  }>;
  byUser: Array<{
    userId: string;
    email: string;
    requests: number;
    tokens: number;
    costCents: number;
  }>;
  recentLogs: Array<{
    id: string;
    endpoint: string;
    model: string;
    requestType: string;
    tokens: number;
    costCents: number;
    success: boolean;
    responseTimeMs: number;
    createdAt: string;
  }>;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

export default function AdminAIUsagePage() {
  const [data, setData] = useState<AIUsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState('30');

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/admin/ai-usage?days=${days}`);

        if (!response.ok) {
          if (response.status === 403) {
            setError('Unauthorized - Admin access required');
          } else {
            setError('Failed to fetch AI usage data');
          }
          return;
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError('Failed to fetch AI usage data');
        console.error('Error fetching AI usage:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [days]);

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="AI Usage Dashboard"
          description="Monitor AI API usage and costs"
        />
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-lg font-medium text-destructive">{error}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Please contact an administrator if you believe this is an error.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Usage Dashboard"
        description="Monitor AI API usage, costs, and performance"
        actions={
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {data?.totals.totalRequests.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{data?.totals.successfulRequests || 0}</span>
                  {' '}successful, {' '}
                  <span className="text-red-600">{data?.totals.failedRequests || 0}</span>
                  {' '}failed
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {(data?.totals.totalTokens || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(data?.totals.totalPromptTokens || 0).toLocaleString()} input, {' '}
                  {(data?.totals.totalCompletionTokens || 0).toLocaleString()} output
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  ${data?.totals.totalCostDollars || '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">
                  ~${((data?.totals.totalCostCents || 0) / parseInt(days) / 100).toFixed(4)}/day avg
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {data?.totals.totalRequests
                    ? ((data.totals.successfulRequests / data.totals.totalRequests) * 100).toFixed(1)
                    : 100}%
                </div>
                <p className="text-xs text-muted-foreground">
                  API reliability
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage Over Time Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Usage Over Time
          </CardTitle>
          <CardDescription>
            Daily API requests and token usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : data?.byDay && data.byDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.byDay} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => format(new Date(value), 'MMM d')}
                />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value, name) => {
                    if (name === 'Tokens') return [(value as number).toLocaleString(), name];
                    return [value, name];
                  }}
                  labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="requests"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="Requests"
                  dot={{ r: 3 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="tokens"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Tokens"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No usage data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Usage by Endpoint */}
        <Card>
          <CardHeader>
            <CardTitle>Usage by Endpoint</CardTitle>
            <CardDescription>
              Breakdown of requests by AI endpoint
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : data?.byEndpoint && data.byEndpoint.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.byEndpoint.slice(0, 8)} layout="vertical" margin={{ left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="endpoint"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => value.replace('/api/ai/', '')}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="requests" fill="#8b5cf6" name="Requests" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No endpoint data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage by User */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Users
            </CardTitle>
            <CardDescription>
              Users with highest AI usage
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : data?.byUser && data.byUser.length > 0 ? (
              <div className="space-y-4">
                {data.byUser.slice(0, 5).map((user, index) => (
                  <div key={user.userId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium truncate max-w-[200px]">
                          {user.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.tokens.toLocaleString()} tokens
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{user.requests} requests</p>
                      <p className="text-xs text-muted-foreground">
                        ${(user.costCents / 100).toFixed(4)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No user data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent API Calls</CardTitle>
          <CardDescription>
            Latest AI API requests with details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : data?.recentLogs && data.recentLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {log.endpoint.replace('/api/ai/', '')}
                      </TableCell>
                      <TableCell className="text-xs">{log.model}</TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {log.tokens?.toLocaleString() || 0}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        ${(log.costCents / 100).toFixed(4)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {log.responseTimeMs ? `${log.responseTimeMs}ms` : '-'}
                      </TableCell>
                      <TableCell>
                        {log.success ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            OK
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Error
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(log.createdAt), 'MMM d, HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              No recent API calls
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
