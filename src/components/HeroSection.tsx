import { ArrowRight } from 'lucide-react';
import { BENCHMARK_METRICS, HERO_STUDIO_IMAGE } from '../data/seedData';
import { ResilientImage } from './ResilientImage';

interface HeroSectionProps {
  activeHandle: string;
  onLaunchAudit: () => void;
  onViewMyAccount: () => void;
}

export function HeroSection({
  activeHandle,
  onLaunchAudit,
  onViewMyAccount,
}: HeroSectionProps) {
  return (
    <section id="top" className="border-b border-slate-200 bg-[#F9FAFB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12 lg:pt-16 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* Left column: Proposition */}
          <div className="lg:col-span-6 flex flex-col justify-between py-1">
            <div>
              <p className="text-sm font-medium text-rose-700 mb-4">
                Free Organic Instagram Follower Growth Studio · Active Profile {activeHandle}
              </p>
              <h1
                className="font-display font-bold tracking-tight text-slate-950 leading-[1.06]"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.65rem)', textWrap: 'balance' }}
              >
                Grow real Instagram followers free with compounding organic ingress.
              </h1>
              <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                Build a zero-dollar daily Reels and Instagram SEO workflow, model your 90-day
                organic follower trajectory, and fix profile-to-follow leaks without bots, fake
                followers, or paid ad spend.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={onViewMyAccount}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 active:scale-[0.99] transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-rose-600 focus-visible:outline-offset-2"
              >
                <span>View {activeHandle}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onLaunchAudit}
                className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 text-sm font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:scale-[0.99] transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-slate-900 focus-visible:outline-offset-2"
              >
                Open Free Growth Toolkit
              </button>
            </div>
          </div>

          {/* Right column: Editorial studio photography */}
          <div className="lg:col-span-6 relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 min-h-[280px] lg:min-h-[410px]">
            <ResilientImage
              src={HERO_STUDIO_IMAGE}
              alt="Sunlit creator production studio with mirrorless cinema camera on tripod and editing desk"
              fallbackTitle="Creator Production Studio"
              className="w-full h-full object-cover lg:absolute lg:inset-0"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/45 to-transparent p-4 sm:p-6 pt-12 sm:pt-16 text-white">
              <p className="font-mono text-sm font-medium text-white/95 tabular-nums">
                +18,400 organic followers in 90 days
              </p>
              <p className="text-xs text-white/80 mt-1">
                @atelier.nord · 12.8% profile-to-follow conversion · Zero paid reach
              </p>
            </div>
          </div>
        </div>

        {/* Full-width 4-column Benchmark Strip below the hero split */}
        <div className="mt-10 pt-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {BENCHMARK_METRICS.map((metric) => (
            <div key={metric.label} className="space-y-1">
              <p className="font-mono text-2xl sm:text-3xl font-semibold text-slate-950 tabular-nums">
                {metric.value}
              </p>
              <p className="text-sm font-semibold text-slate-900">{metric.label}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{metric.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
