import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Bookmark,
  Check,
  CreditCard,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import type { PaidBoostDraftOrder } from '../types/ingress';
import {
  PAID_BOOST_TIERS,
  TRUSTED_PAYMENT_METHODS,
  validatePaidBoostRequest,
  type PaidBoostTierId,
  type PaidPaymentMethod,
} from '../utils/paidBoost';

interface PaidFollowerBoostModalProps {
  open: boolean;
  defaultHandle: string;
  draftOrders: PaidBoostDraftOrder[];
  onClose: () => void;
  onSaveDraftOrder: (order: PaidBoostDraftOrder) => void;
  onRemoveDraftOrder: (id: string) => void;
}

export function PaidFollowerBoostModal({
  open,
  defaultHandle,
  draftOrders,
  onClose,
  onSaveDraftOrder,
  onRemoveDraftOrder,
}: PaidFollowerBoostModalProps) {
  const [selectedTierId, setSelectedTierId] = useState<PaidBoostTierId>('growth');
  const [selectedMethod, setSelectedMethod] = useState<PaidPaymentMethod>('stripe_card');
  const [handleInput, setHandleInput] = useState(defaultHandle);
  const [acknowledgedDisclaimer, setAcknowledgedDisclaimer] = useState(false);
  const [stripeConfigured, setStripeConfigured] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [checkoutNotice, setCheckoutNotice] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    if (!open) return;
    setHandleInput(defaultHandle);
    setFormError(null);
    setCheckoutNotice(null);
    setCheckoutUrl(null);
    setSavedFeedback(false);

    let active = true;
    fetch('/api/payments/status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { stripeConfigured?: boolean } | null) => {
        if (active && data && typeof data.stripeConfigured === 'boolean') {
          setStripeConfigured(data.stripeConfigured);
        }
      })
      .catch(() => {
        // Ignore optional status check failure
      });

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      active = false;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, defaultHandle, onClose]);

  if (!open) return null;

  const activeTier =
    PAID_BOOST_TIERS.find((tier) => tier.id === selectedTierId) ?? PAID_BOOST_TIERS[1];
  const activeMethod =
    TRUSTED_PAYMENT_METHODS.find((m) => m.id === selectedMethod) ?? TRUSTED_PAYMENT_METHODS[0];

  function buildDraftObject(
    normalizedHandle: string,
    status: PaidBoostDraftOrder['status']
  ): PaidBoostDraftOrder {
    return {
      id: `boost-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      handle: normalizedHandle,
      tierId: activeTier.id,
      tierName: activeTier.name,
      priceUsd: activeTier.priceUsd,
      expectedRange: `+${activeTier.expectedFollowerMin.toLocaleString('en-US')} – ${activeTier.expectedFollowerMax.toLocaleString('en-US')}`,
      paymentMethodLabel: activeMethod.label,
      status,
      createdAt: new Date().toISOString().slice(0, 10),
    };
  }

  async function handleCheckoutSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCheckoutNotice(null);
    setCheckoutUrl(null);
    setSavedFeedback(false);

    const validation = validatePaidBoostRequest({
      tierId: selectedTierId,
      handle: handleInput,
      paymentMethod: selectedMethod,
      acknowledgedDisclaimer,
    });

    if (!validation.valid) {
      setFormError(validation.error);
      return;
    }

    setFormError(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/payments/paid-boost/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierId: selectedTierId,
          handle: validation.normalizedHandle,
          paymentMethod: selectedMethod,
          acknowledgedDisclaimer: true,
        }),
      });

      const payload = (await response.json()) as {
        checkoutUrl?: string;
        error?: string;
        code?: string;
      };

      if (!response.ok) {
        setCheckoutNotice(
          payload.error || 'Unable to start secure checkout right now. Please try again.'
        );
        return;
      }

      if (payload.checkoutUrl) {
        setCheckoutUrl(payload.checkoutUrl);
        onSaveDraftOrder(buildDraftObject(validation.normalizedHandle, 'Checkout Started'));
        setCheckoutNotice(
          'Secure Stripe Checkout session created. Open the encrypted checkout page below to complete payment.'
        );
      }
    } catch {
      setCheckoutNotice('Could not reach the payment server. Please check your connection and retry.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleSaveDraftOnly() {
    setCheckoutNotice(null);
    const validation = validatePaidBoostRequest({
      tierId: selectedTierId,
      handle: handleInput,
      paymentMethod: selectedMethod,
      acknowledgedDisclaimer: true,
    });
    if (!validation.valid) {
      setFormError(validation.error);
      return;
    }
    setFormError(null);
    onSaveDraftOrder(buildDraftObject(validation.normalizedHandle, 'Draft (Unpaid)'));
    setSavedFeedback(true);
    window.setTimeout(() => setSavedFeedback(false), 2000);
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
        aria-labelledby="paid-boost-modal-title"
        className="w-full max-w-3xl bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden my-auto"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between gap-4 bg-[#F9FAFB]">
          <div>
            <p className="text-xs font-medium text-rose-700">
              Optional Paid Follower Boost · Separate from Free Organic Toolkit
            </p>
            <h2
              id="paid-boost-modal-title"
              className="mt-1 font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-950"
            >
              Accelerate discovery with transparent paid promotion
            </h2>
            <p className="mt-1 text-xs text-slate-600 max-w-2xl">
              Optional paid promotion packages run separately from the $0 Free Organic Follower Toolkit. Review exact pricing, expected follower increase, delivery pace, and safety disclaimers below.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close Paid Follower Boost options"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-950 hover:bg-slate-200/70 rounded-lg cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form
          onSubmit={handleCheckoutSubmit}
          noValidate
          className="p-6 space-y-6 max-h-[82vh] overflow-y-auto"
        >
          {/* Step 1: Select Transparent Pricing Package */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-900">
                1. Choose Promotion Package (One-Time Pricing)
              </p>
              <span className="text-xs text-slate-500">
                Public handle only · No recurring subscription
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {PAID_BOOST_TIERS.map((tier) => {
                const isSelected = tier.id === selectedTierId;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    data-testid={`paid-tier-${tier.id}`}
                    aria-pressed={isSelected}
                    onClick={() => {
                      setSelectedTierId(tier.id);
                      setFormError(null);
                      setCheckoutNotice(null);
                    }}
                    className={`text-left p-4 rounded-xl border transition-colors cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'border-rose-600 bg-rose-50/40'
                        : 'border-slate-200 bg-white hover:border-slate-400'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-500">{tier.audienceLabel}</p>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-display text-base font-bold text-slate-950">
                          {tier.name}
                        </span>
                        <span className="font-mono text-xl font-bold text-slate-950 tabular-nums">
                          ${tier.priceUsd}
                        </span>
                      </div>
                      <p className="font-mono text-xs font-semibold text-emerald-700 tabular-nums">
                        Est. +{tier.expectedFollowerMin.toLocaleString('en-US')} –{' '}
                        {tier.expectedFollowerMax.toLocaleString('en-US')} followers
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200 space-y-1 text-xs text-slate-600">
                      <p className="font-medium text-slate-800">{tier.reachSummary}</p>
                      <p className="text-slate-500">Delivery: {tier.deliveryWindow}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Public Handle & Trusted Payment Method */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-4 border-t border-slate-200">
            <div className="md:col-span-5 space-y-2">
              <label
                htmlFor="paid-boost-handle"
                className="block text-xs font-semibold text-slate-900"
              >
                2. Target Instagram Handle (Public)
              </label>
              <input
                id="paid-boost-handle"
                type="text"
                placeholder="@my_ads_pro"
                value={handleInput}
                onChange={(e) => setHandleInput(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
              />
              <p className="text-xs text-slate-500 leading-relaxed">
                We never ask for your Instagram password. Ensure your account is set to Public during campaign delivery.
              </p>
            </div>

            <div className="md:col-span-7 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-900">
                  3. Trusted Payment Method
                </p>
                <span className="text-xs text-slate-500">
                  {stripeConfigured ? 'Live Stripe Checkout Ready' : 'Hosted Checkout · Secrets Required'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {TRUSTED_PAYMENT_METHODS.map((method) => {
                  const active = method.id === selectedMethod;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`px-3 py-2.5 text-left rounded-lg border text-xs transition-colors cursor-pointer ${
                        active
                          ? 'border-slate-950 bg-slate-950 text-white'
                          : 'border-slate-200 bg-[#F9FAFB] text-slate-800 hover:border-slate-400'
                      }`}
                    >
                      <span className="font-semibold block whitespace-nowrap">{method.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
                <span>{activeMethod.providerNote} · Card data never touches this app.</span>
              </p>
            </div>
          </div>

          {/* Step 3: Safety & Separation Disclaimer */}
          <div className="p-4 bg-[#F9FAFB] border border-slate-200 rounded-xl space-y-3">
            <p className="text-xs font-semibold text-slate-950">
              Safety & Separation Disclaimers
            </p>
            <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-4 leading-relaxed">
              <li>
                <span className="font-medium text-slate-800">Separate from Free Organic Growth:</span>{' '}
                Your 6-habit Free Organic Follower Toolkit and SEO generator remain 100% free with zero purchase required.
              </li>
              <li>
                <span className="font-medium text-slate-800">No Passwords & No Bot Farms:</span>{' '}
                Paid boosts use gradual sponsored discovery pacing ({activeTier.safePacingNote.toLowerCase()}). Never share your Instagram password with any service.
              </li>
              <li>
                <span className="font-medium text-slate-800">Realistic Retention Notice:</span>{' '}
                Estimated ranges (+{activeTier.expectedFollowerMin.toLocaleString('en-US')}–
                {activeTier.expectedFollowerMax.toLocaleString('en-US')} followers over {activeTier.deliveryWindow}) depend on profile bio clarity, content niche match, and ongoing posting cadence.
              </li>
            </ul>

            <label className="flex items-start gap-2.5 pt-2 border-t border-slate-200 cursor-pointer">
              <input
                id="paid-boost-disclaimer"
                type="checkbox"
                checked={acknowledgedDisclaimer}
                onChange={(e) => {
                  setAcknowledgedDisclaimer(e.target.checked);
                  if (e.target.checked) setFormError(null);
                }}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-rose-600 cursor-pointer shrink-0"
              />
              <span className="text-xs font-medium text-slate-800 leading-relaxed">
                I understand this optional paid boost is separate from the Free Organic Follower Toolkit, requires no Instagram password, and uses paced sponsored discovery.
              </span>
            </label>
          </div>

          {/* Validation or Checkout Feedback */}
          {formError && (
            <p role="alert" data-testid="paid-boost-error" className="text-xs font-medium text-rose-700">
              {formError}
            </p>
          )}

          {checkoutNotice && (
            <div
              role="status"
              data-testid="paid-boost-notice"
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                checkoutUrl
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-start gap-2.5 text-xs leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{checkoutNotice}</span>
              </div>
              {checkoutUrl && (
                <a
                  href={checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 whitespace-nowrap shrink-0"
                >
                  <span>Open Stripe Checkout</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              )}
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-slate-600">
              <p className="font-semibold text-slate-950 font-mono tabular-nums">
                {activeTier.name} · ${activeTier.priceUsd}.00 USD one-time
              </p>
              <p>
                Est. +{activeTier.expectedFollowerMin.toLocaleString('en-US')} –{' '}
                {activeTier.expectedFollowerMax.toLocaleString('en-US')} followers · {activeMethod.label}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleSaveDraftOnly}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 whitespace-nowrap cursor-pointer"
              >
                {savedFeedback ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                    <span>Saved Draft</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Save Plan Draft</span>
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={submitting}
                data-testid="paid-boost-checkout-btn"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:opacity-60 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-rose-600 focus-visible:outline-offset-2"
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />
                )}
                <span>Continue to Secure Checkout (${activeTier.priceUsd})</span>
              </button>
            </div>
          </div>

          {/* Saved Draft Boost Plans */}
          {draftOrders.length > 0 && (
            <div className="pt-4 border-t border-slate-200 space-y-2.5">
              <p className="text-xs font-semibold text-slate-900">
                Saved Paid Boost Plans ({draftOrders.length})
              </p>
              <ul className="divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white">
                {draftOrders.map((order) => (
                  <li
                    key={order.id}
                    className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-mono font-semibold text-slate-950 truncate">
                        {order.handle} · {order.tierName} (${order.priceUsd})
                      </p>
                      <p className="text-slate-500">
                        {order.expectedRange} followers · {order.paymentMethodLabel} · {order.status}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove saved boost plan for ${order.handle}`}
                      onClick={() => onRemoveDraftOrder(order.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-700 rounded-md hover:bg-slate-100 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
