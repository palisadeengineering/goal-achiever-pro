'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Crown,
  Bell,
  Moon,
  Globe,
  Shield,
  Loader2,
  Check,
  X,
  ExternalLink,
  Clock,
  Sparkles,
} from 'lucide-react';
import { formatHour } from '@/lib/utils';
import { useLocalStorage } from '@/lib/hooks/use-local-storage';
import { useTheme } from '@/lib/hooks/use-theme';

interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  emailReminders: boolean;
  weekStartsOn: 'sunday' | 'monday';
  timeFormat: '12h' | '24h';
  pomodoroWorkMinutes: number;
  pomodoroBreakMinutes: number;
  calendarStartHour: number;
  calendarEndHour: number;
  aiProvider: 'openai' | 'anthropic';
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  notifications: true,
  emailReminders: false,
  weekStartsOn: 'sunday',
  timeFormat: '12h',
  pomodoroWorkMinutes: 25,
  pomodoroBreakMinutes: 5,
  calendarStartHour: 5,
  calendarEndHour: 23,
  aiProvider: 'openai',
};

interface SubscriptionInfo {
  tier: 'free' | 'pro' | 'premium';
  status: string;
  stripeCustomerId: string | null;
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [settings, setSettings] = useLocalStorage<UserSettings>('user-settings', DEFAULT_SETTINGS);
  const { theme: currentTheme, setTheme } = useTheme();
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo>({ tier: 'free', status: 'active', stripeCustomerId: null });
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);

  // Check for OAuth callback results
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'google_connected') {
      setGoogleConnected(true);
      setStatusMessage({ type: 'success', message: 'Successfully connected to Google Calendar!' });
    } else if (error) {
      const errorMessages: Record<string, string> = {
        google_auth_denied: 'Google Calendar authorization was denied',
        no_code: 'No authorization code received',
        not_configured: 'Google Calendar integration is not configured',
        token_exchange_failed: 'Failed to exchange authorization code',
        callback_failed: 'Failed to complete Google Calendar connection',
      };
      setStatusMessage({ type: 'error', message: errorMessages[error] || 'An error occurred' });
    }
  }, [searchParams]);

  // Check if Google Calendar is connected via API
  useEffect(() => {
    const checkGoogleConnection = async () => {
      try {
        const response = await fetch('/api/calendar/google/status');
        const data = await response.json();
        setGoogleConnected(data.connected === true);
      } catch (error) {
        console.error('Failed to check Google Calendar status:', error);
        setGoogleConnected(false);
      }
    };
    checkGoogleConnection();
  }, []);

  // Fetch subscription status
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await fetch('/api/user/subscription');
        if (response.ok) {
          const data = await response.json();
          setSubscription({
            tier: data.tier || 'free',
            status: data.status || 'active',
            stripeCustomerId: data.stripeCustomerId || null,
          });
        }
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      } finally {
        setIsLoadingSubscription(false);
      }
    };
    fetchSubscription();
  }, []);

  const manageSubscription = async () => {
    if (!subscription.stripeCustomerId) {
      router.push('/pricing');
      return;
    }

    setIsManagingSubscription(true);
    try {
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: subscription.stripeCustomerId }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setStatusMessage({ type: 'error', message: 'Failed to open billing portal' });
        setIsManagingSubscription(false);
      }
    } catch (error) {
      setStatusMessage({ type: 'error', message: 'Failed to open billing portal' });
      setIsManagingSubscription(false);
    }
  };

  const connectGoogleCalendar = async () => {
    setIsConnectingGoogle(true);
    try {
      const response = await fetch('/api/calendar/google');
      const data = await response.json();

      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else if (data.error) {
        setStatusMessage({ type: 'error', message: data.error });
        setIsConnectingGoogle(false);
      }
    } catch (error) {
      setStatusMessage({ type: 'error', message: 'Failed to start Google Calendar connection' });
      setIsConnectingGoogle(false);
    }
  };

  const disconnectGoogleCalendar = async () => {
    try {
      await fetch('/api/calendar/google', { method: 'DELETE' });
      setGoogleConnected(false);
      setStatusMessage({ type: 'success', message: 'Disconnected from Google Calendar' });
    } catch (error) {
      setStatusMessage({ type: 'error', message: 'Failed to disconnect Google Calendar' });
    }
  };

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Customize your Goal Achiever Pro experience"
      />

      {/* Status Message */}
      {statusMessage && (
        <Card className={statusMessage.type === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
          <CardContent className="py-3">
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-red-600" />
              )}
              <span className={statusMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {statusMessage.message}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-6 w-6 p-0"
                onClick={() => setStatusMessage(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Subscription
              </CardTitle>
              <CardDescription>Manage your subscription plan</CardDescription>
            </div>
            {isLoadingSubscription ? (
              <Badge variant="outline">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Loading...
              </Badge>
            ) : (
              <Badge variant={subscription.tier === 'free' ? 'outline' : 'default'}>
                {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} Plan
                {subscription.status === 'past_due' && ' (Past Due)'}
                {subscription.status === 'canceled' && ' (Canceled)'}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subscription.tier === 'free' ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Upgrade to unlock premium features like Google Calendar sync, advanced analytics, and more.
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => router.push('/pricing')}>
                    Upgrade to Pro
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/pricing')}>
                    View Plans
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {subscription.status === 'active' && `You're on the ${subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} plan. Thank you for your support!`}
                  {subscription.status === 'past_due' && 'Your payment is past due. Please update your payment method.'}
                  {subscription.status === 'canceled' && 'Your subscription has been canceled. You can resubscribe anytime.'}
                  {subscription.status === 'trialing' && `You're on a free trial of the ${subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} plan.`}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={manageSubscription}
                    disabled={isManagingSubscription}
                  >
                    {isManagingSubscription ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Opening...
                      </>
                    ) : (
                      <>
                        Manage Subscription
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                  {subscription.tier === 'pro' && (
                    <Button variant="outline" onClick={() => router.push('/pricing')}>
                      Upgrade to Premium
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar Integrations
          </CardTitle>
          <CardDescription>Connect your calendars to sync events automatically</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google Calendar */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white border rounded-lg">
                <svg viewBox="0 0 24 24" className="h-6 w-6">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div>
                <div className="font-medium">Google Calendar</div>
                <div className="text-sm text-muted-foreground">
                  {googleConnected ? 'Connected' : 'Sync your Google Calendar events'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={googleConnected ? 'default' : 'secondary'}>
                {googleConnected ? 'Connected' : 'Premium'}
              </Badge>
              {googleConnected ? (
                <Button variant="outline" size="sm" onClick={disconnectGoogleCalendar}>
                  Disconnect
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={connectGoogleCalendar}
                  disabled={isConnectingGoogle}
                >
                  {isConnectingGoogle ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Connect'
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Outlook Calendar (Coming Soon) */}
          <div className="flex items-center justify-between p-4 border rounded-lg opacity-60">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white border rounded-lg">
                <svg viewBox="0 0 24 24" className="h-6 w-6">
                  <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.576-.158.152-.354.228-.59.228h-8.16v-6.162l1.95 1.426c.106.082.226.122.36.122.133 0 .253-.04.36-.122l6.08-4.444c.106-.082.186-.179.238-.29v-1.58l-.001-.232z"/>
                  <path fill="#0078D4" d="M15.012 2h8.16c.236 0 .432.076.59.228.158.152.238.346.238.576v3.332l-6.318 4.618-2.67-1.95V2z"/>
                  <path fill="#28A8EA" d="M7.5 14.625c-.258 0-.48-.09-.664-.27-.184-.18-.276-.398-.276-.652v-3.61l-.008-.005c-.5-.353-.81-.93-.81-1.588V4.5h8.25v3.999c0 .657-.31 1.235-.81 1.588l-.008.005v3.611c0 .254-.092.472-.276.652-.184.18-.406.27-.664.27h-4.734z"/>
                  <path fill="#0078D4" d="M0 7.5v10.5c0 .398.147.74.44 1.024.294.284.65.426 1.068.426h6.75V7.5H0z"/>
                  <path fill="#50D9FF" d="M8.258 4.5H0v3c0 .398.147.74.44 1.024.294.284.65.426 1.068.426h6.75V4.5z"/>
                </svg>
              </div>
              <div>
                <div className="font-medium">Outlook Calendar</div>
                <div className="text-sm text-muted-foreground">Coming soon</div>
              </div>
            </div>
            <Badge variant="outline">Coming Soon</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>Customize how the app looks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Theme</Label>
              <p className="text-sm text-muted-foreground">Choose your preferred color scheme</p>
            </div>
            <Select
              value={currentTheme}
              onValueChange={(v) => {
                setTheme(v as 'light' | 'dark' | 'system');
                updateSetting('theme', v as UserSettings['theme']);
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* AI Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Preferences
          </CardTitle>
          <CardDescription>Configure your AI assistant settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>AI Provider</Label>
              <p className="text-sm text-muted-foreground">Choose which AI model to use for suggestions</p>
            </div>
            <Select
              value={settings.aiProvider}
              onValueChange={(v) => updateSetting('aiProvider', v as UserSettings['aiProvider'])}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">
                  <div className="flex items-center gap-2">
                    <span>OpenAI</span>
                    <Badge variant="secondary" className="text-xs">GPT-4o</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="anthropic">
                  <div className="flex items-center gap-2">
                    <span>Anthropic</span>
                    <Badge variant="secondary" className="text-xs">Claude</Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground border-t pt-3">
            AI is used for generating vision suggestions, SMART goals, affirmations, and more.
            {settings.aiProvider === 'anthropic' && (
              <span className="block mt-1 text-amber-600 dark:text-amber-400">
                Note: Some features may use OpenAI as a fallback if Anthropic is unavailable.
              </span>
            )}
          </p>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Configure how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive browser notifications</p>
            </div>
            <Switch
              checked={settings.notifications}
              onCheckedChange={(v) => updateSetting('notifications', v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Email Reminders</Label>
              <p className="text-sm text-muted-foreground">Receive daily summary emails</p>
            </div>
            <Switch
              checked={settings.emailReminders}
              onCheckedChange={(v) => updateSetting('emailReminders', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Regional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Regional Settings
          </CardTitle>
          <CardDescription>Configure date and time preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Week Starts On</Label>
              <p className="text-sm text-muted-foreground">First day of the week</p>
            </div>
            <Select
              value={settings.weekStartsOn}
              onValueChange={(v) => updateSetting('weekStartsOn', v as UserSettings['weekStartsOn'])}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sunday">Sunday</SelectItem>
                <SelectItem value="monday">Monday</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Time Format</Label>
              <p className="text-sm text-muted-foreground">12-hour or 24-hour clock</p>
            </div>
            <Select
              value={settings.timeFormat}
              onValueChange={(v) => updateSetting('timeFormat', v as UserSettings['timeFormat'])}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">12-hour</SelectItem>
                <SelectItem value="24h">24-hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Calendar Display
          </CardTitle>
          <CardDescription>Configure how your time audit calendar appears</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Calendar Start Time</Label>
              <p className="text-sm text-muted-foreground">First hour shown on calendar</p>
            </div>
            <Select
              value={settings.calendarStartHour.toString()}
              onValueChange={(v) => updateSetting('calendarStartHour', parseInt(v))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {formatHour(i, settings.timeFormat)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Calendar End Time</Label>
              <p className="text-sm text-muted-foreground">Last hour shown on calendar</p>
            </div>
            <Select
              value={settings.calendarEndHour.toString()}
              onValueChange={(v) => updateSetting('calendarEndHour', parseInt(v))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {formatHour(i, settings.timeFormat)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {settings.calendarStartHour >= settings.calendarEndHour && (
            <p className="text-sm text-destructive">
              Start time must be before end time
            </p>
          )}
        </CardContent>
      </Card>

      {/* Pomodoro Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Pomodoro Settings</CardTitle>
          <CardDescription>Customize your focus timer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workMinutes">Work Duration (minutes)</Label>
              <Input
                id="workMinutes"
                type="number"
                min="1"
                max="120"
                value={settings.pomodoroWorkMinutes}
                onChange={(e) => updateSetting('pomodoroWorkMinutes', parseInt(e.target.value) || 25)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="breakMinutes">Break Duration (minutes)</Label>
              <Input
                id="breakMinutes"
                type="number"
                min="1"
                max="60"
                value={settings.pomodoroBreakMinutes}
                onChange={(e) => updateSetting('pomodoroBreakMinutes', parseInt(e.target.value) || 5)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Data & Privacy
          </CardTitle>
          <CardDescription>Manage your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Export Data</div>
              <p className="text-sm text-muted-foreground">Download all your data as JSON</p>
            </div>
            <Button variant="outline" size="sm">
              Export
            </Button>
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <div>
              <div className="font-medium text-destructive">Delete Account</div>
              <p className="text-sm text-muted-foreground">Permanently delete your account and data</p>
            </div>
            <Button variant="destructive" size="sm">
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
