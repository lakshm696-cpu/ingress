import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { MyInstagramAccountSection } from './components/MyInstagramAccountSection';
import { FreeGrowthToolkit } from './components/FreeGrowthToolkit';
import { FollowBackDirectory } from './components/FollowBackDirectory';
import { IngressFunnelSimulator } from './components/IngressFunnelSimulator';
import { DeepAuditStudio } from './components/DeepAuditStudio';
import { TrendRadarSection } from './components/TrendRadarSection';
import { HookLabSection } from './components/HookLabSection';
import { CaseStudiesFooter } from './components/CaseStudiesFooter';
import { InstagramLoginModal } from './components/InstagramLoginModal';
import { PaidFollowerBoostModal } from './components/PaidFollowerBoostModal';
import {
  DEFAULT_MY_INSTAGRAM_PROFILE,
  SEED_CONTENT_QUEUE,
  SEED_FOLLOW_ACCOUNTS,
  SEED_TRACKED_ACCOUNTS,
} from './data/seedData';
import type {
  AuditFormValues,
  ContentQueueItem,
  CreatorNiche,
  FollowExchangeAccount,
  FollowRelationshipStatus,
  InstagramAuthState,
  MyInstagramProfile,
  PaidBoostDraftOrder,
  SavedPlaybook,
  TrackedAccount,
} from './types/ingress';
import { calculateFollowBackStats } from './utils/ingressMath';
import {
  isAllowedOAuthOrigin,
  type InstagramOAuthProvider,
} from './utils/instagramAuth';

