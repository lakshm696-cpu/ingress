import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  LogIn,
  Pencil,
  SlidersHorizontal,
} from 'lucide-react';
import { CREATOR_NICHES } from '../data/seedData';
import type {
  CreatorNiche,
  FollowBackStats,
  InstagramAuthState,
  MyInstagramProfile,
} from '../types/ingress';
import {
  buildInstagramProfileUrl,
  formatCompactNumber,
  getHandleInitials,
  validateMyAccountProfile,
} from '../utils/ingressMath';

interface MyInstagramAccountSectionProps {
  profile: MyInstagramProfile;
  authState: InstagramAuthState;
  followStats: FollowBackStats;
  sprintLoggedFollowers: number;
  onOpenLogin: () => void;
  onOpenPaidBoost: () => void;
  onOpenFreeToolkit: () => void;
  onUpdateProfile: (profile: MyInstagramProfile) => void;
  onRunAudit: (profile: MyInstagramProfile) => void;
  onLoadInFunnel: (profile: MyInstagramProfile) => void;
  onOpenFollowDirectory: () => void;
}

export function MyInstagramAccountSection({
  profile,
  authState,
  followStats,
  sprintLoggedFollowers,
  onOpenLogin,
  onOpenPaidBoost,
  onOpenFreeToolkit,
  onUpdateProfile,
  onRunAudit,
  onLoadInFunnel,
  onOpenFollowDirectory,
}: MyInstagramAccountSectionProps) {
  const [editing, setEditing] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const [handleInput, setHandleInput] = useState(profile.handle);
  const [displayNameInput, setDisplayNameInput] = useState(profile.displayName);
  const [nicheInput, setNicheInput] = useState<CreatorNiche>(profile.niche);
  const [followersInput, setFollowersInput] = useState(String(profile.followers));
  const [followingInput, setFollowingInput] = useState(String(profile.following));
  const [postsInput, setPostsInput] = useState(String(profile.posts));
  const [weeklyReelsInput, setWeeklyReelsInput] = useState(String(profile.weeklyReels));
  const [bioInput, setBioInput] = useState(profile.bio);
  const [promiseInput, setPromiseInput] = useState(profile.followBackPromise);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setHandleInput(profile.handle);
    setDisplayNameInput(profile.displayName);
    setNicheInput(profile.niche);
    setFollowersInput(String(profile.followers));
    setFollowingInput(String(profile.following));
    setPostsInput(String(profile.posts));
    setWeeklyReelsInput(String(profile.weeklyReels));
    setBioInput(profile.bio);
    setPromiseInput(profile.followBackPromise);
  }, [profile]);

  const instagramUrl = buildInstagramProfileUrl(profile.handle);
  const initials = getHandleInitials(profile.handle, profile.displayName);

  function handleCopyUrl() {
    navigator.clipboard?.writeText(instagramUrl).catch(() => {});
    setCopiedUrl(true);
    window.setTimeout(() => setCopiedUrl(false), 1800);
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const followersNum = Number(followersInput);
    const followingNum = Number(followingInput);
    const postsNum = Number(postsInput);
    const reelsNum = Number(weeklyReelsInput);

    const validation = validateMyAccountProfile({
      handle: handleInput,
      displayName: displayNameInput,
      followers: followersNum,
      following: followingNum,
      posts: postsNum,
      weeklyReels: reelsNum,
      bio: bioInput,
    });

    if (!validation.valid) {
      setFormError(validation.error);
      return;
    }

    setFormError(null);
    onUpdateProfile({
      handle: validation.normalizedHandle,
      displayName: displayNameInput.trim() || validation.normalizedHandle.slice(1),
      niche: nicheInput,
      followers: Math.round(followersNum),
      following: Math.round(followingNum),
      posts: Math.round(postsNum),
      weeklyReels: Math.round(reelsNum),
      bio: bioInput.trim() || profile.bio,
      followBackPromise: promiseInput.trim() || profile.followBackPromise,
      updatedAt: new Date().toISOString().slice(0, 10),
    });
    setEditing(false);
  }

  return (
    <section
      id="my-account"
      aria-labelledby="my-account-heading"
      className="scroll-mt-16 py-12 lg:py-16 border-b border-slate-200 bg-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <p className="text-sm font-medium text-rose-700">
              My Instagram Account ·{' '}
              <span data-testid="my-account-auth-status" className="text-slate-600">
                {authState.signedIn
                  ? authState.method === 'instagram_oauth'
                    ? 'Connected via Instagram OAuth'
                    : authState.method === 'meta_oauth'
                    ? 'Connected via Meta Graph OAuth'
                    : 'Signed in (Handle Mode)'
                  : 'Public Profile Preview'}
              </span>
            </p>
            <h2
              id="my-account-heading"
              className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950"
            >
              Active profile workspace for{' '}
              <span data-testid="my-account-heading-handle" className="font-mono text-rose-600">
                {profile.handle}
              </span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenLogin}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-slate-950 rounded-lg hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-rose-600 focus-visible:outline-offset-2"
            >
              <LogIn className="w-4 h-4" aria-hidden="true" />
              <span>{authState.signedIn ? 'Switch / Manage Login' : 'Connect / Login'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditing((prev) => !prev);
                setFormError(null);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-rose-600 focus-visible:outline-offset-2"
            >
              <Pencil className="w-4 h-4" aria-hidden="true" />
              <span>{editing ? 'Cancel Editing' : 'Edit Account Details'}</span>
            </button>
          </div>
        </div>

        {/* Account Showcase Card */}
        <div className="mt-6 border border-slate-200 rounded-xl bg-[#F9FAFB] overflow-hidden">
          <div className="p-6 lg:p-8 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            {/* Identity & Bio */}
            <div className="flex items-start gap-4 sm:gap-5 min-w-0">
              <div
                aria-hidden="true"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-950 text-white font-display text-xl sm:text-2xl font-bold flex items-center justify-center shrink-0 tracking-tight border border-slate-800"
              >
                {initials}
              </div>

              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3
                    data-testid="my-account-handle"
                    className="font-mono text-xl sm:text-2xl font-bold text-slate-950"
                  >
                    {profile.handle}
                  </h3>
                  <span className="text-sm font-medium text-slate-700">{profile.displayName}</span>
                  <span className="text-xs text-slate-500">· {profile.niche}</span>
                </div>

                <p className="font-mono text-xs text-slate-500 break-all">{instagramUrl}</p>

                <p
                  data-testid="my-account-bio"
                  className="text-sm text-slate-700 leading-relaxed max-w-2xl pt-1"
                >
                  {profile.bio}
                </p>

                <p className="text-xs text-slate-500 pt-1">
                  <span className="font-semibold text-emerald-700">Follow-Back Status</span>
                  <span> · {profile.followBackPromise}</span>
                </p>
              </div>
            </div>

            {/* Direct Account Actions */}
            <div className="flex flex-wrap lg:flex-col items-stretch gap-2.5 shrink-0 lg:w-56">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="my-account-ig-link"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-rose-600 focus-visible:outline-offset-2"
              >
                <span>Follow {profile.handle}</span>
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
              </a>

              <button
                type="button"
                data-testid="my-account-free-20-btn"
                onClick={onOpenFreeToolkit}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 whitespace-nowrap cursor-pointer"
              >
                <span>Free +20 Followers Plan</span>
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={handleCopyUrl}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap cursor-pointer"
              >
                {copiedUrl ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                    <span>Copied URL</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Copy Profile Link</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onOpenPaidBoost}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg hover:border-slate-900 hover:bg-slate-50 whitespace-nowrap cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5 text-rose-600" aria-hidden="true" />
                <span>Paid Follower Boost</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onRunAudit(profile)}
                  className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg hover:border-slate-400 whitespace-nowrap cursor-pointer"
                >
                  <span>Run Audit</span>
                  <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => onLoadInFunnel(profile)}
                  className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg hover:border-slate-400 whitespace-nowrap cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>In Funnel</span>
                </button>
              </div>
            </div>
          </div>

          {/* 5-Column Account Stats Strip */}
          <div className="border-t border-slate-200 bg-white grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
            <div className="p-4 sm:p-5">
              <p className="text-xs text-slate-500">Followers</p>
              <p
                data-testid="my-account-followers"
                className="mt-1 font-mono text-2xl font-semibold text-slate-950 tabular-nums"
              >
                {formatCompactNumber(profile.followers)}
              </p>
              <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                {profile.followers.toLocaleString('en-US')} · Free +20 goal ({sprintLoggedFollowers}/20)
              </p>
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-xs text-slate-500">Following</p>
              <p
                data-testid="my-account-following"
                className="mt-1 font-mono text-2xl font-semibold text-slate-950 tabular-nums"
              >
                {formatCompactNumber(profile.following)}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Active follows</p>
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-xs text-slate-500">Posts</p>
              <p
                data-testid="my-account-posts"
                className="mt-1 font-mono text-2xl font-semibold text-slate-950 tabular-nums"
              >
                {profile.posts.toLocaleString('en-US')}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Feed & Reels</p>
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-xs text-slate-500">Weekly Reels</p>
              <p className="mt-1 font-mono text-2xl font-semibold text-slate-950 tabular-nums">
                {profile.weeklyReels} / wk
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Publishing pace</p>
            </div>
            <div className="col-span-2 sm:col-span-1 p-4 sm:p-5">
              <p className="text-xs text-slate-500">Directory Mutuals</p>
              <p
                data-testid="my-account-mutuals"
                className="mt-1 font-mono text-2xl font-semibold text-emerald-700 tabular-nums"
              >
                {followStats.mutualCount}
              </p>
              <button
                type="button"
                onClick={onOpenFollowDirectory}
                className="text-xs font-medium text-rose-700 hover:underline mt-0.5 cursor-pointer"
              >
                {followStats.pendingCount} pending · Open directory
              </button>
            </div>
          </div>

          {/* Inline Edit Form */}
          {editing && (
            <form
              onSubmit={handleSave}
              noValidate
              className="border-t border-slate-200 bg-[#F9FAFB] p-6 space-y-4"
            >
              <div>
                <h3 className="font-display text-base font-bold text-slate-950">
                  Update Your Instagram Profile Details
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Keep your handle, live follower counts, and bio synced for audits, funnel simulations, and the Follow-Back directory.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="my-acc-handle" className="block text-xs font-medium text-slate-700 mb-1">
                    Instagram Handle
                  </label>
                  <input
                    id="my-acc-handle"
                    type="text"
                    value={handleInput}
                    onChange={(e) => setHandleInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label htmlFor="my-acc-name" className="block text-xs font-medium text-slate-700 mb-1">
                    Display Name
                  </label>
                  <input
                    id="my-acc-name"
                    type="text"
                    value={displayNameInput}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label htmlFor="my-acc-niche" className="block text-xs font-medium text-slate-700 mb-1">
                    Niche
                  </label>
                  <select
                    id="my-acc-niche"
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
                  <label htmlFor="my-acc-reels" className="block text-xs font-medium text-slate-700 mb-1">
                    Weekly Reels
                  </label>
                  <input
                    id="my-acc-reels"
                    type="number"
                    min={0}
                    max={21}
                    value={weeklyReelsInput}
                    onChange={(e) => setWeeklyReelsInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="my-acc-followers" className="block text-xs font-medium text-slate-700 mb-1">
                    Followers
                  </label>
                  <input
                    id="my-acc-followers"
                    type="number"
                    min={0}
                    value={followersInput}
                    onChange={(e) => setFollowersInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label htmlFor="my-acc-following" className="block text-xs font-medium text-slate-700 mb-1">
                    Following
                  </label>
                  <input
                    id="my-acc-following"
                    type="number"
                    min={0}
                    value={followingInput}
                    onChange={(e) => setFollowingInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label htmlFor="my-acc-posts" className="block text-xs font-medium text-slate-700 mb-1">
                    Posts
                  </label>
                  <input
                    id="my-acc-posts"
                    type="number"
                    min={0}
                    value={postsInput}
                    onChange={(e) => setPostsInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                <div className="lg:col-span-6">
                  <label htmlFor="my-acc-bio" className="block text-xs font-medium text-slate-700 mb-1">
                    Instagram Bio
                  </label>
                  <textarea
                    id="my-acc-bio"
                    rows={2}
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 resize-y"
                  />
                </div>
                <div className="lg:col-span-4">
                  <label htmlFor="my-acc-promise" className="block text-xs font-medium text-slate-700 mb-1">
                    Follow-Back Note
                  </label>
                  <input
                    id="my-acc-promise"
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
                    Save Profile
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
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Instagram restricts automatic live stat fetching without Business Graph API OAuth. Open your profile directly above or edit your exact Followers, Following, and Posts counts anytime—your details stay saved locally.
        </p>
      </div>
    </section>
  );
}
