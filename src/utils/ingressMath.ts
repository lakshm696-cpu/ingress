import type {
  AuditFormValues,
  BottleneckDiagnosis,
  CreatorNiche,
  FollowBackStats,
  FollowExchangeAccount,
  FreeHabitItem,
  FreeRoutineImpact,
  FreeSeoKit,
  IngressProjectionResult,
  IngressSimulationInput,
  WeeklyProjectionPoint,
} from '../types/ingress';

export function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function normalizeHandle(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/^@+/, '')
    .replace(/[^a-zA-Z0-9._]/g, '')
    .toLowerCase();
  return cleaned ? `@${cleaned}` : '';
}

export function formatCompactNumber(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  const abs = Math.abs(safe);
  const sign = safe < 0 ? '-' : '';
  if (abs >= 1_000_000) {
    if (abs >= 10_000_000) {
      return `${sign}${Math.round(abs / 1_000_000)}M`;
    }
    const rounded = Math.round((abs / 1_000_000) * 10) / 10;
    return `${sign}${rounded.toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    if (abs >= 100_000) {
      return `${sign}${Math.round(abs / 1_000)}K`;
    }
    const rounded = Math.round((abs / 1_000) * 10) / 10;
    return `${sign}${rounded.toFixed(1)}K`;
  }
  return `${sign}${Math.round(abs).toLocaleString('en-US')}`;
}

export function diagnoseFunnelBottleneck(input: IngressSimulationInput): BottleneckDiagnosis {
  const weeklyReach = Math.max(0, input.weeklyReels) * Math.max(0, input.avgViewsPerReel);

  if (input.monthlyChurnPct >= 3.8) {
    return {
      code: 'high-churn',
      title: 'Audience retention leak',
      summary: `Monthly unfollow churn (${input.monthlyChurnPct.toFixed(1)}%) is eroding new follower ingress faster than normal niche decay.`,
      recommendedAction:
        'Tighten content consistency around 2 core pillars and add a recurring weekly series so new followers know what they subscribed for.',
      severity: 'High Impact',
    };
  }

  if (input.profileVisitRatePct < 2.2 || input.followConversionPct < 7.5) {
    return {
      code: 'weak-profile-conversion',
      title: 'Profile-to-follow conversion leak',
      summary: `Only ${input.profileVisitRatePct.toFixed(1)}% of viewers visit your profile and ${input.followConversionPct.toFixed(1)}% follow after landing.`,
      recommendedAction:
        'Rewrite line 1 of your bio to state a clear viewer outcome, pin 3 proof-led Reels, and add a direct next-episode CTA in captions.',
      severity: 'High Impact',
    };
  }

  if (weeklyReach < 15_000 || input.weeklyReels < 3) {
    return {
      code: 'low-reach',
      title: 'Top-of-funnel discovery ceiling',
      summary: `Weekly Reel reach (${formatCompactNumber(weeklyReach)}) limits how many non-followers ever encounter your profile.`,
      recommendedAction:
        'Increase publishing cadence to 4–5 Reels per week and front-load visual motion + contrast within the first 2 seconds.',
      severity: 'Moderate Impact',
    };
  }

  return {
    code: 'healthy-scaling',
    title: 'Balanced compounding ingress',
    summary: `Reach (${formatCompactNumber(weeklyReach)}/wk) and profile conversion (${input.followConversionPct.toFixed(1)}%) are both above baseline benchmarks.`,
    recommendedAction:
      'Double down on your top 20% retention formats and collaborate with adjacent creators using Instagram Collab posts.',
    severity: 'Healthy',
  };
}

export function calculateIngressProjection(rawInput: IngressSimulationInput): IngressProjectionResult {
  const input: IngressSimulationInput = {
    currentFollowers: clampNumber(rawInput.currentFollowers, 0, 50_000_000),
    weeklyReels: clampNumber(rawInput.weeklyReels, 0, 21),
    avgViewsPerReel: clampNumber(rawInput.avgViewsPerReel, 0, 10_000_000),
    profileVisitRatePct: clampNumber(rawInput.profileVisitRatePct, 0.2, 25),
    followConversionPct: clampNumber(rawInput.followConversionPct, 0.5, 45),
    monthlyChurnPct: clampNumber(rawInput.monthlyChurnPct, 0, 20),
  };

  const weeklyChurnRate = input.monthlyChurnPct / 100 / 4.33;
  const visitRate = input.profileVisitRatePct / 100;
  const followRate = input.followConversionPct / 100;

  // Optimized ingress assumes structured 0-3s hook lift (+28% non-follower views),
  // bio + pinned-post conversion lift (+32% profile-to-follow), and lower churn (-20%).
  const optimizedVisitRate = Math.min(0.25, visitRate * 1.18);
  const optimizedFollowRate = Math.min(0.45, followRate * 1.32);
  const optimizedWeeklyChurn = weeklyChurnRate * 0.8;

  const points: WeeklyProjectionPoint[] = [];
  let baselineFollowers = input.currentFollowers;
  let optimizedFollowers = input.currentFollowers;

  const baseWeeklyViews = input.weeklyReels * input.avgViewsPerReel;

  for (let week = 0; week <= 12; week += 1) {
    if (week === 0) {
      points.push({
        week: 0,
        baselineFollowers: Math.round(baselineFollowers),
        optimizedFollowers: Math.round(optimizedFollowers),
        weeklyNewFollowers: 0,
        weeklyProfileVisits: Math.round(baseWeeklyViews * visitRate),
      });
      continue;
    }

    // Mild organic compounding factor as audience grows
    const baselineScale = 1 + Math.min(0.25, (baselineFollowers - input.currentFollowers) / Math.max(20_000, input.currentFollowers * 4));
    const optimizedScale = 1 + Math.min(0.55, (optimizedFollowers - input.currentFollowers) / Math.max(15_000, input.currentFollowers * 3));

    const baselineWeeklyViews = baseWeeklyViews * Math.max(1, baselineScale);
    const baselineNew = baselineWeeklyViews * visitRate * followRate;
    baselineFollowers = Math.max(0, baselineFollowers + baselineNew - baselineFollowers * weeklyChurnRate);

    const optWeeklyViews = baseWeeklyViews * 1.28 * Math.max(1, optimizedScale);
    const optVisits = optWeeklyViews * optimizedVisitRate;
    const optNew = optVisits * optimizedFollowRate;
    optimizedFollowers = Math.max(0, optimizedFollowers + optNew - optimizedFollowers * optimizedWeeklyChurn);

    points.push({
      week,
      baselineFollowers: Math.round(baselineFollowers),
      optimizedFollowers: Math.round(optimizedFollowers),
      weeklyNewFollowers: Math.round(optNew),
      weeklyProfileVisits: Math.round(optVisits),
    });
  }

  const finalPoint = points[points.length - 1];
  const monthlyReach = Math.round(baseWeeklyViews * 4.33);
  const monthlyVisits = Math.round(monthlyReach * visitRate);
  const monthlyEngaged = Math.round(monthlyVisits * Math.min(0.85, followRate * 2.1));
  const monthlyGrossFollows = Math.round(monthlyVisits * followRate);
  const monthlyChurnLoss = Math.round(input.currentFollowers * (input.monthlyChurnPct / 100));
  const monthlyNetIngress = monthlyGrossFollows - monthlyChurnLoss;

  const effectiveFollowRatePct = Number(((visitRate * followRate) * 100).toFixed(2));

  return {
    points,
    projected90DayBaseline: finalPoint.baselineFollowers,
    projected90DayOptimized: finalPoint.optimizedFollowers,
    net90DayGainOptimized: finalPoint.optimizedFollowers - Math.round(input.currentFollowers),
    monthlyNetIngress,
    effectiveFollowRatePct,
    funnelStages: [
      {
        id: 'reach',
        label: 'Monthly Non-Follower Reach',
        monthlyCount: monthlyReach,
        conversionLabel: `${input.weeklyReels} Reels/wk × ${formatCompactNumber(input.avgViewsPerReel)} avg views`,
      },
      {
        id: 'visits',
        label: 'Profile Visits',
        monthlyCount: monthlyVisits,
        conversionLabel: `${input.profileVisitRatePct.toFixed(1)}% tap-through from Reels`,
      },
      {
        id: 'engaged',
        label: 'Bio & Pinned Post Readers',
        monthlyCount: monthlyEngaged,
        conversionLabel: 'High-intent profile inspection',
      },
      {
        id: 'followers',
        label: 'Gross New Followers / Mo',
        monthlyCount: monthlyGrossFollows,
        conversionLabel: `${input.followConversionPct.toFixed(1)}% profile-to-follow conversion`,
      },
    ],
    bottleneck: diagnoseFunnelBottleneck(input),
  };
}

export interface AuditValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof AuditFormValues, string>>;
}

export function validateAuditForm(values: AuditFormValues): AuditValidationResult {
  const errors: Partial<Record<keyof AuditFormValues, string>> = {};
  const normalized = normalizeHandle(values.handle);

  if (!normalized || normalized.length < 3) {
    errors.handle = 'Enter a valid Instagram handle (at least 2 characters).';
  }
  if (!values.currentBio || values.currentBio.trim().length < 12) {
    errors.currentBio = 'Provide your current bio (at least 12 characters) so we can audit conversion clarity.';
  }
  if (!values.growthGoal || values.growthGoal.trim().length < 8) {
    errors.growthGoal = 'Describe your 90-day follower or lead goal.';
  }
  if (!Number.isFinite(values.followers) || values.followers < 0) {
    errors.followers = 'Follower count must be zero or higher.';
  }
  if (!Number.isFinite(values.weeklyReels) || values.weeklyReels < 0 || values.weeklyReels > 21) {
    errors.weeklyReels = 'Weekly Reels cadence must be between 0 and 21.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function calculateFreeRoutineImpact(
  habits: FreeHabitItem[],
  completedIds: string[],
  currentFollowers: number
): FreeRoutineImpact {
  const safeFollowers = clampNumber(currentFollowers, 0, 50_000_000);
  const completedSet = new Set(completedIds);
  const completed = habits.filter((h) => completedSet.has(h.id));

  const dailyMinutes = completed.reduce((sum, item) => sum + item.minutesPerDay, 0);
  const baseFollows = completed.reduce((sum, item) => sum + item.baseMonthlyFollows, 0);

  // Accounts with larger existing audiences get a moderate organic network multiplier
  const audienceMultiplier = 1 + Math.min(2.2, Math.log10(Math.max(100, safeFollowers) / 100) * 0.45);
  // Consistency bonus when completing 4+ free daily habits together
  const consistencyBonus = completed.length >= 4 ? 1.2 : 1.0;

  const estimatedMonthlyFreeFollowers =
    completed.length === 0 ? 0 : Math.round(baseFollows * audienceMultiplier * consistencyBonus);

  return {
    completedCount: completed.length,
    totalCount: habits.length,
    completionPct: habits.length === 0 ? 0 : Math.round((completed.length / habits.length) * 100),
    dailyMinutes,
    estimatedMonthlyFreeFollowers,
  };
}

const NICHE_TAG_BANK: Record<
  CreatorNiche,
  { broad: string[]; community: string[]; audienceNoun: string }
> = {
  'Creator & Education': {
    broad: ['creatorlife', 'instagramtips', 'learnonthegram'],
    community: ['creatoreconomy', 'behindtheprocess', 'studiojournal'],
    audienceNoun: 'creators & learners',
  },
  'Fashion & Beauty': {
    broad: ['styleinspo', 'everydaystyle', 'beautyroutine'],
    community: ['wardrobediaries', 'minimalstyle', 'editorialbeauty'],
    audienceNoun: 'style-conscious readers',
  },
  'Fitness & Wellness': {
    broad: ['runningcommunity', 'strengthtraining', 'dailyhabits'],
    community: ['hybridtraining', 'pacingtips', 'mobilitywork'],
    audienceNoun: 'everyday athletes',
  },
  'Food & Hospitality': {
    broad: ['specialtycoffee', 'homecooking', 'foodcraft'],
    community: ['baristadaily', 'recipebreakdown', 'cafeculture'],
    audienceNoun: 'food & coffee lovers',
  },
  'SaaS & Tech': {
    broad: ['buildinpublic', 'productdesign', 'startuplife'],
    community: ['indiehackers', 'founderlessons', 'uxcraft'],
    audienceNoun: 'founders & builders',
  },
  'Local Business': {
    broad: ['shoplocal', 'smallbusinessowner', 'behindthebrand'],
    community: ['localmakers', 'independentbusiness', 'communityfirst'],
    audienceNoun: 'local customers',
  },
};

function toHashtagToken(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function buildFreeSeoKit(topic: string, niche: CreatorNiche): FreeSeoKit | null {
  const cleanedTopic = topic.trim().replace(/\s+/g, ' ');
  if (cleanedTopic.length < 3) {
    return null;
  }

  const bank = NICHE_TAG_BANK[niche];
  const words = cleanedTopic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3);

  const primaryPhrase = words.slice(0, 3).join(' ') || cleanedTopic.toLowerCase();
  const shortAnchor = words[0] || 'instagram';
  const secondAnchor = words[1] || 'tips';

  const specificCandidates = [
    toHashtagToken(`${shortAnchor}${secondAnchor}`),
    toHashtagToken(`${shortAnchor}guide`),
    toHashtagToken(`${shortAnchor}tips`),
    toHashtagToken(`${primaryPhrase}workflow`),
  ].filter((t) => t.length >= 4);

  const seen = new Set<string>();
  const dedupe = (list: string[], count: number) => {
    const out: string[] = [];
    for (const token of list) {
      if (!token || seen.has(token)) continue;
      seen.add(token);
      out.push(`#${token}`);
      if (out.length === count) break;
    }
    return out;
  };

  const broad = dedupe(bank.broad, 3);
  const community = dedupe(bank.community, 3);
  const specific = dedupe([...specificCandidates, 'organicgrowth', 'reelsguide', 'saveforlater'], 3);

  const seoKeywords = [
    `${cleanedTopic} guide`,
    `${cleanedTopic} for ${bank.audienceNoun}`,
    `how to improve ${primaryPhrase}`,
  ];

  const allTags = [...broad, ...community, ...specific].join(' ');
  const captionTemplate = [
    `Most people overlook this about ${cleanedTopic} — here is the exact breakdown I use every week.`,
    ``,
    `1. Lead with the clearest visual proof in the first 2 seconds.`,
    `2. Explain the single mistake that slows down ${primaryPhrase}.`,
    `3. Save this post to reference before your next session.`,
    ``,
    `Follow for practical ${niche.toLowerCase()} breakdowns every week (zero fluff).`,
    ``,
    allTags,
  ].join('\n');

  return {
    topic: cleanedTopic,
    niche,
    seoKeywords,
    hashtags: {
      broad,
      community,
      specific,
    },
    captionTemplate,
  };
}

