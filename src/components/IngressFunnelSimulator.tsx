import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Trash2, ArrowUpRight, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { CREATOR_NICHES } from '../data/seedData';
import type { CreatorNiche, IngressSimulationInput, TrackedAccount } from '../types/ingress';
import {
  calculateIngressProjection,
  formatCompactNumber,
  normalizeHandle,
} from '../utils/ingressMath';

interface SelectedSimulationAccount {
  handle: string;
  niche: CreatorNiche;
  followers: number;
  weeklyReels: number;
  version: number;
}

interface IngressFunnelSimulatorProps {
  accounts: TrackedAccount[];
  selectedSimulationAccount?: SelectedSimulationAccount | null;
  onAddAccount: (account: TrackedAccount) => void;
  onRemoveAccount: (id: string) => void;
  onSendToAudit: (account: TrackedAccount) => void;
}

export function IngressFunnelSimulator({
  accounts,
  selectedSimulationAccount,
  onAddAccount,
  onRemoveAccount,
  onSendToAudit,
}: IngressFunnelSimulatorProps) {
  const [simHandle, setSimHandle] = useState('@atelier.nord');
  const [simNiche, setSimNiche] = useState<CreatorNiche>('Creator & Education');
  const [simInput, setSimInput] = useState<IngressSimulationInput>({
    currentFollowers: 24600,
    weeklyReels: 5,
    avgViewsPerReel: 21500,
    profileVisitRatePct: 3.6,
    followConversionPct: 12.8,
    monthlyChurnPct: 1.4,
  });

  // Roster filters & add form
  const [nicheFilter, setNicheFilter] = useState<'All' | CreatorNiche>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHandle, setNewHandle] = useState('');
  const [newNiche, setNewNiche] = useState<CreatorNiche>('Creator & Education');
  const [newFollowers, setNewFollowers] = useState('8400');
  const [newWeeklyReels, setNewWeeklyReels] = useState('4');
  const [newAvgViews, setNewAvgViews] = useState('11200');
  const [newNotes, setNewNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedSimulationAccount) return;
    setSimHandle(selectedSimulationAccount.handle);
    setSimNiche(selectedSimulationAccount.niche);
    setSimInput((prev) => ({
      ...prev,
      currentFollowers: selectedSimulationAccount.followers,
      weeklyReels: Math.max(1, selectedSimulationAccount.weeklyReels),
    }));
  }, [selectedSimulationAccount]);

  const projection = useMemo(() => calculateIngressProjection(simInput), [simInput]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const matchesNiche = nicheFilter === 'All' || acc.niche === nicheFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        acc.handle.toLowerCase().includes(q) ||
        acc.niche.toLowerCase().includes(q) ||
        acc.notes.toLowerCase().includes(q);
      return matchesNiche && matchesSearch;
    });
  }, [accounts, nicheFilter, searchQuery]);

  // Chart geometry (SVG viewBox 640 x 240)
  const chartData = useMemo(() => {
    const width = 640;
    const height = 240;
    const padL = 56;
    const padR = 52;
    const padT = 18;
    const padB = 34;
    const innerW = width - padL - padR;
    const innerH = height - padT - padB;

    const allVals = projection.points.flatMap((p) => [p.baselineFollowers, p.optimizedFollowers]);
    const minVal = Math.min(...allVals);
    const maxVal = Math.max(...allVals, minVal + 100);
    const range = Math.max(1, maxVal - minVal);

    const xFor = (week: number) => padL + (week / 12) * innerW;
    const yFor = (val: number) => padT + innerH - ((val - minVal) / range) * innerH;

    const baselinePath = projection.points
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${xFor(p.week).toFixed(1)} ${yFor(p.baselineFollowers).toFixed(1)}`)
      .join(' ');

    const optimizedPath = projection.points
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${xFor(p.week).toFixed(1)} ${yFor(p.optimizedFollowers).toFixed(1)}`)
      .join(' ');

    const areaPath = `${optimizedPath} L ${xFor(12).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${xFor(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;

    const yTicks = [0, 0.5, 1].map((t) => {
      const v = Math.round(minVal + range * t);
      return { val: v, y: yFor(v) };
    });

    const xTicks = [0, 4, 8, 12].map((week) => ({
      label: week === 0 ? 'Now' : `Wk ${week}`,
      x: xFor(week),
    }));

    return { width, height, padL, padT, innerH, baselinePath, optimizedPath, areaPath, yTicks, xTicks, xFor, yFor };
  }, [projection]);

  function handleLoadAccount(account: TrackedAccount) {
    setSimHandle(account.handle);
    setSimNiche(account.niche);
    setSimInput({
      currentFollowers: account.followers,
      weeklyReels: account.weeklyReels,
      avgViewsPerReel: account.avgViewsPerReel,
      profileVisitRatePct: account.profileVisitRatePct,
      followConversionPct: account.followConversionPct,
      monthlyChurnPct: account.monthlyChurnPct,
    });
  }

  function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    const normalized = normalizeHandle(newHandle);
    if (!normalized || normalized.length < 3) {
      setFormError('Enter a valid Instagram handle (e.g. @studio.verve).');
      return;
    }
    const followersNum = Number(newFollowers);
    const reelsNum = Number(newWeeklyReels);
    const viewsNum = Number(newAvgViews);
    if (!Number.isFinite(followersNum) || followersNum < 0) {
      setFormError('Followers must be a non-negative number.');
      return;
    }
    if (!Number.isFinite(reelsNum) || reelsNum < 0 || reelsNum > 21) {
      setFormError('Weekly Reels must be between 0 and 21.');
      return;
    }
    if (!Number.isFinite(viewsNum) || viewsNum < 0) {
      setFormError('Average views per Reel must be zero or higher.');
      return;
    }

    setFormError(null);
    const created: TrackedAccount = {
      id: `acc-${Date.now()}`,
      handle: normalized,
      niche: newNiche,
      followers: Math.round(followersNum),
      weeklyReels: Math.round(reelsNum),
      avgViewsPerReel: Math.round(viewsNum),
      profileVisitRatePct: simInput.profileVisitRatePct,
      followConversionPct: simInput.followConversionPct,
      monthlyChurnPct: simInput.monthlyChurnPct,
      notes: newNotes.trim() || 'Added to organic follower ingress tracker.',
    };
    onAddAccount(created);
    handleLoadAccount(created);
    setNewHandle('');
    setNewNotes('');
    setShowAddForm(false);
  }

  const maxFunnelCount = Math.max(1, projection.funnelStages[0]?.monthlyCount ?? 1);

  return (
    <section id="funnel" className="scroll-mt-16 py-16 lg:py-20 border-b border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-slate-200">
          <div>
            <p className="text-sm font-medium text-slate-500">03. Organic Follower Ingress Model</p>
            <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
              Simulate your 90-day acquisition funnel
            </h2>
          </div>
          <p className="text-sm text-slate-600 max-w-md">
            Adjust publishing velocity and conversion rates for{' '}
            <span className="font-mono font-medium text-slate-900">{simHandle}</span> ({simNiche}) to
            locate where non-follower reach leaks out.
          </p>
        </div>

        {/* Main 2-column simulator workspace */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-5 bg-[#F9FAFB] border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-950">Funnel Parameters</h3>
              <span className="font-mono text-xs text-slate-500 tabular-nums">{simHandle}</span>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <label htmlFor="sim-followers" className="font-medium text-slate-700">
                  Current Followers
                </label>
                <span className="font-mono text-slate-950 font-semibold tabular-nums">
                  {simInput.currentFollowers.toLocaleString('en-US')}
                </span>
              </div>
              <input
                id="sim-followers"
                type="number"
                min={0}
                max={5000000}
                step={100}
                value={simInput.currentFollowers}
                onChange={(e) =>
                  setSimInput((prev) => ({
                    ...prev,
                    currentFollowers: Math.max(0, Number(e.target.value) || 0),
                  }))
                }
                className="w-full px-3.5 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <label htmlFor="sim-reels" className="font-medium text-slate-700">
                  Weekly Reels Output
                </label>
                <span className="font-mono text-slate-950 font-semibold tabular-nums">
                  {simInput.weeklyReels} / week
                </span>
              </div>
              <input
                id="sim-reels"
                type="range"
                min={1}
                max={14}
                step={1}
                value={simInput.weeklyReels}
                onChange={(e) =>
                  setSimInput((prev) => ({ ...prev, weeklyReels: Number(e.target.value) }))
                }
                className="w-full accent-rose-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <label htmlFor="sim-views" className="font-medium text-slate-700">
                  Avg. Views per Reel
                </label>
                <span className="font-mono text-slate-950 font-semibold tabular-nums">
                  {formatCompactNumber(simInput.avgViewsPerReel)}
                </span>
              </div>
              <input
                id="sim-views"
                type="range"
                min={500}
                max={150000}
                step={500}
                value={simInput.avgViewsPerReel}
                onChange={(e) =>
                  setSimInput((prev) => ({ ...prev, avgViewsPerReel: Number(e.target.value) }))
                }
                className="w-full accent-rose-600 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <label htmlFor="sim-visit-rate" className="font-medium text-slate-700">
                    Profile Visit %
                  </label>
                  <span className="font-mono text-slate-950 font-semibold tabular-nums">
                    {simInput.profileVisitRatePct.toFixed(1)}%
                  </span>
                </div>
                <input
                  id="sim-visit-rate"
                  type="range"
                  min={0.5}
                  max={8}
                  step={0.1}
                  value={simInput.profileVisitRatePct}
                  onChange={(e) =>
                    setSimInput((prev) => ({
                      ...prev,
                      profileVisitRatePct: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-rose-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <label htmlFor="sim-follow-rate" className="font-medium text-slate-700">
                    Follow Rate %
                  </label>
                  <span className="font-mono text-slate-950 font-semibold tabular-nums">
                    {simInput.followConversionPct.toFixed(1)}%
                  </span>
                </div>
                <input
                  id="sim-follow-rate"
                  type="range"
                  min={2}
                  max={25}
                  step={0.2}
                  value={simInput.followConversionPct}
                  onChange={(e) =>
                    setSimInput((prev) => ({
                      ...prev,
                      followConversionPct: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-rose-600 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <label htmlFor="sim-churn" className="font-medium text-slate-700">
                  Monthly Unfollow Churn
                </label>
                <span className="font-mono text-slate-950 font-semibold tabular-nums">
                  {simInput.monthlyChurnPct.toFixed(1)}%
                </span>
              </div>
              <input
                id="sim-churn"
                type="range"
                min={0.4}
                max={6.0}
                step={0.1}
                value={simInput.monthlyChurnPct}
                onChange={(e) =>
                  setSimInput((prev) => ({ ...prev, monthlyChurnPct: Number(e.target.value) }))
                }
                className="w-full accent-slate-800 cursor-pointer"
              />
            </div>

            {/* Automated Bottleneck Diagnosis */}
            <div className="pt-4 border-t border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                {projection.bottleneck.severity === 'Healthy' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                ) : projection.bottleneck.severity === 'High Impact' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
                ) : (
                  <Info className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                )}
                <span>
                  Diagnosis · {projection.bottleneck.severity}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-950">{projection.bottleneck.title}</p>
              <p className="text-xs text-slate-600 leading-relaxed">{projection.bottleneck.summary}</p>
              <p className="text-xs text-slate-800 font-medium leading-relaxed">
                Next step: {projection.bottleneck.recommendedAction}
              </p>
            </div>
          </div>

          {/* Projection & Funnel Visualization Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Key Projection Numbers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-slate-200">
              <div>
                <p className="text-xs text-slate-500">90-Day Optimized Total</p>
                <p
                  data-testid="projected-90day-optimized"
                  className="mt-1 font-mono text-2xl sm:text-3xl font-semibold text-slate-950 tabular-nums"
                >
                  {projection.projected90DayOptimized.toLocaleString('en-US')}
                </p>
                <p className="mt-0.5 text-xs text-emerald-700 font-medium font-mono tabular-nums">
                  +{projection.net90DayGainOptimized.toLocaleString('en-US')} net followers
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">90-Day Baseline Pace</p>
                <p className="mt-1 font-mono text-2xl sm:text-3xl font-semibold text-slate-700 tabular-nums">
                  {projection.projected90DayBaseline.toLocaleString('en-US')}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 font-mono tabular-nums">
                  {projection.monthlyNetIngress >= 0 ? '+' : ''}
                  {projection.monthlyNetIngress.toLocaleString('en-US')} / mo current net
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">View-to-Follow Yield</p>
                <p className="mt-1 font-mono text-2xl sm:text-3xl font-semibold text-rose-600 tabular-nums">
                  {projection.effectiveFollowRatePct.toFixed(2)}%
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Net followers per 100 Reel views
                </p>
              </div>
            </div>

            {/* SVG Trajectory Chart */}
            <div className="border border-slate-200 rounded-xl p-5 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h3 className="text-sm font-semibold text-slate-950">
                  12-Week Follower Trajectory
                </h3>
                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-rose-600 inline-block" aria-hidden="true" />
                    Optimized Ingress
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-slate-400 inline-block" aria-hidden="true" />
                    Current Baseline
                  </span>
                </div>
              </div>

              <svg
                viewBox={`0 0 ${chartData.width} ${chartData.height}`}
                className="w-full h-auto"
                role="img"
                aria-label="12-week Instagram follower projection chart comparing optimized ingress against current baseline"
              >
                <defs>
                  <linearGradient id="ingressAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E11D48" stopOpacity="0.14" />
                    <stop offset="100%" stopColor="#E11D48" stopOpacity="0.01" />
                  </linearGradient>
                </defs>

                {chartData.yTicks.map((tick) => (
                  <g key={tick.val}>
                    <line
                      x1={chartData.padL}
                      x2={chartData.width - 20}
                      y1={tick.y}
                      y2={tick.y}
                      stroke="#E2E8F0"
                      strokeWidth="1"
                    />
                    <text
                      x={chartData.padL - 8}
                      y={tick.y + 4}
                      textAnchor="end"
                      className="fill-slate-500 text-[11px] font-mono"
                    >
                      {formatCompactNumber(tick.val)}
                    </text>
                  </g>
                ))}

                {chartData.xTicks.map((tick) => (
                  <text
                    key={tick.label}
                    x={tick.x}
                    y={chartData.height - 10}
                    textAnchor="middle"
                    className="fill-slate-500 text-[11px] font-mono"
                  >
                    {tick.label}
                  </text>
                ))}

                <path d={chartData.areaPath} fill="url(#ingressAreaGrad)" />
                <path
                  d={chartData.baselinePath}
                  fill="none"
                  stroke="#94A3B8"
                  strokeWidth="2"
                  strokeDasharray="5 4"
                />
                <path
                  d={chartData.optimizedPath}
                  fill="none"
                  stroke="#E11D48"
                  strokeWidth="2.5"
                />

                {projection.points
                  .filter((p) => p.week % 4 === 0)
                  .map((p) => (
                    <circle
                      key={p.week}
                      cx={chartData.xFor(p.week)}
                      cy={chartData.yFor(p.optimizedFollowers)}
                      r="3.5"
                      fill="#E11D48"
                    />
                  ))}

                <text
                  x={chartData.xFor(12) + 8}
                  y={chartData.yFor(projection.projected90DayOptimized) + 4}
                  className="fill-rose-700 text-[11px] font-mono font-semibold"
                >
                  {formatCompactNumber(projection.projected90DayOptimized)}
                </text>
                <text
                  x={chartData.xFor(12) + 8}
                  y={chartData.yFor(projection.projected90DayBaseline) + 4}
                  className="fill-slate-500 text-[11px] font-mono"
                >
                  {formatCompactNumber(projection.projected90DayBaseline)}
                </text>
              </svg>
            </div>

            {/* 4-Stage Acquisition Funnel */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-950">
                Monthly Conversion Breakdown
              </h3>
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl bg-white">
                {projection.funnelStages.map((stage, idx) => {
                  const logMax = Math.log10(maxFunnelCount + 10);
                  const logVal = Math.log10(Math.max(1, stage.monthlyCount) + 10);
                  const visualWidth = idx === 0 ? 100 : Math.max(14, Math.min(92, Math.round((logVal / logMax) * 100)));
                  return (
                    <div key={stage.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900">{stage.label}</p>
                        <p className="text-xs text-slate-500">{stage.conversionLabel}</p>
                      </div>
                      <div className="flex items-center gap-4 sm:w-64 shrink-0">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${idx === 3 ? 'bg-rose-600' : 'bg-slate-800'}`}
                            style={{ width: `${visualWidth}%` }}
                          />
                        </div>
                        <span className="font-mono text-sm font-semibold text-slate-950 tabular-nums w-16 text-right">
                          {formatCompactNumber(stage.monthlyCount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Tracked Creator Accounts Roster */}
        <div className="mt-14 pt-10 border-t border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-display text-xl font-bold text-slate-950">
                Tracked Account Roster
              </h3>
              <p className="text-sm text-slate-600 mt-0.5">
                Compare Instagram accounts side-by-side, load any profile into the simulator, or send it to Deep Audit.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowAddForm((prev) => !prev);
                setFormError(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-950 rounded-lg hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-rose-600 focus-visible:outline-offset-2"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>{showAddForm ? 'Cancel' : 'Track New Account'}</span>
            </button>
          </div>

          {showAddForm && (
            <form
              onSubmit={handleCreateAccount}
              className="mb-6 p-5 bg-[#F9FAFB] border border-slate-200 rounded-xl space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label htmlFor="new-acc-handle" className="block text-xs font-medium text-slate-700 mb-1">
                    Instagram Handle
                  </label>
                  <input
                    id="new-acc-handle"
                    type="text"
                    placeholder="@studio.verve"
                    value={newHandle}
                    onChange={(e) => setNewHandle(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label htmlFor="new-acc-niche" className="block text-xs font-medium text-slate-700 mb-1">
                    Niche
                  </label>
                  <select
                    id="new-acc-niche"
                    value={newNiche}
                    onChange={(e) => setNewNiche(e.target.value as CreatorNiche)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                  >
                    {CREATOR_NICHES.map((niche) => (
                      <option key={niche} value={niche}>
                        {niche}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="new-acc-followers" className="block text-xs font-medium text-slate-700 mb-1">
                    Followers
                  </label>
                  <input
                    id="new-acc-followers"
                    type="number"
                    min={0}
                    value={newFollowers}
                    onChange={(e) => setNewFollowers(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label htmlFor="new-acc-reels" className="block text-xs font-medium text-slate-700 mb-1">
                    Reels / Week
                  </label>
                  <input
                    id="new-acc-reels"
                    type="number"
                    min={0}
                    max={21}
                    value={newWeeklyReels}
                    onChange={(e) => setNewWeeklyReels(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label htmlFor="new-acc-views" className="block text-xs font-medium text-slate-700 mb-1">
                    Avg. Reel Views
                  </label>
                  <input
                    id="new-acc-views"
                    type="number"
                    min={0}
                    value={newAvgViews}
                    onChange={(e) => setNewAvgViews(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
                <div className="flex-1">
                  <label htmlFor="new-acc-notes" className="block text-xs font-medium text-slate-700 mb-1">
                    Growth Notes (Optional)
                  </label>
                  <input
                    id="new-acc-notes"
                    type="text"
                    placeholder="e.g. Testing behind-the-scenes Reels with pinned portfolio guide"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Save Account
                </button>
              </div>

              {formError && (
                <p role="alert" className="text-xs font-medium text-rose-700">
                  {formError}
                </p>
              )}
            </form>
          )}

          {/* Filter Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
              {(['All', ...CREATOR_NICHES] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setNicheFilter(tab)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    nicheFilter === tab
                      ? 'bg-white text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="relative w-full lg:w-64">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="Search tracked Instagram accounts"
                placeholder="Filter by handle or note..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          {/* Accounts Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
            {filteredAccounts.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <p className="text-sm font-medium text-slate-900">No tracked accounts match this filter.</p>
                <p className="text-xs text-slate-500">
                  Clear your search filter or add a new Instagram handle to track its 90-day ingress.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setNicheFilter('All');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-900 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#F9FAFB] text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Account</th>
                    <th className="py-3 px-4 text-right">Followers</th>
                    <th className="py-3 px-4 text-right">Reels / Wk</th>
                    <th className="py-3 px-4 text-right">Avg. Views</th>
                    <th className="py-3 px-4 text-right">90-Day Opt.</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {filteredAccounts.map((acc) => {
                    const accProj = calculateIngressProjection({
                      currentFollowers: acc.followers,
                      weeklyReels: acc.weeklyReels,
                      avgViewsPerReel: acc.avgViewsPerReel,
                      profileVisitRatePct: acc.profileVisitRatePct,
                      followConversionPct: acc.followConversionPct,
                      monthlyChurnPct: acc.monthlyChurnPct,
                    });
                    const isActive = simHandle === acc.handle;
                    return (
                      <tr
                        key={acc.id}
                        className={`transition-colors ${isActive ? 'bg-rose-50/40' : 'hover:bg-slate-50'}`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-semibold text-slate-950">{acc.handle}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {acc.niche} · {acc.notes}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-900">
                          {formatCompactNumber(acc.followers)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                          {acc.weeklyReels}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                          {formatCompactNumber(acc.avgViewsPerReel)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-emerald-700">
                          +{formatCompactNumber(accProj.net90DayGainOptimized)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleLoadAccount(acc)}
                              className="px-2.5 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 rounded-md hover:bg-slate-200 whitespace-nowrap cursor-pointer"
                            >
                              {isActive ? 'Loaded' : 'Simulate'}
                            </button>
                            <button
                              type="button"
                              onClick={() => onSendToAudit(acc)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 rounded-md hover:bg-rose-100 whitespace-nowrap cursor-pointer"
                            >
                              <span>Audit</span>
                              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Remove ${acc.handle}`}
                              onClick={() => onRemoveAccount(acc.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-700 rounded-md hover:bg-slate-100 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
