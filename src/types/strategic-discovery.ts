// Strategic Discovery Types
// Used for comprehensive business model questioning before generating Impact Projects

export type RevenueType = 'mrr' | 'arr' | 'one-time';
export type PricingModel = 'mass_market' | 'prosumer' | 'enterprise' | 'hybrid';
export type MarketSize = 'niche' | 'medium' | 'large' | 'massive';
export type BillingCycle = 'monthly' | 'yearly' | 'one-time';

// AI-Driven Pricing Model Types
export type BusinessType =
  | 'saas'           // Software as a Service
  | 'service'        // Professional services (consulting, engineering, etc.)
  | 'ecommerce'      // Product sales
  | 'agency'         // Marketing/creative agency
  | 'marketplace'    // Platform connecting buyers/sellers
  | 'hybrid';        // Combination

export type PricingStructure =
  | 'subscription'   // Monthly/yearly recurring
  | 'project'        // Per-project pricing
  | 'hourly'         // Time-based billing
  | 'retainer'       // Monthly retainer fees
  | 'value_based'    // % of value delivered
  | 'tiered'         // Volume-based pricing
  | 'freemium';      // Free + premium

export type PricingModelMode = 'standard' | 'ai_generated';

export interface DynamicPricingOption {
  name: string;
  structure: PricingStructure;
  baseAmount: number;          // Could be hourly rate, project min, or monthly fee
  maxAmount?: number;          // For ranges (project $5K-$50K)
  unit: string;               // "per month", "per project", "per hour", etc.
  clientsNeeded: number;       // Number of clients/projects/hours needed
  description: string;
  recommended: boolean;
  rationale: string;           // Why this works for their business
}

// Revenue Math Section
export interface RevenueOption {
  name: string;
  pricePerMonth: number;
  customersNeeded: number;
  description: string;
  recommended: boolean;
}

export interface RevenueMathData {
  revenueTarget: number;
  revenueType: RevenueType;
  targetTimeframe: string; // ISO date
  pricingModel: PricingModel;
  basePrice: number;
  premiumPrice?: number;
  targetCustomerCount: number;
  arpu: number;
  calculatedOptions: RevenueOption[];
  // AI-Generated pricing fields
  pricingModelMode: PricingModelMode;
  detectedBusinessType?: BusinessType;
  dynamicOptions?: DynamicPricingOption[];
}

// Positioning Section
export interface PositioningData {
  targetCustomer: string;
  problemSolved: string;
  competitors: string;
  differentiator: string;
  marketSize: MarketSize;
}

// Product Section
export interface PricingTier {
  name: string;
  price: number;
  billingCycle: BillingCycle;
  features: string[];
  isPopular?: boolean;
}

export interface ProductData {
  coreFeatures: string[];
  pricingTiers: PricingTier[];
  retentionStrategy: string;
  upgradePath: string;
}

// Acquisition Section
export interface AcquisitionChannel {
  name: string;
  estimatedCost: number;
  estimatedReach: number;
  timeToResults: string;
  isPrimary: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  targetDate: string;
  metric: string;
  targetValue: string;
  isCritical: boolean;
}

export interface AcquisitionData {
  primaryChannels: AcquisitionChannel[];
  estimatedCAC: number;
  milestones: Milestone[];
  launchDate: string;
  criticalPath: string[];
}

// AI Conversation
export type DiscoveryCategory = 'revenue' | 'positioning' | 'product' | 'acquisition';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  category: DiscoveryCategory;
  timestamp: string;
}

export interface AIInsights {
  revenueAnalysis: string;
  riskFactors: string[];
  recommendations: string[];
  successProbability: number; // 0-100
  strengthAreas: string[];
  gapAreas: string[];
}

// Main Strategic Discovery Data
export interface StrategicDiscoveryData {
  id?: string;
  visionId: string;
  userId: string;

  // Category Data
  revenueMath: RevenueMathData;
  positioning: PositioningData;
  product: ProductData;
  acquisition: AcquisitionData;

  // AI Interaction
  aiConversation: ConversationMessage[];
  aiInsights?: AIInsights;

