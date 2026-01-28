'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DollarSign,
  Heart,
  Users,
  Briefcase,
  TrendingUp,
  Dumbbell,
  Palette,
  Sparkles,
  Building2,
  Rocket,
  Target,
  Brain,
  Clock,
  Zap,
} from 'lucide-react';

// 7 Pillars of Life + Business categories
const TEMPLATE_CATEGORIES = [
  { id: 'business', label: 'Business', icon: Briefcase },
  { id: 'finances', label: 'Finances', icon: DollarSign },
  { id: 'health', label: 'Health', icon: Dumbbell },
  { id: 'relationships', label: 'Relationships', icon: Heart },
  { id: 'personal-growth', label: 'Personal Growth', icon: Brain },
  { id: 'lifestyle', label: 'Lifestyle', icon: Palette },
] as const;

export interface VisionTemplate {
  id: string;
  category: typeof TEMPLATE_CATEGORIES[number]['id'];
  title: string;
  description: string;
  icon: typeof DollarSign;
  color: string;
  pillar: string; // 7 Pillars reference
  methodology: 'martell' | 'hormozi' | 'cardone' | 'general';
  // Pre-filled SMART components
  specific?: string;
  measurable?: string;
  attainable?: string;
  realistic?: string;
  // Suggested timeframe
  suggestedMonths: number;
  // 10X version (Grant Cardone style)
  tenXVersion?: {
    title: string;
    description: string;
    specific?: string;
    measurable?: string;
  };
  // Dream outcome (Alex Hormozi style)
  dreamOutcome?: string;
  // Non-negotiables suggestions
  suggestedNonNegotiables?: string[];
}

