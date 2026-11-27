import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFreeSeoKit,
  buildInstagramProfileUrl,
  calculateFollowBackStats,
  calculateFreeRoutineImpact,
  calculateFreeSprintMilestone,
  calculateIngressProjection,
  diagnoseFunnelBottleneck,
  formatCompactNumber,
  getHandleInitials,
  normalizeHandle,
  validateAuditForm,
  validateFollowAccountInput,
  validateMyAccountProfile,
} from './ingressMath';

test('normalizeHandle strips duplicate @ symbols and invalid characters', () => {
  assert.equal(normalizeHandle('  @@Atelier.Nord! '), '@atelier.nord');
  assert.equal(normalizeHandle('maya_ceramics'), '@maya_ceramics');
  assert.equal(normalizeHandle('   '), '');
});

test('formatCompactNumber formats thousands and millions cleanly', () => {
  assert.equal(formatCompactNumber(842), '842');
  assert.equal(formatCompactNumber(14200), '14.2K');
  assert.equal(formatCompactNumber(245000), '245K');
  assert.equal(formatCompactNumber(1450000), '1.5M');
});

test('calculateIngressProjection produces 13 weekly points (week 0..12) with optimized lift', () => {
  const result = calculateIngressProjection({
    currentFollowers: 8500,
    weeklyReels: 5,
    avgViewsPerReel: 12000,
    profileVisitRatePct: 3.2,
    followConversionPct: 11.5,
    monthlyChurnPct: 1.8,
  });

  assert.equal(result.points.length, 13);
  assert.equal(result.points[0].week, 0);
  assert.equal(result.points[0].baselineFollowers, 8500);
  assert.equal(result.points[12].week, 12);
  assert.ok(result.projected90DayOptimized > result.projected90DayBaseline);
  assert.ok(result.net90DayGainOptimized > 0);
  assert.equal(result.funnelStages.length, 4);
  assert.equal(result.bottleneck.code, 'healthy-scaling');
});

test('diagnoseFunnelBottleneck detects churn, conversion, and reach bottlenecks accurately', () => {
  const highChurn = diagnoseFunnelBottleneck({
    currentFollowers: 20000,
    weeklyReels: 5,
    avgViewsPerReel: 18000,
    profileVisitRatePct: 3.5,
    followConversionPct: 12,
    monthlyChurnPct: 4.5,
  });
  assert.equal(highChurn.code, 'high-churn');

  const weakConv = diagnoseFunnelBottleneck({
    currentFollowers: 12000,
    weeklyReels: 5,
    avgViewsPerReel: 15000,
    profileVisitRatePct: 1.4,
    followConversionPct: 5.0,
    monthlyChurnPct: 1.5,
  });
  assert.equal(weakConv.code, 'weak-profile-conversion');

  const lowReach = diagnoseFunnelBottleneck({
    currentFollowers: 4000,
    weeklyReels: 2,
    avgViewsPerReel: 2500,
    profileVisitRatePct: 3.2,
    followConversionPct: 11.0,
    monthlyChurnPct: 1.5,
  });
  assert.equal(lowReach.code, 'low-reach');
});

test('validateAuditForm rejects empty required inputs and accepts complete input', () => {
  const invalid = validateAuditForm({
    handle: '',
    niche: 'Creator & Education',
    followers: 1000,
    weeklyReels: 3,
    currentBio: 'Hi',
    growthGoal: '',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.handle);
  assert.ok(invalid.errors.currentBio);
  assert.ok(invalid.errors.growthGoal);

  const valid = validateAuditForm({
    handle: '@maya.ceramics',
    niche: 'Creator & Education',
    followers: 14800,
    weeklyReels: 4,
    currentBio: 'Wheel-thrown stoneware from Copenhagen. Weekly kiln drops & glaze formulas.',
    growthGoal: 'Reach 30,000 organic followers and double monthly studio drop waitlists.',
  });
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.errors, {});
});

