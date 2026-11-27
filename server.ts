import 'dotenv/config';
import crypto from 'crypto';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  buildOAuthRedirectUri,
  buildProviderAuthorizeUrl,
  INSTAGRAM_OAUTH_CALLBACK_PATH,
  resolveAppBaseUrl,
  serializeForInlineScript,
  type InstagramOAuthProvider,
} from './src/utils/instagramAuth.ts';
import {
  PAID_BOOST_TIERS,
  validatePaidBoostRequest,
} from './src/utils/paidBoost.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

interface PendingOAuthState {
  provider: InstagramOAuthProvider;
  redirectUri: string;
  expiresAt: number;
}

interface ConnectedInstagramSession {
  provider: InstagramOAuthProvider;
  username: string;
  displayName: string;
  accountType: string;
  followersCount?: number;
  followsCount?: number;
  mediaCount?: number;
  bio?: string;
  connectedAt: string;
  expiresAt: number;
}

const pendingOAuthStates = new Map<string, PendingOAuthState>();
const instagramSessions = new Map<string, ConnectedInstagramSession>();

function pruneExpiredAuthEntries() {
  const now = Date.now();
  for (const [key, entry] of pendingOAuthStates.entries()) {
    if (entry.expiresAt <= now) pendingOAuthStates.delete(key);
  }
  for (const [token, session] of instagramSessions.entries()) {
    if (session.expiresAt <= now) instagramSessions.delete(token);
  }
}

function getInstagramOAuthConfig(provider: InstagramOAuthProvider) {
  if (provider === 'instagram') {
    const clientId = (process.env.INSTAGRAM_APP_ID || '').trim();
    const clientSecret = (process.env.INSTAGRAM_APP_SECRET || '').trim();
    return {
      configured: Boolean(clientId && clientSecret),
      clientId,
      clientSecret,
    };
  }
  const clientId = (process.env.META_APP_ID || '').trim();
  const clientSecret = (process.env.META_APP_SECRET || '').trim();
  return {
    configured: Boolean(clientId && clientSecret),
    clientId,
    clientSecret,
  };
}

function extractBearerToken(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  return token.length >= 32 ? token : null;
}

