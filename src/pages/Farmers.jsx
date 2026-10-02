import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProgressSpinner } from 'primereact/progressspinner';
import api from '../services/api';
import AnimatedPage from '../components/AnimatedPage';
import SEO from '../components/SEO';

const CATEGORY_COLORS = {
  Vegetables: { bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300', dot: 'bg-emerald-500' },
  Fruits:     { bg: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',         dot: 'bg-rose-500' },
  Grains:     { bg: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',     dot: 'bg-amber-500' },
  Dairy:      { bg: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',             dot: 'bg-sky-500' },
  default:    { bg: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300', dot: 'bg-purple-500' },
};

function CategoryBadge({ label }) {
  const style = CATEGORY_COLORS[label] || CATEGORY_COLORS.default;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${style.bg}`}>
      <SEO title="Sell Farm Products Online - FarmBazar Farmer Marketplace" description="Join FarmBazar as a farmer and sell your fresh farm products directly to customers online." />
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {label}
    </span>
  );
}

export const getFallbackImage = (categories, width = 600) => {
  const cats = categories || [];
  const hasGrains = cats.some(c => c.toLowerCase().includes('grain') || c.toLowerCase().includes('wheat'));
  const hasDairy = cats.some(c => c.toLowerCase().includes('dairy') || c.toLowerCase().includes('milk'));
  const hasFruits = cats.some(c => c.toLowerCase().includes('fruit'));
  const hasVegetables = cats.some(c => c.toLowerCase().includes('vegetable'));
  
  let url = 'https://images.unsplash.com/photo-1464226184884-fa280b87c399'; // Default lush green field
  
  if (hasGrains && hasDairy) url = 'https://images.unsplash.com/photo-1500595046743-cd271d694d30'; // Farmland with cows/wheat vibe
  else if (hasFruits && hasVegetables) url = 'https://images.unsplash.com/photo-1488459716781-31db52582fe9'; // Mixed farmer's market fresh produce
  else if (hasGrains) url = 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b'; // Wheat field
  else if (hasDairy) url = 'https://images.unsplash.com/photo-1528498033373-3c6c08e93d79'; // Dairy cows in field
  else if (hasVegetables) url = 'https://images.unsplash.com/photo-1592982537447-6f2334cb45cb'; // Vegetables
  else if (hasFruits) url = 'https://images.unsplash.com/photo-1610832958506-aa56368176cf'; // Fruits
  
  return `${url}?w=${width}&auto=format&fit=crop&q=80`;
};

export default function Farmers() {
  const navigate = useNavigate();
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchFarmers = async () => {
      try {
        const { data } = await api.get('/users/farmers');
        setFarmers(data.data || []);
      } catch (err) {
        console.error('Error loading farmers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFarmers();
  }, []);

  const allCategories = ['All', ...new Set(farmers.flatMap((f) => f.categories || []).filter(Boolean))];

  const filtered = farmers.filter((farmer) => {
    const matchesSearch =
      !search ||
      farmer.farmName?.toLowerCase().includes(search.toLowerCase()) ||
      farmer.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
      farmer.city?.toLowerCase().includes(search.toLowerCase()) ||
      farmer.state?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === 'All' ||
      (farmer.categories || []).includes(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  return (
    <AnimatedPage>
      <main className="min-h-screen bg-background text-on-background pt-[104px] pb-20">
        
        {/* ── Hero Section ────────────────────────────────────────────── */}
        <section className="relative py-20 overflow-hidden bg-gradient-to-b from-emerald-950 via-[#152e18] to-background text-white border-b border-white/10">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-green-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider border border-emerald-400/30">
              <i className="pi pi-verified text-emerald-400 text-xs" />
              Direct From Local Growers
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
              Meet the Farmers Behind <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-amber-300">
                Your Fresh Table
              </span>
            </h1>

            <p className="text-sm sm:text-base text-white/80 max-w-2xl mx-auto mb-8 leading-relaxed">
              Every harvest at FarmBazar connects you to verified farmers in Ahmedabad, Sanand, Kheda & across Gujarat with 100% transparent origins.
            </p>

            {/* Search Input */}
            <div className="relative max-w-md mx-auto">
              <i className="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search farm name, grower, or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 text-sm shadow-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>
        </section>

        {/* ── Filter Bar ──────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20 scale-105'
                      : 'bg-white dark:bg-[#182318] text-slate-700 dark:text-white/70 border border-slate-200 dark:border-emerald-900/30 hover:bg-emerald-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <p className="text-xs font-semibold text-slate-500">
              Showing <span className="font-bold text-slate-900 dark:text-white">{filtered.length}</span> verified farms
            </p>
          </div>

          {/* ── Farmers Grid ───────────────────────────────────────────── */}
          {loading ? (
            <div className="flex justify-center py-20">
              <ProgressSpinner strokeWidth="4" style={{ width: '48px', height: '48px' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-[#182318] rounded-3xl border border-slate-200 dark:border-emerald-900/30 max-w-lg mx-auto p-8">
              <i className="pi pi-users text-4xl text-slate-400 mb-3 block" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No farmers found</h3>
              <p className="text-xs text-slate-500">Try resetting your search or category filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((f) => (
                <div
                  key={f._id}
                  onClick={() => navigate(`/farmer/${f._id}`)}
                  className="group bg-white dark:bg-[#182318] rounded-3xl border border-slate-200/80 dark:border-emerald-900/30 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Cover photo */}
                    <div className="relative h-44 bg-slate-100 dark:bg-emerald-950/40 overflow-hidden">
                      <img
                        src={f.coverImage || f.farmImage || getFallbackImage(f.categories)}
                        alt={f.farmName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      
                      <div className="absolute top-3.5 right-3.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm flex items-center gap-1">
                        <i className="pi pi-check-circle text-[9px]" /> Verified
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="p-6 pt-7">
                      <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors mb-1">
                        {f.farmName}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-white/60 mb-3">
                        Grown by <strong className="text-slate-800 dark:text-white">{f.ownerName || 'Partner Farmer'}</strong>
                      </p>

                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-white/70 mb-4">
                        <i className="pi pi-map-marker text-emerald-600" />
                        <span>{f.city || 'Ahmedabad'}, {f.state || 'Gujarat'}</span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-white/60 line-clamp-2 leading-relaxed mb-4">
                        {f.bio || f.farmDescription || 'Dedicated to sustainable, regenerative agriculture and direct community supplies.'}
                      </p>

                      {/* Categories Badges */}
                      <div className="flex flex-wrap gap-1.5">
                        {(f.categories && f.categories.length > 0 ? f.categories.filter(Boolean) : ['Vegetables', 'Organic']).map((c) => (
                          <CategoryBadge key={c} label={c} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="p-6 pt-0">
                    <button className="w-full py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 group-hover:bg-emerald-600 group-hover:text-white text-emerald-800 dark:text-emerald-300 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm">
                      <span>View Farm & Fresh Produce</span>
                      <i className="pi pi-arrow-right text-[10px]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </AnimatedPage>
  );
}