test('calculateFreeRoutineImpact sums daily minutes and scales free monthly follower estimates', () => {
  const sampleHabits = [
    { id: 'h1', title: 'Hook Reel', detail: '', minutesPerDay: 20, baseMonthlyFollows: 400, stage: 'Discovery' as const },
    { id: 'h2', title: 'Comments', detail: '', minutesPerDay: 10, baseMonthlyFollows: 150, stage: 'Discovery' as const },
    { id: 'h3', title: 'Reply', detail: '', minutesPerDay: 5, baseMonthlyFollows: 100, stage: 'Retention' as const },
    { id: 'h4', title: 'Pinned Bio', detail: '', minutesPerDay: 5, baseMonthlyFollows: 150, stage: 'Conversion' as const },
  ];

  const none = calculateFreeRoutineImpact(sampleHabits, [], 5000);
  assert.equal(none.completedCount, 0);
  assert.equal(none.dailyMinutes, 0);
  assert.equal(none.estimatedMonthlyFreeFollowers, 0);

  const partial = calculateFreeRoutineImpact(sampleHabits, ['h1', 'h2'], 5000);
  assert.equal(partial.completedCount, 2);
  assert.equal(partial.completionPct, 50);
  assert.equal(partial.dailyMinutes, 30);
  assert.ok(partial.estimatedMonthlyFreeFollowers > 550);

  const full = calculateFreeRoutineImpact(sampleHabits, ['h1', 'h2', 'h3', 'h4'], 5000);
  assert.equal(full.completedCount, 4);
  assert.equal(full.completionPct, 100);
  assert.ok(full.estimatedMonthlyFreeFollowers > partial.estimatedMonthlyFreeFollowers);
});

test('buildFreeSeoKit validates short topics and returns 3 SEO phrases plus 9 unique hashtags', () => {
  assert.equal(buildFreeSeoKit('  ', 'Creator & Education'), null);
  assert.equal(buildFreeSeoKit('hi', 'Creator & Education'), null);

  const kit = buildFreeSeoKit('morning espresso dial in', 'Food & Hospitality');
  assert.ok(kit !== null);
  assert.equal(kit.seoKeywords.length, 3);
  assert.equal(kit.hashtags.broad.length, 3);
  assert.equal(kit.hashtags.community.length, 3);
  assert.equal(kit.hashtags.specific.length, 3);

  const allTags = [...kit.hashtags.broad, ...kit.hashtags.community, ...kit.hashtags.specific];
  assert.equal(new Set(allTags).size, 9);
  assert.ok(allTags.every((t) => t.startsWith('#')));
  assert.ok(kit.captionTemplate.includes('morning espresso dial in'));
});

test('calculateFollowBackStats computes mutuals, pending, rate, and daily pacing budget', () => {
  const empty = calculateFollowBackStats([]);
  assert.equal(empty.totalAccounts, 0);
  assert.equal(empty.followBackRatePct, 0);
  assert.equal(empty.safeDailyRemaining, 25);

  const sample = [
    { id: '1', handle: '@a', displayName: 'A', niche: 'SaaS & Tech' as const, followers: 1000, bioNote: '', followBackPromise: '', status: 'mutual' as const, updatedAt: '2026-11-24' },
    { id: '2', handle: '@b', displayName: 'B', niche: 'SaaS & Tech' as const, followers: 1000, bioNote: '', followBackPromise: '', status: 'following' as const, updatedAt: '2026-11-24' },
    { id: '3', handle: '@c', displayName: 'C', niche: 'SaaS & Tech' as const, followers: 1000, bioNote: '', followBackPromise: '', status: 'mutual' as const, updatedAt: '2026-11-24' },
    { id: '4', handle: '@d', displayName: 'D', niche: 'SaaS & Tech' as const, followers: 1000, bioNote: '', followBackPromise: '', status: 'none' as const, updatedAt: '2026-11-24' },
  ];

  const stats = calculateFollowBackStats(sample);
  assert.equal(stats.totalAccounts, 4);
  assert.equal(stats.followingCount, 3);
  assert.equal(stats.mutualCount, 2);
  assert.equal(stats.pendingCount, 1);
  assert.equal(stats.followBackRatePct, 67);
  assert.equal(stats.safeDailyRemaining, 22);
});

