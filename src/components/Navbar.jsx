import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import { Carrot, Citrus, Wheat, Milk, Bell, Check, Trash2, Clock } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import api from '../services/api';
import { useNotifications } from '../context/NotificationContext';

// Time-ago helper
function getTimeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const [cartCount, setCartCount] = useState(0);
  
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  const {
    notifications: notifList,
    unreadCount: notifUnreadCount,
    loading: notifLoading,
    markAsRead: notifMarkAsRead,
    markAllAsRead: notifMarkAllAsRead,
    deleteNotification: notifDelete,
    clearAll: notifClearAll,
  } = useNotifications();

  const categoryMenuRef = useRef(null);
  const userMenuRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target)) {
        setCategoryDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setCategoryDropdownOpen(false);
    setUserMenuOpen(false);
    setShowNotifications(false);
  }, [location.pathname]);

  // Fetch cart count
  useEffect(() => {
    const fetchCartCount = async () => {
      if (user && user.role === 'customer') {
        try {
          const res = await api.get('/cart');
          const items = res.data?.data?.items || [];
          const count = items.reduce((acc, item) => acc + item.quantity, 0);
          setCartCount(count);
        } catch (err) {
          // ignore
        }
      }
    };
    fetchCartCount();

    window.addEventListener('cartUpdated', fetchCartCount);
    return () => window.removeEventListener('cartUpdated', fetchCartCount);
  }, [user]);

  const getNavLinks = () => {
    if (user?.role === 'admin') {
      return [
        { label: 'Home', path: '/' },
        { label: 'Marketplace', path: '/products' },
        { label: 'Farmers', path: '/farmers' },
        { label: 'Our Story', path: '/about' },
        { label: 'Contact', path: '/contact' },
      ];
    }
    if (user?.role === 'farmer') {
      return [
        { label: 'Home', path: '/' },
        { label: 'Marketplace', path: '/products' },
        { label: 'Our Story', path: '/about' },
        { label: 'Contact', path: '/contact' },
      ];
    }
    return [
      { label: 'Home', path: '/' },
      { label: 'Marketplace', path: '/products' },
      { label: 'Local Farmers', path: '/farmers' },
      { label: 'Our Story', path: '/about' },
      { label: 'Contact', path: '/contact' },
    ];
  };

  const navLinks = getNavLinks();

  const categories = [
    { name: 'Fresh Vegetables', cat: 'Vegetables', Icon: Carrot, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/50' },
    { name: 'Seasonal Fruits', cat: 'Fruits', Icon: Citrus, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/50' },
    { name: 'Organic Grains', cat: 'Grains', Icon: Wheat, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/50' },
    { name: 'Pure Dairy & Milk', cat: 'Dairy', Icon: Milk, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/50' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (navSearch.trim()) {
      navigate(`/products?search=${encodeURIComponent(navSearch.trim())}`);
    } else {
      navigate('/products');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50">
      
      {/* ── Top Announcement Strip ─────────────────────────────────────── */}
      <div className="bg-[#122214] text-white text-[11px] font-medium py-1.5 px-4 sm:px-8 border-b border-emerald-900/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <i className="pi pi-map-marker text-[10px]" />
              <span>Delivering to: <strong className="text-white">Ahmedabad, Gujarat</strong></span>
            </span>
            <span className="hidden md:inline-block text-white/30">|</span>
            <span className="hidden md:flex items-center gap-1.5 text-white/70">
              <i className="pi pi-bolt text-amber-400 text-[10px]" />
              <span>Morning Harvests Dispatched Daily</span>
            </span>
          </div>

          <div className="flex items-center gap-4 text-white/75">
            <span className="hidden sm:inline-block">Free Delivery on Orders Over ₹499</span>
            <span className="text-white/30 hidden sm:inline-block">|</span>
            <a href="tel:+919876543210" className="flex items-center gap-1 hover:text-emerald-400 transition-colors">
              <i className="pi pi-phone text-[10px]" />
              <span>+91 98765 43210</span>
            </a>
          </div>

        </div>
      </div>

      {/* ── Main Navbar ────────────────────────────────────────────────── */}
      <nav className="bg-white/95 dark:bg-[#141f15]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-emerald-900/30 shadow-sm transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-green-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-900/20 group-hover:scale-105 transition-transform">
              <i className="pi pi-shop text-lg" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none mt-1">
                Farm<span className="text-emerald-600 dark:text-emerald-400">Bazar</span>
              </span>
            </div>
          </Link>

          {/* Search Bar in Navbar (Desktop) */}
          <form onSubmit={handleSearch} className="hidden xl:flex items-center relative flex-1 max-w-sm mx-2">
            <i className="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
            <input
              type="text"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder="Search vegetables, fruits, grains..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-transparent hover:border-slate-300 dark:hover:border-white/10 focus:border-emerald-500 focus:bg-white text-xs text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all"
            />
            {navSearch && (
              <button
                type="button"
                onClick={() => setNavSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <i className="pi pi-times text-[10px]" />
              </button>
            )}
          </form>

          {/* Desktop Nav Links */}
          <ul className="hidden lg:flex items-center gap-1">
            
            {/* Category Dropdown Pill */}
            <div className="relative" ref={categoryMenuRef}>
              <button
                onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  categoryDropdownOpen
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-emerald-600'
                }`}
              >
                <i className="pi pi-th-large text-xs" />
                <span>Categories</span>
                <i className={`pi pi-chevron-down text-[9px] transition-transform duration-200 ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {categoryDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 p-2 rounded-2xl bg-white dark:bg-[#182318] border border-slate-200 dark:border-emerald-900/40 shadow-2xl z-50 animate-fadeIn">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5">
                    Browse Fresh Harvest
                  </div>
                  {categories.map((c) => {
                    const IconComponent = c.Icon;
                    return (
                      <button
                        key={c.cat}
                        onClick={() => {
                          navigate(`/products?category=${c.cat}`);
                          setCategoryDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 text-left transition-colors group"
                      >
                        <div className={`w-8 h-8 rounded-xl ${c.bg} ${c.color} flex items-center justify-center shrink-0 shadow-sm`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-emerald-600">
                          {c.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Standard / Role Nav Items */}
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      link.isConsole
                        ? active
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20'
                          : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/80 dark:border-emerald-800/60'
                        : active
                        ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50'
                        : 'text-slate-700 dark:text-white/80 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    {link.isConsole && <i className="pi pi-chart-bar text-xs" />}
                    <span>{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Right Action Icons & User Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Search Toggle for smaller screens */}
            <button
              onClick={() => navigate('/products')}
              className="xl:hidden p-2.5 rounded-xl text-slate-600 dark:text-white/70 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-white/5 transition-all"
              aria-label="Search Produce"
            >
              <i className="pi pi-search text-sm" />
            </button>

            {/* Notification Bell */}
            {user && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2.5 rounded-xl text-slate-600 dark:text-white/70 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-white/5 transition-all"
                  aria-label="Notifications"
                >
                  <i className="pi pi-bell text-sm" />
                  {notifUnreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-sm">
                      {notifUnreadCount > 99 ? '99+' : notifUnreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute right-0 mt-3 w-80 sm:w-96 bg-white/95 dark:bg-[#0f1710]/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-emerald-900/10 dark:shadow-black/40 border border-slate-200/60 dark:border-white/10 overflow-hidden z-50 origin-top-right ring-1 ring-black/5"
                  >
                    <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-gradient-to-r from-slate-50 to-white dark:from-white/5 dark:to-transparent flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <h3 className="font-extrabold text-slate-900 dark:text-white tracking-tight text-sm">Notifications</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {notifUnreadCount > 0 && (
                          <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm shadow-emerald-500/20">
                            {notifUnreadCount} New
                          </span>
                        )}
                        {notifList.length > 0 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); notifMarkAllAsRead(); }}
                            className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-lg"
                          >
                            <Check className="w-3 h-3" /> Mark read
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-[360px] overflow-y-auto custom-scrollbar p-1">
                      {notifLoading ? (
                        <div className="p-8 text-center flex flex-col items-center gap-2">
                          <i className="pi pi-spin pi-spinner text-2xl text-emerald-500"></i>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium animate-pulse">Loading updates...</p>
                        </div>
                      ) : notifList.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {notifList.map((notif, index) => {
                            const iconMap = {
                              'shopping-cart': 'pi-shopping-cart',
                              'package': 'pi-box',
                              'package-check': 'pi-check-circle',
                              'truck': 'pi-truck',
                              'check-circle': 'pi-check-circle',
                              'x-circle': 'pi-times-circle',
                              'star': 'pi-star',
                              'mail': 'pi-envelope',
                              'user-plus': 'pi-user-plus',
                              'bell': 'pi-bell',
                            };
                            const colorMap = {
                              emerald: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-500/30',
                              blue: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-200/50 dark:border-blue-500/30',
                              red: 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-300 border-red-200/50 dark:border-red-500/30',
                              amber: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-200/50 dark:border-amber-500/30',
                              orange: 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-300 border-orange-200/50 dark:border-orange-500/30',
                              indigo: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border-indigo-200/50 dark:border-indigo-500/30',
                              violet: 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300 border-violet-200/50 dark:border-violet-500/30',
                            };
                            const piIcon = iconMap[notif.icon] || 'pi-bell';
                            const colorClass = colorMap[notif.color] || colorMap.blue;
                            const timeAgo = getTimeAgo(notif.createdAt);

                            return (
                              <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.04, duration: 0.2 }}
                                key={notif._id} 
                                onClick={() => {
                                  if (!notif.isRead) notifMarkAsRead(notif._id);
                                  if (notif.link) {
                                    setShowNotifications(false);
                                    navigate(notif.link);
                                  }
                                }}
                                className={`group relative p-3.5 rounded-2xl transition-all cursor-pointer flex gap-3.5 border ${
                                  !notif.isRead 
                                    ? 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 shadow-sm' 
                                    : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                                }`}
                              >
                                {!notif.isRead && (
                                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-r-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                )}
                                <div className={`w-10 h-10 rounded-xl border ${colorClass} flex items-center justify-center shrink-0 shadow-inner`}>
                                  <i className={`pi ${piIcon} text-base`}></i>
                                </div>
                                <div className="flex-1 min-w-0 pr-6">
                                  <p className={`text-xs leading-snug ${!notif.isRead ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                                    {notif.title}
                                  </p>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                    {notif.message}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-2 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                                    <Clock className="w-3 h-3" />
                                    {timeAgo}
                                  </div>
                                </div>
                                
                                {/* Delete button appears on hover */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    notifDelete(notif._id);
                                  }}
                                  className="absolute right-3 top-3.5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-all p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
                                  title="Delete notification"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </motion.div>
                            );
                          })}
                        </div>
                      ) : (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="py-12 px-6 text-center flex flex-col items-center"
                        >
                          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center text-emerald-500 dark:text-emerald-400 mb-4 shadow-inner">
                            <Bell className="w-8 h-8 opacity-50" />
                          </div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-1">You're all caught up!</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">When you receive notifications, they'll appear here.</p>
                        </motion.div>
                      )}
                    </div>
                    {notifList.length > 0 && (
                      <div className="p-3 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20 flex justify-center items-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            notifClearAll();
                          }}
                          className="w-full text-xs font-bold text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center justify-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Clear all notifications
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            )}

            {/* Cart Button (Only for Customers / Guests) */}
            {(!user || user.role === 'customer') && (
              <button
                onClick={() => navigate('/cart')}
                className="relative px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold transition-all border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-2 shadow-sm"
                title="View Cart"
              >
                <i className="pi pi-shopping-bag text-sm" />
                <span className="hidden sm:inline-block">Basket</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-sm">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* Quick Console link for Farmer / Admin */}
            {user?.role === 'admin' && (
              <Link
                to="/dashboard/admin"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-900/10 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40 text-xs font-extrabold hover:bg-emerald-900/20 transition-all"
              >
                <i className="pi pi-shield text-xs text-emerald-600" />
                <span>Admin Dashboard</span>
              </Link>
            )}
            {user?.role === 'farmer' && (
              <Link
                to="/dashboard/farmer"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-900/10 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40 text-xs font-extrabold hover:bg-emerald-900/20 transition-all"
              >
                <i className="pi pi-sparkles text-xs text-emerald-600" />
                <span>Farmer Hub</span>
              </Link>
            )}

            {/* User Profile / Auth Action */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 transition-all border border-slate-200/60 dark:border-white/10"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[90px] leading-tight">
                      {user.name?.split(' ')[0]}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 capitalize">
                      {user.role}
                    </span>
                  </div>
                  <i className={`pi pi-chevron-down text-[8px] text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* User Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 p-2 rounded-2xl bg-white dark:bg-[#182318] border border-slate-200 dark:border-emerald-900/40 shadow-2xl z-50 animate-fadeIn">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5 mb-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        {user.role} Portal
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        navigate(user.role === 'farmer' ? '/dashboard/farmer' : user.role === 'admin' ? '/dashboard/admin' : '/dashboard/customer');
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-white/80 hover:bg-emerald-50 dark:hover:bg-white/5 hover:text-emerald-600 transition-colors text-left"
                    >
                      <i className="pi pi-chart-bar text-emerald-600" />
                      <span>{user.role === 'admin' ? 'Admin Dashboard' : user.role === 'farmer' ? 'Farmer Dashboard' : 'My Dashboard'}</span>
                    </button>

                    {user.role === 'customer' && (
                      <button
                        onClick={() => {
                          navigate('/track-order');
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-white/80 hover:bg-emerald-50 dark:hover:bg-white/5 hover:text-emerald-600 transition-colors text-left"
                      >
                        <i className="pi pi-truck text-emerald-600" />
                        <span>Track Orders</span>
                      </button>
                    )}

                    <div className="border-t border-slate-100 dark:border-white/5 my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left"
                    >
                      <i className="pi pi-sign-out text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-900/20 flex items-center gap-1.5"
                >
                  <i className="pi pi-user text-xs" />
                  <span>Sign In</span>
                </Link>
              </div>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
              aria-label="Toggle Menu"
            >
              <i className={`pi ${mobileMenuOpen ? 'pi-times' : 'pi-bars'} text-lg`} />
            </button>

          </div>

        </div>

        {/* ── Mobile Menu Drawer ────────────────────────────────────────── */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white/98 dark:bg-[#141f15]/98 border-t border-slate-200 dark:border-emerald-900/30 px-4 py-5 shadow-2xl">
            
            {/* Search box inside mobile menu */}
            <form onSubmit={handleSearch} className="relative mb-4">
              <i className="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                placeholder="Search fresh harvest..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              />
            </form>

            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                Pages
              </div>
              {navLinks.filter((link) => !(link.hideForFarmer && user?.role === 'farmer')).map((link) => {
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      active
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <span>{link.label}</span>
                    <i className="pi pi-chevron-right text-[10px]" />
                  </Link>
                );
              })}
            </div>

            {/* Category Shortcuts with Lucide vector icons */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 mb-1">
                Categories
              </div>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((c) => {
                  const IconComponent = c.Icon;
                  return (
                    <button
                      key={c.cat}
                      onClick={() => {
                        navigate(`/products?category=${c.cat}`);
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-white/5 text-left hover:bg-emerald-50 transition-colors"
                    >
                      <div className={`w-7 h-7 rounded-lg ${c.bg} ${c.color} flex items-center justify-center shrink-0`}>
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 dark:text-white">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* User Account / Auth Section in Mobile Menu */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
              {user ? (
                <div className="space-y-1">
                  <div className="px-3 py-1.5 flex items-center gap-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl mb-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{user.name}</p>
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-400 capitalize font-semibold">{user.role} Account</p>
                    </div>
                  </div>

                  <Link
                    to={user.role === 'farmer' ? '/dashboard/farmer' : user.role === 'admin' ? '/dashboard/admin' : '/dashboard/customer'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-white/80 hover:bg-slate-100"
                  >
                    <i className="pi pi-chart-bar text-emerald-600" />
                    <span>My Dashboard</span>
                  </Link>

                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 text-left"
                  >
                    <i className="pi pi-sign-out" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold text-center shadow-md"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white text-xs font-bold text-center"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

          </div>
        )}
      </nav>
    </header>
  );
}
