export type InstagramOAuthProvider = 'instagram' | 'facebook';

export const INSTAGRAM_OAUTH_CALLBACK_PATH = '/auth/instagram/callback';

export function resolveAppBaseUrl(appUrlEnv?: string, fallbackOrigin = 'http://localhost:3000'): string {
  const raw = (appUrlEnv || '').trim();
  if (!raw || raw === 'MY_APP_URL') {
    return fallbackOrigin.replace(/\/+$/, '');
  }
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return fallbackOrigin.replace(/\/+$/, '');
    }
    return parsed.origin;
  } catch {
    return fallbackOrigin.replace(/\/+$/, '');
  }
}

export function buildOAuthRedirectUri(appUrlEnv?: string, fallbackOrigin = 'http://localhost:3000'): string {
  return `${resolveAppBaseUrl(appUrlEnv, fallbackOrigin)}${INSTAGRAM_OAUTH_CALLBACK_PATH}`;
}

export function buildProviderAuthorizeUrl(params: {
  provider: InstagramOAuthProvider;
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  const { provider, clientId, redirectUri, state } = params;
  if (provider === 'instagram') {
    const query = new URLSearchParams({
      enable_fb_login: '0',
      force_authentication: '1',
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'instagram_business_basic',
      state,
    });
    return `https://www.instagram.com/oauth/authorize?${query.toString()}`;
  }

  const query = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'instagram_basic,pages_show_list,pages_read_engagement',
    state,
  });
  return `https://www.facebook.com/v21.0/dialog/oauth?${query.toString()}`;
}

export function isAllowedOAuthOrigin(origin: string, currentOrigin?: string): boolean {
  if (!origin) return false;
  if (currentOrigin && origin === currentOrigin) return true;
  try {
    const parsed = new URL(origin);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    const host = parsed.hostname.toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host.endsWith('.run.app');
  } catch {
    return false;
  }
}

export function serializeForInlineScript(payload: unknown): string {
  return JSON.stringify(payload)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
