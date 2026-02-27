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

  // Dashboard
  dashboard: '/dashboard',

  // Time Audit
  timeAudit: '/time-audit',
  timeAuditWeekly: '/time-audit/weekly',
  timeAuditBiweekly: '/time-audit/biweekly',
  timeAuditMonthly: '/time-audit/monthly',
  timeAuditProjects: '/time-audit/projects',

  // Leverage & Network
  leverage: '/leverage',
  network: '/network',

  // Analytics
  analytics: '/analytics',

  // Team & Collaboration
  team: '/team',
  teamMember: (id: string) => `/team/${id}`,

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
  '/time-audit',
  '/analytics',
  '/leverage',
  '/network',
  '/team',
  '/settings',
  '/admin',
];
