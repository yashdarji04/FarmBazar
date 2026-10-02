import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import api from '../services/api';
import AnimatedPage from '../components/AnimatedPage';
import { Carrot, Citrus, Wheat, Milk } from 'lucide-react';
import SEO from '../components/SEO';

// Custom vegetable (carrot) SVG icon
function CarrotIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <SEO title="FarmBazar - Fresh Farm Products Directly From Farmers" description="FarmBazar connects customers directly with local farmers to buy fresh vegetables, fruits, grains, and organic farm products online." />
      <path d="M32 52 C20 44, 14 30, 18 16 C22 8, 36 6, 44 14 C52 22, 50 38, 38 48 Z" fill="#F97316" />
      <path d="M32 52 L28 60 L32 56 L36 60 Z" fill="#EA580C" />
      <path d="M30 16 C26 8, 18 4, 14 10" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <path d="M32 14 C30 4, 36 0, 42 6" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <path d="M34 16 C40 8, 48 8, 48 14" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <path d="M22 24 C28 22, 38 24, 42 28" stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5"/>
      <path d="M20 32 C26 30, 40 32, 44 36" stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5"/>
    </svg>
  );
}

// Custom grain (wheat) SVG icon
function GrainIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="32" y1="58" x2="32" y2="10" stroke="#92400E" strokeWidth="2.5" strokeLinecap="round"/>
      <ellipse cx="32" cy="10" rx="5" ry="7" fill="#D97706"/>
      <ellipse cx="32" cy="10" rx="3" ry="5" fill="#F59E0B"/>
      <ellipse cx="24" cy="20" rx="5" ry="7" fill="#D97706" transform="rotate(-30 24 20)"/>
      <ellipse cx="24" cy="20" rx="3" ry="5" fill="#F59E0B" transform="rotate(-30 24 20)"/>
      <ellipse cx="21" cy="33" rx="5" ry="7" fill="#D97706" transform="rotate(-20 21 33)"/>
      <ellipse cx="21" cy="33" rx="3" ry="5" fill="#F59E0B" transform="rotate(-20 21 33)"/>
      <ellipse cx="22" cy="45" rx="4.5" ry="6" fill="#D97706" transform="rotate(-15 22 45)"/>
      <ellipse cx="22" cy="45" rx="2.5" ry="4" fill="#F59E0B" transform="rotate(-15 22 45)"/>
      <ellipse cx="40" cy="20" rx="5" ry="7" fill="#D97706" transform="rotate(30 40 20)"/>
      <ellipse cx="40" cy="20" rx="3" ry="5" fill="#F59E0B" transform="rotate(30 40 20)"/>
      <ellipse cx="43" cy="33" rx="5" ry="7" fill="#D97706" transform="rotate(20 43 33)"/>
      <ellipse cx="43" cy="33" rx="3" ry="5" fill="#F59E0B" transform="rotate(20 43 33)"/>
      <ellipse cx="42" cy="45" rx="4.5" ry="6" fill="#D97706" transform="rotate(15 42 45)"/>
      <ellipse cx="42" cy="45" rx="2.5" ry="4" fill="#F59E0B" transform="rotate(15 42 45)"/>
      <line x1="32" y1="20" x2="24" y2="20" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="32" y1="33" x2="21" y2="33" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="32" y1="45" x2="22" y2="45" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="32" y1="20" x2="40" y2="20" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="32" y1="33" x2="43" y2="33" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="32" y1="45" x2="42" y2="45" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// Custom fruit (mango) SVG icon
function MangoIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 8 Q36 4 40 6 Q42 7 40 9 Q38 10 36 9 Q34 9 32 12" stroke="#65a30d" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M36 6 Q46 2 48 10 Q46 12 36 10 Z" fill="#4ade80" opacity="0.9"/>
      <line x1="36" y1="6" x2="48" y2="10" stroke="#16a34a" strokeWidth="1" strokeLinecap="round"/>
      <path d="M32 12 C18 14, 10 26, 14 40 C18 52, 28 58, 36 56 C46 54, 54 44, 52 32 C50 20, 42 10, 32 12 Z" fill="#fb923c"/>
      <path d="M28 16 C20 20, 16 30, 18 40 C20 48, 26 54, 32 54 C24 50, 18 40, 20 30 C22 20, 28 16, 36 16 C34 14, 30 14, 28 16 Z" fill="#fbbf24" opacity="0.6"/>
      <path d="M40 18 C48 24, 52 36, 48 46 C52 38, 52 26, 44 18 Z" fill="#ef4444" opacity="0.35"/>
      <ellipse cx="24" cy="28" rx="4" ry="6" fill="white" opacity="0.18" transform="rotate(-20 24 28)"/>
    </svg>
  );
}

