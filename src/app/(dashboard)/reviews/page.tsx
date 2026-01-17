'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Sun,
  Clock,
  Moon,
  CheckCircle2,
  Star,
  Target,
  Zap,
  Heart,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { ShareButton } from '@/components/features/sharing';

interface DailyReview {
  id: string;
  date: string;
  type: 'morning' | 'midday' | 'evening';
  wins: string[];
  challenges: string[];
  gratitude: string[];
  clarityScore: number;
  beliefScore: number;
  consistencyScore: number;
  energyLevel: number;
  moodScore: number;
  tomorrowFocus: string;
  notes: string;
  completedAt: string;
}

const today = new Date().toISOString().split('T')[0];

// Fetch reviews for today
async function fetchTodayReviews(): Promise<DailyReview[]> {
  const response = await fetch(`/api/reviews?date=${today}`);
  if (!response.ok) {
    throw new Error('Failed to fetch reviews');
  }
  return response.json();
}

// Save a review
async function saveReviewToApi(review: Omit<DailyReview, 'id' | 'completedAt'>): Promise<DailyReview> {
  const response = await fetch('/api/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(review),
  });
  if (!response.ok) {
    throw new Error('Failed to save review');
  }
  return response.json();
}

export default function ReviewsPage() {
  const queryClient = useQueryClient();
  const [activeReview, setActiveReview] = useState<'morning' | 'midday' | 'evening'>('morning');

  // Form state
  const [wins, setWins] = useState('');
  const [challenges, setChallenges] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [clarityScore, setClarityScore] = useState([70]);
  const [beliefScore, setBeliefScore] = useState([70]);
  const [consistencyScore, setConsistencyScore] = useState([70]);
  const [energyLevel, setEnergyLevel] = useState([70]);
  const [moodScore, setMoodScore] = useState([70]);
  const [tomorrowFocus, setTomorrowFocus] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch today's reviews
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviews', today],
    queryFn: fetchTodayReviews,
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: saveReviewToApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', today] });
      // Reset form
      setWins('');
      setChallenges('');
      setGratitude('');
      setTomorrowFocus('');
      setNotes('');
    },
  });

  // Check if review exists for today
  const getTodayReview = (type: 'morning' | 'midday' | 'evening') => {
    return reviews.find(r => r.date === today && r.type === type);
  };

  const morningDone = !!getTodayReview('morning');
  const middayDone = !!getTodayReview('midday');
  const eveningDone = !!getTodayReview('evening');

  const saveReview = () => {
    saveMutation.mutate({
      date: today,
      type: activeReview,
      wins: wins.split('\n').filter(w => w.trim()),
      challenges: challenges.split('\n').filter(c => c.trim()),
      gratitude: gratitude.split('\n').filter(g => g.trim()),
      clarityScore: clarityScore[0],
      beliefScore: beliefScore[0],
      consistencyScore: consistencyScore[0],
      energyLevel: energyLevel[0],
      moodScore: moodScore[0],
      tomorrowFocus,
      notes,
    });
  };

  // Calculate 300% score
  const threeHundredPercent = clarityScore[0] + beliefScore[0] + consistencyScore[0];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Reviews"
        description="Check in with yourself 3x daily to maintain clarity, belief, and consistency"
        actions={<ShareButton tabName="reviews" />}
      />

      {/* Today's Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Today&apos;s Check-ins</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Button
              variant={morningDone ? 'default' : activeReview === 'morning' ? 'secondary' : 'outline'}
              onClick={() => setActiveReview('morning')}
              className="gap-2"
            >
              <Sun className="h-4 w-4" />
              Morning
              {morningDone && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </Button>
            <Button
              variant={middayDone ? 'default' : activeReview === 'midday' ? 'secondary' : 'outline'}
              onClick={() => setActiveReview('midday')}
              className="gap-2"
            >
              <Clock className="h-4 w-4" />
              Midday
              {middayDone && <CheckCircle2 className="h-4 w-4 text-green-500" />}
              <Badge variant="secondary" className="ml-1 text-xs">Pro</Badge>
            </Button>
            <Button
              variant={eveningDone ? 'default' : activeReview === 'evening' ? 'secondary' : 'outline'}
              onClick={() => setActiveReview('evening')}
              className="gap-2"
            >
              <Moon className="h-4 w-4" />
              Evening
              {eveningDone && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Review Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                {activeReview === 'morning' && <Sun className="h-5 w-5 text-amber-500" />}
                {activeReview === 'midday' && <Clock className="h-5 w-5 text-blue-500" />}
                {activeReview === 'evening' && <Moon className="h-5 w-5 text-indigo-500" />}
                <CardTitle>
                  {activeReview === 'morning' && 'Morning Review'}
                  {activeReview === 'midday' && 'Midday Check-in'}
                  {activeReview === 'evening' && 'Evening Reflection'}
                </CardTitle>
              </div>
              <CardDescription>
                {activeReview === 'morning' && 'Set your intentions and visualize success for the day ahead'}
                {activeReview === 'midday' && 'Recalibrate and refocus for the second half of your day'}
                {activeReview === 'evening' && 'Reflect on your day and prepare for tomorrow'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 300% Rule Scores */}
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">300% Rule Check</h3>
                  <Badge variant={threeHundredPercent >= 240 ? 'default' : 'secondary'}>
                    {threeHundredPercent}%
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-500" />
                        Clarity
                      </Label>
                      <span className="text-sm font-medium">{clarityScore[0]}%</span>
                    </div>
                    <Slider
                      value={clarityScore}
                      onValueChange={setClarityScore}
                      max={100}
                      step={5}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      How clear are you on what you need to do today?
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <Label className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-amber-500" />
                        Belief
                      </Label>
                      <span className="text-sm font-medium">{beliefScore[0]}%</span>
                    </div>
                    <Slider
                      value={beliefScore}
                      onValueChange={setBeliefScore}
                      max={100}
                      step={5}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      How confident are you that you can achieve your goals?
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <Label className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-green-500" />
                        Consistency
                      </Label>
                      <span className="text-sm font-medium">{consistencyScore[0]}%</span>
                    </div>
                    <Slider
                      value={consistencyScore}
                      onValueChange={setConsistencyScore}
                      max={100}
                      step={5}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      How consistent have you been with your daily actions?
                    </p>
                  </div>
                </div>
              </div>

              {/* Energy & Mood */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Energy Level</Label>
                    <span className="text-sm font-medium">{energyLevel[0]}%</span>
                  </div>
                  <Slider
                    value={energyLevel}
                    onValueChange={setEnergyLevel}
                    max={100}
                    step={5}
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Mood</Label>
                    <span className="text-sm font-medium">{moodScore[0]}%</span>
                  </div>
                  <Slider
                    value={moodScore}
                    onValueChange={setMoodScore}
                    max={100}
                    step={5}
                  />
                </div>
              </div>

              {/* Wins */}
              <div>
                <Label htmlFor="wins">
                  {activeReview === 'morning' ? 'What wins do you expect today?' : 'What wins did you have?'}
                </Label>
                <Textarea
                  id="wins"
                  value={wins}
                  onChange={(e) => setWins(e.target.value)}
                  placeholder="List your wins (one per line)..."
                  rows={3}
                  className="mt-2"
                />
              </div>

              {/* Challenges */}
              {activeReview !== 'morning' && (
                <div>
                  <Label htmlFor="challenges">What challenges did you face?</Label>
                  <Textarea
                    id="challenges"
                    value={challenges}
                    onChange={(e) => setChallenges(e.target.value)}
                    placeholder="List any challenges (one per line)..."
                    rows={3}
                    className="mt-2"
                  />
                </div>
              )}

              {/* Gratitude */}
              <div>
                <Label htmlFor="gratitude" className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-pink-500" />
                  Gratitude (3 things)
                </Label>
                <Textarea
                  id="gratitude"
                  value={gratitude}
                  onChange={(e) => setGratitude(e.target.value)}
                  placeholder="What are you grateful for today? (one per line)"
                  rows={3}
                  className="mt-2"
                />
              </div>

              {/* Tomorrow Focus */}
              {activeReview === 'evening' && (
                <div>
                  <Label htmlFor="tomorrowFocus">Tomorrow&apos;s #1 Focus</Label>
                  <Textarea
                    id="tomorrowFocus"
                    value={tomorrowFocus}
                    onChange={(e) => setTomorrowFocus(e.target.value)}
                    placeholder="What's the most important thing to accomplish tomorrow?"
                    rows={2}
                    className="mt-2"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any other reflections..."
                  rows={2}
                  className="mt-2"
                />
              </div>

              <Button
                onClick={saveReview}
                className="w-full"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Complete {activeReview.charAt(0).toUpperCase() + activeReview.slice(1)} Review
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* 300% Tracker */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">300% Rule</CardTitle>
              <CardDescription>Clarity + Belief + Consistency</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold">
                  {threeHundredPercent}%
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {threeHundredPercent >= 270 ? 'Excellent! You\'re on fire!' :
                   threeHundredPercent >= 240 ? 'Great progress!' :
                   threeHundredPercent >= 200 ? 'Keep pushing!' :
                   'Time to recalibrate'}
                </p>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Clarity</span>
                  <span className="font-medium">{clarityScore[0]}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Belief</span>
                  <span className="font-medium">{beliefScore[0]}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Consistency</span>
                  <span className="font-medium">{consistencyScore[0]}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Related</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={ROUTES.vision}>
                  <Target className="h-4 w-4 mr-2" />
                  Review Vision
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={ROUTES.mins}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Today&apos;s MINS
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={ROUTES.routines}>
                  <Clock className="h-4 w-4 mr-2" />
                  Daily Routines
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Review Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p><strong>Morning:</strong> Visualize success. See yourself completing your goals.</p>
              <p><strong>Midday:</strong> Quick reset. Are you on track? Adjust if needed.</p>
              <p><strong>Evening:</strong> Celebrate wins. Learn from challenges. Set up tomorrow.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