const STORAGE_KEYS = {
  myAccount: 'ingress_my_account_v1',
  accounts: 'ingress_tracked_accounts_v1',
  playbooks: 'ingress_saved_playbooks_v1',
  queue: 'ingress_content_queue_v1',
  freeHabits: 'ingress_free_habits_v1',
  freeSprintFollowers: 'ingress_free_sprint_followers_v1',
  followBack: 'ingress_follow_back_v1',
  paidBoostDrafts: 'ingress_paid_boost_drafts_v1',
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [myAccount, setMyAccount] = useState<MyInstagramProfile>(() =>
    readStorage(STORAGE_KEYS.myAccount, DEFAULT_MY_INSTAGRAM_PROFILE)
  );
  const [accounts, setAccounts] = useState<TrackedAccount[]>(() =>
    readStorage(STORAGE_KEYS.accounts, SEED_TRACKED_ACCOUNTS)
  );
  const [savedPlaybooks, setSavedPlaybooks] = useState<SavedPlaybook[]>(() =>
    readStorage(STORAGE_KEYS.playbooks, [])
  );
  const [contentQueue, setContentQueue] = useState<ContentQueueItem[]>(() =>
    readStorage(STORAGE_KEYS.queue, SEED_CONTENT_QUEUE)
  );
  const [completedHabitIds, setCompletedHabitIds] = useState<string[]>(() =>
    readStorage(STORAGE_KEYS.freeHabits, ['habit-reel-hook', 'habit-pinned-check'])
  );
  const [loggedSprintFollowers, setLoggedSprintFollowers] = useState<number>(() =>
    readStorage(STORAGE_KEYS.freeSprintFollowers, 0)
  );
  const [followAccounts, setFollowAccounts] = useState<FollowExchangeAccount[]>(() =>
    readStorage(STORAGE_KEYS.followBack, SEED_FOLLOW_ACCOUNTS)
  );
  const [auditPrefill, setAuditPrefill] = useState<AuditFormValues | null>(null);
  const [selectedSimulationAccount, setSelectedSimulationAccount] = useState<{
    handle: string;
    niche: CreatorNiche;
    followers: number;
    weeklyReels: number;
    version: number;
  } | null>(null);

  // Instagram Login state (OAuth session token stays strictly in React memory, never localStorage)
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [paidBoostOpen, setPaidBoostOpen] = useState(false);
  const [paidBoostDrafts, setPaidBoostDrafts] = useState<PaidBoostDraftOrder[]>(() =>
    readStorage(STORAGE_KEYS.paidBoostDrafts, [])
  );
  const [oauthSessionToken, setOauthSessionToken] = useState<string | null>(null);
  const [connectingProvider, setConnectingProvider] = useState<InstagramOAuthProvider | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [authState, setAuthState] = useState<InstagramAuthState>(() => ({
    signedIn: false,
    method: null,
    handle: myAccount.handle,
    displayName: myAccount.displayName,
  }));

  const followStats = useMemo(() => calculateFollowBackStats(followAccounts), [followAccounts]);

  const fetchAuthenticatedInstagramProfile = useCallback(async (token: string) => {
    try {
      const response = await fetch('/api/auth/instagram/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to verify Instagram login session.');
      }

      const method = data.provider === 'facebook' ? 'meta_oauth' : 'instagram_oauth';
      setOauthSessionToken(token);
      setOauthError(null);
      setAuthState({
        signedIn: true,
        method,
        handle: data.username,
        displayName: data.displayName || data.username,
        accountType: data.accountType,
        connectedAt: data.connectedAt,
      });

      setMyAccount((prev) => ({
        ...prev,
        handle: data.username || prev.handle,
        displayName: data.displayName || prev.displayName,
        followers: typeof data.followersCount === 'number' ? data.followersCount : prev.followers,
        following: typeof data.followsCount === 'number' ? data.followsCount : prev.following,
        posts: typeof data.mediaCount === 'number' ? data.mediaCount : prev.posts,
        bio: data.bio || prev.bio,
        updatedAt: new Date().toISOString().slice(0, 10),
      }));

      setLoginModalOpen(false);
    } catch (err) {
      setOauthError(err instanceof Error ? err.message : 'Unable to complete Instagram sign-in.');
    } finally {
      setConnectingProvider(null);
    }
  }, []);

  useEffect(() => {
    function handleOAuthMessage(event: MessageEvent) {
      if (!isAllowedOAuthOrigin(event.origin, window.location.origin)) {
        return;
      }
      const payload = event.data as
        | { type?: string; sessionToken?: string; error?: string }
        | undefined;
      if (!payload || typeof payload !== 'object') return;

      if (payload.type === 'INSTAGRAM_OAUTH_SUCCESS' && typeof payload.sessionToken === 'string') {
        void fetchAuthenticatedInstagramProfile(payload.sessionToken);
      } else if (payload.type === 'INSTAGRAM_OAUTH_ERROR') {
        setConnectingProvider(null);
        setOauthError(payload.error || 'Instagram authorization was cancelled or failed.');
      }
    }

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [fetchAuthenticatedInstagramProfile]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.myAccount, JSON.stringify(myAccount));
    } catch {
      // Ignore storage quota errors
    }
  }, [myAccount]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(accounts));
    } catch {
      // Ignore storage quota errors
    }
  }, [accounts]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.playbooks, JSON.stringify(savedPlaybooks));
    } catch {
      // Ignore storage quota errors
    }
  }, [savedPlaybooks]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.queue, JSON.stringify(contentQueue));
    } catch {
      // Ignore storage quota errors
    }
  }, [contentQueue]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.freeHabits, JSON.stringify(completedHabitIds));
    } catch {
      // Ignore storage quota errors
    }
  }, [completedHabitIds]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.freeSprintFollowers,
        JSON.stringify(loggedSprintFollowers)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [loggedSprintFollowers]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.followBack, JSON.stringify(followAccounts));
    } catch {
      // Ignore storage quota errors
    }
  }, [followAccounts]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.paidBoostDrafts, JSON.stringify(paidBoostDrafts));
    } catch {
      // Ignore storage quota errors
    }
  }, [paidBoostDrafts]);

  function scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  async function handleStartOAuth(provider: InstagramOAuthProvider) {
    setOauthError(null);
    setConnectingProvider(provider);
    try {
      const response = await fetch(`/api/auth/instagram/url?provider=${encodeURIComponent(provider)}`);
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setConnectingProvider(null);
        setOauthError(data.error || 'Unable to start Instagram OAuth login.');
        return;
      }

      const authWindow = window.open(
        data.url,
        'instagram_oauth_popup',
        'width=600,height=720'
      );

      if (!authWindow) {
        setConnectingProvider(null);
        setOauthError(
          'Your browser blocked the Instagram login popup. Allow popups for this site and click Connect again.'
        );
      }
    } catch {
      setConnectingProvider(null);
      setOauthError('Could not reach the authentication server. Please try again.');
    }
  }

  function handleQuickHandleLogin(handle: string, displayName: string) {
    setOauthError(null);
    setMyAccount((prev) => ({
      ...prev,
      handle,
      displayName,
      updatedAt: new Date().toISOString().slice(0, 10),
    }));
    setAuthState({
      signedIn: true,
      method: 'handle_workspace',
      handle,
      displayName,
      connectedAt: new Date().toISOString(),
    });
    setLoginModalOpen(false);
  }

  async function handleSignOut() {
    if (oauthSessionToken) {
      try {
        await fetch('/api/auth/instagram/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${oauthSessionToken}` },
        });
      } catch {
        // Proceed with local session sign-out
      }
      setOauthSessionToken(null);
    }
    setOauthError(null);
    setAuthState({
      signedIn: false,
      method: null,
      handle: myAccount.handle,
      displayName: myAccount.displayName,
    });
  }

  function handleUpdateMyAccount(updated: MyInstagramProfile) {
    setMyAccount(updated);
    setAuthState((prev) => ({
      ...prev,
      handle: updated.handle,
      displayName: updated.displayName,
    }));
  }

  function handleAddAccount(account: TrackedAccount) {
    setAccounts((prev) => [account, ...prev]);
  }

  function handleRemoveAccount(id: string) {
    setAccounts((prev) => prev.filter((item) => item.id !== id));
  }

  function handleSendToAudit(account: TrackedAccount) {
    setAuditPrefill({
      handle: account.handle,
      niche: account.niche,
      followers: account.followers,
      weeklyReels: account.weeklyReels,
      currentBio: account.notes,
      growthGoal: `Increase organic monthly follower ingress for ${account.handle} while improving profile-to-follow conversion.`,
    });
    scrollToSection('audit');
  }

  function handleAuditMyAccount(profile: MyInstagramProfile) {
    setAuditPrefill({
      handle: profile.handle,
      niche: profile.niche,
      followers: profile.followers,
      weeklyReels: profile.weeklyReels,
      currentBio: profile.bio,
      growthGoal: `Grow ${profile.handle} organically with high-retention Reels and stronger profile-to-follow conversion.`,
    });
    scrollToSection('audit');
  }

  function handleLoadMyAccountInFunnel(profile: MyInstagramProfile) {
    setSelectedSimulationAccount({
      handle: profile.handle,
      niche: profile.niche,
      followers: profile.followers,
      weeklyReels: profile.weeklyReels,
      version: Date.now(),
    });
    scrollToSection('funnel');
  }

  function handleSavePlaybook(playbook: SavedPlaybook) {
    setSavedPlaybooks((prev) => [playbook, ...prev]);
  }

  function handleDeletePlaybook(id: string) {
    setSavedPlaybooks((prev) => prev.filter((pb) => pb.id !== id));
  }

  function handleAddQueueItem(item: Omit<ContentQueueItem, 'id' | 'createdAt' | 'status'>) {
    const created: ContentQueueItem = {
      ...item,
      id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      status: 'Draft',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setContentQueue((prev) => [created, ...prev]);
  }

  function handleToggleQueueStatus(id: string) {
    setContentQueue((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'Draft' ? 'Scheduled' : 'Draft' }
          : item
      )
    );
  }

  function handleRemoveQueueItem(id: string) {
    setContentQueue((prev) => prev.filter((item) => item.id !== id));
  }

  function handleToggleHabit(id: string) {
    setCompletedHabitIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function handleResetHabits() {
    setCompletedHabitIds([]);
  }

  function handleLogSprintFollower(delta: number) {
    setLoggedSprintFollowers((prev) => Math.max(0, Math.min(20, prev + delta)));
  }

  function handleResetSprintFollowers() {
    setLoggedSprintFollowers(0);
  }

  function handleAddFollowAccount(account: FollowExchangeAccount) {
    setFollowAccounts((prev) => [account, ...prev]);
  }

  function handleUpdateFollowStatus(id: string, status: FollowRelationshipStatus) {
    setFollowAccounts((prev) =>
      prev.map((acc) =>
        acc.id === id
          ? { ...acc, status, updatedAt: new Date().toISOString().slice(0, 10) }
          : acc
      )
    );
  }

  function handleRemoveFollowAccount(id: string) {
    setFollowAccounts((prev) => prev.filter((acc) => acc.id !== id));
  }

  function handleSavePaidBoostDraft(order: PaidBoostDraftOrder) {
    setPaidBoostDrafts((prev) => [order, ...prev]);
  }

  function handleRemovePaidBoostDraft(id: string) {
    setPaidBoostDrafts((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Navbar
        authState={authState}
        onOpenLogin={() => {
          setOauthError(null);
          setLoginModalOpen(true);
        }}
      />
      <main>
        <HeroSection
          activeHandle={myAccount.handle}
          onLaunchAudit={() => scrollToSection('free-plan')}
          onViewMyAccount={() => scrollToSection('my-account')}
        />
        <MyInstagramAccountSection
          profile={myAccount}
          authState={authState}
          followStats={followStats}
          sprintLoggedFollowers={loggedSprintFollowers}
          onOpenLogin={() => {
            setOauthError(null);
            setLoginModalOpen(true);
          }}
          onOpenPaidBoost={() => setPaidBoostOpen(true)}
          onOpenFreeToolkit={() => scrollToSection('free-plan')}
          onUpdateProfile={handleUpdateMyAccount}
          onRunAudit={handleAuditMyAccount}
          onLoadInFunnel={handleLoadMyAccountInFunnel}
          onOpenFollowDirectory={() => scrollToSection('follow-back')}
        />
        <FreeGrowthToolkit
          activeProfile={myAccount}
          followStats={followStats}
          completedHabitIds={completedHabitIds}
          loggedSprintFollowers={loggedSprintFollowers}
          onToggleHabit={handleToggleHabit}
          onResetHabits={handleResetHabits}
          onLogSprintFollower={handleLogSprintFollower}
          onResetSprintFollowers={handleResetSprintFollowers}
          onAddQueueItem={handleAddQueueItem}
          onOpenPaidBoost={() => setPaidBoostOpen(true)}
          onOpenFollowDirectory={() => scrollToSection('follow-back')}
        />
        <FollowBackDirectory
          myAccount={myAccount}
          accounts={followAccounts}
          onAddAccount={handleAddFollowAccount}
          onUpdateStatus={handleUpdateFollowStatus}
          onRemoveAccount={handleRemoveFollowAccount}
        />
        <IngressFunnelSimulator
          accounts={accounts}
          selectedSimulationAccount={selectedSimulationAccount}
          onAddAccount={handleAddAccount}
          onRemoveAccount={handleRemoveAccount}
          onSendToAudit={handleSendToAudit}
        />
        <DeepAuditStudio
          prefillAccount={auditPrefill}
          savedPlaybooks={savedPlaybooks}
          onSavePlaybook={handleSavePlaybook}
          onDeletePlaybook={handleDeletePlaybook}
        />
        <TrendRadarSection />
        <HookLabSection
          queue={contentQueue}
          onAddQueueItem={handleAddQueueItem}
          onToggleQueueStatus={handleToggleQueueStatus}
          onRemoveQueueItem={handleRemoveQueueItem}
        />
        <CaseStudiesFooter />
      </main>

      <InstagramLoginModal
        open={loginModalOpen}
        authState={authState}
        currentProfile={myAccount}
        oauthError={oauthError}
        connectingProvider={connectingProvider}
        onClose={() => setLoginModalOpen(false)}
        onStartOAuth={handleStartOAuth}
        onQuickHandleLogin={handleQuickHandleLogin}
        onSignOut={handleSignOut}
      />

      <PaidFollowerBoostModal
        open={paidBoostOpen}
        defaultHandle={myAccount.handle}
        draftOrders={paidBoostDrafts}
        onClose={() => setPaidBoostOpen(false)}
        onSaveDraftOrder={handleSavePaidBoostDraft}
        onRemoveDraftOrder={handleRemovePaidBoostDraft}
      />
    </div>
  );
}
