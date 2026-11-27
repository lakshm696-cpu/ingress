import type {
  AuditFormValues,
  CaseStudyItem,
  ContentQueueItem,
  CreatorNiche,
  FollowExchangeAccount,
  FreeHabitItem,
  MyInstagramProfile,
  TrackedAccount,
} from '../types/ingress';

export const DEFAULT_MY_INSTAGRAM_PROFILE: MyInstagramProfile = {
  handle: '@my_ads_pro',
  displayName: 'My Ads Pro',
  niche: 'SaaS & Tech',
  followers: 1000,
  following: 250,
  posts: 24,
  weeklyReels: 4,
  bio: 'Performance marketing, creative ad teardowns & organic Instagram growth systems. Follow for daily campaign & Reels breakdowns.',
  followBackPromise: 'Follows back active creators, marketers & business accounts within 24h',
  updatedAt: '2026-11-24',
};

export const FREE_DAILY_HABITS: FreeHabitItem[] = [
  {
    id: 'habit-reel-hook',
    title: 'Publish 1 short Reel with a 0–2s visual hook',
    detail: 'Open mid-action with on-screen text stating the viewer payoff to earn non-follower Explore reach.',
    minutesPerDay: 25,
    baseMonthlyFollows: 420,
    stage: 'Discovery',
  },
  {
    id: 'habit-niche-comments',
    title: 'Leave 10 thoughtful comments on peer niche accounts',
    detail: 'Add specific insight under recent Reels from creators with 5K–80K followers so curious readers tap your handle.',
    minutesPerDay: 12,
    baseMonthlyFollows: 165,
    stage: 'Discovery',
  },
  {
    id: 'habit-reply-window',
    title: 'Reply to every comment within 45 minutes',
    detail: 'Ask a short follow-up question in replies to double comment threads and signal active discussion.',
    minutesPerDay: 8,
    baseMonthlyFollows: 110,
    stage: 'Retention',
  },
  {
    id: 'habit-story-poll',
    title: 'Post 1 interactive Story poll or question box',
    detail: 'Warm up existing followers so Instagram prioritizes your next Reel in their feed first.',
    minutesPerDay: 5,
    baseMonthlyFollows: 85,
    stage: 'Retention',
  },
  {
    id: 'habit-pinned-check',
    title: 'Align bio line 1 and 3 pinned posts to new visitors',
    detail: 'Make sure every profile visitor immediately sees who you help, your best proof, and why to follow.',
    minutesPerDay: 6,
    baseMonthlyFollows: 190,
    stage: 'Conversion',
  },
  {
    id: 'habit-collab-pitch',
    title: 'Pitch 1 Instagram Collab post to a peer creator',
    detail: 'Co-author one carousel or Reel weekly so your handle appears natively inside an aligned audience feed.',
    minutesPerDay: 10,
    baseMonthlyFollows: 260,
    stage: 'Discovery',
  },
];

export const CREATOR_NICHES: CreatorNiche[] = [
  'Creator & Education',
  'Fashion & Beauty',
  'Fitness & Wellness',
  'Food & Hospitality',
  'SaaS & Tech',
  'Local Business',
];

export const HERO_STUDIO_IMAGE = '/src/assets/images/hero_creator_studio_1795517500455.jpg';

export const BENCHMARK_METRICS = [
  {
    value: '4.8%',
    label: 'Median Profile-to-Follow Rate',
    detail: 'Top-quartile creator accounts across 90 days',
  },
  {
    value: '2.6x',
    label: 'Non-Follower Reach Ratio',
    detail: 'Target Reels discovery multiplier over follower base',
  },
  {
    value: '+14.2K',
    label: '90-Day Organic Net Ingress',
    detail: 'Observed median lift after hook & bio restructuring',
  },
  {
    value: '38%',
    label: '3-Second Watch-Through Floor',
    detail: 'Minimum opening retention for Explore distribution',
  },
];

export const SEED_TRACKED_ACCOUNTS: TrackedAccount[] = [
  {
    id: 'acc-atelier-nord',
    handle: '@atelier.nord',
    niche: 'Creator & Education',
    followers: 24600,
    weeklyReels: 5,
    avgViewsPerReel: 21500,
    profileVisitRatePct: 3.6,
    followConversionPct: 12.8,
    monthlyChurnPct: 1.4,
    notes: 'Process-led studio timelapses with pinned starter guide.',
  },
  {
    id: 'acc-atlas-runclub',
    handle: '@atlas.runclub',
    niche: 'Fitness & Wellness',
    followers: 11400,
    weeklyReels: 4,
    avgViewsPerReel: 14800,
    profileVisitRatePct: 2.1,
    followConversionPct: 6.4,
    monthlyChurnPct: 1.9,
    notes: 'Strong marathon pacing reels, bio lacks clear city & weekly run schedule.',
  },
  {
    id: 'acc-solis-roasters',
    handle: '@solis.roasters',
    niche: 'Food & Hospitality',
    followers: 6200,
    weeklyReels: 2,
    avgViewsPerReel: 4200,
    profileVisitRatePct: 3.4,
    followConversionPct: 11.2,
    monthlyChurnPct: 1.6,
    notes: 'High local conversion when discovered; needs 4+ weekly espresso extraction reels.',
  },
];