export const VISION_TEMPLATES: VisionTemplate[] = [
  // BUSINESS TEMPLATES
  {
    id: 'saas-10m',
    category: 'business',
    title: 'Build a $10M SaaS Business',
    description: 'Scale a software business to 8 figures with recurring revenue',
    icon: Rocket,
    color: '#6366f1',
    pillar: 'Finances',
    methodology: 'martell',
    specific: 'Build a B2B SaaS product solving a specific pain point with monthly recurring revenue',
    measurable: '$10M ARR, 500+ paying customers, <5% monthly churn, $500 average MRR per customer',
    attainable: 'Leverage existing industry expertise, start with MVP, iterate based on customer feedback',
    realistic: 'SaaS market growing 18% annually, similar companies achieved this in 3-5 years',
    suggestedMonths: 36,
    tenXVersion: {
      title: 'Build a $100M SaaS Empire',
      description: 'Create a market-defining software company with multiple products',
      specific: 'Build a suite of B2B SaaS products becoming the category leader',
      measurable: '$100M ARR, 5000+ customers, multiple product lines, international expansion',
    },
    dreamOutcome: 'Wake up to see MRR grow automatically. Work 4 hours/day on strategy while a team of A-players executes. Take 12 weeks vacation/year.',
    suggestedNonNegotiables: ['Ship something every day', 'Talk to 3 customers weekly', 'Review metrics daily'],
  },
  {
    id: 'agency-exit',
    category: 'business',
    title: 'Build & Exit an Agency',
    description: 'Create a sellable agency that runs without you',
    icon: Building2,
    color: '#8b5cf6',
    pillar: 'Finances',
    methodology: 'martell',
    specific: 'Build a specialized agency with documented processes, a-player team, and recurring clients',
    measurable: '$2M revenue, 40%+ margins, 80% recurring revenue, owner works <10 hrs/week',
    attainable: 'Start with your expertise, build systems, hire and train team members',
    realistic: 'Following proven agency playbooks, agencies can be exit-ready in 3-4 years',
    suggestedMonths: 48,
    tenXVersion: {
      title: 'Build a $20M Agency Portfolio',
      description: 'Own multiple agencies across verticals with a holding company structure',
      specific: 'Acquire and scale 3-5 agencies in complementary niches',
      measurable: '$20M combined revenue, multiple exits, passive income from all entities',
    },
    dreamOutcome: 'Own an agency that deposits profits monthly while you focus on acquisition deals. Location-independent with global team.',
    suggestedNonNegotiables: ['Document one process daily', 'Delegate one task weekly', 'Review P&L monthly'],
  },
  {
    id: 'course-creator',
    category: 'business',
    title: 'Launch a $1M Course Business',
    description: 'Package your expertise into a scalable online education business',
    icon: Sparkles,
    color: '#ec4899',
    pillar: 'Finances',
    methodology: 'hormozi',
    specific: 'Create a signature course teaching a high-value skill with community support',
    measurable: '$1M revenue, 1000+ students, 90%+ completion rate, 4.8+ rating',
    attainable: 'Already have expertise in this area, can leverage existing audience',
    realistic: 'Course market is $400B+ globally, experts regularly achieve this with proper positioning',
    suggestedMonths: 18,
    tenXVersion: {
      title: 'Build a $10M Education Empire',
      description: 'Create multiple courses, certifications, and a coaching program',
      specific: 'Build a comprehensive education platform with multiple product tiers',
      measurable: '$10M revenue, 10K+ students, certification program, licensed trainers',
    },
    dreamOutcome: 'Students achieve life-changing results and share testimonials daily. Revenue grows while you sleep. Impact thousands globally.',
    suggestedNonNegotiables: ['Create content daily', 'Respond to student questions', 'Collect one testimonial weekly'],
  },
  // FINANCE TEMPLATES
  {
    id: 'financial-freedom',
    category: 'finances',
    title: 'Achieve Financial Freedom',
    description: 'Build enough passive income to cover all expenses',
    icon: DollarSign,
    color: '#22c55e',
    pillar: 'Finances',
    methodology: 'general',
    specific: 'Build diversified passive income streams covering 100% of monthly expenses',
    measurable: '$15K/month passive income from 3+ sources, 12 months emergency fund',
    attainable: 'Start with one income stream, reinvest profits, diversify over time',
    realistic: 'Following proven wealth-building strategies, achievable in 5-7 years with focus',
    suggestedMonths: 60,
    tenXVersion: {
      title: 'Build Generational Wealth',
      description: 'Create $10M+ in assets with legacy planning',
      specific: 'Build a diversified portfolio of businesses, real estate, and investments',
      measurable: '$10M net worth, $50K/month passive income, family trust established',
    },
    dreamOutcome: 'Money works for you 24/7. Every month brings more wealth. Complete freedom to spend time how you want.',
    suggestedNonNegotiables: ['Track net worth monthly', 'Invest before spending', 'Learn about money daily'],
  },
  {
    id: 'debt-freedom',
    category: 'finances',
    title: 'Become 100% Debt-Free',
    description: 'Eliminate all debt and build a solid financial foundation',
    icon: Target,
    color: '#14b8a6',
    pillar: 'Finances',
    methodology: 'general',
    specific: 'Pay off all consumer debt, student loans, and build emergency fund',
    measurable: '$0 debt (excluding mortgage), 6-month emergency fund, automated savings',
    attainable: 'Use debt snowball method, cut expenses, increase income',
    realistic: 'Debt-free journey typically takes 2-4 years with focused effort',
    suggestedMonths: 24,
    dreamOutcome: 'Every paycheck is 100% yours. No stress about bills. Complete control over your financial future.',
    suggestedNonNegotiables: ['Track all spending', 'No new debt', 'Side hustle 5hrs/week'],
  },
  // HEALTH TEMPLATES
  {
    id: 'peak-health',
    category: 'health',
    title: 'Achieve Peak Physical Health',
    description: 'Transform your body and energy levels',
    icon: Dumbbell,
    color: '#f97316',
    pillar: 'Health',
    methodology: 'cardone',
    specific: 'Reach optimal body composition, energy, and fitness levels',
    measurable: '15% body fat, run 5K in under 25 min, sleep 7+ hours, energy 8+/10',
    attainable: 'Commit to consistent training, proper nutrition, and recovery',
    realistic: 'With proper program, dramatic improvements in 6-12 months',
    suggestedMonths: 12,
    tenXVersion: {
      title: 'Become an Elite Athlete',
      description: 'Compete at the highest level in your chosen sport',
      specific: 'Train like a professional athlete with world-class coaching',
      measurable: 'Complete Ironman, climb major peaks, or compete professionally',
    },
    dreamOutcome: 'Boundless energy from morning to night. Look and feel better than ever. People ask what your secret is.',
    suggestedNonNegotiables: ['Exercise 60 min daily', 'No processed food', '7+ hours sleep', '10K steps daily'],
  },
  {
    id: 'mental-wellness',
    category: 'health',
    title: 'Master Mental Wellness',
    description: 'Build unshakeable mental health and resilience',
    icon: Brain,
    color: '#a855f7',
    pillar: 'Health',
    methodology: 'general',
    specific: 'Develop strong mental health habits, stress management, and emotional intelligence',
    measurable: 'Daily meditation, therapy support, stress score <3/10, 8+/10 life satisfaction',
    attainable: 'Build habits incrementally, get professional support, practice consistently',
    realistic: 'Mental wellness improves significantly within 3-6 months of consistent practice',
    suggestedMonths: 12,
    dreamOutcome: 'Calm and centered no matter what happens. Anxiety is a distant memory. Handle any challenge with grace.',
    suggestedNonNegotiables: ['Meditate 20 min daily', 'Journal every morning', 'Weekly therapy', 'Digital detox Sunday'],
  },
  // RELATIONSHIP TEMPLATES
  {
    id: 'relationship-transformation',
    category: 'relationships',
    title: 'Transform Key Relationships',
    description: 'Deepen connections with the people who matter most',
    icon: Heart,
    color: '#ef4444',
    pillar: 'Love',
    methodology: 'martell',
    specific: 'Strengthen marriage/partnership, family bonds, and close friendships',
    measurable: 'Weekly date night, monthly family activity, quarterly friend meetups, relationship satisfaction 9+/10',
    attainable: 'Prioritize relationship time, develop communication skills, be intentional',
    realistic: 'Relationships can transform dramatically with consistent attention over 6-12 months',
    suggestedMonths: 12,
    dreamOutcome: 'Deep, fulfilling relationships that energize you. Coming home is the best part of the day. True partnership in everything.',
    suggestedNonNegotiables: ['Quality time daily', 'Express gratitude', 'No phones at dinner', 'Listen actively'],
  },
  {
    id: 'network-expansion',
    category: 'relationships',
    title: 'Build a World-Class Network',
    description: 'Surround yourself with high-performers and mentors',
    icon: Users,
    color: '#3b82f6',
    pillar: 'Friends',
    methodology: 'hormozi',
    specific: 'Build relationships with industry leaders, mentors, and high-performers',
    measurable: '5 mentor relationships, 50+ valuable connections, attend 4 conferences/year',
    attainable: 'Provide value first, be consistent in outreach, join mastermind groups',
    realistic: 'Building a powerful network takes 1-2 years of consistent effort',
    suggestedMonths: 18,
    tenXVersion: {
      title: 'Become a Connector & Influencer',
      description: 'Be the person everyone wants to know in your industry',
      specific: 'Host events, create content, and facilitate high-value introductions',
      measurable: '10K+ followers, host quarterly events, known as THE connector in your space',
    },
    dreamOutcome: 'One text away from any introduction you need. Opportunities come to you. Your network is your unfair advantage.',
    suggestedNonNegotiables: ['Reach out to 3 people daily', 'Give before asking', 'Follow up always'],
  },
  // PERSONAL GROWTH TEMPLATES
  {
    id: 'skill-mastery',
    category: 'personal-growth',
    title: 'Master a High-Value Skill',
    description: 'Become world-class at a skill that creates massive value',
    icon: Zap,
    color: '#f59e0b',
    pillar: 'Hobbies',
    methodology: 'cardone',
    specific: 'Achieve top 1% proficiency in a valuable skill (coding, sales, writing, etc.)',
    measurable: 'Complete certification, 1000+ hours practice, get paid top rates for this skill',
    attainable: 'Deliberate practice, expert coaching, real-world application',
    realistic: 'With focused effort, significant mastery achievable in 1-2 years',
    suggestedMonths: 18,
    tenXVersion: {
      title: 'Become THE Authority',
      description: 'Be recognized as the world\'s leading expert in your field',
      specific: 'Write the book, give the talks, train the trainers',
      measurable: 'Best-selling book, 100+ speaking gigs, trained 1000+ others',
    },
    dreamOutcome: 'People seek you out for your expertise. Your skill opens any door. You get paid premium rates effortlessly.',
    suggestedNonNegotiables: ['Practice 2 hours daily', 'Learn from best-in-class', 'Teach others weekly'],
  },
  // LIFESTYLE TEMPLATES
  {
    id: 'time-freedom',
    category: 'lifestyle',
    title: 'Reclaim Your Time',
    description: 'Work less while achieving more through delegation and systems',
    icon: Clock,
    color: '#06b6d4',
    pillar: 'Family',
    methodology: 'martell',
    specific: 'Systematize and delegate to work fewer hours while increasing output',
    measurable: 'Work 25 hours/week max, revenue maintained or increased, 4+ weeks vacation/year',
    attainable: 'Document processes, hire team, use proven delegation frameworks',
    realistic: 'Following time optimization principles, achievable in 12-18 months',
    suggestedMonths: 18,
    tenXVersion: {
      title: 'Complete Time Sovereignty',
      description: 'Work only on what you love, when you want',
      specific: 'Build a business and life that runs on your schedule, not the other way around',
      measurable: 'Work 10 hours/week on strategy only, 12+ weeks vacation, location independent',
    },
    dreamOutcome: 'Your time is 100% yours. Work is optional. Every day feels like a weekend while income grows.',
    suggestedNonNegotiables: ['Audit time weekly', 'Delegate one thing daily', 'Protect morning routine'],
  },
  {
    id: 'location-independence',
    category: 'lifestyle',
    title: 'Achieve Location Independence',
    description: 'Build a life and business you can run from anywhere',
    icon: TrendingUp,
    color: '#10b981',
    pillar: 'Spirituality',
    methodology: 'general',
    specific: 'Create income streams that work regardless of location, with travel flexibility',
    measurable: 'Remote income covering 150% of expenses, travel 3+ months/year, productive from anywhere',
    attainable: 'Transition to remote work, build online income, establish systems',
    realistic: 'Location independence achievable in 12-24 months with focused effort',
    suggestedMonths: 18,
    dreamOutcome: 'Work from a beach in Bali or a cafe in Paris. Your office is wherever you open your laptop. True freedom.',
    suggestedNonNegotiables: ['Build one remote income stream', 'Minimize possessions', 'Design for flexibility'],
  },
];

