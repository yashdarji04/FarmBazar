import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { completeGoogleSignup } from '../store/slices/authSlice';
import { ShoppingBag, Sprout, Store, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import AnimatedPage from '../components/AnimatedPage';

export default function ChooseRole() {
  const [farmName, setFarmName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // Role is determined at account creation time and encoded in the URL.
  // We do NOT allow the user to change it here — backend enforces this too.
  const params = new URLSearchParams(window.location.search);
  const role = (params.get('role') === 'farmer' || user?.role === 'farmer') ? 'farmer' : 'customer';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {};
      if (role === 'farmer') payload.farmName = farmName || `${user?.name}'s Farm`;
      const result = await dispatch(completeGoogleSignup(payload));
      if (completeGoogleSignup.fulfilled.match(result)) {
        const updatedRole = result.payload.role;
        if (updatedRole === 'farmer') navigate('/dashboard/farmer');
        else navigate('/');
      } else {
        setError(result.payload || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedPage>
      <main className="min-h-screen flex w-full bg-[#fbfdf9] dark:bg-[#0f1710] selection:bg-emerald-500 selection:text-white">
        
        {/* ── Left Side: Botanical Visual Showcase (Desktop) ─────────── */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-emerald-950">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
            style={{ 
              backgroundImage: "url('https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1600&auto=format&fit=crop&q=80')" 
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/95 via-emerald-950/70 to-emerald-950/40" />
          
          <div className="relative z-10 p-10 w-full flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-950/50 group-hover:scale-105 transition-transform">
                <i className="pi pi-shop text-lg font-bold" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                Farm<span className="text-emerald-400">Bazar</span>
              </span>
            </Link>
          </div>

          <div className="relative z-10 p-10 mt-auto w-full max-w-lg">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-4 h-4 text-amber-300" />
              Almost There!
            </div>
            <h1 className="text-3xl font-black text-white leading-tight mb-4">
              Join the FarmBazar <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-amber-300">
                Community.
              </span>
            </h1>
            <p className="text-white/80 text-sm leading-relaxed mb-6">
              Choose whether you are shopping for fresh organic produce for your home or looking to sell fresh harvests directly to families.
            </p>
          </div>
        </div>

        {/* ── Right Side: Choose Role Form ───────────────────────────── */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-4 sm:px-8 lg:px-12 py-12 relative overflow-y-auto">
          
          <div className="w-full max-w-md relative z-10">
            
            {/* Header */}
            <div className="mb-8 text-center sm:text-left">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center mb-4 text-emerald-700 dark:text-emerald-300 shadow-sm overflow-hidden">
                {user?.profileImage && user.profileImage !== 'default.jpg' ? (
                  <img loading="lazy" src={user.profileImage} alt={user?.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-black text-lg">{user?.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Welcome, {user?.name?.split(' ')[0] || 'Friend'}!
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                {role === 'farmer'
                  ? 'You signed in with Google as a Farmer. Add your farm details to finish setup.'
                  : 'You signed in with Google as a Customer. Click below to go to your dashboard.'}
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <i className="pi pi-exclamation-circle text-sm" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Role locked banner */}
              <div className="flex items-center gap-3 p-4 rounded-2xl border-2 border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/50 shadow-md">
                <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
                  {role === 'farmer' ? <Sprout className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-slate-900 dark:text-white">{role === 'farmer' ? 'Farmer' : 'Customer'}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {role === 'farmer'
                      ? 'Sell harvests directly to consumers with zero middlemen.'
                      : 'Buy fresh organic produce directly from local farms.'}
                  </p>
                </div>
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs shrink-0">
                  <i className="pi pi-check text-[10px]" />
                </div>
              </div>

              {/* Farm name input (only for farmer) */}
              {role === 'farmer' && (
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 space-y-2 animate-fadeIn">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300" htmlFor="farm-name">
                    Farm / Store Name <span className="text-slate-400 text-xs font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Store className="w-4 h-4" />
                    </div>
                    <input
                      id="farm-name"
                      type="text"
                      value={farmName}
                      onChange={(e) => setFarmName(e.target.value)}
                      placeholder={`${user?.name || 'My'}'s Farm`}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                id="choose-role-submit"
                disabled={loading}
                className="w-full mt-4 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-bold shadow-lg shadow-emerald-900/20 hover:shadow-xl hover:shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <>
                    <i className="pi pi-spin pi-spinner text-sm" />
                    <span>Setting up your account...</span>
                  </>
                ) : (
                  <>
                    <span>Continue as {role === 'farmer' ? 'Farmer' : 'Customer'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>

            </form>

          </div>
        </div>

      </main>
    </AnimatedPage>
  );
}