test('validateFollowAccountInput rejects invalid or duplicate handles and normalizes valid entries', () => {
  const bad = validateFollowAccountInput(
    { handle: '  ', displayName: 'Test', followers: 100, bioNote: '' },
    ['@maya.ceramics']
  );
  assert.equal(bad.valid, false);
  assert.ok(bad.error);

  const dup = validateFollowAccountInput(
    { handle: 'MAYA.CERAMICS', displayName: 'Maya', followers: 100, bioNote: '' },
    ['@maya.ceramics']
  );
  assert.equal(dup.valid, false);
  assert.ok(dup.error?.includes('@maya.ceramics'));

  const ok = validateFollowAccountInput(
    { handle: 'luma.design', displayName: 'Luma', followers: 3400, bioNote: 'Design studio' },
    ['@maya.ceramics']
  );
  assert.equal(ok.valid, true);
  assert.equal(ok.normalizedHandle, '@luma.design');
});

test('buildInstagramProfileUrl and getHandleInitials handle underscores cleanly', () => {
  assert.equal(buildInstagramProfileUrl('@my_ads_pro'), 'https://www.instagram.com/my_ads_pro/');
  assert.equal(buildInstagramProfileUrl('  my_ads_pro  '), 'https://www.instagram.com/my_ads_pro/');
  assert.equal(getHandleInitials('@my_ads_pro', 'My Ads Pro'), 'MA');
  assert.equal(getHandleInitials('@my_ads_pro'), 'MA');
});

test('validateMyAccountProfile validates handle and numeric stats cleanly', () => {
  const invalidHandle = validateMyAccountProfile({
    handle: ' ',
    displayName: 'My Ads Pro',
    followers: 1000,
    following: 200,
    posts: 20,
    weeklyReels: 4,
    bio: 'Growth tips',
  });
  assert.equal(invalidHandle.valid, false);
  assert.ok(invalidHandle.error);

  const negativeStats = validateMyAccountProfile({
    handle: '@my_ads_pro',
    displayName: 'My Ads Pro',
    followers: -5,
    following: 200,
    posts: 20,
    weeklyReels: 4,
    bio: 'Growth tips',
  });
  assert.equal(negativeStats.valid, false);

  const valid = validateMyAccountProfile({
    handle: 'my_ads_pro',
    displayName: 'My Ads Pro',
    followers: 1250,
    following: 310,
    posts: 35,
    weeklyReels: 5,
    bio: 'Organic Reels & ad breakdowns.',
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.normalizedHandle, '@my_ads_pro');
});

test('calculateFreeSprintMilestone tracks +20 organic follower sprint progress and ETA accurately', () => {
  const start = calculateFreeSprintMilestone({
    currentFollowers: 1000,
    targetGain: 20,
    loggedFollowers: 0,
    completedHabitsCount: 2,
    totalHabits: 6,
    seoKitReady: true,
    mutualFollowsCount: 2,
    estimatedMonthlyFreeFollowers: 600,
  });
  assert.equal(start.targetFollowerTotal, 1020);
  assert.equal(start.gainedFollowers, 0);
  assert.equal(start.remainingFollowers, 20);
  assert.equal(start.progressPct, 0);
  assert.equal(start.estimatedDaysToGoal, 1);
  assert.equal(start.readinessStepsDone, 2);

  const halfway = calculateFreeSprintMilestone({
    currentFollowers: 1000,
    targetGain: 20,
    loggedFollowers: 10,
    completedHabitsCount: 6,
    totalHabits: 6,
    seoKitReady: true,
    mutualFollowsCount: 3,
    estimatedMonthlyFreeFollowers: 300,
  });
  assert.equal(halfway.progressPct, 50);
  assert.equal(halfway.remainingFollowers, 10);
  assert.equal(halfway.estimatedDaysToGoal, 1);
  assert.equal(halfway.readinessStepsDone, 3);

  const zeroRate = calculateFreeSprintMilestone({
    currentFollowers: 1000,
    targetGain: 20,
    loggedFollowers: 5,
    completedHabitsCount: 0,
    totalHabits: 6,
    seoKitReady: false,
    mutualFollowsCount: 0,
    estimatedMonthlyFreeFollowers: 0,
  });
  assert.equal(zeroRate.estimatedDaysToGoal, null);
  assert.equal(zeroRate.readinessStepsDone, 0);
});


