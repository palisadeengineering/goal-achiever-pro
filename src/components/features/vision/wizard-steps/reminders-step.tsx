'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, Sun, Moon, LogIn } from 'lucide-react';
import type { VisionWizardData } from '../vision-wizard';

interface RemindersStepProps {
  data: VisionWizardData;
  updateData: (updates: Partial<VisionWizardData>) => void;
}

export function RemindersStep({ data, updateData }: RemindersStepProps) {
  const updateReminder = (key: keyof VisionWizardData['reminders'], value: unknown) => {
    updateData({
      reminders: {
        ...data.reminders,
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Set up reminders to review your vision regularly. Consistent review reinforces
          your commitment and keeps you focused.
        </p>
      </div>

      <div className="space-y-4">
        {/* Show on Login */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <LogIn className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <Label className="font-medium">Show on Login</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your vision when you open the app
                  </p>
                </div>
              </div>
              <Switch
                checked={data.reminders.showOnLogin}
                onCheckedChange={(checked) => updateReminder('showOnLogin', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Morning Reminder */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Sun className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <Label className="font-medium">Morning Reminder</Label>
                  <p className="text-sm text-muted-foreground">
                    Start your day by reviewing your vision
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="time"
                  value={data.reminders.morningTime}
                  onChange={(e) => updateReminder('morningTime', e.target.value)}
                  disabled={!data.reminders.morningReminder}
                  className="w-32"
                />
                <Switch
                  checked={data.reminders.morningReminder}
                  onCheckedChange={(checked) => updateReminder('morningReminder', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Evening Reminder */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Moon className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <Label className="font-medium">Evening Reminder</Label>
                  <p className="text-sm text-muted-foreground">
                    Reflect on your vision before bed
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="time"
                  value={data.reminders.eveningTime}
                  onChange={(e) => updateReminder('eveningTime', e.target.value)}
                  disabled={!data.reminders.eveningReminder}
                  className="w-32"
                />
                <Switch
                  checked={data.reminders.eveningReminder}
                  onCheckedChange={(checked) => updateReminder('eveningReminder', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Why Review 3x Daily?
        </h4>
        <p className="text-sm text-muted-foreground">
          Dan Martell recommends reviewing your goals morning, midday, and evening.
          This consistent reinforcement keeps your vision top-of-mind and helps
          maintain the belief and clarity needed to achieve it.
        </p>
        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
          <li>• <strong>Morning:</strong> Set your intention for the day</li>
          <li>• <strong>Midday:</strong> Realign your focus if needed</li>
          <li>• <strong>Evening:</strong> Reflect and reinforce before sleep</li>
        </ul>
      </div>
    </div>
  );
}