export const SAFE_DAILY_FOLLOW_LIMIT = 25;

export function calculateFollowBackStats(accounts: FollowExchangeAccount[]): FollowBackStats {
  const totalAccounts = accounts.length;
  const mutualCount = accounts.filter((a) => a.status === 'mutual').length;
  const pendingCount = accounts.filter((a) => a.status === 'following').length;
  const followingCount = mutualCount + pendingCount;
  const followBackRatePct =
    followingCount === 0 ? 0 : Math.round((mutualCount / followingCount) * 100);
  const safeDailyRemaining = Math.max(0, SAFE_DAILY_FOLLOW_LIMIT - followingCount);

  return {
    totalAccounts,
    followingCount,
    mutualCount,
    pendingCount,
    followBackRatePct,
    safeDailyRemaining,
  };
}

export interface FollowAccountFormInput {
  handle: string;
  displayName: string;
  followers: number;
  bioNote: string;
}

export function validateFollowAccountInput(
  input: FollowAccountFormInput,
  existingHandles: string[]
): { valid: boolean; error: string | null; normalizedHandle: string } {
  const normalizedHandle = normalizeHandle(input.handle);
  if (!normalizedHandle || normalizedHandle.length < 3) {
    return {
      valid: false,
      error: 'Enter a valid Instagram handle (e.g. @luma.design).',
      normalizedHandle: '',
    };
  }

  const existingSet = new Set(existingHandles.map((h) => normalizeHandle(h)));
  if (existingSet.has(normalizedHandle)) {
    return {
      valid: false,
      error: `${normalizedHandle} is already listed in your Follow & Follow-Back directory.`,
      normalizedHandle,
    };
  }

  if (!Number.isFinite(input.followers) || input.followers < 0) {
    return {
      valid: false,
      error: 'Follower count must be zero or higher.',
      normalizedHandle,
    };
  }

  return { valid: true, error: null, normalizedHandle };
}

