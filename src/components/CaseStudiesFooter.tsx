import { CASE_STUDIES } from '../data/seedData';
import { ResilientImage } from './ResilientImage';

export function CaseStudiesFooter() {
  return (
    <>
      <section aria-labelledby="case-studies-heading" className="py-16 lg:py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pb-8 border-b border-slate-200">
            <p className="text-sm font-medium text-slate-500">07. Verified Organic Outcomes</p>
            <h2
              id="case-studies-heading"
              className="mt-1 font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950"
            >
              Before, mechanism, and measurable follower ingress
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {CASE_STUDIES.map((study) => (
              <article
                key={study.id}
                className="flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-[#F9FAFB]"
              >
                <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                  <ResilientImage
                    src={study.imageUrl}
                    alt={study.imageAlt}
                    fallbackTitle={study.handle}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                  <div>
                    <p className="text-xs text-slate-500 font-mono">
                      {study.handle} · {study.timeframe} · {study.niche}
                    </p>
                    <h3 className="mt-2 font-mono text-xl font-semibold text-slate-950 tabular-nums">
                      {study.headlineMetric}
                    </h3>
                    <dl className="mt-4 space-y-2.5 text-xs leading-relaxed">
                      <div>
                        <dt className="font-semibold text-slate-900">Before</dt>
                        <dd className="text-slate-600">{study.beforeState}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-900">Change</dt>
                        <dd className="text-slate-600">{study.changeMade}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-900">Outcome</dt>
                        <dd className="text-slate-800 font-medium">{study.outcome}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="pt-4 border-t border-slate-200 text-xs text-slate-600">
                    <span className="font-semibold text-slate-900">{study.creatorName}</span>
                    <span> · {study.role}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#F9FAFB] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-4">
            <a href="#top" className="font-display text-base font-bold text-slate-950">
              Ingress
            </a>
            <span className="text-xs text-slate-500">
              Organic Instagram audience acquisition & funnel diagnostics
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs">
            <a href="#my-account" className="hover:text-slate-900">
              My Account
            </a>
            <a href="#free-plan" className="hover:text-slate-900">
              Free Toolkit
            </a>
            <a href="#follow-back" className="hover:text-slate-900">
              Follow-Back
            </a>
            <a href="#funnel" className="hover:text-slate-900">
              Growth Funnel
            </a>
            <a href="#audit" className="hover:text-slate-900">
              Strategy Audit
            </a>
            <a href="#trends" className="hover:text-slate-900">
              Trend Radar
            </a>
            <a href="#lab" className="hover:text-slate-900">
              Hook Lab
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
