'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Target,
  CheckCircle2,
  Settings,
  Volume2,
  VolumeX,
} from 'lucide-react';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

interface PomodoroSettings {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  pomodorosUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  soundEnabled: boolean;
}

interface PomodoroSession {
  id: string;
  date: string;
  completedPomodoros: number;
  totalMinutes: number;
  tasks: string[];
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  pomodorosUntilLongBreak: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  soundEnabled: true,
};

interface TodaySummary {
  date: string;
  completedPomodoros: number;
  totalMinutes: number;
  tasks: string[];
}

export default function PomodoroPage() {
  const queryClient = useQueryClient();

  // Local settings state (synced with server but works offline)
  const [settings, setLocalSettings] = useState<PomodoroSettings>(DEFAULT_SETTINGS);

  // Fetch today's session data
  const { data: sessionData } = useQuery<{ sessions: unknown[]; todaySummary: TodaySummary }>({
    queryKey: ['pomodoro-sessions', new Date().toISOString().split('T')[0]],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/pomodoro?date=${today}`);
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return response.json();
    },
    staleTime: 30000, // 30 seconds
  });

  const todaySession = sessionData?.todaySummary || null;

  // Create pomodoro session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (data: { plannedMinutes: number; actualMinutes: number; focusNotes: string; status: string }) => {
      const response = await fetch('/api/pomodoro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create session');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pomodoro-sessions'] });
    },
  });

  // Update settings helper
  const setSettings = (updater: PomodoroSettings | ((prev: PomodoroSettings) => PomodoroSettings)) => {
    setLocalSettings(prev => {
      const newSettings = typeof updater === 'function' ? updater(prev) : updater;
      return newSettings;
    });
  };

  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(settings.workMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [currentTask, setCurrentTask] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/sounds/bell.mp3');
    audioRef.current.volume = 0.5;
    return () => {
      audioRef.current = null;
    };
  }, []);

  // Get duration based on mode
  const getDuration = useCallback((timerMode: TimerMode) => {
    switch (timerMode) {
      case 'work':
        return settings.workMinutes * 60;
      case 'shortBreak':
        return settings.shortBreakMinutes * 60;
      case 'longBreak':
        return settings.longBreakMinutes * 60;
    }
  }, [settings]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Play notification sound
  const playSound = useCallback(() => {
    if (settings.soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {
        // Audio play failed, likely due to browser autoplay policy
      });
    }
  }, [settings.soundEnabled]);

  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    playSound();
    setIsRunning(false);

    if (mode === 'work') {
      const newCount = completedPomodoros + 1;
      setCompletedPomodoros(newCount);

      // Save completed pomodoro to database
      createSessionMutation.mutate({
        plannedMinutes: settings.workMinutes,
        actualMinutes: settings.workMinutes,
        focusNotes: currentTask || '',
        status: 'completed',
      });

      // Determine next break type
      const isLongBreak = newCount % settings.pomodorosUntilLongBreak === 0;
      const nextMode = isLongBreak ? 'longBreak' : 'shortBreak';
      setMode(nextMode);
      setTimeLeft(getDuration(nextMode));

      if (settings.autoStartBreaks) {
        setIsRunning(true);
      }
    } else {
      // Break completed, switch to work
      setMode('work');
      setTimeLeft(getDuration('work'));

      if (settings.autoStartPomodoros) {
        setIsRunning(true);
      }
    }
  }, [mode, completedPomodoros, settings, currentTask, getDuration, playSound, createSessionMutation]);

  // Timer effect
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimerComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, handleTimerComplete]);

  // Reset timer
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(getDuration(mode));
  };

  // Switch mode
  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(getDuration(newMode));
  };

  // Calculate progress
  const totalDuration = getDuration(mode);
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;

  // Get mode colors
  const getModeColors = () => {
    switch (mode) {
      case 'work':
        return 'bg-red-500';
      case 'shortBreak':
        return 'bg-green-500';
      case 'longBreak':
        return 'bg-blue-500';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pomodoro Timer"
        description="25-minute focused sprints to maximize productivity"
        actions={
          <Button variant="outline" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Timer Card */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              {/* Mode Tabs */}
              <div className="flex gap-2 justify-center mb-8">
                <Button
                  variant={mode === 'work' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => switchMode('work')}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Focus
                </Button>
                <Button
                  variant={mode === 'shortBreak' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => switchMode('shortBreak')}
                >
                  <Coffee className="h-4 w-4 mr-2" />
                  Short Break
                </Button>
                <Button
                  variant={mode === 'longBreak' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => switchMode('longBreak')}
                >
                  <Coffee className="h-4 w-4 mr-2" />
                  Long Break
                </Button>
              </div>

              {/* Timer Display */}
              <div className="text-center mb-8">
                <div className="relative inline-flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`w-64 h-64 rounded-full ${getModeColors()} opacity-10`} />
                  </div>
                  <div className="relative">
                    <div className="text-8xl font-mono font-bold tracking-tight">
                      {formatTime(timeLeft)}
                    </div>
                    <div className="text-muted-foreground mt-2">
                      {mode === 'work' ? 'Focus Time' : mode === 'shortBreak' ? 'Short Break' : 'Long Break'}
                    </div>
                  </div>
                </div>
                <Progress value={progress} className="max-w-md mx-auto mt-6" />
              </div>

              {/* Controls */}
              <div className="flex justify-center gap-4">
                <Button
                  size="lg"
                  onClick={() => setIsRunning(!isRunning)}
                  className="w-32"
                >
                  {isRunning ? (
                    <><Pause className="h-5 w-5 mr-2" /> Pause</>
                  ) : (
                    <><Play className="h-5 w-5 mr-2" /> Start</>
                  )}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={resetTimer}
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setSettings(s => ({ ...s, soundEnabled: !s.soundEnabled }))}
                >
                  {settings.soundEnabled ? (
                    <Volume2 className="h-5 w-5" />
                  ) : (
                    <VolumeX className="h-5 w-5" />
                  )}
                </Button>
              </div>

              {/* Current Task */}
              <div className="max-w-md mx-auto mt-8">
                <Label htmlFor="currentTask" className="text-sm text-muted-foreground">
                  What are you working on?
                </Label>
                <Input
                  id="currentTask"
                  value={currentTask}
                  onChange={(e) => setCurrentTask(e.target.value)}
                  placeholder="e.g., Write blog post, Review PRs..."
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats & Settings */}
        <div className="space-y-6">
          {/* Today's Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Today&apos;s Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Pomodoros</span>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: settings.pomodorosUntilLongBreak }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          i < completedPomodoros ? 'bg-red-500 text-white' : 'bg-muted'
                        }`}
                      >
                        {i < completedPomodoros && <CheckCircle2 className="h-4 w-4" />}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Today</span>
                  <Badge variant="secondary">
                    {todaySession?.completedPomodoros || 0} pomodoros
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Focus Time</span>
                  <Badge variant="secondary">
                    {todaySession?.totalMinutes || 0} minutes
                  </Badge>
                </div>
              </div>

              {todaySession?.tasks && todaySession.tasks.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground mb-2">Worked on:</div>
                  <div className="flex flex-wrap gap-2">
                    {todaySession.tasks.map((task, i) => (
                      <Badge key={i} variant="outline">{task}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings Panel */}
          {showSettings && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Timer Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs">Focus</Label>
                    <Input
                      type="number"
                      value={settings.workMinutes}
                      onChange={(e) => setSettings(s => ({
                        ...s,
                        workMinutes: parseInt(e.target.value) || 25
                      }))}
                      min={1}
                      max={60}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Short Break</Label>
                    <Input
                      type="number"
                      value={settings.shortBreakMinutes}
                      onChange={(e) => setSettings(s => ({
                        ...s,
                        shortBreakMinutes: parseInt(e.target.value) || 5
                      }))}
                      min={1}
                      max={30}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Long Break</Label>
                    <Input
                      type="number"
                      value={settings.longBreakMinutes}
                      onChange={(e) => setSettings(s => ({
                        ...s,
                        longBreakMinutes: parseInt(e.target.value) || 15
                      }))}
                      min={1}
                      max={60}
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setSettings(DEFAULT_SETTINGS);
                    resetTimer();
                  }}
                >
                  Reset to Defaults
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Pomodoro Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p><strong>Focus:</strong> During work sessions, commit to one task only. No multitasking.</p>
              <p><strong>Breaks:</strong> Step away from your screen. Stretch, hydrate, or take a short walk.</p>
              <p><strong>Track:</strong> After each session, log what you accomplished in Time Audit.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