export const AUDIT_PRESETS: Array<{ label: string; values: AuditFormValues }> = [
  {
    label: '@my_ads_pro',
    values: {
      handle: '@my_ads_pro',
      niche: 'SaaS & Tech',
      followers: 1000,
      weeklyReels: 4,
      currentBio:
        'Performance marketing, creative ad teardowns & organic Instagram growth systems. Follow for daily campaign & Reels breakdowns.',
      growthGoal:
        'Grow @my_ads_pro organically through high-retention ad breakdown Reels and stronger profile-to-follow conversion.',
    },
  },
  {
    label: '@maya.ceramics',
    values: {
      handle: '@maya.ceramics',
      niche: 'Creator & Education',
      followers: 14800,
      weeklyReels: 3,
      currentBio: 'Ceramics studio in Aarhus. Handmade mugs & bowls. DM for inquiries.',
      growthGoal: 'Add 15,000 organic followers in 90 days and grow monthly kiln drop waitlists.',
    },
  },
  {
    label: '@atlas.runclub',
    values: {
      handle: '@atlas.runclub',
      niche: 'Fitness & Wellness',
      followers: 11400,
      weeklyReels: 4,
      currentBio: 'Running club. Saturdays at 7am. Good vibes only.',
      growthGoal: 'Convert non-follower pacing Reel viewers into loyal local & online running followers.',
    },
  },
  {
    label: '@kofi.builds',
    values: {
      handle: '@kofi.builds',
      niche: 'SaaS & Tech',
      followers: 5900,
      weeklyReels: 2,
      currentBio: 'Founder & engineer sharing startup lessons and code.',
      growthGoal: 'Reach 20,000 technical founder followers with repeatable breakdown carousels and Reels.',
    },
  },
];

export const TREND_TOPIC_PRESETS = [
  { label: 'Instagram Reels Algorithm', niche: 'Instagram Reels algorithm & organic reach' },
  { label: 'Fashion & Beauty Creators', niche: 'Fashion & Beauty Instagram Reels' },
  { label: 'Fitness & Running Clubs', niche: 'Fitness & Wellness Instagram growth' },
  { label: 'Specialty Food & Cafes', niche: 'Specialty coffee & hospitality Instagram' },
  { label: 'B2B & Tech Founders', niche: 'SaaS & Tech founder Instagram carousels' },
];

export const SEED_CONTENT_QUEUE: ContentQueueItem[] = [
  {
    id: 'q-1',
    category: 'Reels Hook',
    title: '0-3s Process Reveal: Glaze Mistake Breakdown',
    body: 'Visual: Crack open kiln door in natural morning light. Spoken: "Three glaze ratios ruined 40 bowls last month—here is the one chart that saved my firing."',
    niche: 'Creator & Education',
    status: 'Scheduled',
    createdAt: '2026-11-22',
  },
  {
    id: 'q-2',
    category: 'Carousel',
    title: '5-Slide Profile Audit Checklist for Non-Follower Conversion',
    body: 'Slide 1: Why 10,000 Reel views brought 12 followers. Slide 2: Fix line 1 of your bio. Slide 3: Pin one origin story + two proof posts. Slide 4: End-frame follow reason. Slide 5: Save & benchmark.',
    niche: 'SaaS & Tech',
    status: 'Draft',
    createdAt: '2026-11-23',
  },
];

