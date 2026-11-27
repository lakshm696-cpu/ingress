import { useEffect, useState } from 'react';
import { Bookmark, Check, Copy, Loader2, Trash2, AlertCircle } from 'lucide-react';
import { AUDIT_PRESETS, CREATOR_NICHES } from '../data/seedData';
import type { AuditData, AuditFormValues, CreatorNiche, SavedPlaybook } from '../types/ingress';
import { normalizeHandle, validateAuditForm } from '../utils/ingressMath';

interface DeepAuditStudioProps {
  prefillAccount: AuditFormValues | null;
  savedPlaybooks: SavedPlaybook[];
  onSavePlaybook: (playbook: SavedPlaybook) => void;
  onDeletePlaybook: (id: string) => void;
}

export function DeepAuditStudio({
  prefillAccount,
  savedPlaybooks,
  onSavePlaybook,
  onDeletePlaybook,
}: DeepAuditStudioProps) {
  const [values, setValues] = useState<AuditFormValues>({
    handle: '',
    niche: 'Creator & Education',
    followers: 12000,
    weeklyReels: 3,
    currentBio: '',
    growthGoal: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof AuditFormValues, string>>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<{
    handle: string;
    niche: CreatorNiche;
    modelUsed: string;
    generatedAt: string;
    audit: AuditData;
  } | null>(null);
  const [copiedBio, setCopiedBio] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (prefillAccount) {
      setValues(prefillAccount);
      setFieldErrors({});
      setApiError(null);
    }
  }, [prefillAccount]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = validateAuditForm(values);
    if (!validation.valid) {
      setFieldErrors(validation.errors);
      return;
    }

    setFieldErrors({});
    setApiError(null);
    setSavedNotice(false);
    setLoading(true);

    const normalized = normalizeHandle(values.handle);

    try {
      const response = await fetch('/api/gemini/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          handle: normalized,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Audit request failed.');
      }

      setAuditResult({
        handle: normalized,
        niche: values.niche,
        modelUsed: payload.modelUsed || 'High-Thinking Audit',
        generatedAt: payload.generatedAt || new Date().toISOString(),
        audit: payload.audit,
      });
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Unable to complete strategy audit.');
    } finally {
      setLoading(false);
    }
  }

  function handleCopyBio(text: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedBio(true);
    window.setTimeout(() => setCopiedBio(false), 1800);
  }

  function handleSaveCurrentPlaybook() {
    if (!auditResult) return;
    onSavePlaybook({
      id: `pb-${Date.now()}`,
      handle: auditResult.handle,
      niche: auditResult.niche,
      savedAt: new Date().toISOString().slice(0, 10),
      modelUsed: auditResult.modelUsed,
      audit: auditResult.audit,
    });
    setSavedNotice(true);
  }

  return (
    <section id="audit" className="scroll-mt-16 py-16 lg:py-20 border-b border-slate-200 bg-[#F9FAFB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-slate-200">
          <div>
            <p className="text-sm font-medium text-slate-500">04. Deep-Thinking Strategy Audit</p>
            <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
              Diagnose your bio, pillars, and 30-day ingress sprint
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 mr-1">Load example:</span>
            {AUDIT_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setValues(preset.values);
                  setFieldErrors({});
                  setApiError(null);
                }}
                className="px-3 py-1.5 text-xs font-mono font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:border-slate-400 hover:text-slate-950 transition-colors whitespace-nowrap cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Column */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="audit-handle" className="block text-sm font-medium text-slate-800 mb-1.5">
                  Instagram Handle
                </label>
                <input
                  id="audit-handle"
                  type="text"
                  placeholder="@maya.ceramics"
                  value={values.handle}
                  onChange={(e) => setValues((prev) => ({ ...prev, handle: e.target.value }))}
                  aria-invalid={Boolean(fieldErrors.handle)}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                />
                {fieldErrors.handle && (
                  <p role="alert" className="mt-1 text-xs text-rose-700">
                    {fieldErrors.handle}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="audit-niche" className="block text-sm font-medium text-slate-800 mb-1.5">
                  Account Niche
                </label>
                <select
                  id="audit-niche"
                  value={values.niche}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, niche: e.target.value as CreatorNiche }))
                  }
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                >
                  {CREATOR_NICHES.map((niche) => (
                    <option key={niche} value={niche}>
                      {niche}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="audit-followers" className="block text-sm font-medium text-slate-800 mb-1.5">
                  Current Followers
                </label>
                <input
                  id="audit-followers"
                  type="number"
                  min={0}
                  value={values.followers}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, followers: Number(e.target.value) }))
                  }
                  className="w-full px-3.5 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                />
                {fieldErrors.followers && (
                  <p role="alert" className="mt-1 text-xs text-rose-700">
                    {fieldErrors.followers}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="audit-reels" className="block text-sm font-medium text-slate-800 mb-1.5">
                  Weekly Reels Published
                </label>
                <input
                  id="audit-reels"
                  type="number"
                  min={0}
                  max={21}
                  value={values.weeklyReels}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, weeklyReels: Number(e.target.value) }))
                  }
                  className="w-full px-3.5 py-2 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
                />
                {fieldErrors.weeklyReels && (
                  <p role="alert" className="mt-1 text-xs text-rose-700">
                    {fieldErrors.weeklyReels}
                  </p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="audit-bio" className="block text-sm font-medium text-slate-800">
                  Current Instagram Bio
                </label>
                <span className="font-mono text-xs text-slate-500 tabular-nums">
                  {values.currentBio.length} / 150
                </span>
              </div>
              <textarea
                id="audit-bio"
                rows={3}
                placeholder="Paste your exact Instagram bio lines..."
                value={values.currentBio}
                onChange={(e) => setValues((prev) => ({ ...prev, currentBio: e.target.value }))}
                aria-invalid={Boolean(fieldErrors.currentBio)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 resize-y"
              />
              {fieldErrors.currentBio && (
                <p role="alert" className="mt-1 text-xs text-rose-700">
                  {fieldErrors.currentBio}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="audit-goal" className="block text-sm font-medium text-slate-800 mb-1.5">
                90-Day Follower & Conversion Goal
              </label>
              <textarea
                id="audit-goal"
                rows={2}
                placeholder="e.g. Grow from 10K to 25K organic followers and double newsletter signups."
                value={values.growthGoal}
                onChange={(e) => setValues((prev) => ({ ...prev, growthGoal: e.target.value }))}
                aria-invalid={Boolean(fieldErrors.growthGoal)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 resize-y"
              />
              {fieldErrors.growthGoal && (
                <p role="alert" className="mt-1 text-xs text-rose-700">
                  {fieldErrors.growthGoal}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-slate-950 rounded-lg hover:bg-slate-800 disabled:opacity-60 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-rose-600 focus-visible:outline-offset-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              <span>{loading ? 'Running Deep-Thinking Audit...' : 'Generate Deep Growth Audit'}</span>
            </button>

            <p className="text-xs text-slate-500">
              Runs extended high-thinking analysis on bio clarity, pillar mix, and weekly organic cadence.
            </p>
          </form>

          {/* Results Column */}
          <div className="lg:col-span-7 space-y-6">
            {apiError && (
              <div
                role="alert"
                className="p-5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-rose-950">Strategy Audit Unavailable</p>
                  <p className="text-sm text-rose-800 mt-1">{apiError}</p>
                </div>
              </div>
            )}

            {loading && (
              <div
                aria-busy="true"
                aria-label="Generating deep growth audit"
                className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 animate-pulse"
              >
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-slate-200 rounded" />
                  <div className="h-6 w-3/4 bg-slate-200 rounded" />
                  <div className="h-4 w-full bg-slate-100 rounded" />
                </div>
                <div className="h-24 w-full bg-slate-100 rounded-lg" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="h-28 bg-slate-100 rounded-lg" />
                  <div className="h-28 bg-slate-100 rounded-lg" />
                </div>
              </div>
            )}

            {!loading && !auditResult && !apiError && (
              <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-4">
                <h3 className="font-display text-lg font-semibold text-slate-950">
                  What your deep-thinking audit includes
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Select one of the example accounts above or enter your own handle and bio to generate a tailored organic acquisition blueprint.
                </p>
                <ol className="space-y-2.5 text-sm text-slate-700 pt-2 border-t border-slate-100">
                  <li>01. Root-cause diagnosis of your highest-leverage follower bottleneck</li>
                  <li>02. Conversion-rewritten Instagram bio strictly under 150 characters</li>
                  <li>03. Weighted content pillar allocation across Reels and Carousels</li>
                  <li>04. Four-week publishing sprint with measurable weekly targets</li>
                </ol>
              </div>
            )}

            {!loading && auditResult && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-200">
                  <div>
                    <p className="text-xs text-slate-500 font-mono">
                      {auditResult.handle} · {auditResult.niche} · {auditResult.modelUsed}
                    </p>
                    <h3 className="mt-1 font-display text-xl font-bold text-slate-950">
                      {auditResult.audit.primaryBottleneck}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      {auditResult.audit.executiveSummary}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveCurrentPlaybook}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-slate-100 rounded-lg hover:bg-slate-200 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {savedNotice ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                        <span>Saved to Playbooks</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Save Playbook</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Projected Lift & Bio Rewrite */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-5 border-b border-slate-200">
                  <div className="md:col-span-4 space-y-1">
                    <p className="text-xs text-slate-500">Projected 90-Day Lift</p>
                    <p className="font-mono text-lg font-semibold text-rose-600 tabular-nums">
                      {auditResult.audit.projected90DayLift}
                    </p>
                  </div>
                  <div className="md:col-span-8 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-900">
                        Rewritten Bio ({auditResult.audit.optimizedBio.length} chars)
                      </p>
                      <button
                        type="button"
                        onClick={() => handleCopyBio(auditResult.audit.optimizedBio)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-950 cursor-pointer"
                      >
                        {copiedBio ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Copy Bio</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="p-3.5 bg-[#F9FAFB] border border-slate-200 rounded-lg text-sm text-slate-900 whitespace-pre-line">
                      {auditResult.audit.optimizedBio}
                    </p>
                    <p className="text-xs text-slate-500">{auditResult.audit.bioRationale}</p>
                  </div>
                </div>

                {/* Content Pillars */}
                <div className="space-y-3 pb-5 border-b border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-950">Recommended Content Pillar Mix</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {auditResult.audit.contentPillars.map((pillar) => (
                      <div key={pillar.name} className="p-4 bg-[#F9FAFB] rounded-lg border border-slate-200">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-950">{pillar.name}</p>
                          <span className="font-mono text-sm font-semibold text-rose-600 tabular-nums">
                            {pillar.sharePercent}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{pillar.format}</p>
                        <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                          Example: {pillar.exampleTopic}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4-Week Sprint Table */}
                <div className="space-y-3 pb-5 border-b border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-950">30-Day Execution Sprint</h4>
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                    {auditResult.audit.weeklySprint.map((item) => (
                      <div key={item.week} className="p-3.5 grid grid-cols-1 sm:grid-cols-12 gap-2 text-sm">
                        <div className="sm:col-span-2 font-mono text-xs font-semibold text-slate-900 pt-0.5">
                          {item.week}
                        </div>
                        <div className="sm:col-span-7">
                          <p className="font-medium text-slate-900">{item.focus}</p>
                          <p className="text-xs text-slate-600 mt-0.5">{item.deliverables}</p>
                        </div>
                        <div className="sm:col-span-3 sm:text-right font-mono text-xs text-emerald-700 font-medium tabular-nums pt-0.5">
                          {item.metricTarget}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Daily Habits */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-950">Daily Organic Ingress Habits</h4>
                  <ul className="space-y-1.5 text-sm text-slate-700 list-disc pl-5">
                    {auditResult.audit.dailyIngressHabits.map((habit) => (
                      <li key={habit}>{habit}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Saved Playbooks List */}
            {savedPlaybooks.length > 0 && (
              <div className="pt-2 space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Saved Strategy Playbooks ({savedPlaybooks.length})
                </h3>
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl bg-white">
                  {savedPlaybooks.map((pb) => (
                    <div key={pb.id} className="p-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-semibold text-slate-950 truncate">
                          {pb.handle}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {pb.niche} · {pb.savedAt} · {pb.audit.primaryBottleneck}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setAuditResult({
                              handle: pb.handle,
                              niche: pb.niche,
                              modelUsed: pb.modelUsed,
                              generatedAt: pb.savedAt,
                              audit: pb.audit,
                            })
                          }
                          className="px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 rounded-md hover:bg-slate-200 cursor-pointer"
                        >
                          Open
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete saved playbook for ${pb.handle}`}
                          onClick={() => onDeletePlaybook(pb.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-700 rounded-md hover:bg-slate-100 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