function renderOAuthCallbackHtml(payload: Record<string, unknown>, statusMessage: string): string {
  const safePayload = serializeForInlineScript(payload);
  const safeText = statusMessage
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Instagram Account Connection</title>
  </head>
  <body style="font-family: system-ui, -apple-system, sans-serif; padding: 24px; color: #0f172a; background: #f9fafb;">
    <p>${safeText}</p>
    <script>
      (function () {
        var data = ${safePayload};
        if (window.opener) {
          window.opener.postMessage(data, '*');
          window.close();
        } else {
          window.location.href = '/';
        }
      })();
    </script>
  </body>
</html>`;
}

function createGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function extractGeminiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('PERMISSION_DENIED') || raw.includes('API_KEY_INVALID') || raw.includes('403')) {
    return {
      status: 403,
      message: 'Gemini API authentication failed. Verify your API key in Settings > Secrets.',
    };
  }
  if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('429')) {
    return {
      status: 429,
      message: 'Gemini API rate limit or quota reached. Please retry shortly or select a billing-enabled key in Settings > Secrets.',
    };
  }
  if (raw.includes('NOT_FOUND') || raw.includes('404')) {
    return {
      status: 404,
      message: 'Requested Gemini model is unavailable for this API key.',
    };
  }
  return {
    status: 500,
    message: raw || 'Unable to reach Gemini API right now.',
  };
}

async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let attempt = 0;
  let lastError: unknown;
  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isRetryable = msg.includes('429') || msg.includes('503') || msg.includes('UNAVAILABLE');
      if (!isRetryable || attempt === maxRetries) {
        throw err;
      }
      const delayMs = 700 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      attempt += 1;
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, geminiConfigured: Boolean(createGeminiClient()) });
  });

  // Instagram & Meta OAuth Status
  app.get('/api/auth/instagram/status', (_req, res) => {
    pruneExpiredAuthEntries();
    const ig = getInstagramOAuthConfig('instagram');
    const fb = getInstagramOAuthConfig('facebook');
    const redirectUri = buildOAuthRedirectUri(process.env.APP_URL, `http://localhost:${PORT}`);
    res.json({
      instagramConfigured: ig.configured,
      facebookConfigured: fb.configured,
      redirectUri,
      callbackPath: INSTAGRAM_OAUTH_CALLBACK_PATH,
    });
  });

  // Construct official provider OAuth authorization URL (never open container route in popup)
  app.get('/api/auth/instagram/url', (req, res) => {
    pruneExpiredAuthEntries();
    const rawProvider = String(req.query.provider || 'instagram').toLowerCase();
    if (rawProvider !== 'instagram' && rawProvider !== 'facebook') {
      res.status(400).json({ error: 'Unsupported login provider. Choose instagram or facebook.' });
      return;
    }
    const provider: InstagramOAuthProvider = rawProvider;
    const config = getInstagramOAuthConfig(provider);
    const redirectUri = buildOAuthRedirectUri(process.env.APP_URL, `http://localhost:${PORT}`);

    if (!config.configured) {
      const neededVars =
        provider === 'instagram'
          ? 'INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET'
          : 'META_APP_ID and META_APP_SECRET';
      res.status(503).json({
        error: `${provider === 'instagram' ? 'Instagram Login' : 'Meta / Facebook Login'} is not configured yet. Add ${neededVars} in Settings > Secrets and register the callback URL below in your Meta Developer App.`,
        redirectUri,
      });
      return;
    }

    const state = crypto.randomBytes(24).toString('hex');
    pendingOAuthStates.set(state, {
      provider,
      redirectUri,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    const url = buildProviderAuthorizeUrl({
      provider,
      clientId: config.clientId,
      redirectUri,
      state,
    });

    res.json({ url, provider, redirectUri });
  });

  // OAuth callback handler (handles both trailing-slash and non-trailing-slash variants)
  const instagramCallbackHandler: express.RequestHandler = async (req, res) => {
    pruneExpiredAuthEntries();
    const oauthError = typeof req.query.error === 'string' ? req.query.error : '';
    const oauthErrorDesc =
      typeof req.query.error_description === 'string' ? req.query.error_description : '';
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    const code = typeof req.query.code === 'string' ? req.query.code : '';

    if (oauthError) {
      res
        .status(200)
        .type('html')
        .send(
          renderOAuthCallbackHtml(
            {
              type: 'INSTAGRAM_OAUTH_ERROR',
              error: oauthErrorDesc || `Instagram authorization was cancelled (${oauthError}).`,
            },
            'Authorization was cancelled. You can close this window.'
          )
        );
      return;
    }

    const pending = state ? pendingOAuthStates.get(state) : undefined;
    if (state) pendingOAuthStates.delete(state);

    if (!pending || !code) {
      res
        .status(400)
        .type('html')
        .send(
          renderOAuthCallbackHtml(
            {
              type: 'INSTAGRAM_OAUTH_ERROR',
              error: 'Invalid or expired Instagram login state. Please try connecting again.',
            },
            'Invalid or expired login state. Please return to the app and retry.'
          )
        );
      return;
    }

    const config = getInstagramOAuthConfig(pending.provider);
    if (!config.configured) {
      res
        .status(503)
        .type('html')
        .send(
          renderOAuthCallbackHtml(
            {
              type: 'INSTAGRAM_OAUTH_ERROR',
              error: 'OAuth credentials are missing on the server.',
            },
            'Server OAuth credentials are not configured.'
          )
        );
      return;
    }

    try {
      let profile: ConnectedInstagramSession;

      if (pending.provider === 'instagram') {
        const body = new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          grant_type: 'authorization_code',
          redirect_uri: pending.redirectUri,
          code,
        });

        const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
        });
        const tokenData = (await tokenRes.json()) as {
          access_token?: string;
          error_message?: string;
        };

        if (!tokenRes.ok || !tokenData.access_token) {
          throw new Error(tokenData.error_message || 'Instagram token exchange failed.');
        }

        const profileUrl = new URL('https://graph.instagram.com/me');
        profileUrl.searchParams.set(
          'fields',
          'user_id,username,name,account_type,followers_count,follows_count,media_count'
        );
        profileUrl.searchParams.set('access_token', tokenData.access_token);

        const meRes = await fetch(profileUrl.toString());
        const meData = (await meRes.json()) as {
          username?: string;
          name?: string;
          account_type?: string;
          followers_count?: number;
          follows_count?: number;
          media_count?: number;
          error?: { message?: string };
        };

        if (!meRes.ok || !meData.username) {
          throw new Error(meData.error?.message || 'Unable to load Instagram profile details.');
        }

        profile = {
          provider: 'instagram',
          username: `@${meData.username.replace(/^@+/, '').toLowerCase()}`,
          displayName: meData.name || meData.username,
          accountType: meData.account_type || 'Business / Creator',
          followersCount: typeof meData.followers_count === 'number' ? meData.followers_count : undefined,
          followsCount: typeof meData.follows_count === 'number' ? meData.follows_count : undefined,
          mediaCount: typeof meData.media_count === 'number' ? meData.media_count : undefined,
          connectedAt: new Date().toISOString(),
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        };
      } else {
        const tokenUrl = new URL('https://graph.facebook.com/v21.0/oauth/access_token');
        tokenUrl.searchParams.set('client_id', config.clientId);
        tokenUrl.searchParams.set('client_secret', config.clientSecret);
        tokenUrl.searchParams.set('redirect_uri', pending.redirectUri);
        tokenUrl.searchParams.set('code', code);

        const tokenRes = await fetch(tokenUrl.toString());
        const tokenData = (await tokenRes.json()) as {
          access_token?: string;
          error?: { message?: string };
        };

        if (!tokenRes.ok || !tokenData.access_token) {
          throw new Error(tokenData.error?.message || 'Meta OAuth token exchange failed.');
        }

        const pagesUrl = new URL('https://graph.facebook.com/v21.0/me/accounts');
        pagesUrl.searchParams.set(
          'fields',
          'name,instagram_business_account{id,username,name,followers_count,follows_count,media_count,biography}'
        );
        pagesUrl.searchParams.set('access_token', tokenData.access_token);

        const pagesRes = await fetch(pagesUrl.toString());
        const pagesData = (await pagesRes.json()) as {
          data?: Array<{
            instagram_business_account?: {
              username?: string;
              name?: string;
              followers_count?: number;
              follows_count?: number;
              media_count?: number;
              biography?: string;
            };
          }>;
          error?: { message?: string };
        };

        if (!pagesRes.ok) {
          throw new Error(pagesData.error?.message || 'Unable to query linked Instagram Business account.');
        }

        const linkedIg = pagesData.data?.find((p) => p.instagram_business_account?.username)
          ?.instagram_business_account;

        if (!linkedIg?.username) {
          throw new Error(
            'No Instagram Business or Creator account is linked to your Facebook Pages yet.'
          );
        }

        profile = {
          provider: 'facebook',
          username: `@${linkedIg.username.replace(/^@+/, '').toLowerCase()}`,
          displayName: linkedIg.name || linkedIg.username,
          accountType: 'Instagram Business (Meta Graph)',
          followersCount: typeof linkedIg.followers_count === 'number' ? linkedIg.followers_count : undefined,
          followsCount: typeof linkedIg.follows_count === 'number' ? linkedIg.follows_count : undefined,
          mediaCount: typeof linkedIg.media_count === 'number' ? linkedIg.media_count : undefined,
          bio: linkedIg.biography || undefined,
          connectedAt: new Date().toISOString(),
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        };
      }

      const sessionToken = crypto.randomBytes(32).toString('hex');
      instagramSessions.set(sessionToken, profile);

      res
        .status(200)
        .type('html')
        .send(
          renderOAuthCallbackHtml(
            {
              type: 'INSTAGRAM_OAUTH_SUCCESS',
              sessionToken,
              provider: pending.provider,
            },
            'Instagram account connected. This window will close automatically.'
          )
        );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Instagram OAuth connection failed.';
      res
        .status(200)
        .type('html')
        .send(
          renderOAuthCallbackHtml(
            {
              type: 'INSTAGRAM_OAUTH_ERROR',
              error: message,
            },
            'Could not finish connecting Instagram. Please return to the app.'
          )
        );
    }
  };

  app.get([INSTAGRAM_OAUTH_CALLBACK_PATH, `${INSTAGRAM_OAUTH_CALLBACK_PATH}/`], instagramCallbackHandler);

  // Authenticated Instagram profile endpoint (Bearer token verified server-side)
  app.get('/api/auth/instagram/me', (req, res) => {
    pruneExpiredAuthEntries();
    const token = extractBearerToken(req);
    if (!token) {
      res.status(401).json({ error: 'Not signed in with an Instagram OAuth session.' });
      return;
    }
    const session = instagramSessions.get(token);
    if (!session) {
      res.status(401).json({ error: 'Instagram session expired. Please reconnect.' });
      return;
    }
    res.json({
      provider: session.provider,
      username: session.username,
      displayName: session.displayName,
      accountType: session.accountType,
      followersCount: session.followersCount,
      followsCount: session.followsCount,
      mediaCount: session.mediaCount,
      bio: session.bio,
      connectedAt: session.connectedAt,
    });
  });

  // Revoke server-side Instagram OAuth session
  app.post('/api/auth/instagram/logout', (req, res) => {
    const token = extractBearerToken(req);
    if (token) {
      instagramSessions.delete(token);
    }
    res.json({ ok: true });
  });

  // Optional Paid Follower Boost — Payment Status & Authoritative Tier Catalog
  app.get('/api/payments/status', (_req, res) => {
    const stripeKey = (process.env.STRIPE_SECRET_KEY || '').trim();
    res.json({
      stripeConfigured: Boolean(stripeKey && stripeKey.startsWith('sk_')),
      tiers: PAID_BOOST_TIERS,
    });
  });

  // Optional Paid Follower Boost — Server-Authoritative Stripe Checkout Session
  app.post('/api/payments/paid-boost/checkout', async (req, res) => {
    const body = req.body ?? {};
    const validation = validatePaidBoostRequest({
      tierId: typeof body.tierId === 'string' ? body.tierId : '',
      handle: typeof body.handle === 'string' ? body.handle : '',
      paymentMethod: typeof body.paymentMethod === 'string' ? body.paymentMethod : '',
      acknowledgedDisclaimer: body.acknowledgedDisclaimer === true,
    });

    if (!validation.valid || !validation.tier || !validation.paymentMethod) {
      res.status(400).json({ error: validation.error || 'Invalid paid boost request.' });
      return;
    }

    const stripeKey = (process.env.STRIPE_SECRET_KEY || '').trim();
    if (!stripeKey || !stripeKey.startsWith('sk_')) {
      res.status(503).json({
        code: 'STRIPE_NOT_CONFIGURED',
        error:
          'Live checkout is not enabled yet. Add STRIPE_SECRET_KEY in Settings > Secrets to activate real Stripe, Apple Pay, Google Pay, and PayPal checkout sessions.',
        quote: {
          tierId: validation.tier.id,
          tierName: validation.tier.name,
          handle: validation.normalizedHandle,
          priceUsd: validation.tier.priceUsd,
          expectedFollowerMin: validation.tier.expectedFollowerMin,
          expectedFollowerMax: validation.tier.expectedFollowerMax,
          deliveryWindow: validation.tier.deliveryWindow,
        },
      });
      return;
    }

    try {
      const appBaseUrl = resolveAppBaseUrl(process.env.APP_URL, `http://localhost:${PORT}`);
      const formParams = new URLSearchParams();
      formParams.set('mode', 'payment');
      formParams.set('success_url', `${appBaseUrl}/?boost_checkout=success#free-plan`);
      formParams.set('cancel_url', `${appBaseUrl}/?boost_checkout=cancelled#free-plan`);
      formParams.set('line_items[0][quantity]', '1');
      formParams.set('line_items[0][price_data][currency]', 'usd');
      formParams.set(
        'line_items[0][price_data][unit_amount]',
        String(validation.tier.priceCents)
      );
      formParams.set(
        'line_items[0][price_data][product_data][name]',
        `Ingress ${validation.tier.name} (${validation.normalizedHandle})`
      );
      formParams.set(
        'line_items[0][price_data][product_data][description]',
        `${validation.tier.reachSummary} · Est. +${validation.tier.expectedFollowerMin}–${validation.tier.expectedFollowerMax} followers over ${validation.tier.deliveryWindow}`
      );
      formParams.set('metadata[instagram_handle]', validation.normalizedHandle);
      formParams.set('metadata[tier_id]', validation.tier.id);
      formParams.set('metadata[preferred_method]', validation.paymentMethod);

      const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formParams.toString(),
      });

      const stripeData = (await stripeRes.json()) as {
        id?: string;
        url?: string;
        error?: { message?: string };
      };

      if (!stripeRes.ok || !stripeData.url) {
        res.status(502).json({
          error: stripeData.error?.message || 'Unable to create a secure Stripe checkout session.',
        });
        return;
      }

      res.json({
        sessionId: stripeData.id,
        checkoutUrl: stripeData.url,
        tier: validation.tier,
        handle: validation.normalizedHandle,
      });
    } catch {
      res.status(502).json({
        error: 'Unable to reach Stripe checkout right now. Please try again shortly.',
      });
    }
  });

  // 1. Deep-Thinking Organic Growth Audit (ThinkingLevel.HIGH)
  app.post('/api/gemini/audit', async (req, res) => {
    const { handle, niche, followers, weeklyReels, currentBio, growthGoal } = req.body ?? {};
    if (!handle || !niche || !currentBio || !growthGoal) {
      res.status(400).json({ error: 'Handle, niche, current bio, and growth goal are required.' });
      return;
    }

    const ai = createGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Gemini API key is not configured on the server. Add GEMINI_API_KEY in Settings > Secrets.',
      });
      return;
    }

    try {
      const prompt = [
        `Perform a rigorous organic Instagram follower ingress audit for this account:`,
        `- Handle: ${String(handle).slice(0, 60)}`,
        `- Niche: ${String(niche).slice(0, 80)}`,
        `- Current followers: ${Number(followers) || 0}`,
        `- Weekly Reels cadence: ${Number(weeklyReels) || 0}`,
        `- Current bio: ${String(currentBio).slice(0, 300)}`,
        `- 90-day growth objective: ${String(growthGoal).slice(0, 260)}`,
        ``,
        `Deliver a concrete, non-generic organic acquisition plan. Focus on non-follower discovery, 0-3s retention hooks, profile-to-follow conversion, and repeatable content pillars. No spam, bots, or follow-for-follow tactics.`,
        `Keep the rewritten bio strictly under 150 characters.`,
      ].join('\n');

      const response = await callWithRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: {
            systemInstruction:
              'You are a senior organic Instagram audience acquisition strategist. Write concise, concrete, data-minded recommendations in plain human language without buzzwords.',
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.HIGH,
            },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                executiveSummary: { type: Type.STRING },
                primaryBottleneck: { type: Type.STRING },
                projected90DayLift: { type: Type.STRING },
                optimizedBio: { type: Type.STRING },
                bioRationale: { type: Type.STRING },
                contentPillars: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      sharePercent: { type: Type.INTEGER },
                      format: { type: Type.STRING },
                      exampleTopic: { type: Type.STRING },
                    },
                    required: ['name', 'sharePercent', 'format', 'exampleTopic'],
                  },
                },
                weeklySprint: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      week: { type: Type.STRING },
                      focus: { type: Type.STRING },
                      deliverables: { type: Type.STRING },
                      metricTarget: { type: Type.STRING },
                    },
                    required: ['week', 'focus', 'deliverables', 'metricTarget'],
                  },
                },
                dailyIngressHabits: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: [
                'executiveSummary',
                'primaryBottleneck',
                'projected90DayLift',
                'optimizedBio',
                'bioRationale',
                'contentPillars',
                'weeklySprint',
                'dailyIngressHabits',
              ],
            },
          },
        })
      );

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({
        modelUsed: 'gemini-4-hydrogen (High Thinking)',
        generatedAt: new Date().toISOString(),
        audit: parsed,
      });
    } catch (err) {
      const { status, message } = extractGeminiError(err);
      res.status(status).json({ error: message });
    }
  });

  // 2. Live Google Search Grounded Instagram Trend Radar
  app.post('/api/gemini/trends', async (req, res) => {
    const { niche, focus } = req.body ?? {};
    if (!niche || String(niche).trim().length < 2) {
      res.status(400).json({ error: 'Please specify a niche or topic to scan.' });
      return;
    }

    const ai = createGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Gemini API key is not configured on the server. Add GEMINI_API_KEY in Settings > Secrets.',
      });
      return;
    }

    try {
      const prompt = [
        `Research the latest Instagram organic growth trends, Reels formats, carousel patterns, and algorithm updates relevant to the "${String(niche).slice(0, 100)}" niche.`,
        focus ? `Specific angle requested: ${String(focus).slice(0, 160)}` : '',
        `Organize your briefing into 4 short sections using clean markdown headings (##):`,
        `1. Algorithm & Distribution Signals`,
        `2. High-Converting Reels & Carousel Formats`,
        `3. Emerging Niche Topics Worth Covering This Week`,
        `4. Immediate Action Checklist (3 concrete steps)`,
        `Keep the brief scannable, specific, and grounded in current search results.`,
      ]
        .filter(Boolean)
        .join('\n');

      const response = await callWithRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: {
            systemInstruction:
              'You are an editorial social-media researcher. Synthesize current web evidence into crisp, factual guidance for organic Instagram audience growth.',
            tools: [{ googleSearch: {} }],
          },
        })
      );

      const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
      const sources: Array<{ title: string; uri: string }> = [];
      const seen = new Set<string>();

      for (const chunk of rawChunks) {
        const web = (chunk as { web?: { uri?: string; title?: string } }).web;
        if (web?.uri && !seen.has(web.uri)) {
          seen.add(web.uri);
          sources.push({
            title: web.title || web.uri,
            uri: web.uri,
          });
        }
      }

      res.json({
        modelUsed: 'gemini-4-hydrogen + Google Search',
        generatedAt: new Date().toISOString(),
        briefing: (response.text ?? '').trim(),
        sources,
      });
    } catch (err) {
      const { status, message } = extractGeminiError(err);
      res.status(status).json({ error: message });
    }
  });

  // 3. Fast Hook, Bio & Carousel Lab (gemini-3.1-flash-lite)
  app.post('/api/gemini/hooks', async (req, res) => {
    const { topic, niche, tone } = req.body ?? {};
    if (!topic || String(topic).trim().length < 3) {
      res.status(400).json({ error: 'Enter a Reel or Carousel topic (at least 3 characters).' });
      return;
    }

    const ai = createGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Gemini API key is not configured on the server. Add GEMINI_API_KEY in Settings > Secrets.',
      });
      return;
    }

    try {
      const prompt = [
        `Generate high-retention Instagram organic growth copy for:`,
        `- Topic: ${String(topic).slice(0, 180)}`,
        `- Niche: ${String(niche || 'Creator & Education').slice(0, 80)}`,
        `- Voice/Tone: ${String(tone || 'Direct & Editorial').slice(0, 60)}`,
        ``,
        `Provide:`,
        `- 4 distinct 0-3 second Reels hooks (visual cue + spoken opener + why it stops scrolling)`,
        `- 3 Instagram bio variants (each strictly <= 150 characters, clearly stating who it helps and why to follow)`,
        `- 5-slide Instagram carousel outline optimized for saves and follows`,
      ].join('\n');

      const response = await callWithRetry(() =>
        ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: prompt,
          config: {
            systemInstruction:
              'You are a sharp short-form scriptwriter for Instagram Reels and Carousels. Avoid cliches, clickbait hype, and filler adjectives. Write tight, human copy.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                hooks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      angle: { type: Type.STRING },
                      visualCue: { type: Type.STRING },
                      spokenLine: { type: Type.STRING },
                      retentionWhy: { type: Type.STRING },
                    },
                    required: ['angle', 'visualCue', 'spokenLine', 'retentionWhy'],
                  },
                },
                bioVariants: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      style: { type: Type.STRING },
                      text: { type: Type.STRING },
                    },
                    required: ['style', 'text'],
                  },
                },
                carouselSlides: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      slideNumber: { type: Type.INTEGER },
                      headline: { type: Type.STRING },
                      body: { type: Type.STRING },
                    },
                    required: ['slideNumber', 'headline', 'body'],
                  },
                },
              },
              required: ['hooks', 'bioVariants', 'carouselSlides'],
            },
          },
        })
      );

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({
        modelUsed: 'gemini-3.1-flash-lite',
        generatedAt: new Date().toISOString(),
        result: parsed,
      });
    } catch (err) {
      const { status, message } = extractGeminiError(err);
      res.status(status).json({ error: message });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api/')) {
        next();
        return;
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ingress server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