export const CASE_STUDIES: CaseStudyItem[] = [
  {
    id: 'cs-ceramics',
    handle: '@atelier.nord',
    creatorName: 'Freja Lindholm',
    role: 'Founder, Atelier Nord Ceramics',
    niche: 'Creator & Education',
    imageUrl: '/src/assets/images/case_study_ceramics_1795517499810.jpg',
    imageAlt: 'Artisan shaping a stoneware ceramic vessel on a wheel in morning window light',
    headlineMetric: '+18,400 Organic Followers',
    timeframe: '90 Days',
    beforeState: '2,100 avg Reel views, generic studio bio, 1.8% profile visit rate.',
    changeMade: 'Shifted to 2-second wheel-pull openings, pinned a 3-part studio guide, and published 5 Reels/week.',
    outcome: 'Profile-to-follow rate rose from 4.1% to 12.8%, selling out 3 consecutive kiln drops organically.',
  },
  {
    id: 'cs-running',
    handle: '@atlas.runclub',
    creatorName: 'Devon Morales',
    role: 'Coach, Atlas Urban Run Club',
    niche: 'Fitness & Wellness',
    imageUrl: '/src/assets/images/case_study_running_1795517502384.jpg',
    imageAlt: 'Three urban runners crossing a minimalist concrete footbridge at sunrise',
    headlineMetric: '+11,900 Net Followers',
    timeframe: '75 Days',
    beforeState: 'High local Reel views but 0.9% follow conversion due to vague bio and inconsistent cadence.',
    changeMade: 'Introduced weekly split-screen pacing breakdowns and a recurring Tuesday form-check series.',
    outcome: 'Non-follower reach reached 3.4x follower count with 620 new Saturday run RSVPs.',
  },
  {
    id: 'cs-espresso',
    handle: '@solis.roasters',
    creatorName: 'Clara Benitez',
    role: 'Head Roaster, Solis Coffee Bar',
    niche: 'Food & Hospitality',
    imageUrl: '/src/assets/images/case_study_espresso_1795517502719.jpg',
    imageAlt: 'Specialty barista pouring latte art on a travertine marble counter in morning sunlight',
    headlineMetric: '+9,350 Local Followers',
    timeframe: '60 Days',
    beforeState: 'Static latte photos averaging 600 impressions and minimal saves.',
    changeMade: 'Replaced static feed posts with 18-second dial-in recipes and carousel extraction guides.',
    outcome: 'Saves per post increased 5.2x and direct-to-consumer bean subscriptions grew 44%.',
  },
];

export const SEED_FOLLOW_ACCOUNTS: FollowExchangeAccount[] = [
  {
    id: 'fb-maya-ceramics',
    handle: '@maya.ceramics',
    displayName: 'Maya Holm',
    niche: 'Creator & Education',
    followers: 14800,
    bioNote: 'Wheel-thrown stoneware, glaze recipes, and weekly studio logs.',
    followBackPromise: 'Follows back active makers & design creators within 24h',
    status: 'mutual',
    updatedAt: '2026-11-23',
  },
  {
    id: 'fb-atlas-runclub',
    handle: '@atlas.runclub',
    displayName: 'Atlas Run Club',
    niche: 'Fitness & Wellness',
    followers: 11400,
    bioNote: 'Urban 10K pacing Reels, Saturday community runs, and form breakdowns.',
    followBackPromise: 'Follows back fitness, wellness & outdoor accounts daily',
    status: 'following',
    updatedAt: '2026-11-23',
  },
  {
    id: 'fb-solis-roasters',
    handle: '@solis.roasters',
    displayName: 'Solis Coffee Bar',
    niche: 'Food & Hospitality',
    followers: 6200,
    bioNote: 'Espresso dial-in clips, origin stories, and minimalist cafe interiors.',
    followBackPromise: 'Follows back hospitality, culinary & local creators',
    status: 'none',
    updatedAt: '2026-11-22',
  },
  {
    id: 'fb-kofi-builds',
    handle: '@kofi.builds',
    displayName: 'Kofi Mensah',
    niche: 'SaaS & Tech',
    followers: 5900,
    bioNote: 'Bootstrapped product design teardowns and indie software metrics.',
    followBackPromise: 'Follows back builders, developers & creative founders',
    status: 'mutual',
    updatedAt: '2026-11-24',
  },
  {
    id: 'fb-nina-linen',
    handle: '@nina.linen',
    displayName: 'Nina Alvarez',
    niche: 'Fashion & Beauty',
    followers: 8700,
    bioNote: 'Capsule wardrobe styling, natural fabrics, and seasonal lookbooks.',
    followBackPromise: 'Follows back fashion, photography & editorial accounts',
    status: 'none',
    updatedAt: '2026-11-24',
  },
  {
    id: 'fb-harbor-bakes',
    handle: '@harbor.bakes',
    displayName: 'Harbor Sourdough',
    niche: 'Local Business',
    followers: 3900,
    bioNote: 'Morning bakery prep Reels, fermentation notes, and weekend menus.',
    followBackPromise: 'Follows back small businesses & food creators within 48h',
    status: 'none',
    updatedAt: '2026-11-24',
  },
];
