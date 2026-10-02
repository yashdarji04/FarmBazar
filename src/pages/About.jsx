import { useNavigate } from 'react-router-dom';
import AnimatedPage from '../components/AnimatedPage';
import SEO from '../components/SEO';

export default function About() {
  const navigate = useNavigate();

  return (
    <AnimatedPage>
      <SEO title="About Us - FarmBazar" description="Learn more about FarmBazar and our mission to connect farmers directly with customers." />
      <main className="min-h-screen bg-background text-on-background pt-[104px] pb-20">
        
        {/* ── Hero Section ────────────────────────────────────────────── */}
        <section className="relative min-h-[55vh] flex items-center justify-center text-center overflow-hidden bg-gradient-to-b from-emerald-950 via-[#152e18] to-background text-white px-4">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto py-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-5">
              <i className="pi pi-globe text-xs" />
              Our Agricultural Mission
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white mb-6 leading-tight tracking-tight">
              Cultivating Community, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-amber-300">
                One Fresh Harvest at a Time
              </span>
            </h1>

            <p className="text-sm sm:text-base text-white/80 max-w-2xl mx-auto leading-relaxed">
              We bridge the gap between hard-working local Gujarat farmers and modern conscious families, ensuring nutritious, sustainable food is accessible every single day.
            </p>
          </div>
        </section>

        {/* ── Mission & Story ─────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-emerald-900/30 aspect-[4/3] relative group">
              <img
                src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&auto=format&fit=crop&q=80"
                alt="Farmer holding fresh vegetables"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 text-white">
                <p className="text-xs font-bold text-emerald-300 uppercase">Ahmedabad Farming Roots</p>
                <h4 className="text-lg font-black">Directly From Gujarat Growers</h4>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                Why FarmBazar Exists
              </span>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                Rooted in Fairness, Freshness &amp; Soil Integrity
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                Traditional vegetable and grain supply chains take days and involve 4 to 6 middlemen. By the time produce reaches consumer kitchens, nutrient levels have plummeted, and farmers receive less than 30% of what buyers pay.
              </p>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                <strong className="text-slate-800 dark:text-white">FarmBazar changes this equation completely.</strong> We empower farmers to set fair prices and dispatch harvests directly to local doorsteps within 24 to 48 hours.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  { title: 'Zero Middleman Exploitation', desc: 'Farmers receive direct bank transfers with transparent pricing.', icon: 'pi-check-circle' },
                  { title: 'Reduced Carbon Food Miles', desc: 'Sourced from farms right around Ahmedabad, Sanand & Kheda.', icon: 'pi-truck' },
                  { title: 'Regenerative & Natural Farming', desc: 'Encouraging organic soil methods and pesticide-free cultivation.', icon: 'pi-leaf' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3.5 rounded-2xl bg-surface-container-low/60 border border-outline-variant/30">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 text-sm">
                      <i className={`pi ${item.icon}`} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-white/60">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* ── Impact Stats Counter ────────────────────────────────────── */}
        <section className="py-16 bg-surface-container-low/50 border-y border-outline-variant/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="p-6 rounded-3xl bg-white dark:bg-[#182318] border border-slate-200/80 dark:border-emerald-900/30 shadow-sm">
                <div className="text-3xl sm:text-4xl font-black text-emerald-700 dark:text-emerald-400 mb-1">500+</div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Local Farms</div>
                <div className="text-[11px] text-slate-500 mt-1">Partnered across Gujarat</div>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-[#182318] border border-slate-200/80 dark:border-emerald-900/30 shadow-sm">
                <div className="text-3xl sm:text-4xl font-black text-emerald-700 dark:text-emerald-400 mb-1">24-48h</div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Soil to Table</div>
                <div className="text-[11px] text-slate-500 mt-1">Average delivery speed</div>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-[#182318] border border-slate-200/80 dark:border-emerald-900/30 shadow-sm">
                <div className="text-3xl sm:text-4xl font-black text-emerald-700 dark:text-emerald-400 mb-1">10,000+</div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Happy Households</div>
                <div className="text-[11px] text-slate-500 mt-1">Eating organic & fresh</div>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-[#182318] border border-slate-200/80 dark:border-emerald-900/30 shadow-sm">
                <div className="text-3xl sm:text-4xl font-black text-emerald-700 dark:text-emerald-400 mb-1">100%</div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Traceable Origins</div>
                <div className="text-[11px] text-slate-500 mt-1">Know your exact grower</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Community CTA ───────────────────────────────────────────── */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 text-center">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-emerald-900 via-[#19321c] to-[#0f1d12] text-white shadow-2xl border border-emerald-800/40">
            <h2 className="text-2xl sm:text-3xl font-black mb-3">
              Be a Part of the Agriculture Revolution
            </h2>
            <p className="text-white/75 text-xs sm:text-sm max-w-xl mx-auto mb-8 leading-relaxed">
              Whether you are a farming family looking to list your harvest directly or a household that values fresh food, join FarmBazar today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={() => navigate('/products')}
                className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm transition-all shadow-md"
              >
                Shop Fresh Produce
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs sm:text-sm transition-all border border-white/20"
              >
                Join as a Partner Farmer
              </button>
            </div>
          </div>
        </section>

      </main>
    </AnimatedPage>
  );
}