  // Progress
  completionScore: number; // 0-100
  sectionsCompleted: DiscoveryCategory[];

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

// API Request/Response Types
export interface StrategicDiscoveryRequest {
  action: 'analyze' | 'follow-up' | 'summarize' | 'generate-insights' | 'calculate-revenue';
  visionTitle: string;
  visionDescription?: string;
  smartGoals?: {
    specific?: string;
    measurable?: string;
    attainable?: string;
    realistic?: string;
    timeBound?: string;
  };
  currentData?: Partial<StrategicDiscoveryData>;
  category?: DiscoveryCategory;
  userMessage?: string;
}

export interface CategoryQuestion {
  id: string;
  category: DiscoveryCategory;
  question: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'date';
  options?: string[];
  placeholder?: string;
  helperText?: string;
  required: boolean;
  followUpTrigger?: string;
}

export interface StrategicDiscoveryResponse {
  // For 'analyze' action
  initialQuestions?: CategoryQuestion[];
  revenueOptions?: RevenueOption[];

  // For 'follow-up' action
  followUpQuestions?: string[];
  insights?: string[];
  nextCategory?: DiscoveryCategory;

  // For 'summarize' action
  summary?: {
    businessModel: string;
    keyMetrics: Record<string, string>;
    criticalPath: string[];
    estimatedTimeToGoal: string;
  };

  // For 'generate-insights' action
  aiInsights?: AIInsights;
  impactProjectRecommendations?: ImpactProjectRecommendation[];

  // For 'calculate-revenue' action
  revenueBreakdown?: {
    monthlyTarget: number;
    yearlyTarget: number;
    options: RevenueOption[];
    recommendation: string;
  };
}

export interface ImpactProjectRecommendation {
  title: string;
  description: string;
  quarter: number;
  category: string;
  linkedToDiscovery: {
    section: DiscoveryCategory;
    metric?: string;
    target?: string;
  };
}

// Backwards compatibility alias
export type PowerGoalRecommendation = ImpactProjectRecommendation;

// Calculate Revenue Request
export interface CalculateRevenueRequest {
  targetRevenue: number;
  revenueType: RevenueType;
  targetDate: string;
  currentCustomers?: number;
  currentRevenue?: number;
}

export interface CalculateRevenueResponse {
  monthlyTarget: number;
  yearlyTarget: number;
  monthsRemaining: number;
  options: RevenueOption[];
  recommendation: string;
  mathBreakdown: string;
}

// AI-Generated Pricing Models API Types
export interface GeneratePricingModelsRequest {
  targetRevenue: number;
  revenueType: RevenueType;
  targetDate: string;
  positioning: {
    targetCustomer: string;
    problemSolved: string;
    competitors?: string;
    differentiator?: string;
  };
  visionContext?: string;
}

export interface GeneratePricingModelsResponse {
  detectedBusinessType: BusinessType;
  businessTypeRationale: string;
  pricingOptions: DynamicPricingOption[];
  recommendation: string;
  mathBreakdown: string;
}

// Default/Initial Values
export const DEFAULT_REVENUE_MATH: RevenueMathData = {
  revenueTarget: 0,
  revenueType: 'arr',
  targetTimeframe: '',
  pricingModel: 'prosumer',
  basePrice: 29,
  targetCustomerCount: 0,
  arpu: 29,
  calculatedOptions: [],
  pricingModelMode: 'standard',
};

export const DEFAULT_POSITIONING: PositioningData = {
  targetCustomer: '',
  problemSolved: '',
  competitors: '',
  differentiator: '',
  marketSize: 'medium',
};

export const DEFAULT_PRODUCT: ProductData = {
  coreFeatures: [],
  pricingTiers: [],
  retentionStrategy: '',
  upgradePath: '',
};

export const DEFAULT_ACQUISITION: AcquisitionData = {
  primaryChannels: [],
  estimatedCAC: 0,
  milestones: [],
  launchDate: '',
  criticalPath: [],
};

export const DEFAULT_STRATEGIC_DISCOVERY: Omit<StrategicDiscoveryData, 'id' | 'visionId' | 'userId'> = {
  revenueMath: DEFAULT_REVENUE_MATH,
  positioning: DEFAULT_POSITIONING,
  product: DEFAULT_PRODUCT,
  acquisition: DEFAULT_ACQUISITION,
  aiConversation: [],
  completionScore: 0,
  sectionsCompleted: [],
};
