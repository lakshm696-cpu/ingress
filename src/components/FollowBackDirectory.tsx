import { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { CREATOR_NICHES } from '../data/seedData';
import type {
  CreatorNiche,
  FollowExchangeAccount,
  FollowRelationshipStatus,
  MyInstagramProfile,
} from '../types/ingress';
import {
  buildInstagramProfileUrl,
  calculateFollowBackStats,
  formatCompactNumber,
  SAFE_DAILY_FOLLOW_LIMIT,
  validateFollowAccountInput,
} from '../utils/ingressMath';

interface FollowBackDirectoryProps {
  myAccount: MyInstagramProfile;
  accounts: FollowExchangeAccount[];
  onAddAccount: (account: FollowExchangeAccount) => void;
  onUpdateStatus: (id: string, status: FollowRelationshipStatus) => void;
  onRemoveAccount: (id: string) => void;
}

type StatusFilter = 'all' | 'mutual' | 'following' | 'none';

export function FollowBackDirectory({
  myAccount,
  accounts,
  onAddAccount,
  onUpdateStatus,
  onRemoveAccount,
}: FollowBackDirectoryProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [nicheFilter, setNicheFilter] = useState<'All' | CreatorNiche>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [copiedMyHandle, setCopiedMyHandle] = useState(false);

  const [handleInput, setHandleInput] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [nicheInput, setNicheInput] = useState<CreatorNiche>('Creator & Education');
  const [followersInput, setFollowersInput] = useState('2500');
  const [bioNoteInput, setBioNoteInput] = useState('');
  const [promiseInput, setPromiseInput] = useState('Follows back active niche creators within 24h');
  const [formError, setFormError] = useState<string | null>(null);

  const stats = useMemo(() => calculateFollowBackStats(accounts), [accounts]);

  const filteredAccounts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return accounts.filter((acc) => {
      const matchesStatus = statusFilter === 'all' || acc.status === statusFilter;
      const matchesNiche = nicheFilter === 'All' || acc.niche === nicheFilter;
      const matchesQuery =
        !q ||
        acc.handle.toLowerCase().includes(q) ||
        acc.displayName.toLowerCase().includes(q) ||
        acc.bioNote.toLowerCase().includes(q);
      return matchesStatus && matchesNiche && matchesQuery;
    });
  }, [accounts, statusFilter, nicheFilter, searchQuery]);

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = validateFollowAccountInput(
      {
        handle: handleInput,
        displayName: displayNameInput,
        followers: Number(followersInput),
        bioNote: bioNoteInput,
      },
      accounts.map((a) => a.handle)
    );

    if (!validation.valid) {
      setFormError(validation.error);
      return;
    }

    setFormError(null);
    const created: FollowExchangeAccount = {
      id: `fb-${Date.now()}`,
      handle: validation.normalizedHandle,
      displayName: displayNameInput.trim() || validation.normalizedHandle.slice(1),
      niche: nicheInput,
      followers: Math.round(Number(followersInput) || 0),
      bioNote: bioNoteInput.trim() || 'Open to mutual organic follows and Reels engagement.',
      followBackPromise:
        promiseInput.trim() || 'Follows back aligned creators within 24 hours',
      status: 'none',
      addedByUser: true,
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    onAddAccount(created);
    setHandleInput('');
    setDisplayNameInput('');
    setFollowersInput('2500');
    setBioNoteInput('');
    setShowAddForm(false);
  }

  function handleCopyMyHandle() {
    navigator.clipboard?.writeText(myAccount.handle).catch(() => {});
    setCopiedMyHandle(true);
    window.setTimeout(() => setCopiedMyHandle(false), 1800);
  }

  function getInstagramUrl(handle: string): string {
    return buildInstagramProfileUrl(handle);
  }

  function renderStatusLabel(status: FollowRelationshipStatus): string {
    if (status === 'mutual') return 'Mutual Follow-Back';
    if (status === 'following') return 'Following · Awaiting Follow-Back';
    return 'Open to Mutual Follow';
  }

  return (
    <section id="follow-back" className="scroll-mt-16 py-16 lg:py-20 border-b border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-slate-200">
          <div>
            <p className="text-sm font-medium text-rose-700">
              02. Follow & Follow-Back Creator Directory
            </p>
            <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
              Connect with niche Instagram accounts for mutual follow-backs
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowAddForm((prev) => !prev);
              setFormError(null);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-rose-600 focus-visible:outline-offset-2"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>{showAddForm ? 'Cancel' : 'Add Your Instagram Account'}</span>
          </button>
        </div>

        {/* Live Follow & Follow-Back Summary Metrics */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-5 gap-4 pb-6 border-b border-slate-200">
          <div>
            <p className="text-xs text-slate-500">Directory Accounts</p>
            <p
              data-testid="fb-total-count"
              className="mt-1 font-mono text-2xl font-semibold text-slate-950 tabular-nums"
            >
              {stats.totalAccounts}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Accounts You Follow</p>
            <p
              data-testid="fb-following-count"
              className="mt-1 font-mono text-2xl font-semibold text-slate-950 tabular-nums"
            >
              {stats.followingCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Mutual Follow-Backs</p>
            <p
              data-testid="fb-mutual-count"
              className="mt-1 font-mono text-2xl font-semibold text-emerald-700 tabular-nums"
            >
              {stats.mutualCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Pending Follow-Back</p>
            <p
              data-testid="fb-pending-count"
              className="mt-1 font-mono text-2xl font-semibold text-amber-700 tabular-nums"
            >
              {stats.pendingCount}
            </p>
          </div>
          <div className="col-span-2 lg:col-span-1">
            <p className="text-xs text-slate-500">Follow-Back Rate · Safe Pace</p>
            <p
              data-testid="fb-rate"
              className="mt-1 font-mono text-2xl font-semibold text-rose-600 tabular-nums"
            >
              {stats.followBackRatePct}%
            </p>
            <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
              {stats.safeDailyRemaining} / {SAFE_DAILY_FOLLOW_LIMIT} safe follows left today
            </p>
          </div>
        </div>

        {/* Pinned Active User Handle */}
        <div
          data-testid="fb-my-account-banner"
          className="mt-6 p-4 sm:p-5 bg-[#F9FAFB] border border-slate-200 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4"
        >
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <span className="text-xs font-semibold text-rose-700">Your Account</span>
              <span className="font-mono text-sm font-bold text-slate-950">
                {myAccount.handle}
              </span>
              <span className="text-sm font-medium text-slate-700">{myAccount.displayName}</span>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                · {formatCompactNumber(myAccount.followers)} followers
              </span>
              <span className="text-xs text-slate-500">· {myAccount.niche}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {myAccount.followBackPromise}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href={getInstagramUrl(myAccount.handle)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open your account ${myAccount.handle} on Instagram`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-950 rounded-md hover:bg-slate-800 whitespace-nowrap"
            >
              <span>Open {myAccount.handle}</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={handleCopyMyHandle}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:border-slate-400 hover:text-slate-950 whitespace-nowrap cursor-pointer"
            >
              {copiedMyHandle ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Copy Handle</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Add Account Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddSubmit}
            noValidate
            className="mt-6 p-6 bg-[#F9FAFB] border border-slate-200 rounded-xl space-y-4"
          >
            <div>
              <h3 className="font-display text-base font-bold text-slate-950">
                List an Instagram account for Follow & Follow-Back
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Add your own handle or a peer niche creator to track mutual follows and reciprocal engagement.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="fb-handle" className="block text-xs font-medium text-slate-700 mb-1">
                  Instagram Handle
                </label>
                <input
                  id="fb-handle"
                  type="text"
                  placeholder="@luma.design"
                  value={handleInput}
                  onChange={(e) => setHandleInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label htmlFor="fb-name" className="block text-xs font-medium text-slate-700 mb-1">
                  Creator or Brand Name
                </label>
                <input
                  id="fb-name"
                  type="text"
                  placeholder="Luma Studio"
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label htmlFor="fb-niche" className="block text-xs font-medium text-slate-700 mb-1">
                  Niche
                </label>
                <select
                  id="fb-niche"
                  value={nicheInput}
                  onChange={(e) => setNicheInput(e.target.value as CreatorNiche)}
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
                <label htmlFor="fb-followers" className="block text-xs font-medium text-slate-700 mb-1">
                  Current Followers
                </label>
                <input
                  id="fb-followers"
                  type="number"
                  min={0}
                  value={followersInput}
                  onChange={(e) => setFollowersInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
              <div className="lg:col-span-5">
                <label htmlFor="fb-bio" className="block text-xs font-medium text-slate-700 mb-1">
                  What You Post
                </label>
                <input
                  id="fb-bio"
                  type="text"
                  placeholder="e.g. Minimal UI teardowns, Reels process logs, typography tips"
                  value={bioNoteInput}
                  onChange={(e) => setBioNoteInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>
              <div className="lg:col-span-5">
                <label htmlFor="fb-promise" className="block text-xs font-medium text-slate-700 mb-1">
                  Follow-Back Note
                </label>
                <input
                  id="fb-promise"
                  type="text"
                  value={promiseInput}
                  onChange={(e) => setPromiseInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>
              <div className="lg:col-span-2">
                <button
                  type="submit"
                  className="w-full px-4 py-2 text-sm font-semibold text-white bg-slate-950 rounded-lg hover:bg-slate-800 whitespace-nowrap cursor-pointer"
                >
                  Publish Handle
                </button>
              </div>
            </div>

            {formError && (
              <p role="alert" className="text-xs font-medium text-rose-700">
                {formError}
              </p>
            )}
          </form>
        )}

        {/* Filter & Search Toolbar */}
        <div className="mt-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'mutual', label: 'Mutual' },
                  { id: 'following', label: 'Pending' },
                  { id: 'none', label: 'Not Followed' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    statusFilter === tab.id
                      ? 'bg-white text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <select
              aria-label="Filter follow-back accounts by niche"
              value={nicheFilter}
              onChange={(e) => setNicheFilter(e.target.value as 'All' | CreatorNiche)}
              className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
            >
              <option value="All">All Niches</option>
              {CREATOR_NICHES.map((niche) => (
                <option key={niche} value={niche}>
                  {niche}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full lg:w-64">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Search follow-back Instagram accounts"
              placeholder="Search handle or niche..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
            />
          </div>
        </div>

        {/* Directory List */}
        <div className="mt-5 border border-slate-200 rounded-xl bg-white overflow-hidden">
          {filteredAccounts.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <p className="text-sm font-medium text-slate-900">
                No Instagram accounts match this follow-back filter.
              </p>
              <p className="text-xs text-slate-500">
                Reset filters or add your Instagram handle to start tracking mutual follows.
              </p>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setNicheFilter('All');
                  setSearchQuery('');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-900 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                Show All Accounts
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-slate-200">
              {filteredAccounts.map((acc) => (
                <li
                  key={acc.id}
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                      <span className="font-mono text-sm font-semibold text-slate-950">
                        {acc.handle}
                      </span>
                      <span className="text-sm font-medium text-slate-700">{acc.displayName}</span>
                      <span className="text-xs text-slate-500 font-mono tabular-nums">
                        · {formatCompactNumber(acc.followers)} followers
                      </span>
                      <span className="text-xs text-slate-500">· {acc.niche}</span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{acc.bioNote}</p>

                    <p className="text-xs text-slate-500">
                      <span
                        className={`font-semibold ${
                          acc.status === 'mutual'
                            ? 'text-emerald-700'
                            : acc.status === 'following'
                            ? 'text-amber-700'
                            : 'text-slate-700'
                        }`}
                      >
                        {renderStatusLabel(acc.status)}
                      </span>
                      <span> · {acc.followBackPromise}</span>
                    </p>
                  </div>

                  {/* Interactive Follow & Follow-Back Controls */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <a
                      href={getInstagramUrl(acc.handle)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${acc.handle} on Instagram`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:border-slate-400 hover:text-slate-950 whitespace-nowrap"
                    >
                      <span>Open IG</span>
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    </a>

                    {acc.status === 'none' && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(acc.id, 'following')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-950 rounded-md hover:bg-slate-800 whitespace-nowrap cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Follow</span>
                      </button>
                    )}

                    {acc.status === 'following' && (
                      <>
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(acc.id, 'mutual')}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 rounded-md hover:bg-emerald-800 whitespace-nowrap cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Confirm Follow-Back</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(acc.id, 'none')}
                          className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 whitespace-nowrap cursor-pointer"
                        >
                          Unfollow
                        </button>
                      </>
                    )}

                    {acc.status === 'mutual' && (
                      <button
                        type="button"
                        onClick={() => onUpdateStatus(acc.id, 'following')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 whitespace-nowrap cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Mutual</span>
                      </button>
                    )}

                    <button
                      type="button"
                      aria-label={`Remove ${acc.handle} from follow-back directory`}
                      onClick={() => onRemoveAccount(acc.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-700 rounded-md hover:bg-slate-100 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
