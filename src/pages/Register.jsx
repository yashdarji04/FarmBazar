import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, reset } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import AnimatedPage from '../components/AnimatedPage';
import SEO from '../components/SEO';
import { 
  User, 
  Lock, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  ShoppingBag, 
  Sprout, 
  Store,
  CheckCircle2,
  Sparkles,
  FileText
} from 'lucide-react';

export default function Register() {
  const [accountType, setAccountType] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    return ['customer', 'farmer'].includes(roleParam) ? roleParam : 'customer';
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    farmName: ''
  });
  const [errors, setErrors] = useState({});

  const { firstName, lastName, email, phone, password, address, farmName } = formData;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, isLoading, isError, isSuccess, message } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
    if (isSuccess || user) {
      toast.dismiss();
      toast.success(`Account created successfully! Welcome to FarmBazar.`);
      if (user?.role === 'admin') navigate('/dashboard/admin');
      else if (user?.role === 'farmer') navigate('/dashboard/farmer');
      else navigate('/');
    }
    dispatch(reset());
  }, [user, isError, isSuccess, message, navigate, dispatch]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Please enter a valid email address';
    
    if (!phone) newErrors.phone = 'Phone number is required';
    else if (!/^[0-9]{10}$/.test(phone)) newErrors.phone = 'Please enter a valid 10-digit phone number';

    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters long';

    if (accountType === 'farmer' && (!farmName || !farmName.trim())) {
      newErrors.farmName = 'Farm/Store name is required for farmers';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});

    const userData = {
      name: `${firstName.trim()} ${lastName.trim()}`,
      email: email.trim(),
      password,
      phone: phone.trim(),
      address: address.trim(),
      role: accountType,
      farmName: accountType === 'farmer' ? farmName.trim() : undefined
    };
    dispatch(register(userData));
  };

  const handleGoogleLogin = () => {
    const apiBase = import.meta.env.MODE === 'production' 
      ? 'https://farmbazar-backend-lpu4.onrender.com/api' 
      : '/api';
    window.location.href = `${apiBase}/auth/google?role=${accountType}`;
  };

  return (
    <AnimatedPage>
      <SEO title="Register - FarmBazar" description="Join FarmBazar as a customer or farmer." />
      <main className="min-h-screen flex w-full bg-[#fbfdf9] dark:bg-[#0f1710] selection:bg-emerald-500 selection:text-white">
        
        {/* ── Left Side: Botanical Visual Showcase (Desktop) ─────────── */}
        <div className="hidden lg:flex lg:flex-col lg:w-5/12 relative overflow-hidden bg-emerald-950">
          {/* Background image */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
            style={{ 
              backgroundImage: "url('https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=1600&auto=format&fit=crop&q=80')" 
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
          </div>

          {/* Bottom Content & Trust Badges */}
          <div className="relative z-10 p-10 mt-auto w-full max-w-lg">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-4 h-4 text-amber-300" />
              Join 10,000+ Conscious Families
            </div>

            <h1 className="text-3xl font-black text-white leading-tight mb-4">
              {accountType === 'farmer' ? (
                <>
                  Sell Directly to Families, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-amber-300">
                    Earn 100% Honest Profits.
                  </span>
                </>
              ) : (
                <>
                  Pure Organic Harvests, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-amber-300">
                    Direct From Gujarat Soil.
                  </span>
                </>
              )}
            </h1>
            <p className="text-white/80 text-sm leading-relaxed mb-8">
              {accountType === 'farmer'
                ? 'Get fair market prices without middlemen commissions. Connect directly with households in Ahmedabad, Gandhinagar and across Gujarat.'
                : 'Experience pesticide-free vegetables, sun-ripened seasonal fruits, pure A2 dairy and organic grains harvested fresh every morning.'}
            </p>

            {/* Micro Highlights */}
            <div className="space-y-3 pt-6 border-t border-white/15 text-xs text-white/90">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero commission overhead on basic produce</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Direct farmer-to-doorstep dispatch within 24-48 hours</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Transparent prices & quality verified standards</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Side: Modern Registration Form ─────────────────────── */}
        <div className="w-full lg:w-7/12 flex flex-col justify-center items-center px-4 sm:px-8 lg:px-12 py-10 relative overflow-y-auto">
          
          {/* Ambient glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-100/40 dark:bg-emerald-950/20 rounded-full blur-3xl pointer-events-none" />

          {/* Form Container */}
          <div className="w-full max-w-xl relative z-10 py-4">
            
            {/* Header / Logo */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
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
                Create your account
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Join FarmBazar to explore direct farm produce or list your harvest.
              </p>
            </div>

            {/* Account Type Selector Card */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setAccountType('customer')}
                className={`p-3.5 rounded-2xl border-2 transition-all text-left flex items-center gap-3 relative ${
                  accountType === 'customer'
                    ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-sm'
                    : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-slate-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  accountType === 'customer'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/20'
                    : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                }`}>
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white">Customer</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Buy fresh produce</p>
                </div>
                {accountType === 'customer' && (
                  <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                    <i className="pi pi-check text-[8px]" />
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => setAccountType('farmer')}
                className={`p-3.5 rounded-2xl border-2 transition-all text-left flex items-center gap-3 relative ${
                  accountType === 'farmer'
                    ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-sm'
                    : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-slate-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  accountType === 'farmer'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/20'
                    : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                }`}>
                  <Sprout className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white">Farmer / Seller</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Sell farm harvests</p>
                </div>
                {accountType === 'farmer' && (
                  <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                    <i className="pi pi-check text-[8px]" />
                  </div>
                )}
              </button>
            </div>

            {/* Registration Form */}
            <form onSubmit={onSubmit} className="space-y-4">
              
              {/* First & Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="firstName">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={firstName}
                      onChange={onChange}
                      placeholder="Yash"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all shadow-sm ${errors.firstName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:ring-emerald-500 focus:border-emerald-500'}`}
                    />
                  </div>
                  {errors.firstName && <p className="text-red-500 text-[11px] font-semibold mt-1">{errors.firstName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="lastName">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={lastName}
                      onChange={onChange}
                      placeholder="Darji"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all shadow-sm ${errors.lastName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:ring-emerald-500 focus:border-emerald-500'}`}
                    />
                  </div>
                  {errors.lastName && <p className="text-red-500 text-[11px] font-semibold mt-1">{errors.lastName}</p>}
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="email">
                    Email Address <span className="text-rose-500">*</span>
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
                      onChange={onChange}
                      placeholder="yash@gmail.com"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all shadow-sm ${errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:ring-emerald-500 focus:border-emerald-500'}`}
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-[11px] font-semibold mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="phone">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-stretch">
                    <span className="inline-flex items-center px-3.5 rounded-l-xl bg-slate-100 dark:bg-white/10 border border-r-0 border-slate-200 dark:border-white/10 text-sm font-bold text-slate-600 dark:text-white/70 select-none">+91</span>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => { const val = e.target.value.replace(/\D/g, ''); onChange({ target: { name: 'phone', value: val } }); }}
                      placeholder="9876543210"
                      maxLength={10}
                      required
                      className={`w-full pl-4 pr-4 py-2.5 rounded-r-xl rounded-l-none bg-white dark:bg-white/5 border border-l-0 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all shadow-sm ${errors.phone ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:ring-emerald-500 focus:border-emerald-500'}`}
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-[11px] font-semibold mt-1">{errors.phone}</p>}
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="password">
                  Create Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={onChange}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm"
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
              </div>

              {/* Delivery / Farm Base Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="address">
                  {accountType === 'farmer' ? 'Farm Location & Address' : 'Delivery Address'}
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3.5 pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <textarea
                    id="address"
                    name="address"
                    value={address}
                    onChange={onChange}
                    rows={2}
                    placeholder={accountType === 'farmer' ? 'e.g. Village Sanand, Dist Ahmedabad, Gujarat' : 'e.g. Flat 402, Navrangpura, Ahmedabad'}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm resize-none"
                  />
                </div>
              </div>

              {/* Farmer Specific Card */}
              {accountType === 'farmer' && (
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 space-y-3.5 animate-fadeIn">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
                    <Store className="w-4 h-4 text-emerald-600" />
                    <span>Farm Details</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1" htmlFor="farmName">
                      Farm / Brand Name
                    </label>
                    <input
                      id="farmName"
                      name="farmName"
                      type="text"
                      value={farmName}
                      onChange={onChange}
                      placeholder="Gir Organic Farm or Yash Organics"
                      className={`w-full px-3.5 py-2 rounded-xl bg-white dark:bg-white/5 border text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${errors.farmName ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-white/10 focus:ring-emerald-500'}`}
                    />
                  </div>
                  {errors.farmName && <p className="text-red-500 text-[11px] font-semibold mt-1">{errors.farmName}</p>}

                  <div className="p-3 rounded-xl bg-white/80 dark:bg-white/5 border border-emerald-100 dark:border-emerald-900/30 text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-2">
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      After creating your account, you will be able to upload your organic certification, list crops, and manage stock from your Farmer Hub!
                    </span>
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
                    <span>Creating your account...</span>
                  </>
                ) : (
                  <>
                    <span>Create {accountType === 'farmer' ? 'Farmer' : 'Customer'} Account</span>
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
                  Or register with
                </span>
              </div>
            </div>

            {/* Google OAuth Register Button */}
            <div>
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-800 dark:text-white text-xs font-bold transition-all shadow-sm"
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

            {/* Bottom Link to Login */}
            <p className="mt-6 text-center text-xs text-slate-600 dark:text-slate-400">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline"
              >
                Sign in here
              </Link>
            </p>

            <p className="mt-4 text-center text-[11px] text-slate-400">
              By creating an account, you agree to FarmBazar's{' '}
              <Link to="/terms" className="underline hover:text-emerald-600">Terms</Link> and{' '}
              <Link to="/privacy-policy" className="underline hover:text-emerald-600">Privacy Policy</Link>.
            </p>

          </div>
        </div>

      </main>
    </AnimatedPage>
  );
}
