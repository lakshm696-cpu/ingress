import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  KeyRound,
  Loader2,
  LogOut,
  ShieldCheck,
  UserCheck,
  X,
} from 'lucide-react';
import type { InstagramAuthState, MyInstagramProfile } from '../types/ingress';
import { normalizeHandle } from '../utils/ingressMath';
import {
  INSTAGRAM_OAUTH_CALLBACK_PATH,
  type InstagramOAuthProvider,
} from '../utils/instagramAuth';

interface OAuthStatusPayload {
  instagramConfigured: boolean;
  facebookConfigured: boolean;
  redirectUri: string;
}

interface InstagramLoginModalProps {
  open: boolean;
  authState: InstagramAuthState;
  currentProfile: MyInstagramProfile;
  oauthError: string | null;
  connectingProvider: InstagramOAuthProvider | null;
  onClose: () => void;
  onStartOAuth: (provider: InstagramOAuthProvider) => void;
  onQuickHandleLogin: (handle: string, displayName: string) => void;
  onSignOut: () => void;
}

export function InstagramLoginModal({
  open,
  authState,
  currentProfile,
  oauthError,
  connectingProvider,
  onClose,
  onStartOAuth,
  onQuickHandleLogin,
  onSignOut,
}: InstagramLoginModalProps) {
  const [status, setStatus] = useState<OAuthStatusPayload | null>(null);
  const [handleInput, setHandleInput] = useState(currentProfile.handle);
  const [displayNameInput, setDisplayNameInput] = useState(currentProfile.displayName);
  const [handleError, setHandleError] = useState<string | null>(null);
  const [copiedCallback, setCopiedCallback] = useState(false);

  useEffect(() => {
    if (!open) return;
    setHandleInput(currentProfile.handle);
    setDisplayNameInput(currentProfile.displayName);
    setHandleError(null);

    let active = true;
    fetch('/api/auth/instagram/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: OAuthStatusPayload | null) => {
        if (active && data) setStatus(data);
      })
      .catch(() => {
        // Ignore network errors while reading optional status
      });

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      active = false;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, currentProfile.handle, currentProfile.displayName, onClose]);

  if (!open) return null;

  const callbackUrl =
    status?.redirectUri || `${window.location.origin}${INSTAGRAM_OAUTH_CALLBACK_PATH}`;

  function handleCopyCallback() {
    navigator.clipboard?.writeText(callbackUrl).catch(() => {});
    setCopiedCallback(true);
    window.setTimeout(() => setCopiedCallback(false), 1800);
  }

  function handleQuickSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalized = normalizeHandle(handleInput);
    if (!normalized || normalized.length < 3) {
      setHandleError('Enter a valid Instagram handle (e.g. @my_ads_pro).');
      return;
    }
    setHandleError(null);
    onQuickHandleLogin(normalized, displayNameInput.trim() || normalized.slice(1));
  }

  function formatMethodLabel(method: InstagramAuthState['method']): string {
    if (method === 'instagram_oauth') return 'Instagram Business OAuth';
    if (method === 'meta_oauth') return 'Meta / Facebook Graph OAuth';
    return 'Public Handle Workspace';
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-[2px] p-4 overflow-y-auto"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ig-login-modal-title"
        className="w-full max-w-xl bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden my-auto"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between gap-4 bg-[#F9FAFB]">
          <div>
            <p className="text-xs font-medium text-rose-700">Instagram Account Access</p>
            <h2
              id="ig-login-modal-title"
              className="mt-1 font-display text-xl font-bold tracking-tight text-slate-950"
            >
              Choose how to sign in to Instagram
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Connect via official OAuth popups for live Graph API metrics or sign in with your public handle—never share your Instagram password.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close Instagram login options"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-950 hover:bg-slate-200/70 rounded-lg cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Active Session Banner */}
          {authState.signedIn && (
            <div
              data-testid="ig-active-session"
              className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Signed in · {formatMethodLabel(authState.method)}</span>
                </p>
                <p className="mt-0.5 font-mono text-sm font-bold text-slate-950 truncate">
                  {authState.handle}{' '}
                  <span className="font-sans font-normal text-slate-600">
                    ({authState.displayName})
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Sign Out</span>
              </button>
            </div>
          )}

          {/* OAuth Error Feedback */}
          {oauthError && (
            <div
              role="alert"
              data-testid="ig-oauth-error"
              className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-xs text-rose-900 space-y-1">
                <p className="font-semibold">OAuth Connection Notice</p>
                <p className="leading-relaxed">{oauthError}</p>
              </div>
            </div>
          )}

          {/* Option 1 & 2: Official OAuth Popups */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Official OAuth Login (Live Graph API Sync)
              </h3>
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                <span>Popup OAuth 2.0</span>
              </span>
            </div>

            {/* Option 1: Instagram Business & Creator OAuth */}
            <div className="p-4 border border-slate-200 rounded-xl bg-[#F9FAFB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-950">
                    Continue with Instagram
                  </p>
                  <span
                    className={`text-xs font-medium ${
                      status?.instagramConfigured ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    · {status?.instagramConfigured ? 'Ready' : 'Setup required'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Direct Instagram Login for Business & Creator accounts. Syncs handle, followers, and media count.
                </p>
              </div>
              <button
                type="button"
                disabled={connectingProvider !== null}
                onClick={() => onStartOAuth('instagram')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {connectingProvider === 'instagram' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>Continue with Instagram</span>
              </button>
            </div>

            {/* Option 2: Meta / Facebook Login */}
            <div className="p-4 border border-slate-200 rounded-xl bg-[#F9FAFB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-950">
                    Continue with Facebook / Meta
                  </p>
                  <span
                    className={`text-xs font-medium ${
                      status?.facebookConfigured ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    · {status?.facebookConfigured ? 'Ready' : 'Setup required'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Connect an Instagram Business account linked to your Facebook Page via Meta Graph API.
                </p>
              </div>
              <button
                type="button"
                disabled={connectingProvider !== null}
                onClick={() => onStartOAuth('facebook')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-950 rounded-lg hover:bg-slate-800 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {connectingProvider === 'facebook' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>Meta Login</span>
              </button>
            </div>

            {/* Exact Callback URI for Meta Developer Console */}
            <div className="p-3.5 border border-slate-200 rounded-lg bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-500">
                  OAuth Redirect URI (add to Meta Developer App)
                </p>
                <p className="font-mono text-xs text-slate-800 truncate">{callbackUrl}</p>
              </div>
              <button
                type="button"
                onClick={handleCopyCallback}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copiedCallback ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Copy URI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Option 3: Quick Handle Workspace Sign-In (No Password) */}
          <form
            onSubmit={handleQuickSubmit}
            noValidate
            className="pt-5 border-t border-slate-200 space-y-4"
          >
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Instant Handle Sign-In (No Password Required)
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                Switch your active public Instagram handle right away for audits, funnel projections, and Follow-Back tracking.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="login-ig-handle"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Instagram Handle
                </label>
                <input
                  id="login-ig-handle"
                  type="text"
                  placeholder="@my_ads_pro"
                  value={handleInput}
                  onChange={(e) => setHandleInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label
                  htmlFor="login-ig-name"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Display Name (Optional)
                </label>
                <input
                  id="login-ig-name"
                  type="text"
                  placeholder="My Ads Pro"
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>

            {handleError && (
              <p role="alert" className="text-xs font-medium text-rose-700">
                {handleError}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                <span>Quick switch:</span>
                {['@my_ads_pro', '@maya.ceramics', '@kofi.builds'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setHandleInput(preset);
                      setDisplayNameInput(
                        preset === '@my_ads_pro'
                          ? 'My Ads Pro'
                          : preset === '@maya.ceramics'
                          ? 'Maya Holm'
                          : 'Kofi Mensah'
                      );
                      setHandleError(null);
                    }}
                    className="px-2 py-1 font-mono text-xs text-slate-700 bg-slate-100 rounded hover:bg-slate-200 cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold text-white bg-slate-950 rounded-lg hover:bg-slate-800 whitespace-nowrap cursor-pointer"
              >
                Sign In with Handle
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
