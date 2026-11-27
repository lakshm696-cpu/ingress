import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildOAuthRedirectUri,
  buildProviderAuthorizeUrl,
  isAllowedOAuthOrigin,
  resolveAppBaseUrl,
  serializeForInlineScript,
} from './instagramAuth';

test('resolveAppBaseUrl and buildOAuthRedirectUri normalize APP_URL safely', () => {
  assert.equal(
    resolveAppBaseUrl('https://ais-dev-example.asia-east1.run.app/'),
    'https://ais-dev-example.asia-east1.run.app'
  );
  assert.equal(resolveAppBaseUrl('MY_APP_URL'), 'http://localhost:3000');
  assert.equal(resolveAppBaseUrl('javascript:alert(1)'), 'http://localhost:3000');
  assert.equal(
    buildOAuthRedirectUri('https://ais-dev-example.asia-east1.run.app'),
    'https://ais-dev-example.asia-east1.run.app/auth/instagram/callback'
  );
});

test('buildProviderAuthorizeUrl generates official Instagram and Meta OAuth URLs', () => {
  const igUrl = new URL(
    buildProviderAuthorizeUrl({
      provider: 'instagram',
      clientId: 'ig_client_123',
      redirectUri: 'https://example.run.app/auth/instagram/callback',
      state: 'state_abc',
    })
  );
  assert.equal(igUrl.origin, 'https://www.instagram.com');
  assert.equal(igUrl.pathname, '/oauth/authorize');
  assert.equal(igUrl.searchParams.get('client_id'), 'ig_client_123');
  assert.equal(igUrl.searchParams.get('response_type'), 'code');
  assert.equal(igUrl.searchParams.get('state'), 'state_abc');
  assert.equal(igUrl.searchParams.get('scope'), 'instagram_business_basic');

  const fbUrl = new URL(
    buildProviderAuthorizeUrl({
      provider: 'facebook',
      clientId: 'meta_client_456',
      redirectUri: 'https://example.run.app/auth/instagram/callback',
      state: 'state_def',
    })
  );
  assert.equal(fbUrl.origin, 'https://www.facebook.com');
  assert.equal(fbUrl.pathname, '/v21.0/dialog/oauth');
  assert.equal(fbUrl.searchParams.get('client_id'), 'meta_client_456');
  assert.equal(fbUrl.searchParams.get('state'), 'state_def');
});

test('isAllowedOAuthOrigin permits AI Studio run.app & localhost and blocks untrusted origins', () => {
  assert.equal(isAllowedOAuthOrigin('https://ais-dev-123.asia-east1.run.app'), true);
  assert.equal(isAllowedOAuthOrigin('http://localhost:3000'), true);
  assert.equal(isAllowedOAuthOrigin('https://evil.example.com'), false);
  assert.equal(isAllowedOAuthOrigin('https://run.app.evil.com'), false);
  assert.equal(isAllowedOAuthOrigin('javascript:alert(1)'), false);
});

test('serializeForInlineScript escapes closing script tags safely', () => {
  const serialized = serializeForInlineScript({ error: '</script><script>alert(1)</script>' });
  assert.equal(serialized.includes('</script>'), false);
  assert.equal(serialized.includes('\\u003c/script\\u003e'), true);
});
