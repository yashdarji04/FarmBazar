import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, reset, logout } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import AnimatedPage from '../components/AnimatedPage';
import SEO from '../components/SEO';
import {
  Lock,
  Mail,
  ShieldCheck,
  ArrowRight,
  Eye,
  EyeOff,
  ShoppingBag,
  Sprout,
  Shield,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function Login() {
  const [accountType, setAccountType] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    return ['customer', 'farmer', 'admin'].includes(roleParam) ? roleParam : 'customer';
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [googleAccountNotice, setGoogleAccountNotice] = useState(false);
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    // Show backend error message passed via URL (e.g. from Google OAuth mismatch)
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get('error');
    if (urlError) {
      toast.dismiss();
      toast.error(decodeURIComponent(urlError), { id: 'url-error', duration: 6000 });
      // Clean the error out of the URL without a page reload
      window.history.replaceState({}, '', window.location.pathname);
    }
    const roleParam = params.get('role');
    if (roleParam && ['customer', 'farmer', 'admin'].includes(roleParam)) {
      setAccountType(roleParam);
    }
    // If already logged in, redirect to the correct dashboard
    if (user && !isSuccess) {
      if (user.role === 'admin') navigate('/dashboard/admin');
      else if (user.role === 'farmer') navigate('/dashboard/farmer');
      else navigate('/');
    }
  }, []);

  useEffect(() => {
    if (isError) {
      if (message && message.includes('Google Sign-In')) {
        setGoogleAccountNotice(true);
      }
      toast.error(message, { duration: 6000 });
    }
    if (isSuccess && user) {
      toast.dismiss();
      toast.success(`Welcome back, ${user.name?.split(' ')[0] || 'User'}!`, { id: 'login-success' });
      if (user.role === 'admin') navigate('/dashboard/admin');
      else if (user.role === 'farmer') navigate('/dashboard/farmer');
      else navigate('/');
    }
    dispatch(reset());
  }, [user, isError, isSuccess, message, navigate, dispatch, accountType]);

  const onSubmit = (e) => {
    e.preventDefault();
    setGoogleAccountNotice(false);
    const newErrors = {};

    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Please enter a valid email address';

    if (!password) newErrors.password = 'Password is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    // Send the selected role so the backend can enforce it server-side
    const userData = { email, password, rememberMe, role: accountType };
    dispatch(login(userData));
  };

  const handleGoogleLogin = () => {
    const apiBase = '/api';
    window.location.href = `${apiBase}/auth/google?role=${accountType}`;
  };

  return (
    <AnimatedPage>
      <SEO title="Login - FarmBazar" description="Login to your FarmBazar account." />
      <main className="min-h-screen flex w-full bg-[#fbfdf9] dark:bg-[#0f1710] selection:bg-emerald-500 selection:text-white">

        {/* ── Left Side: Botanical Visual Showcase (Desktop) ─────────── */}
        <div className="hidden lg:flex lg:flex-col lg:w-1/2 relative overflow-hidden bg-emerald-950">
          {/* Background image */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1600&auto=format&fit=crop&q=80')"
            }}
          />
          {/* Rich gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/95 via-emerald-950/70 to-emerald-950/40" />

          {/* Glowing orbs */}
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-green-400/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Logo */}
          <div className="relative z-10 p-10 w-full flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-green-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-950/50 group-hover:scale-105 transition-transform">
                <i className="pi pi-shop text-lg font-bold" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                Farm<span className="text-emerald-400">Bazar</span>
              </span>
            </Link>
            <div className="px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Gujarat's Direct Agri Market</span>
            </div>
          </div>

          {/* Bottom Content & Trust Badges */}
          <div className="relative z-10 p-10 mt-auto w-full max-w-lg">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              100% Direct From Farmers
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">
              Fresh Harvests, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-amber-300">
                Zero Middlemen.
              </span>
            </h1>
            <p className="text-white/80 text-sm leading-relaxed mb-8">
              Connect directly with verified farmers from  Ahmedabad. Enjoy soil-to-table freshness within 24 hours.
            </p>

            {/* Micro Highlights Grid */}
            <div className="grid grid-cols-2 gap-3 pt-6 border-t border-white/15 text-xs text-white/90">
              <div className="flex items-center gap-2.5 bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>500+ Verified Farmers</span>
              </div>
              <div className="flex items-center gap-2.5 bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Fair Pricing for All</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Side: Modern Login Form ─────────────────────────── */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-4 sm:px-8 lg:px-12 py-12 relative overflow-y-auto">

          {/* Subtle background ambient mesh */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-100/50 dark:bg-emerald-950/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-green-100/40 dark:bg-green-950/20 rounded-full blur-3xl pointer-events-none" />

          {/* Form Container */}
          <div className="w-full max-w-md relative z-10">

            {/* Header / Logo (Mobile & Desktop) */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <Link to="/" className="lg:hidden flex items-center gap-2 group">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-md">
                    <i className="pi pi-shop text-sm font-bold" />
                  </div>
                  <span className="text-xl font-black text-slate-900 dark:text-white">
                    Farm<span className="text-emerald-600">Bazar</span>
                  </span>
                </Link>
                <Link
                  to="/"
                  className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors ml-auto"
                >
                  <span>Back to home</span>
                  <i className="pi pi-arrow-right text-[10px]" />
                </Link>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Welcome back
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Sign in to your FarmBazar account to continue.
              </p>
            </div>

            {/* Role Switcher Pill Bar */}
            <div className="p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200/80 dark:border-white/10 mb-6 grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => setAccountType('customer')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${accountType === 'customer'
                  ? 'bg-white dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 shadow-sm border border-slate-200/60 dark:border-emerald-800/40'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Customer</span>
              </button>

              <button
                type="button"
                onClick={() => setAccountType('farmer')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${accountType === 'farmer'
                  ? 'bg-white dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 shadow-sm border border-slate-200/60 dark:border-emerald-800/40'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                <Sprout className="w-3.5 h-3.5" />
                <span>Farmer</span>
              </button>

              <button
                type="button"
                onClick={() => setAccountType('admin')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${accountType === 'admin'
                  ? 'bg-white dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 shadow-sm border border-slate-200/60 dark:border-emerald-800/40'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            </div>

            {/* Login Form */}
            <form onSubmit={onSubmit} className="space-y-4">

              {/* Email field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-white/5 border text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all shadow-sm ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-white/10 focus:ring-emerald-500'}`}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-[11px] font-semibold mt-1">{errors.email}</p>}
              </div>

              {/* Password field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300" htmlFor="password">
                    Password
                  </label>
                  <Link
                    to="/contact"
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={`w-full pl-10 pr-11 py-3 rounded-xl bg-white dark:bg-white/5 border text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all shadow-sm ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-white/10 focus:ring-emerald-500'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-[11px] font-semibold mt-1">{errors.password}</p>}
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                  />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Remember me on this device
                  </span>
                </label>
              </div>

              {/* Google Account Alert Notice */}
              {googleAccountNotice && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/50 text-amber-900 dark:text-amber-100 my-2 animate-fade-in shadow-sm">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-1">
                        Google Sign-In Account
                      </h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                        This account was registered via Google. Please click <strong>Continue with Google</strong> below to log in. Once logged in, you can set your password in Account Settings to enable email/password login.
                      </p>
                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
                      >
                        <i className="pi pi-google" /> Continue with Google to Sign In
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-bold shadow-lg shadow-emerald-900/20 hover:shadow-xl hover:shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                {isLoading ? (
                  <>
                    <i className="pi pi-spin pi-spinner text-sm" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to FarmBazar</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>

            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-[#fbfdf9] dark:bg-[#0f1710] text-slate-400 font-medium">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google OAuth Login Button */}
            <div>
              <button
                type="button"
                onClick={handleGoogleLogin}
                id="google-login-btn"
                disabled={accountType === 'admin'}
                className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-800 dark:text-white text-xs font-bold transition-all shadow-sm ${accountType === 'admin' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                title={accountType === 'admin' ? 'Admins must use email and password to log in' : 'Log in with Google'}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>

            {/* Bottom Link to Register */}
            <p className="mt-8 text-center text-xs text-slate-600 dark:text-slate-400">
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline"
              >
                Create an account
              </Link>
            </p>

          </div>
        </div>

      </main>
    </AnimatedPage>
  );
}