// Custom dairy (milk bottle) SVG icon
function MilkIcon({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="25" y="6" width="14" height="6" rx="2" fill="#0284C7" />
      <path d="M24 12 H40 L44 22 V54 C44 57.3 41.3 60 38 60 H26 C22.7 60 20 57.3 20 54 V22 L24 12 Z" fill="#E0F2FE" stroke="#0284C7" strokeWidth="2.5" />
      <path d="M20 32 C24 30, 28 34, 32 32 C36 30, 40 34, 44 32 V54 C44 57.3 41.3 60 38 60 H26 C22.7 60 20 57.3 20 54 V32 Z" fill="#38BDF8" opacity="0.4" />
      <path d="M32 34 C30 37, 28 40, 28 42 C28 44.2 29.8 46 32 46 C34.2 46 36 44.2 36 42 C36 40, 34 37, 32 34 Z" fill="#0284C7" />
    </svg>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal');
    const revealOnScroll = () => {
      const windowHeight = window.innerHeight;
      const elementVisible = 80;
      reveals.forEach((reveal) => {
        const elementTop = reveal.getBoundingClientRect().top;
        if (elementTop < windowHeight - elementVisible) {
          reveal.classList.add('active');
        }
      });
    };
    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll();
    return () => window.removeEventListener('scroll', revealOnScroll);
  }, []);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get('/products?limit=6');
        setFeatured(res.data.data.products || res.data.data || []);
      } catch (error) {
        console.error('Error fetching featured products', error);
      } finally {
        setLoadingFeatured(false);
      }
    };
    fetchFeatured();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/products');
    }
  };

  return (
    <AnimatedPage>
      <main className="min-h-screen bg-background text-on-background">
        
        {/* ── Hero Section ────────────────────────────────────────────── */}
        <section className="relative min-h-[88vh] flex flex-col justify-center pt-36 sm:pt-44 pb-20 overflow-hidden bg-gradient-to-b from-emerald-950 via-[#152e18] to-[#0a170c] text-white">
          {/* Subtle nature mesh & glows */}
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-green-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full my-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Column: Headlines & CTA */}
              <div className="lg:col-span-7 flex flex-col items-start">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-6">
                  <i className="pi pi-verified text-emerald-400 text-xs" />
                  100% Direct From Gujarat Farms
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight mb-6">
                  Harvested Today, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-amber-300">
                    On Your Table Tomorrow
                  </span>
                </h1>

                <p className="text-white/80 text-base sm:text-lg max-w-xl mb-8 leading-relaxed">
                  Cut out the middleman. Buy organic vegetables, sweet fruits, pure grains & dairy directly from local Ahmedabad farmers at honest prices.
                </p>

                {/* Instant Search Bar */}
                <form onSubmit={handleSearch} className="w-full max-w-lg mb-6">
                  <div className="relative flex items-center">
                    <i className="pi pi-search absolute left-4 text-emerald-700 text-base pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search fresh tomatoes, mangoes, milk, wheat..."
                      className="w-full pl-11 pr-32 py-4 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 text-sm shadow-xl shadow-black/20 outline-none focus:ring-4 focus:ring-emerald-500/40 transition-all"
                    />
                    <button
                      type="submit"
                      className="absolute right-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md"
                    >
                      Find Food
                    </button>
                  </div>
                </form>

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => navigate('/products')}
                    className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm transition-all shadow-lg shadow-emerald-950/40 hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    <i className="pi pi-shopping-bag text-sm" />
                    Explore Marketplace
                  </button>

                  <button
                    onClick={() => navigate('/farmers')}
                    className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/20 transition-all hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    <i className="pi pi-users text-sm text-emerald-400" />
                    Meet Local Farmers
                  </button>
                </div>

                {/* Quick Trust Highlights */}
                <div className="mt-10 pt-6 border-t border-white/10 w-full flex flex-wrap items-center gap-6 text-sm text-white/90 font-medium">
                  <div className="flex items-center gap-2">
                    <i className="pi pi-truck text-emerald-400 text-sm" />
                    <span>24-48h Farm Dispatch</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="pi pi-shield text-emerald-400 text-sm" />
                    <span>100% Quality Guaranteed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="pi pi-heart text-rose-400 text-sm" />
                    <span>Fair Pay to Farmers</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Hero Visual Showcase */}
              <div className="lg:col-span-5 relative hidden lg:block">
                <div className="relative mx-auto max-w-md">
                  {/* Main Farm Image Card */}
                  <div className="rounded-3xl overflow-hidden border-4 border-white/20 shadow-2xl shadow-emerald-950/60 aspect-[4/5] relative group">
                    <img
                      src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80"
                      alt="Fresh Harvest Basket"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    
                    {/* Top Tag inside image */}
                    <div className="absolute top-5 left-5">
                      <span className="px-3.5 py-1.5 rounded-full bg-emerald-600/90 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider shadow-md inline-flex items-center gap-1.5">
                        <i className="pi pi-check-circle text-xs text-emerald-200" />
                        Morning Harvest
                      </span>
                    </div>

                    {/* Bottom Info inside image */}
                    <div className="absolute bottom-6 left-6 right-6 text-white">
                      <h3 className="text-xl font-extrabold mb-1 drop-shadow-md">Naturally Grown & Pesticide-Free</h3>
                      <p className="text-xs text-white/90 drop-shadow">Direct from Sanand & Kheda farms to Ahmedabad</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── Featured Categories ─────────────────────────────────────── */}
        <section className="py-16 bg-surface-container-low/60 border-b border-outline-variant/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2 block">
                  Pure & Seasonal
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  Shop By Category
                </h2>
              </div>
              <button
                onClick={() => navigate('/products')}
                className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 flex items-center gap-1.5 transition-colors group"
              >
                <span>View All Produce</span>
                <i className="pi pi-arrow-right text-xs group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[
                { label: 'Vegetables', desc: 'Fresh greens, roots & daily staples', Icon: Carrot, img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80', cat: 'Vegetables' },
                { label: 'Fruits', desc: 'Sweet orchard-picked seasonal fruits', Icon: Citrus, img: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&auto=format&fit=crop&q=80', cat: 'Fruits' },
                { label: 'Grains & Pulses', desc: 'Desi wheat, rice & organic dals', Icon: Wheat, img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80', cat: 'Grains' },
                { label: 'Dairy & Milk', desc: 'Pure Gir cow milk, curd & ghee', Icon: Milk, img: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&auto=format&fit=crop&q=80', cat: 'Dairy' },
              ].map((c) => {
                const IconComp = c.Icon;
                return (
                  <div
                    key={c.label}
                    onClick={() => navigate(`/products?category=${c.cat}`)}
                    className="group relative rounded-3xl overflow-hidden aspect-[4/5] cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 border border-outline-variant/40"
                  >
                    <img
                      src={c.img}
                      alt={c.label}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

                    <div className="absolute inset-0 p-5 flex flex-col justify-between text-white">
                      <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black mb-1">{c.label}</h3>
                        <p className="text-xs text-white/75 line-clamp-1">{c.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Price Comparison "See The Difference" ───────────────────── */}
        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3">
                Fair & Direct Pricing
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-3">
                See How Much You Save
              </h2>
              <p className="text-slate-600 dark:text-white/70 text-sm sm:text-base">
                By removing intermediaries, farmers earn more and you pay less for fresher harvest.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Fresh Vegetables', customIcon: <CarrotIcon className="w-12 h-12" />, iconBg: 'bg-orange-100', shopPrice: '₹50 / kg', ourPrice: '₹35 / kg', saving: 'Save ₹15 / kg', badge: 'Fresh Daily' },
                { label: 'Desi Grains & Dals', customIcon: <GrainIcon className="w-12 h-12" />, iconBg: 'bg-amber-100', shopPrice: '₹65 / kg', ourPrice: '₹48 / kg', saving: 'Save ₹17 / kg', badge: 'Organic Certified' },
                { label: 'Fresh Fruits', customIcon: <MangoIcon className="w-12 h-12" />, iconBg: 'bg-rose-100', shopPrice: '₹80 / kg', ourPrice: '₹60 / kg', saving: 'Save ₹20 / kg', badge: 'Tree Ripened' },
                { label: 'Pure Dairy & Milk', customIcon: <MilkIcon className="w-12 h-12" />, iconBg: 'bg-sky-100', shopPrice: '₹75 / L', ourPrice: '₹58 / L', saving: 'Save ₹17 / L', badge: 'Pure A2 Gir Cow' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-6 rounded-3xl bg-white dark:bg-[#182318] border border-slate-200/80 dark:border-emerald-900/40 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-16 h-16 rounded-2xl ${item.iconBg} flex items-center justify-center shadow-inner`}>
                        {item.customIcon}
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                        {item.badge}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                      {item.label}
                    </h3>

                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between items-center text-sm text-slate-500 dark:text-white/60 pb-2 border-b border-slate-100 dark:border-white/10">
                        <span>Middleman Supermarket:</span>
                        <span className="font-semibold text-slate-700 dark:text-white/80 line-through">{item.shopPrice}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40">
                        <span className="font-bold text-emerald-900 dark:text-emerald-300 text-sm">FarmBazar Direct:</span>
                        <span className="font-black text-emerald-700 dark:text-emerald-400 text-lg">{item.ourPrice}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-600 text-white text-center text-xs font-extrabold tracking-wide uppercase shadow-md shadow-emerald-900/20">
                    {item.saving}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Fresh This Week (Product Grid) ──────────────────────────── */}
        <section className="py-20 bg-surface-container-low/40 border-t border-outline-variant/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2 block">
                  Direct From Field
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  Fresh Harvest This Week
                </h2>
              </div>
              <Button
                label="Browse All 50+ Products"
                icon="pi pi-arrow-right"
                iconPos="right"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-900/20"
                onClick={() => navigate('/products')}
              />
            </div>

            {loadingFeatured ? (
              <div className="flex justify-center py-16">
                <ProgressSpinner strokeWidth="4" style={{ width: '48px', height: '48px' }} />
              </div>
            ) : featured.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-[#182318] rounded-3xl border border-slate-200 dark:border-emerald-900/30">
                <i className="pi pi-inbox text-4xl text-emerald-600 mb-3" />
                <p className="text-slate-600 dark:text-white/70 font-semibold text-base">
                  Fresh harvests are being packed right now. Check back soon!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featured.map((product) => (
                  <div
                    key={product._id}
                    onClick={() => navigate(`/products/${product._id}`)}
                    className="group bg-white dark:bg-[#182318] rounded-3xl border border-slate-200/80 dark:border-emerald-900/30 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      {/* Product Image Box */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-emerald-950/40">
                        <img
                          src={product.images?.[0] || 'https://via.placeholder.com/400x300'}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-md text-[11px] font-bold text-emerald-800 dark:text-emerald-300 shadow-sm">
                          {product.category || 'Organic'}
                        </div>
                        {product.quantity < 10 && (
                          <div className="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                            Limited Stock
                          </div>
                        )}
                      </div>

                      {/* Product Content */}
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors line-clamp-1">
                            {product.name}
                          </h3>
                          <div className="text-right shrink-0">
                            <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                              ₹{product.price}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">/{product.unit || 'kg'}</span>
                          </div>
                        </div>

                        {/* Farmer & Location Badge */}
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-white/60 mb-4">
                          <i className="pi pi-map-marker text-emerald-600" />
                          <span className="font-semibold text-slate-700 dark:text-white/80">
                            {product.farmerId?.farmName || 'Ahmedabad Partner Farm'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-white/60 line-clamp-2 leading-relaxed">
                          {product.description || 'Purely harvested without synthetic chemical pesticides.'}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <i className="pi pi-check-circle text-xs" />
                        In Stock ({product.quantity || 1} {product.unit || 'units'})
                      </span>
                      <button className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-600 hover:text-white text-emerald-800 dark:text-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm">
                        <i className="pi pi-shopping-bag text-xs" />
                        Order Fresh
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── 4-Step Farm-to-Table Journey ───────────────────────────── */}
        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2 block">
                Direct & Transparent
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-3">
                How FarmBazar Works
              </h2>
              <p className="text-slate-600 dark:text-white/70 text-sm">
                4 simple steps from the farmer's soil to your kitchen table.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { step: '01', title: 'Local Harvesting', desc: 'Farmers harvest your produce fresh on order confirmation in morning sunlight.', icon: 'pi-leaf' },
                { step: '02', title: 'Quality Inspection', desc: 'Zero chemical residue check & hygienic crate packing at regional farm hubs.', icon: 'pi-shield' },
                { step: '03', title: 'Direct Logistics', desc: 'Cold-chain dispatch directly from Ahmedabad & Gujarat farm roots.', icon: 'pi-truck' },
                { step: '04', title: 'Doorstep Enjoyment', desc: 'Nutrient-rich, delicious meals for your family while supporting local agriculture.', icon: 'pi-heart-fill' },
              ].map((s, idx) => (
                <div key={idx} className="relative p-6 rounded-3xl bg-surface-container-low/50 border border-outline-variant/40 flex flex-col items-start">
                  <span className="text-3xl font-black text-emerald-600/30 mb-3">{s.step}</span>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-lg mb-4 shadow-md shadow-emerald-900/20">
                    <i className={`pi ${s.icon}`} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{s.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-white/70 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
    </AnimatedPage>
  );
}