export function buildInstagramProfileUrl(handle: string): string {
  const normalized = normalizeHandle(handle);
  const clean = normalized.replace(/^@+/, '');
  return clean ? `https://www.instagram.com/${encodeURIComponent(clean)}/` : 'https://www.instagram.com/';
}

export function getHandleInitials(handle: string, displayName?: string): string {
  const source = (displayName || '').trim() || handle.replace(/^@+/, '');
  const parts = source
    .replace(/[._-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  const single = (parts[0] || 'IG').replace(/[^a-zA-Z0-9]/g, '');
  return single.slice(0, 2).toUpperCase() || 'IG';
}

export interface MyAccountProfileInput {
  handle: string;
  displayName: string;
  followers: number;
  following: number;
  posts: number;
  weeklyReels: number;
  bio: string;
}

export function validateMyAccountProfile(input: MyAccountProfileInput): {
  valid: boolean;
  error: string | null;
  normalizedHandle: string;
} {
  const normalizedHandle = normalizeHandle(input.handle);
  if (!normalizedHandle || normalizedHandle.length < 3) {
    return {
      valid: false,
      error: 'Enter a valid Instagram handle (e.g. @my_ads_pro).',
      normalizedHandle: '',
    };
  }
  if (!Number.isFinite(input.followers) || input.followers < 0) {
    return { valid: false, error: 'Followers count must be zero or higher.', normalizedHandle };
  }
  if (!Number.isFinite(input.following) || input.following < 0) {
    return { valid: false, error: 'Following count must be zero or higher.', normalizedHandle };
  }
  if (!Number.isFinite(input.posts) || input.posts < 0) {
    return { valid: false, error: 'Posts count must be zero or higher.', normalizedHandle };
  }
  if (!Number.isFinite(input.weeklyReels) || input.weeklyReels < 0 || input.weeklyReels > 21) {
    return { valid: false, error: 'Weekly Reels must be between 0 and 21.', normalizedHandle };
  }
  return { valid: true, error: null, normalizedHandle };
}

export interface FreeSprintMilestone {
  targetGain: number;
  targetFollowerTotal: number;
  gainedFollowers: number;
  remainingFollowers: number;
  progressPct: number;
  estimatedDaysToGoal: number | null;
  readinessStepsDone: number;
  readinessStepsTotal: number;
}

export function calculateFreeSprintMilestone(params: {
  currentFollowers: number;
  targetGain?: number;
  loggedFollowers: number;
  completedHabitsCount: number;
  totalHabits: number;
  seoKitReady: boolean;
  mutualFollowsCount: number;
  estimatedMonthlyFreeFollowers: number;
}): FreeSprintMilestone {
  const targetGain = Math.max(1, Math.round(params.targetGain ?? 20));
  const safeBase = Math.max(0, Math.round(params.currentFollowers));
  const gainedFollowers = clampNumber(Math.round(params.loggedFollowers), 0, targetGain);
  const remainingFollowers = Math.max(0, targetGain - gainedFollowers);
  const progressPct = Math.round((gainedFollowers / targetGain) * 100);

  let readinessStepsDone = 0;
  if (params.totalHabits > 0 && params.completedHabitsCount >= params.totalHabits) {
    readinessStepsDone += 1;
  }
  if (params.seoKitReady) {
    readinessStepsDone += 1;
  }
  if (params.mutualFollowsCount >= 2) {
    readinessStepsDone += 1;
  }

  let estimatedDaysToGoal: number | null = null;
  if (remainingFollowers === 0) {
    estimatedDaysToGoal = 0;
  } else if (params.estimatedMonthlyFreeFollowers > 0) {
    estimatedDaysToGoal = Math.max(
      1,
      Math.ceil((remainingFollowers / params.estimatedMonthlyFreeFollowers) * 30)
    );
  }

  return {
    targetGain,
    targetFollowerTotal: safeBase + targetGain,
    gainedFollowers,
    remainingFollowers,
    progressPct,
    estimatedDaysToGoal,
    readinessStepsDone,
    readinessStepsTotal: 3,
  };
}


