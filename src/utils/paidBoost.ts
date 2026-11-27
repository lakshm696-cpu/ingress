import { normalizeHandle } from './ingressMath.ts';

export type PaidBoostTierId = 'starter' | 'growth' | 'scale';

export type PaidPaymentMethod = 'stripe_card' | 'apple_pay' | 'google_pay' | 'paypal';

export interface PaidBoostTier {
  id: PaidBoostTierId;
  name: string;
  audienceLabel: string;
  priceUsd: number;
  priceCents: number;
  expectedFollowerMin: number;
  expectedFollowerMax: number;
  deliveryWindow: string;
  reachSummary: string;
  safePacingNote: string;
}

export interface PaymentMethodOption {
  id: PaidPaymentMethod;
  label: string;
  providerNote: string;
}

export const PAID_BOOST_TIERS: PaidBoostTier[] = [
  {
    id: 'starter',
    name: 'Starter Boost',
    audienceLabel: 'For early-stage creators',
    priceUsd: 19,
    priceCents: 1900,
    expectedFollowerMin: 250,
    expectedFollowerMax: 450,
    deliveryWindow: '24–48 hours',
    reachSummary: 'Sponsored Reels discovery across 1 target niche',
    safePacingNote: 'Gradual delivery · Public handle only · No password',
  },
  {
    id: 'growth',
    name: 'Growth Boost',
    audienceLabel: 'For active creator accounts',
    priceUsd: 49,
    priceCents: 4900,
    expectedFollowerMin: 750,
    expectedFollowerMax: 1300,
    deliveryWindow: '48–72 hours',
    reachSummary: 'Multi-niche Reels promotion + profile-visit optimization',
    safePacingNote: 'Paced daily intake · Policy-safe audience targeting',
  },
  {
    id: 'scale',
    name: 'Scale Campaign',
    audienceLabel: 'For brands & scaling studios',
    priceUsd: 119,
    priceCents: 11900,
    expectedFollowerMin: 2000,
    expectedFollowerMax: 3500,
    deliveryWindow: '5–7 days',
    reachSummary: 'Lookalike audience campaign + bio conversion check',
    safePacingNote: 'Spread across 7 days to preserve engagement ratio',
  },
];

export const TRUSTED_PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: 'stripe_card',
    label: 'Card (Stripe)',
    providerNote: 'Visa, Mastercard, Amex via encrypted Stripe Checkout',
  },
  {
    id: 'apple_pay',
    label: 'Apple Pay',
    providerNote: 'Express biometric checkout on supported devices',
  },
  {
    id: 'google_pay',
    label: 'Google Pay',
    providerNote: 'One-tap Google Wallet checkout via Stripe',
  },
  {
    id: 'paypal',
    label: 'PayPal',
    providerNote: 'Buyer-protected PayPal checkout session',
  },
];

export const VALID_PAYMENT_METHODS = new Set<PaidPaymentMethod>(
  TRUSTED_PAYMENT_METHODS.map((m) => m.id)
);

export function getPaidBoostTierById(id: string): PaidBoostTier | null {
  return PAID_BOOST_TIERS.find((tier) => tier.id === id) ?? null;
}

export interface PaidBoostValidationInput {
  tierId: string;
  handle: string;
  paymentMethod: string;
  acknowledgedDisclaimer: boolean;
}

export interface PaidBoostValidationResult {
  valid: boolean;
  error: string | null;
  tier: PaidBoostTier | null;
  normalizedHandle: string;
  paymentMethod: PaidPaymentMethod | null;
}

export function validatePaidBoostRequest(
  input: PaidBoostValidationInput
): PaidBoostValidationResult {
  const tier = getPaidBoostTierById(input.tierId);
  if (!tier) {
    return {
      valid: false,
      error: 'Select a valid paid follower boost package.',
      tier: null,
      normalizedHandle: '',
      paymentMethod: null,
    };
  }

  const normalizedHandle = normalizeHandle(input.handle);
  if (!normalizedHandle || normalizedHandle.length < 3) {
    return {
      valid: false,
      error: 'Enter a valid public Instagram handle (e.g. @my_ads_pro).',
      tier,
      normalizedHandle: '',
      paymentMethod: null,
    };
  }

  if (!VALID_PAYMENT_METHODS.has(input.paymentMethod as PaidPaymentMethod)) {
    return {
      valid: false,
      error: 'Choose a supported payment method (Card, Apple Pay, Google Pay, or PayPal).',
      tier,
      normalizedHandle,
      paymentMethod: null,
    };
  }

  if (!input.acknowledgedDisclaimer) {
    return {
      valid: false,
      error: 'Please confirm you have read the safety disclaimer and understand paid boosts are separate from the free organic toolkit.',
      tier,
      normalizedHandle,
      paymentMethod: input.paymentMethod as PaidPaymentMethod,
    };
  }

  return {
    valid: true,
    error: null,
    tier,
    normalizedHandle,
    paymentMethod: input.paymentMethod as PaidPaymentMethod,
  };
}
