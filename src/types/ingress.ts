export type CreatorNiche =
  | 'Creator & Education'
  | 'Fashion & Beauty'
  | 'Fitness & Wellness'
  | 'Food & Hospitality'
  | 'SaaS & Tech'
  | 'Local Business';

export interface IngressSimulationInput {
  currentFollowers: number;
  weeklyReels: number;
  avgViewsPerReel: number;
  profileVisitRatePct: number; // % of Reel viewers who tap profile (typically 1.2% - 6.0%)
  followConversionPct: number; // % of profile visitors who hit Follow (typically 3.0% - 18.0%)
  monthlyChurnPct: number; // % monthly unfollow churn (typically 1.0% - 5.0%)
}

export interface WeeklyProjectionPoint {
  week: number;
  baselineFollowers: number;
  optimizedFollowers: number;
  weeklyNewFollowers: number;
  weeklyProfileVisits: number;
}

export interface FunnelStageMetric {
  id: 'reach' | 'visits' | 'engaged' | 'followers';
  label: string;
  monthlyCount: number;
  conversionLabel: string;
}

export interface BottleneckDiagnosis {
  code: 'low-reach' | 'weak-profile-conversion' | 'high-churn' | 'healthy-scaling';
  title: string;
  summary: string;
  recommendedAction: string;
  severity: 'High Impact' | 'Moderate Impact' | 'Healthy';
}

export interface IngressProjectionResult {
  points: WeeklyProjectionPoint[];
  projected90DayBaseline: number;
  projected90DayOptimized: number;
  net90DayGainOptimized: number;
  monthlyNetIngress: number;
  effectiveFollowRatePct: number;
  funnelStages: FunnelStageMetric[];
  bottleneck: BottleneckDiagnosis;
}

export interface TrackedAccount {
  id: string;
  handle: string;
  niche: CreatorNiche;
  followers: number;
  weeklyReels: number;
  avgViewsPerReel: number;
  profileVisitRatePct: number;
  followConversionPct: number;
  monthlyChurnPct: number;
  notes: string;
}

export interface AuditFormValues {
  handle: string;
  niche: CreatorNiche;
  followers: number;
  weeklyReels: number;
  currentBio: string;
  growthGoal: string;
}

export interface ContentPillar {
  name: string;
  sharePercent: number;
  format: string;
  exampleTopic: string;
}

export interface WeeklySprintItem {
  week: string;
  focus: string;
  deliverables: string;
  metricTarget: string;
}

export interface AuditData {
  executiveSummary: string;
  primaryBottleneck: string;
  projected90DayLift: string;
  optimizedBio: string;
  bioRationale: string;
  contentPillars: ContentPillar[];
  weeklySprint: WeeklySprintItem[];
  dailyIngressHabits: string[];
}

export interface SavedPlaybook {
  id: string;
  handle: string;
  niche: CreatorNiche;
  savedAt: string;
  modelUsed: string;
  audit: AuditData;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface TrendRadarData {
  modelUsed: string;
  generatedAt: string;
  briefing: string;
  sources: GroundingSource[];
}

export interface ReelHookItem {
  angle: string;
  visualCue: string;
  spokenLine: string;
  retentionWhy: string;
}

export interface BioVariantItem {
  style: string;
  text: string;
}

export interface CarouselSlideItem {
  slideNumber: number;
  headline: string;
  body: string;
}

export interface HookLabResult {
  hooks: ReelHookItem[];
  bioVariants: BioVariantItem[];
  carouselSlides: CarouselSlideItem[];
}

export type QueueCategory = 'Reels Hook' | 'Carousel' | 'Bio';

export interface ContentQueueItem {
  id: string;
  category: QueueCategory;
  title: string;
  body: string;
  niche: string;
  status: 'Draft' | 'Scheduled';
  createdAt: string;
}

export interface CaseStudyItem {
  id: string;
  handle: string;
  creatorName: string;
  role: string;
  niche: CreatorNiche;
  imageUrl: string;
  imageAlt: string;
  headlineMetric: string;
  timeframe: string;
  beforeState: string;
  changeMade: string;
  outcome: string;
}

export interface FreeHabitItem {
  id: string;
  title: string;
  detail: string;
  minutesPerDay: number;
  baseMonthlyFollows: number;
  stage: 'Discovery' | 'Conversion' | 'Retention';
}

export interface FreeRoutineImpact {
  completedCount: number;
  totalCount: number;
  completionPct: number;
  dailyMinutes: number;
  estimatedMonthlyFreeFollowers: number;
}

export interface FreeSeoKit {
  topic: string;
  niche: CreatorNiche;
  seoKeywords: string[];
  hashtags: {
    broad: string[];
    community: string[];
    specific: string[];
  };
  captionTemplate: string;
}

export type FollowRelationshipStatus = 'none' | 'following' | 'mutual';

export interface FollowExchangeAccount {
  id: string;
  handle: string;
  displayName: string;
  niche: CreatorNiche;
  followers: number;
  bioNote: string;
  followBackPromise: string;
  status: FollowRelationshipStatus;
  addedByUser?: boolean;
  updatedAt: string;
}

export interface FollowBackStats {
  totalAccounts: number;
  followingCount: number;
  mutualCount: number;
  pendingCount: number;
  followBackRatePct: number;
  safeDailyRemaining: number;
}

export interface MyInstagramProfile {
  handle: string;
  displayName: string;
  niche: CreatorNiche;
  followers: number;
  following: number;
  posts: number;
  weeklyReels: number;
  bio: string;
  followBackPromise: string;
  updatedAt: string;
}

export type InstagramLoginMethod = 'instagram_oauth' | 'meta_oauth' | 'handle_workspace';

export interface InstagramAuthState {
  signedIn: boolean;
  method: InstagramLoginMethod | null;
  handle: string;
  displayName: string;
  accountType?: string;
  connectedAt?: string;
}

export interface PaidBoostDraftOrder {
  id: string;
  handle: string;
  tierId: 'starter' | 'growth' | 'scale';
  tierName: string;
  priceUsd: number;
  expectedRange: string;
  paymentMethodLabel: string;
  status: 'Draft (Unpaid)' | 'Checkout Started';
  createdAt: string;
}



