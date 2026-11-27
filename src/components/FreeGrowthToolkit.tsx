import { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { CREATOR_NICHES, FREE_DAILY_HABITS } from '../data/seedData';
import type {
  ContentQueueItem,
  CreatorNiche,
  FollowBackStats,
  MyInstagramProfile,
} from '../types/ingress';
import {
  buildFreeSeoKit,
  buildInstagramProfileUrl,
  calculateFreeRoutineImpact,
  calculateFreeSprintMilestone,
  SAFE_DAILY_FOLLOW_LIMIT,
} from '../utils/ingressMath';

interface FreeGrowthToolkitProps {
  activeProfile: MyInstagramProfile;
  followStats: FollowBackStats;
  completedHabitIds: string[];
  loggedSprintFollowers: number;
  onToggleHabit: (id: string) => void;
  onResetHabits: () => void;
  onLogSprintFollower: (delta: number) => void;
  onResetSprintFollowers: () => void;
  onAddQueueItem: (item: Omit<ContentQueueItem, 'id' | 'createdAt' | 'status'>) => void;
  onOpenPaidBoost: () => void;
  onOpenFollowDirectory: () => void;
}

function defaultTierForFollowers(followers: number): number {
  if (followers < 1000) return 500;
  if (followers < 10000) return 4500;
  if (followers < 50000) return 25000;
  return 100000;
}

function defaultTopicForProfile(profile: MyInstagramProfile): string {
  if (profile.niche === 'SaaS & Tech') {
    return `ad creative teardown and organic Reels hooks for ${profile.handle}`;
  }
  return `${profile.niche.toLowerCase()} organic Reels strategy for ${profile.handle}`;
}

export function FreeGrowthToolkit({
  activeProfile,
  followStats,
  completedHabitIds,
  loggedSprintFollowers,
  onToggleHabit,
  onResetHabits,
  onLogSprintFollower,
  onResetSprintFollowers,
  onAddQueueItem,
  onOpenPaidBoost,
  onOpenFollowDirectory,
}: FreeGrowthToolkitProps) {
  const [followerTier, setFollowerTier] = useState(() =>
    defaultTierForFollowers(activeProfile.followers)
  );
  const [seoTopic, setSeoTopic] = useState(() => defaultTopicForProfile(activeProfile));
  const [seoNiche, setSeoNiche] = useState<CreatorNiche>(activeProfile.niche);
  const [seoError, setSeoError] = useState<string | null>(null);
  const [generatedKit, setGeneratedKit] = useState(() =>
    buildFreeSeoKit(defaultTopicForProfile(activeProfile), activeProfile.niche)
  );
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [queuedNotice, setQueuedNotice] = useState(false);

  const activeProfileUrl = buildInstagramProfileUrl(activeProfile.handle);

  const routineImpact = useMemo(
    () => calculateFreeRoutineImpact(FREE_DAILY_HABITS, completedHabitIds, followerTier),
    [completedHabitIds, followerTier]
  );

  const sprintMilestone = useMemo(
    () =>
      calculateFreeSprintMilestone({
        currentFollowers: activeProfile.followers,
        targetGain: 20,
        loggedFollowers: loggedSprintFollowers,
        completedHabitsCount: routineImpact.completedCount,
        totalHabits: routineImpact.totalCount,
        seoKitReady: Boolean(generatedKit),
        mutualFollowsCount: followStats.mutualCount,
        estimatedMonthlyFreeFollowers: routineImpact.estimatedMonthlyFreeFollowers,
      }),
    [
      activeProfile.followers,
      loggedSprintFollowers,
      routineImpact.completedCount,
      routineImpact.totalCount,
      routineImpact.estimatedMonthlyFreeFollowers,
      generatedKit,
      followStats.mutualCount,
    ]
  );

  function handleBuildSeoKit(e: React.FormEvent) {
    e.preventDefault();
    const kit = buildFreeSeoKit(seoTopic, seoNiche);
    if (!kit) {
      setSeoError('Enter a Reel or post topic (at least 3 characters) to build your free SEO kit.');
      return;
    }
    setSeoError(null);
    setQueuedNotice(false);
    setGeneratedKit(kit);
  }

  function handleLoadActiveProfileSeo() {
    const nextTopic = defaultTopicForProfile(activeProfile);
    setSeoTopic(nextTopic);
    setSeoNiche(activeProfile.niche);
    setSeoError(null);
    setQueuedNotice(false);
    setGeneratedKit(buildFreeSeoKit(nextTopic, activeProfile.niche));
  }

  function handleCopyCaption() {
    if (!generatedKit) return;
    navigator.clipboard?.writeText(generatedKit.captionTemplate).catch(() => {});
    setCopiedCaption(true);
    window.setTimeout(() => setCopiedCaption(false), 1800);
  }

  function handleQueueCaption() {
    if (!generatedKit) return;
    onAddQueueItem({
      category: 'Reels Hook',
      title: `Free SEO Kit (${activeProfile.handle}): ${generatedKit.topic}`,
      body: generatedKit.captionTemplate,
      niche: generatedKit.niche,
    });
    setQueuedNotice(true);
  }

  return (
    <section id="free-plan" className="scroll-mt-16 py-16 lg:py-20 border-b border-slate-200 bg-[#F9FAFB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-8 border-b border-slate-200">
          <div>
            <p className="text-sm font-medium text-rose-700">
              01. Free Organic Follower Toolkit · $0 Ad Spend · Active Account{' '}
              <span className="font-mono">{activeProfile.handle}</span>
            </p>
            <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
              Grow Instagram followers free with a safe daily organic routine
            </h2>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl">
              Follow the 6-habit organic checklist, generate SEO-friendly hashtags and captions, and complete the Free +20 Followers Sprint for{' '}
              <span className="font-mono font-semibold text-slate-900">{activeProfile.handle}</span> at zero cost.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href={activeProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="toolkit-follow-active-link"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-rose-600 focus-visible:outline-offset-2"
            >
              <span>Follow {activeProfile.handle}</span>
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
            </a>
            <button
              type="button"
              data-testid="open-paid-boost-btn"
              onClick={onOpenPaidBoost}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg hover:border-slate-900 hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-rose-600 focus-visible:outline-offset-2"
            >
              <CreditCard className="w-4 h-4 text-rose-600" aria-hidden="true" />
              <span>Paid Follower Boost</span>
            </button>
          </div>
        </div>

        {/* Dedicated Free +20 Organic Followers Sprint Panel for Active Account (@my_ads_pro) */}
        <div
          data-testid="free-20-sprint-card"
          className="mt-8 bg-white border border-slate-200 rounded-xl overflow-hidden"
        >
          <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-1.5 min-w-0">
              <p className="text-xs font-medium text-emerald-700">
                Free +20 Organic Followers Sprint · {activeProfile.handle} ({activeProfile.niche})
              </p>
              <h3 className="font-display text-lg sm:text-xl font-bold text-slate-950">
                Safe +20 follower roadmap:{' '}
                <span className="font-mono tabular-nums">
                  {activeProfile.followers.toLocaleString('en-US')} &rarr;{' '}
                  {sprintMilestone.targetFollowerTotal.toLocaleString('en-US')}
                </span>{' '}
                followers
              </h3>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                Complete the 6 daily habits below, publish your SEO-optimized caption, and trade safe mutual follow-backs to earn your next 20 real organic followers with zero bots or ad spend.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                data-testid="log-sprint-follower-btn"
                onClick={() => onLogSprintFollower(1)}
                disabled={sprintMilestone.gainedFollowers >= sprintMilestone.targetGain}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-950 rounded-lg hover:bg-slate-800 disabled:opacity-40 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-rose-600 focus-visible:outline-offset-2"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Log +1 Organic Follower</span>
              </button>
              <button
                type="button"
                aria-label="Decrement logged organic sprint followers"
                onClick={() => onLogSprintFollower(-1)}
                disabled={sprintMilestone.gainedFollowers <= 0}
                className="p-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              {sprintMilestone.gainedFollowers > 0 && (
                <button
                  type="button"
                  onClick={onResetSprintFollowers}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-950 whitespace-nowrap cursor-pointer"
                >
                  Reset Sprint
                </button>
              )}
            </div>
          </div>

          <div className="px-6 pb-5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span data-testid="sprint-progress-text" className="font-mono font-semibold text-slate-950 tabular-nums">
                {sprintMilestone.gainedFollowers} / {sprintMilestone.targetGain} free organic followers logged ({sprintMilestone.progressPct}%)
              </span>
              <span className="font-mono text-slate-600 tabular-nums">
                {sprintMilestone.remainingFollowers === 0
                  ? 'Goal reached! Keep compounding with your daily routine'
                  : sprintMilestone.estimatedDaysToGoal !== null
                  ? `Est. ~${sprintMilestone.estimatedDaysToGoal} ${sprintMilestone.estimatedDaysToGoal === 1 ? 'day' : 'days'} at +${routineImpact.estimatedMonthlyFreeFollowers.toLocaleString('en-US')}/mo pace`
                  : 'Check daily habits below to estimate days to +20'}
              </span>
            </div>
            <div
              role="progressbar"
              aria-label={`Free 20 organic followers sprint progress for ${activeProfile.handle}`}
              aria-valuenow={sprintMilestone.progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-200"
                style={{ width: `${sprintMilestone.progressPct}%` }}
              />
            </div>
          </div>

          <div className="border-t border-slate-200 bg-[#F9FAFB] grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 text-xs">
            <div className="px-6 py-3.5 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">1. Daily 6-Habit Routine</p>
                <p className="text-slate-600 mt-0.5">
                  Reels hooks, niche comments, Story polls &amp; collabs
                </p>
              </div>
              <span className="font-mono font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                {routineImpact.completedCount} / {routineImpact.totalCount}
              </span>
            </div>
            <div className="px-6 py-3.5 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">2. SEO Hashtags &amp; Caption</p>
                <p className="text-slate-600 mt-0.5">
                  Tailored 3×3 hashtags &amp; keywords for {activeProfile.handle}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLoadActiveProfileSeo}
                className="font-semibold text-rose-700 hover:underline whitespace-nowrap cursor-pointer"
              >
                Load for {activeProfile.handle}
              </button>
            </div>
            <div className="px-6 py-3.5 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">3. Safe Follow-Back Network</p>
                <p className="text-slate-600 mt-0.5 font-mono tabular-nums">
                  {followStats.mutualCount} mutuals · {followStats.safeDailyRemaining}/{SAFE_DAILY_FOLLOW_LIMIT} safe follows left
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenFollowDirectory}
                className="inline-flex items-center gap-1 font-semibold text-rose-700 hover:underline whitespace-nowrap cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Open Directory</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Interactive Daily Free Organic Routine */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-950">
                  Daily Free Organic Routine
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Check the actions you commit to daily to calculate your $0 monthly follower ingress.
                </p>
              </div>
              <button
                type="button"
                onClick={onResetHabits}
                disabled={completedHabitIds.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 disabled:opacity-40 whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reset Today</span>
              </button>
            </div>

            {/* Live Free Routine Summary Strip + Progress & Safe Organic Limits */}
            <div className="p-4 bg-[#F9FAFB] border border-slate-200 rounded-lg space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Completed</p>
                  <p
                    data-testid="free-routine-count"
                    className="mt-0.5 font-mono text-lg font-semibold text-slate-950 tabular-nums"
                  >
                    {routineImpact.completedCount} / {routineImpact.totalCount}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Time / Day</p>
                  <p className="mt-0.5 font-mono text-lg font-semibold text-slate-950 tabular-nums">
                    {routineImpact.dailyMinutes} min
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Est. Free / Mo</p>
                  <p
                    data-testid="free-routine-estimate"
                    className="mt-0.5 font-mono text-lg font-semibold text-emerald-700 tabular-nums"
                  >
                    +{routineImpact.estimatedMonthlyFreeFollowers.toLocaleString('en-US')}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">Daily routine progress</span>
                  <span
                    data-testid="free-routine-pct"
                    className="font-mono font-semibold text-slate-900 tabular-nums"
                  >
                    {routineImpact.completionPct}%
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label="Daily organic routine completion"
                  aria-valuenow={routineImpact.completionPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-2 w-full bg-slate-200 rounded-full overflow-hidden"
                >
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-200"
                    style={{ width: `${routineImpact.completionPct}%` }}
                  />
                </div>
                <p className="text-xs text-slate-600 flex items-center gap-1.5 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
                  <span>
                    Safe organic limits: &le; {SAFE_DAILY_FOLLOW_LIMIT} follows/day · &le; 15 comments/hr · 100% policy-safe
                  </span>
                </p>
              </div>
            </div>

            {/* Account Size Selector for Realistic Free Scaling */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <label htmlFor="free-tier-followers" className="font-medium text-slate-700">
                Starting account size (scales organic discovery):
              </label>
              <select
                id="free-tier-followers"
                value={followerTier}
                onChange={(e) => setFollowerTier(Number(e.target.value))}
                className="px-3 py-1.5 text-xs font-mono tabular-nums bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900"
              >
                <option value={500}>Under 1,000 followers</option>
                <option value={4500}>1,000 – 10,000 followers</option>
                <option value={25000}>10,000 – 50,000 followers</option>
                <option value={100000}>50,000+ followers</option>
              </select>
            </div>

            {/* Checkable Habit List */}
            <ul className="divide-y divide-slate-200 border-t border-slate-200">
              {FREE_DAILY_HABITS.map((habit) => {
                const checked = completedHabitIds.includes(habit.id);
                return (
                  <li key={habit.id} className="py-3.5 first:pt-3.5 last:pb-0">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleHabit(habit.id)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-rose-600 cursor-pointer shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span
                            className={`text-sm font-semibold transition-colors ${
                              checked ? 'text-slate-500 line-through' : 'text-slate-950 group-hover:text-rose-700'
                            }`}
                          >
                            {habit.title}
                          </span>
                          <span className="font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
                            {habit.stage} · {habit.minutesPerDay}m
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{habit.detail}</p>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Right Column: Instant Free Instagram SEO, Hashtag & Caption Builder */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-950">
                  Instant Free Instagram SEO & Hashtag Kit
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Build searchable keywords, a balanced 3×3 hashtag set, and a follow-converting caption in zero seconds.
                </p>
              </div>

              <form onSubmit={handleBuildSeoKit} noValidate className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-7">
                    <label htmlFor="free-seo-topic" className="block text-xs font-medium text-slate-700 mb-1">
                      Reel or Carousel Topic
                    </label>
                    <input
                      id="free-seo-topic"
                      type="text"
                      placeholder="e.g. morning espresso dial in"
                      value={seoTopic}
                      onChange={(e) => setSeoTopic(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                    />
                  </div>
                  <div className="sm:col-span-5">
                    <label htmlFor="free-seo-niche" className="block text-xs font-medium text-slate-700 mb-1">
                      Niche
                    </label>
                    <select
                      id="free-seo-niche"
                      value={seoNiche}
                      onChange={(e) => setSeoNiche(e.target.value as CreatorNiche)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                    >
                      {CREATOR_NICHES.map((niche) => (
                        <option key={niche} value={niche}>
                          {niche}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-semibold text-white bg-slate-950 rounded-lg hover:bg-slate-800 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-rose-600 focus-visible:outline-offset-2"
                  >
                    Generate Free SEO Kit
                  </button>
                  <span className="text-xs text-slate-500">Offline-capable · $0 · No login required</span>
                </div>

                {seoError && (
                  <p role="alert" className="text-xs font-medium text-rose-700">
                    {seoError}
                  </p>
                )}
              </form>

              {generatedKit && (
                <div className="pt-4 border-t border-slate-200 space-y-4">
                  {/* Searchable Keywords */}
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      Instagram Search Keywords (use in bio, alt text & line 1)
                    </p>
                    <p className="mt-1 text-xs font-mono text-slate-700 leading-relaxed">
                      {generatedKit.seoKeywords.join('  ·  ')}
                    </p>
                  </div>

                  {/* Balanced 3x3 Hashtags */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-[#F9FAFB] rounded-lg border border-slate-200">
                      <p className="font-semibold text-slate-900">Broad Reach</p>
                      <p className="mt-1 font-mono text-slate-600 leading-relaxed">
                        {generatedKit.hashtags.broad.join(' ')}
                      </p>
                    </div>
                    <div className="p-3 bg-[#F9FAFB] rounded-lg border border-slate-200">
                      <p className="font-semibold text-slate-900">Community</p>
                      <p className="mt-1 font-mono text-slate-600 leading-relaxed">
                        {generatedKit.hashtags.community.join(' ')}
                      </p>
                    </div>
                    <div className="p-3 bg-[#F9FAFB] rounded-lg border border-slate-200">
                      <p className="font-semibold text-slate-900">High-Intent</p>
                      <p className="mt-1 font-mono text-slate-600 leading-relaxed">
                        {generatedKit.hashtags.specific.join(' ')}
                      </p>
                    </div>
                  </div>

                  {/* Ready-to-Paste Caption */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-900">Ready-to-Paste Organic Caption</p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopyCaption}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-800 bg-slate-100 rounded-md hover:bg-slate-200 cursor-pointer"
                        >
                          {copiedCaption ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Copy Caption</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={handleQueueCaption}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 rounded-md hover:bg-rose-100 cursor-pointer"
                        >
                          {queuedNotice ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                              <span>Queued</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Save to Queue</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <pre className="p-3.5 bg-[#F9FAFB] border border-slate-200 rounded-lg text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed">
                      {generatedKit.captionTemplate}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Free Organic vs Optional Paid Boost vs Fake Bots Reality Check */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-200 bg-[#F9FAFB] flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-950">
                  Free Organic Growth vs. Optional Paid Boost
                </h3>
                <button
                  type="button"
                  onClick={onOpenPaidBoost}
                  className="text-xs font-semibold text-rose-700 hover:underline whitespace-nowrap cursor-pointer"
                >
                  Compare Paid Packages
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2.5 px-4 font-medium">Method</th>
                      <th className="py-2.5 px-4 font-medium">Cost</th>
                      <th className="py-2.5 px-4 font-medium">Account Safety</th>
                      <th className="py-2.5 px-4 font-medium">Expected Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="bg-emerald-50/40">
                      <td className="py-2.5 px-4 font-semibold text-slate-950">Free Organic Toolkit</td>
                      <td className="py-2.5 px-4 font-mono tabular-nums font-semibold text-emerald-700">$0 / mo</td>
                      <td className="py-2.5 px-4 text-slate-800">100% Policy Safe</td>
                      <td className="py-2.5 px-4 text-slate-800">Compounding real fans</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-medium text-slate-900">Optional Paid Boost</td>
                      <td className="py-2.5 px-4 font-mono tabular-nums text-slate-700">$19 – $119 once</td>
                      <td className="py-2.5 px-4 text-slate-700">Paced · No password</td>
                      <td className="py-2.5 px-4 text-slate-700">Faster sponsored reach</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-medium text-slate-700">Bot / Fake Follower Farms</td>
                      <td className="py-2.5 px-4 font-mono tabular-nums text-slate-600">$15 – $99</td>
                      <td className="py-2.5 px-4 text-rose-700 font-medium">Shadowban / Ban Risk</td>
                      <td className="py-2.5 px-4 text-rose-700">Zero engagement</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
