import { useState } from 'react';
import { ExternalLink, Globe, Loader2, AlertCircle } from 'lucide-react';
import { TREND_TOPIC_PRESETS } from '../data/seedData';
import type { TrendRadarData } from '../types/ingress';

function parseBriefingBlocks(markdown: string): Array<{ type: 'heading' | 'bullet' | 'paragraph'; text: string }> {
  const lines = markdown.split('\n').map((line) => line.trim());
  const blocks: Array<{ type: 'heading' | 'bullet' | 'paragraph'; text: string }> = [];

  for (const line of lines) {
    if (!line) continue;
    if (line.startsWith('## ') || line.startsWith('### ')) {
      blocks.push({ type: 'heading', text: line.replace(/^#{2,3}\s+/, '').replace(/\*\*/g, '') });
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      blocks.push({ type: 'bullet', text: line.replace(/^[-*]\s+/, '').replace(/\*\*/g, '') });
    } else {
      blocks.push({ type: 'paragraph', text: line.replace(/\*\*/g, '') });
    }
  }
  return blocks;
}

export function TrendRadarSection() {
  const [nicheQuery, setNicheQuery] = useState('Instagram Reels algorithm & organic reach');
  const [focusAngle, setFocusAngle] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [data, setData] = useState<TrendRadarData | null>(null);

  async function runTrendScan(nicheToScan: string, angleToScan: string) {
    if (!nicheToScan.trim() || nicheToScan.trim().length < 2) {
      setValidationError('Enter a niche or topic to scan live search signals.');
      return;
    }

    setValidationError(null);
    setApiError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/gemini/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: nicheToScan.trim(),
          focus: angleToScan.trim(),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Trend radar scan failed.');
      }
      setData(payload as TrendRadarData);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Unable to fetch live Google Search trends.');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runTrendScan(nicheQuery, focusAngle);
  }

  const blocks = data ? parseBriefingBlocks(data.briefing) : [];

  return (
    <section id="trends" className="scroll-mt-16 py-16 lg:py-20 border-b border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-slate-200">
          <div>
            <p className="text-sm font-medium text-slate-500">05. Live Google Search Trend Radar</p>
            <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
              Scan live Instagram algorithm shifts and niche formats
            </h2>
          </div>
          <p className="text-sm text-slate-600 max-w-md">
            Grounded directly in live Google Search results so your weekly Reels cadence aligns with current distribution signals.
          </p>
        </div>

        {/* Preset Query Bar */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {TREND_TOPIC_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setNicheQuery(preset.niche);
                setValidationError(null);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap cursor-pointer ${
                nicheQuery === preset.niche
                  ? 'bg-slate-950 text-white border-slate-950'
                  : 'bg-[#F9FAFB] text-slate-700 border-slate-200 hover:border-slate-400'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} noValidate className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-5">
            <label htmlFor="trend-niche" className="block text-sm font-medium text-slate-800 mb-1.5">
              Instagram Niche or Topic
            </label>
            <input
              id="trend-niche"
              type="text"
              placeholder="e.g. Specialty coffee Reels or fitness coaching"
              value={nicheQuery}
              onChange={(e) => setNicheQuery(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
            />
          </div>
          <div className="md:col-span-4">
            <label htmlFor="trend-focus" className="block text-sm font-medium text-slate-800 mb-1.5">
              Specific Angle (Optional)
            </label>
            <input
              id="trend-focus"
              type="text"
              placeholder="e.g. trial reels, carousel audio, DM triggers"
              value={focusAngle}
              onChange={(e) => setFocusAngle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-slate-900"
            />
          </div>
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:opacity-60 transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-rose-600 focus-visible:outline-offset-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Globe className="w-4 h-4" aria-hidden="true" />
              )}
              <span>{loading ? 'Scanning Web...' : 'Scan Live Trends'}</span>
            </button>
          </div>
        </form>

        {validationError && (
          <p role="alert" className="mt-2 text-xs font-medium text-rose-700">
            {validationError}
          </p>
        )}

        {apiError && (
          <div
            role="alert"
            className="mt-6 p-5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-rose-950">Trend Radar Unavailable</p>
              <p className="text-sm text-rose-800 mt-1">{apiError}</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse" aria-busy="true">
            <div className="lg:col-span-8 p-6 border border-slate-200 rounded-xl space-y-4">
              <div className="h-5 w-48 bg-slate-200 rounded" />
              <div className="h-4 w-full bg-slate-100 rounded" />
              <div className="h-4 w-5/6 bg-slate-100 rounded" />
              <div className="h-5 w-56 bg-slate-200 rounded pt-2" />
              <div className="h-4 w-full bg-slate-100 rounded" />
            </div>
            <div className="lg:col-span-4 p-6 border border-slate-200 rounded-xl space-y-3">
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="h-12 bg-slate-100 rounded" />
              <div className="h-12 bg-slate-100 rounded" />
            </div>
          </div>
        )}

        {!loading && !data && !apiError && (
          <div className="mt-8 p-6 border border-slate-200 rounded-xl bg-[#F9FAFB] grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-semibold text-slate-950">01. Live Algorithm Signals</p>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Surfaces current Reels ranking updates, trial Reels experiments, and watch-time priorities from recent web coverage.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">02. High-Retention Niche Formats</p>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Identifies repeatable short-form and carousel structures currently driving non-follower reach in your category.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">03. Verifiable Web Citations</p>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Every trend brief pairs direct source URLs returned by Google Search grounding so you can verify every signal.
              </p>
            </div>
          </div>
        )}

        {!loading && data && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 p-6 border border-slate-200 rounded-xl bg-[#F9FAFB] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-200 text-xs text-slate-500 font-mono">
                <span>{data.modelUsed}</span>
                <span>Updated {new Date(data.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              <div className="space-y-3">
                {blocks.map((block, index) => {
                  if (block.type === 'heading') {
                    return (
                      <h3
                        key={`${block.text}-${index}`}
                        className="font-display text-lg font-bold text-slate-950 pt-2"
                      >
                        {block.text}
                      </h3>
                    );
                  }
                  if (block.type === 'bullet') {
                    return (
                      <p key={`${block.text}-${index}`} className="text-sm text-slate-700 leading-relaxed pl-4 relative">
                        <span className="absolute left-0 text-rose-600 font-bold" aria-hidden="true">
                          ·
                        </span>
                        {block.text}
                      </p>
                    );
                  }
                  return (
                    <p key={`${block.text}-${index}`} className="text-sm text-slate-700 leading-relaxed">
                      {block.text}
                    </p>
                  );
                })}
              </div>
            </div>

            <aside className="lg:col-span-4 border border-slate-200 rounded-xl bg-white p-5 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-950">Verified Web Sources</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Citations retrieved via Google Search grounding
                </p>
              </div>

              {data.sources.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No external web links were returned for this query. Try a broader Instagram trend topic.
                </p>
              ) : (
                <ul className="divide-y divide-slate-200">
                  {data.sources.map((source) => (
                    <li key={source.uri} className="py-3 first:pt-0 last:pb-0">
                      <a
                        href={source.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-start justify-between gap-2 text-sm text-slate-800 hover:text-rose-700"
                      >
                        <span className="font-medium leading-snug line-clamp-2 group-hover:underline">
                          {source.title}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 shrink-0 mt-1" aria-hidden="true" />
                      </a>
                      <p className="text-xs text-slate-400 truncate mt-0.5 font-mono">{source.uri}</p>
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
