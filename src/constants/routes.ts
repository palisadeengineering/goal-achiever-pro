// Application routes

export const ROUTES = {
  // Public/Marketing
  home: '/',
  pricing: '/pricing',
  features: '/features',
  offer: '/offer',

  // Auth
  login: '/login',
  signup: '/signup',
  forgotPassword: '/forgot-password',
  callback: '/callback',
  acceptInvite: (token: string) => `/accept-invite/${token}`,

  // Onboarding
  onboarding: {
    welcome: '/welcome',
    vision: '/vision-setup',
    complete: '/complete',
  },

  // Dashboard
  dashboard: '/dashboard',
  today: '/today',
  progress: '/progress',

  // Backtrack Planning
  backtrack: '/backtrack',
  backtrackNew: '/backtrack/new',
  backtrackDetail: (id: string) => `/backtrack/${id}`,

  // Vision & Goals
  planner: '/planner',
  vision: '/vision',
  goals: '/goals',
  goalNew: '/goals/new',
  goalDetail: (id: string) => `/goals/${id}`,

  // MINS
  mins: '/mins',
  minsCalendar: '/mins/calendar',

  // Time Audit
  timeAudit: '/time-audit',
  timeAuditWeekly: '/time-audit/weekly',
  timeAuditBiweekly: '/time-audit/biweekly',
  timeAuditMonthly: '/time-audit/monthly',
  timeAuditProjects: '/time-audit/projects',

  // Value Matrix
  drip: '/drip',
  dripAnalysis: '/drip/analysis',

  // Daily Systems
  routines: '/routines',
  routineDetail: (id: string) => `/routines/${id}`,
  routineToday: '/routines/today',
  pomodoro: '/pomodoro',

  // Reviews
  reviews: '/reviews',
  reviewMorning: '/reviews/morning',
  reviewMidday: '/reviews/midday',
  reviewEvening: '/reviews/evening',

  // Team & Collaboration
  team: '/team',
  teamMember: (id: string) => `/team/${id}`,

  // Key Results / OKRs
  okrs: '/okrs',
  okrNew: '/okrs/new',
  okrDetail: (id: string) => `/okrs/${id}`,

  // Leverage & Network (Pro+)
  leverage: '/leverage',
  network: '/network',

  // Metrics & Analytics
  metrics: '/metrics',
  scorecard: '/metrics/scorecard',
  analytics: '/analytics',

  // Help & Guide
  guide: '/guide',

  // Accountability (Elite)
  accountability: '/accountability',

  // Settings
  settings: '/settings',
  settingsProfile: '/settings/profile',
  settingsSubscription: '/settings/subscription',
  settingsIntegrations: '/settings/integrations',
  settingsNotifications: '/settings/notifications',
  settingsExport: '/settings/export',

  // Admin
  admin: '/admin',
  adminAIUsage: '/admin/ai-usage',
  adminBetaAccess: '/admin/beta-access',
  adminFeedback: '/admin/feedback',
} as const;

// Routes that require authentication
export const PROTECTED_ROUTES = [
  '/dashboard',
  '/today',
  '/progress',
  '/backtrack',
  '/planner',
  '/vision',
  '/goals',
  '/mins',
  '/time-audit',
  '/drip',
  '/routines',
  '/pomodoro',
  '/reviews',
  '/team',
  '/okrs',
  '/leverage',
  '/network',
  '/metrics',
  '/analytics',
  '/accountability',
  '/settings',
];

// Routes by subscription tier requirement
export const TIER_REQUIRED_ROUTES: Record<string, 'pro' | 'elite'> = {
  '/time-audit/biweekly': 'pro',
  '/time-audit/monthly': 'pro',
  '/leverage': 'pro',
  '/network': 'pro',
  '/accountability': 'elite',
  '/reviews/midday': 'pro',
};
