'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Image, Bell, Quote, Target, ListChecks } from 'lucide-react';
import type { VisionWizardData } from '../vision-wizard';

interface ReviewStepProps {
  data: VisionWizardData;
}

export function ReviewStep({ data }: ReviewStepProps) {
  const getCompletionStatus = () => {
    const checks = [
      { label: 'Vision Title', complete: !!data.title.trim() },
      { label: 'SMART Goals', complete: !!(data.specific || data.measurable || data.attainable || data.realistic || data.timeBound) },
      { label: 'Non-Negotiables', complete: data.nonNegotiables.length > 0 },
      { label: 'Reminders', complete: data.reminders.showOnLogin || data.reminders.morningReminder || data.reminders.eveningReminder },
      { label: 'Vision Board', complete: data.boardImages.length > 0 },
      { label: 'Affirmation', complete: !!data.affirmationText.trim() },
    ];

    const completed = checks.filter(c => c.complete).length;
    return { checks, completed, total: checks.length };
  };

  const status = getCompletionStatus();
  const threeHundredPercent = data.clarityScore + data.beliefScore + data.consistencyScore;

  return (
    <div className="space-y-6">
      {/* Completion Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Completion Status</span>
            <Badge variant={status.completed === status.total ? 'default' : 'secondary'}>
              {status.completed}/{status.total} Complete
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {status.checks.map((check) => (
              <div
                key={check.label}
                className={`flex items-center gap-2 text-sm ${
                  check.complete ? 'text-green-600' : 'text-muted-foreground'
                }`}
              >
                {check.complete ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
                {check.label}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Vision Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            Vision
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <h3 className="font-semibold text-lg">{data.title || 'Untitled Vision'}</h3>
          </div>
          {data.description && (
            <p className="text-sm text-muted-foreground">{data.description}</p>
          )}
          {data.targetDate && (
            <p className="text-sm">
              <strong>Target Date:</strong> {new Date(data.targetDate).toLocaleDateString()}
            </p>
          )}

          {/* 300% Score */}
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">300% Score</span>
              <span className={`font-bold ${
                threeHundredPercent >= 240 ? 'text-green-600' :
                threeHundredPercent >= 180 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {threeHundredPercent}%
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Clarity:</span> {data.clarityScore}%
              </div>
              <div>
                <span className="text-muted-foreground">Belief:</span> {data.beliefScore}%
              </div>
              <div>
                <span className="text-muted-foreground">Consistency:</span> {data.consistencyScore}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMART Goals Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">SMART Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {[
              { key: 'specific', label: 'Specific' },
              { key: 'measurable', label: 'Measurable' },
              { key: 'attainable', label: 'Attainable' },
              { key: 'realistic', label: 'Realistic' },
              { key: 'timeBound', label: 'Time-Bound' },
            ].map(({ key, label }) => {
              const value = data[key as keyof VisionWizardData] as string;
              return (
                <div key={key} className="flex gap-2">
                  <span className="font-medium w-24 shrink-0">{label}:</span>
                  <span className="text-muted-foreground">
                    {value?.trim() ? value.substring(0, 100) + (value.length > 100 ? '...' : '') : 'Not set'}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Non-Negotiables Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ListChecks className="h-5 w-5" />
            Non-Negotiables ({data.nonNegotiables.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.nonNegotiables.length > 0 ? (
            <div className="space-y-2">
              {data.nonNegotiables.map((nn, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>{nn.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {nn.frequency}
                  </Badge>
                  {nn.targetCount > 1 && (
                    <Badge variant="secondary" className="text-xs">
                      {nn.targetCount}x/day
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No non-negotiables defined</p>
          )}
        </CardContent>
      </Card>

      {/* Reminders & Vision Board & Affirmation Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Reminders
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            {data.reminders.showOnLogin && <div>Show on login</div>}
            {data.reminders.morningReminder && <div>Morning ({data.reminders.morningTime})</div>}
            {data.reminders.eveningReminder && <div>Evening ({data.reminders.eveningTime})</div>}
            {!data.reminders.showOnLogin && !data.reminders.morningReminder && !data.reminders.eveningReminder && (
              <span className="text-muted-foreground">None set</span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Image className="h-4 w-4" />
              Vision Board
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {data.boardImages.length > 0 ? (
              <span>{data.boardImages.length} image{data.boardImages.length !== 1 ? 's' : ''}</span>
            ) : (
              <span className="text-muted-foreground">No images</span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Quote className="h-4 w-4" />
              Affirmation
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {data.affirmationText.trim() ? (
              <span className="text-muted-foreground italic">
                "{data.affirmationText.substring(0, 50)}..."
              </span>
            ) : (
              <span className="text-muted-foreground">Not set</span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ready Message */}
      <div className="bg-primary/10 rounded-lg p-4 text-center">
        <p className="font-medium">
          {status.completed === status.total
            ? "Your vision is fully configured and ready to save!"
            : "You can save now and complete the remaining sections later."}
        </p>
      </div>
    </div>
  );
}