interface VisionTemplatesProps {
  onSelectTemplate: (template: VisionTemplate, use10X?: boolean) => void;
  onClose: () => void;
}

export function VisionTemplates({ onSelectTemplate, onClose }: VisionTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('business');
  const [selectedTemplate, setSelectedTemplate] = useState<VisionTemplate | null>(null);
  const [use10X, setUse10X] = useState(false);

  const filteredTemplates = VISION_TEMPLATES.filter(t => t.category === selectedCategory);

  const handleSelectTemplate = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate, use10X);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Choose a Vision Template</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Based on proven entrepreneurial frameworks for goal achievement
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 justify-center">
        {TEMPLATE_CATEGORIES.map((category) => {
          const Icon = category.icon;
          return (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedCategory(category.id);
                setSelectedTemplate(null);
              }}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              {category.label}
            </Button>
          );
        })}
      </div>

      {/* Template Grid */}
      <ScrollArea className="h-[300px] rounded-lg border p-4">
        <div className="grid gap-3">
          {filteredTemplates.map((template) => {
            const Icon = template.icon;
            const isSelected = selectedTemplate?.id === template.id;
            return (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all hover:border-primary/50 ${
                  isSelected ? 'border-primary ring-2 ring-primary/20' : ''
                }`}
                onClick={() => setSelectedTemplate(template)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${template.color}20` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: template.color }} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{template.title}</CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          {template.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {template.suggestedMonths} mo
                    </Badge>
                  </div>
                </CardHeader>
                {isSelected && (
                  <CardContent className="pt-0">
                    <div className="space-y-3 text-sm">
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {template.pillar} Pillar
                        </Badge>
                        {template.tenXVersion && (
                          <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">
                            10X Available
                          </Badge>
                        )}
                      </div>

                      {template.dreamOutcome && (
                        <div className="p-3 rounded-lg bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-200 dark:border-violet-800">
                          <p className="text-xs font-medium text-violet-700 dark:text-violet-300 mb-1">
                            Dream Outcome (Hormozi):
                          </p>
                          <p className="text-xs text-muted-foreground">{template.dreamOutcome}</p>
                        </div>
                      )}

                      {template.tenXVersion && (
                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-muted/50">
                          <input
                            type="checkbox"
                            checked={use10X}
                            onChange={(e) => {
                              e.stopPropagation();
                              setUse10X(e.target.checked);
                            }}
                            className="rounded border-orange-500"
                          />
                          <span className="text-xs">
                            <strong className="text-orange-600">10X it</strong> (Cardone): {template.tenXVersion.title}
                          </span>
                        </label>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          Start from Scratch
        </Button>
        <Button
          onClick={handleSelectTemplate}
          disabled={!selectedTemplate}
        >
          Use Template
          {selectedTemplate && use10X && selectedTemplate.tenXVersion && (
            <span className="ml-1 text-orange-300">(10X)</span>
          )}
        </Button>
      </div>
    </div>
  );
}
