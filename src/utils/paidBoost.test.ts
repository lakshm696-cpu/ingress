import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getPaidBoostTierById,
  PAID_BOOST_TIERS,
  validatePaidBoostRequest,
} from './paidBoost';

test('getPaidBoostTierById returns authoritative server-side pricing tiers', () => {
  assert.equal(PAID_BOOST_TIERS.length, 3);
  const growth = getPaidBoostTierById('growth');
  assert.ok(growth);
  assert.equal(growth.priceUsd, 49);
  assert.equal(growth.priceCents, 4900);
  assert.equal(getPaidBoostTierById('unknown'), null);
});

test('validatePaidBoostRequest enforces valid tier, handle, payment method, and disclaimer', () => {
  const missingDisclaimer = validatePaidBoostRequest({
    tierId: 'starter',
    handle: '@my_ads_pro',
    paymentMethod: 'stripe_card',
    acknowledgedDisclaimer: false,
  });
  assert.equal(missingDisclaimer.valid, false);
  assert.ok(missingDisclaimer.error?.includes('disclaimer'));

  const badHandle = validatePaidBoostRequest({
    tierId: 'starter',
    handle: '  ',
    paymentMethod: 'apple_pay',
    acknowledgedDisclaimer: true,
  });
  assert.equal(badHandle.valid, false);

  const badMethod = validatePaidBoostRequest({
    tierId: 'growth',
    handle: 'my_ads_pro',
    paymentMethod: 'crypto_unverified',
    acknowledgedDisclaimer: true,
  });
  assert.equal(badMethod.valid, false);

  const valid = validatePaidBoostRequest({
    tierId: 'scale',
    handle: '  my_ads_pro ',
    paymentMethod: 'paypal',
    acknowledgedDisclaimer: true,
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.normalizedHandle, '@my_ads_pro');
  assert.equal(valid.tier?.priceUsd, 119);
  assert.equal(valid.paymentMethod, 'paypal');
});
