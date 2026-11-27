import { useMemo, useState } from 'react';
import { Check, Copy, Loader2, Plus, Trash2, AlertCircle } from 'lucide-react';
import { CREATOR_NICHES } from '../data/seedData';
import type {
  ContentQueueItem,
  CreatorNiche,
  HookLabResult,
  QueueCategory,
} from '../types/ingress';

interface HookLabSectionProps {
  queue: ContentQueueItem[];
  onAddQueueItem: (item: Omit<ContentQueueItem, 'id' | 'createdAt' | 'status'>) => void;
  onToggleQueueStatus: (id: string) => void;
  onRemoveQueueItem: (id: string) => void;
}

const VOICE_TONES = ['Direct & Editorial', 'Documentary & Calm', 'Tactical & Data-Backed', 'Conversational'];

export function HookLabSection({
  queue,
  onAddQueueItem,
  onToggleQueueStatus,
  onRemoveQueueItem,
}: HookLabSectionProps) {
  const [topic, setTopic] = useState('How we doubled profile-to-follow conversion by rewriting line 1 of our bio');
  const [niche, setNiche] = useState<CreatorNiche>('Creator & Education');
  const [tone, setTone] = useState(VOICE_TONES[0]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<HookLabResult | null>(null);
  const [activeBioText, setActiveBioText] = useState(
    'Wheel-thrown stoneware in Copenhagen.\nWeekly firing logs & glaze ratios for home potters.\nNext kiln drop: Friday 10:00 CET ↓'
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [queueFilter, setQueueFilter] = useState<'All' | QueueCategory>('All');

  const filteredQueue = useMemo(() => {
    if (queueFilter === 'All') return queue;
    return queue.filter((item) => item.category === queueFilter);
  }, [queue, queueFilter]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim() || topic.trim().length < 3) {
      setValidationError('Enter a Reel or Carousel topic (at least 3 characters).');
      return;
    }

    setValidationError(null);
    setApiError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/gemini/hooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), niche, tone }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to generate hooks right now.');
      }
      const generated = payload.result as HookLabResult;
      setResult(generated);
      if (generated.bioVariants?.[0]?.text) {
        setActiveBioText(generated.bioVariants[0].text);
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Hook generation failed.');
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(id: string, text: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1600);
  }

  const bioLength = activeBioText.length;
  const bioOverLimit = bioLength > 150;

  return (
    <section id="lab" className="scroll-mt-16 py-16 lg:py-20 border-b border-slate-200 bg-[#F9FAFB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-slate-200">
          <div>
            <p className="text-sm font-medium text-slate-500">06. Rapid Hook, Bio & Carousel Lab</p>
            <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
              Draft 0–3 second Reels hooks and conversion bios
            </h2>
          </div>
          <p className="text-sm text-slate-600 max-w-md">
            Generate scroll-stopping openers, test bio character limits in real time, and queue winning scripts for publishing.
          </p>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleGenerate}
          noValidate
          className="mt-8 p-6 bg-white border border-slate-200 rounded-xl grid grid-cols-1 lg:grid-cols-12 gap-4 items-end"
        >
          <div className="lg:col-span-5">
            <label htmlFor="hook-topic" className="block text-sm font-medium text-slate-800 mb-1.5">
              Reel or Carousel Topic
            </label>
            <input
              id="hook-topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="What insight, transformation, or breakdown are you filming?"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
            />
          </div>
          <div className="lg:col-span-3">
            <label htmlFor="hook-niche" className="block text-sm font-medium text-slate-800 mb-1.5">
              Niche
            </label>
            <select
              id="hook-niche"
              value={niche}
              onChange={(e) => setNiche(e.target.value as CreatorNiche)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
            >
              {CREATOR_NICHES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-2">
            <label htmlFor="hook-tone" className="block text-sm font-medium text-slate-800 mb-1.5">
              Editorial Tone
            </label>
            <select
              id="hook-tone"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
            >
              {VOICE_TONES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-slate-950 rounded-lg hover:bg-slate-800 disabled:opacity-60 transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-rose-600 focus-visible:outline-offset-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              <span>{loading ? 'Drafting...' : 'Generate Copy'}</span>
            </button>
          </div>
          {validationError && (
            <p role="alert" className="lg:col-span-12 text-xs font-medium text-rose-700">
              {validationError}
            </p>
          )}
        </form>

        {apiError && (
          <div
            role="alert"
            className="mt-6 p-5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-rose-950">Hook Lab Unavailable</p>
              <p className="text-sm text-rose-800 mt-1">{apiError}</p>
            </div>
          </div>
        )}

        {/* Generated Copy Results */}
        {result && !loading && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Reels Hooks */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="font-display text-lg font-bold text-slate-950">
                0–3 Second Reels Openers
              </h3>
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl bg-white">
                {result.hooks.map((hook, idx) => (
                  <div key={`${hook.angle}-${idx}`} className="p-5 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs font-medium text-rose-700">
                        0{idx + 1}. {hook.angle}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopy(`hook-${idx}`, hook.spokenLine)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-950 cursor-pointer"
                        >
                          {copiedId === `hook-${idx}` ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedId === `hook-${idx}` ? 'Copied' : 'Copy'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onAddQueueItem({
                              category: 'Reels Hook',
                              title: `${hook.angle} Opener`,
                              body: `Visual: ${hook.visualCue} | Spoken: "${hook.spokenLine}"`,
                              niche,
                            })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-900 bg-slate-100 rounded-md hover:bg-slate-200 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Queue</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-slate-950">“{hook.spokenLine}”</p>
                    <p className="text-xs text-slate-600">
                      <span className="font-medium text-slate-800">Visual cue:</span> {hook.visualCue}
                    </p>
                    <p className="text-xs text-slate-500">Why it holds: {hook.retentionWhy}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Carousel Outline & Bio Variants */}
            <div className="lg:col-span-5 space-y-6">
              <div className="border border-slate-200 rounded-xl bg-white p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-base font-bold text-slate-950">
                    5-Slide Save-Optimized Carousel
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      onAddQueueItem({
                        category: 'Carousel',
                        title: topic.slice(0, 64),
                        body: result.carouselSlides
                          .map((s) => `Slide ${s.slideNumber}: ${s.headline} — ${s.body}`)
                          .join(' | '),
                        niche,
                      })
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-900 bg-slate-100 rounded-md hover:bg-slate-200 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Queue Deck</span>
                  </button>
                </div>
                <ol className="divide-y divide-slate-200">
                  {result.carouselSlides.map((slide) => (
                    <li key={slide.slideNumber} className="py-3 first:pt-0 last:pb-0">
                      <p className="text-xs font-mono text-slate-500">Slide 0{slide.slideNumber}</p>
                      <p className="text-sm font-semibold text-slate-950 mt-0.5">{slide.headline}</p>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{slide.body}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {result.bioVariants?.length > 0 && (
                <div className="border border-slate-200 rounded-xl bg-white p-5 space-y-3">
                  <h3 className="font-display text-base font-bold text-slate-950">Generated Bio Variants</h3>
                  <div className="space-y-3">
                    {result.bioVariants.map((variant, idx) => (
                      <div key={`${variant.style}-${idx}`} className="p-3.5 bg-[#F9FAFB] rounded-lg border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-slate-600">
                            {variant.style} · {variant.text.length}/150 chars
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveBioText(variant.text)}
                            className="text-xs font-semibold text-rose-700 hover:underline cursor-pointer"
                          >
                            Preview Bio
                          </button>
                        </div>
                        <p className="text-xs text-slate-900 whitespace-pre-line">{variant.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Persistent Workspace Row: Live Instagram Bio Sandbox + Publishing Content Queue */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Bio Conversion Sandbox */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-base font-bold text-slate-950">
                Instagram Bio Conversion Sandbox
              </h3>
              <span
                className={`font-mono text-xs font-semibold tabular-nums ${
                  bioOverLimit ? 'text-rose-700' : 'text-slate-500'
                }`}
              >
                {bioLength} / 150 chars
              </span>
            </div>

            <div>
              <label htmlFor="bio-sandbox" className="sr-only">
                Edit Instagram bio preview
              </label>
              <textarea
                id="bio-sandbox"
                rows={4}
                value={activeBioText}
                onChange={(e) => setActiveBioText(e.target.value)}
                className="w-full p-3.5 text-sm bg-[#F9FAFB] border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900 resize-none"
              />
              {bioOverLimit && (
                <p role="alert" className="mt-1 text-xs text-rose-700">
                  Instagram bios truncate at 150 characters. Trim {bioLength - 150} characters.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => handleCopy('bio-sandbox', activeBioText)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                {copiedId === 'bio-sandbox' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                    <span>Copied Bio</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Copy Bio</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={!activeBioText.trim() || bioOverLimit}
                onClick={() =>
                  onAddQueueItem({
                    category: 'Bio',
                    title: 'Profile Bio Rewrite',
                    body: activeBioText.trim(),
                    niche,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-950 rounded-lg hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Save to Queue</span>
              </button>
            </div>
          </div>

          {/* Interactive Content Queue */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-bold text-slate-950">
                  Publishing Content Queue ({queue.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Saved hooks, carousels, and bio tests persist in your browser workspace.
                </p>
              </div>
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
                {(['All', 'Reels Hook', 'Carousel', 'Bio'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setQueueFilter(cat)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      queueFilter === cat
                        ? 'bg-white text-slate-950 shadow-xs'
                        : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {filteredQueue.length === 0 ? (
              <div className="py-10 text-center space-y-2 border-t border-slate-200">
                <p className="text-sm font-medium text-slate-900">No items in this queue view.</p>
                <p className="text-xs text-slate-500">
                  Generate new copy above or switch back to All items.
                </p>
                {queueFilter !== 'All' && (
                  <button
                    type="button"
                    onClick={() => setQueueFilter('All')}
                    className="mt-2 px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 rounded-md hover:bg-slate-200 cursor-pointer"
                  >
                    Show All Items
                  </button>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-slate-200 border-t border-slate-200">
                {filteredQueue.map((item) => (
                  <li key={item.id} className="py-4 first:pt-4 last:pb-0 flex items-start justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                      <p className="text-xs text-slate-500">
                        {item.category} · {item.niche} · {item.createdAt}
                      </p>
                      <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.body}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onToggleQueueStatus(item.id)}
                        className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                          item.status === 'Scheduled'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {item.status}
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete queue item ${item.title}`}
                        onClick={() => onRemoveQueueItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-700 rounded-md hover:bg-slate-100 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
