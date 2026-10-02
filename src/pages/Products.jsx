import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import toast from 'react-hot-toast';
import api from '../services/api';
import AnimatedPage from '../components/AnimatedPage';
import SEO from '../components/SEO';

const sortOptions = [
  { label: 'Recommended', value: 'Recommended' },
  { label: 'Price: Low to High', value: 'Price: Low to High' },
  { label: 'Price: High to Low', value: 'Price: High to Low' },
  { label: 'Newest Arrivals', value: 'Newest Arrivals' }
];

const ALL_PRODUCE = 'All Produce';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([ALL_PRODUCE]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState([ALL_PRODUCE]);
  const [sortValue, setSortValue] = useState('Recommended');
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) setSelectedCategories([categoryParam]);
    const queryParam = searchParams.get('search');
    if (queryParam) setSearchTerm(queryParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get('/products?limit=100'),
          api.get('/categories')
        ]);
        setProducts(prodRes.data.data.products || prodRes.data.data || []);
        const dbCategories = catRes.data.data || [];
        setCategories([ALL_PRODUCE, ...dbCategories]);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const addToCart = async (productId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Please sign in to add items to your cart.');
      navigate('/login');
      return;
    }
    if (user.role !== 'customer') {
      toast.error('Only customer accounts can place orders.');
      return;
    }
    try {
      await api.post('/cart', { productId, quantity: 1 });
      toast.success('Added to fresh harvest cart!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error adding to cart');
    }
  };

  const onCategoryToggle = (cat) => {
    let _selected = [...selectedCategories];
    if (cat === ALL_PRODUCE) {
      _selected = [ALL_PRODUCE];
    } else {
      if (_selected.includes(cat)) {
        _selected = _selected.filter(c => c !== cat);
        if (_selected.length === 0) _selected = [ALL_PRODUCE];
      } else {
        _selected = _selected.filter(c => c !== ALL_PRODUCE);
        _selected.push(cat);
      }
    }
    setSelectedCategories(_selected);
  };

  const clearFilters = () => {
    setSelectedCategories([ALL_PRODUCE]);
    setSortValue('Recommended');
    setSearchTerm('');
  };

  const categoryCounts = useMemo(() => {
    const counts = {};
    products.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    counts[ALL_PRODUCE] = products.length;
    return counts;
  }, [products]);

  const visibleProducts = useMemo(() => {
    let list = [...products];

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      list = list.filter(p =>
        p.name?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term) ||
        p.farmerId?.farmName?.toLowerCase().includes(term) ||
        p.city?.toLowerCase().includes(term)
      );
    }

    if (!selectedCategories.includes(ALL_PRODUCE)) {
      list = list.filter(p => selectedCategories.includes(p.category));
    }

    switch (sortValue) {
      case 'Price: Low to High':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'Price: High to Low':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'Newest Arrivals':
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        break;
    }

    return list;
  }, [products, searchTerm, selectedCategories, sortValue]);

  return (
    <AnimatedPage>
      <SEO title="Buy Fresh Farm Products Online - FarmBazar" description="Explore fresh vegetables, fruits, grains, and organic products from trusted local farmers on FarmBazar." />
      <main className="min-h-screen bg-background text-on-background pt-[104px] pb-20">
        
        {/* ── Page Header ─────────────────────────────────────────────── */}
        <div className="bg-gradient-to-b from-emerald-900/10 via-surface-container-low/40 to-background py-10 border-b border-outline-variant/30 mb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3">
                  <i className="pi pi-verified" /> Verified Farm Direct
                </span>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  Fresh Produce Marketplace
                </h1>
                <p className="text-slate-600 dark:text-white/70 text-sm mt-1 max-w-xl">
                  Order 100% natural, farm-harvested groceries from local growers in Ahmedabad and nearby regions.
                </p>
              </div>

              {/* Search Box */}
              <div className="relative w-full md:w-80">
                <i className="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700 text-sm" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search produce, farms, crops..."
                  className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white dark:bg-[#182318] border border-slate-200 dark:border-emerald-900/40 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    <i className="pi pi-times text-xs" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Filter Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pt-6 pb-2 no-scrollbar">
              {categories.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => onCategoryToggle(cat)}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20 scale-105'
                        : 'bg-white dark:bg-[#182318] text-slate-700 dark:text-white/70 border border-slate-200 dark:border-emerald-900/30 hover:bg-emerald-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/60'}`}>
                      {categoryCounts[cat] || 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Main Catalog Grid & Controls ────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-100 dark:border-white/5">
            <p className="text-xs font-semibold text-slate-500 dark:text-white/60">
              Showing <span className="text-slate-900 dark:text-white font-bold">{visibleProducts.length}</span> fresh harvest items
            </p>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 dark:text-white/60 font-medium">Sort by:</span>
              <Dropdown
                value={sortValue}
                onChange={(e) => setSortValue(e.value)}
                options={sortOptions}
                className="bg-white dark:bg-[#182318] border border-slate-200 dark:border-emerald-900/40 rounded-xl text-xs font-bold text-emerald-800 shadow-sm"
              />
              {(searchTerm || !selectedCategories.includes(ALL_PRODUCE)) && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors flex items-center gap-1"
                >
                  <i className="pi pi-refresh text-xs" />
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <i className="pi pi-spin pi-spinner text-4xl text-emerald-600 mb-3" />
              <p className="text-sm font-semibold text-slate-500">Harvesting fresh produce for you...</p>
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-[#182318] rounded-3xl border border-slate-200 dark:border-emerald-900/30 p-8 max-w-lg mx-auto">
              <i className="pi pi-search text-4xl text-slate-400 mb-3 block" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No produce found</h3>
              <p className="text-xs text-slate-500 dark:text-white/60 mb-6">
                Try searching for another vegetable, fruit, or reset the filters to see all available produce.
              </p>
              <button
                onClick={clearFilters}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md hover:bg-emerald-700 transition-all"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {visibleProducts.map((product) => (
                <div
                  key={product._id}
                  onClick={() => navigate(`/products/${product._id}`)}
                  className="group bg-white dark:bg-[#182318] rounded-3xl border border-slate-200/80 dark:border-emerald-900/30 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Image Area */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-emerald-950/30">
                      <img
                        src={product.images?.[0] || 'https://via.placeholder.com/400x300'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-md text-[10px] font-bold text-emerald-800 dark:text-emerald-300 shadow-sm">
                        {product.category || 'Organic'}
                      </div>
                      {product.quantity < 5 && (
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                          Only {product.quantity} left
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors line-clamp-1">
                          {product.name}
                        </h3>
                        <div className="text-right shrink-0">
                          <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                            ₹{product.price}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">/{product.unit || 'kg'}</span>
                        </div>
                      </div>

                      {/* Farmer Info */}
                      <p className="text-xs text-slate-500 dark:text-white/60 flex items-center gap-1.5 mb-2">
                        <i className="pi pi-shop text-emerald-600 text-xs" />
                        <span className="font-semibold text-slate-700 dark:text-white/80 truncate">
                          {product.farmerId?.farmName || 'Gujarat Partner Farm'}
                        </span>
                      </p>

                      {/* Location & Rating */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-white/50 pt-2 border-t border-slate-100 dark:border-white/5">
                        <span className="flex items-center gap-1">
                          <i className="pi pi-map-marker text-emerald-600" />
                          {product.city || 'Ahmedabad Area'}
                        </span>
                        <span className="flex items-center gap-1 text-amber-500 font-bold">
                          <i className="pi pi-star-fill text-[10px]" />
                          {product.rating > 0 ? Number(product.rating).toFixed(1) : 'New'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Add to Cart Footer */}
                  <div className="p-4 pt-0">
                    <button
                      onClick={(e) => addToCart(product._id, e)}
                      className="w-full py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-600 hover:text-white text-emerald-800 dark:text-emerald-300 text-xs font-bold transition-all flex items-center justify-center gap-2 border border-emerald-200/50 dark:border-emerald-800/40 shadow-sm"
                    >
                      <i className="pi pi-shopping-cart text-xs" />
                      Add to Cart
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
