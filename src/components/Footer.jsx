import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Carrot, Citrus, Wheat, Milk } from 'lucide-react';

// SVG social icons
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.859L2.25 2.25h6.938l4.27 5.647 4.786-5.647zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
  </svg>
);
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);
const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const quickLinks = [
  { label: 'Shop Products',   to: '/products',  icon: 'pi-shopping-bag' },
  { label: 'Meet Farmers',    to: '/farmers',   icon: 'pi-users' },
  { label: 'About Us',        to: '/about',     icon: 'pi-info-circle' },
  { label: 'Contact Us',      to: '/contact',   icon: 'pi-envelope' },
];

const categories = [
  { label: 'Fresh Vegetables', to: '/products?category=Vegetables', Icon: Carrot },
  { label: 'Fresh Fruits',     to: '/products?category=Fruits',     Icon: Citrus },
  { label: 'Grains & Cereals', to: '/products?category=Grains',     Icon: Wheat },
  { label: 'Dairy Products',   to: '/products?category=Dairy',      Icon: Milk },
];

const stats = [
  { value: '500+', label: 'Farmers' },
  { value: '10K+', label: 'Customers' },
  { value: '50+',  label: 'Cities' },
  { value: '100%', label: 'Fresh' },
];

const socials = [
  { icon: XIcon,         href: 'https://x.com',           label: 'X',         hover: 'hover:bg-black' },
  { icon: InstagramIcon, href: 'https://instagram.com',   label: 'Instagram', hover: 'hover:bg-gradient-to-br hover:from-pink-500 hover:to-orange-400' },
  { icon: LinkedInIcon,  href: 'https://linkedin.com',    label: 'LinkedIn',  hover: 'hover:bg-blue-600' },
  { icon: FacebookIcon,  href: 'https://facebook.com',    label: 'Facebook',  hover: 'hover:bg-[#1877F2]' },
];

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) { setSubscribed(true); setEmail(''); }
  };

  return (
    <footer className="w-full bg-[#1c2b1c] text-white relative overflow-hidden">

      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-900/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-green-900/15 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* ── Main Footer Content ───────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-14 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* ── Brand Column ─────────────────────────────────────────── */}
          <div className="lg:col-span-1">
            {/* Logo */}
            <Link to="/" className="inline-flex items-center gap-2.5 mb-5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center shadow-lg shadow-emerald-900/40 group-hover:shadow-emerald-700/50 transition-shadow">
                <i className="pi pi-shop text-white text-lg" />
              </div>
              <span className="text-2xl font-extrabold tracking-tight">
                Farm<span className="text-emerald-400">Bazar</span>
              </span>
            </Link>

            <p className="text-white/50 text-sm leading-relaxed mb-6">
              Connecting local farmers directly to your table. Fresh, fair, and community-rooted — every single day.
            </p>

            {/* Contact pills */}
            <div className="space-y-2.5 mb-7">
              <a href="mailto:support@farmbazar.com" className="flex items-center gap-2.5 text-sm text-white/50 hover:text-emerald-400 transition-colors group">
                <div className="w-7 h-7 rounded-lg bg-emerald-900/50 flex items-center justify-center group-hover:bg-emerald-800/60 transition-colors">
                  <i className="pi pi-envelope text-emerald-400 text-xs" />
                </div>
                support@farmbazar.com
              </a>
              <a href="tel:+919876543210" className="flex items-center gap-2.5 text-sm text-white/50 hover:text-emerald-400 transition-colors group">
                <div className="w-7 h-7 rounded-lg bg-emerald-900/50 flex items-center justify-center group-hover:bg-emerald-800/60 transition-colors">
                  <i className="pi pi-phone text-emerald-400 text-xs" />
                </div>
                +91 98765 43210
              </a>
              <div className="flex items-center gap-2.5 text-sm text-white/50">
                <div className="w-7 h-7 rounded-lg bg-emerald-900/50 flex items-center justify-center">
                  <i className="pi pi-map-marker text-emerald-400 text-xs" />
                </div>
                Ahmedabad, Gujarat, India
              </div>
            </div>

            {/* Socials */}
            <div className="flex gap-2">
              {socials.map(({ icon: Icon, href, label, hover }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                  className={`w-9 h-9 rounded-xl bg-white/8 text-white/60 flex items-center justify-center transition-all duration-200 ${hover} hover:text-white hover:scale-110`}>
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* ── Quick Links ───────────────────────────────────────────── */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-5 flex items-center gap-2">
              <span className="w-5 h-0.5 bg-emerald-500 rounded-full inline-block" />
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="flex items-center gap-2.5 text-sm text-white/50 hover:text-emerald-400 transition-colors group">
                    <i className={`pi ${l.icon} text-xs text-emerald-700 group-hover:text-emerald-400 transition-colors`} />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Shop Categories ───────────────────────────────────────── */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-5 flex items-center gap-2">
              <span className="w-5 h-0.5 bg-emerald-500 rounded-full inline-block" />
              Categories
            </h3>
            <ul className="space-y-3">
              {categories.map((c) => {
                const IconComponent = c.Icon;
                return (
                  <li key={c.label}>
                    <Link to={c.to} className="flex items-center gap-3 text-sm text-white/50 hover:text-emerald-400 transition-colors group">
                      <div className="w-7 h-7 rounded-lg bg-emerald-900/60 flex items-center justify-center shrink-0 group-hover:bg-emerald-800/80 text-emerald-400 transition-colors">
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      {c.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* ── Newsletter ────────────────────────────────────────────── */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-5 flex items-center gap-2">
              <span className="w-5 h-0.5 bg-emerald-500 rounded-full inline-block" />
              Newsletter
            </h3>
            <p className="text-white/50 text-sm mb-4 leading-relaxed">
              Get fresh deals, seasonal picks & farmer stories — straight to your inbox.
            </p>

            {subscribed ? (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-900/40 border border-emerald-700/40 text-emerald-400 text-sm">
                <i className="pi pi-check-circle" />
                You're subscribed! Thank you
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
                <div className="relative">
                  <i className="pi pi-envelope absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-sm" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-sm text-white placeholder:text-white/35 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
                <button type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white text-sm font-semibold hover:from-emerald-500 hover:to-green-500 transition-all hover:-translate-y-0.5 shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2">
                  <i className="pi pi-send text-xs" />
                  Subscribe Now
                </button>
              </form>
            )}

            {/* App badges placeholder */}
            <div className="mt-5 flex gap-2">
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/6 border border-white/10 text-xs text-white/50">
                <i className="pi pi-apple text-sm" /> App Store
              </div>
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/6 border border-white/10 text-xs text-white/50">
                <i className="pi pi-android text-sm text-emerald-500" /> Play Store
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Bar ───────────────────────────────────────────────── */}
      <div className="border-t border-white/8 relative z-10">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/35 text-xs">
            © {new Date().getFullYear()} <span className="text-emerald-500 font-semibold">FarmBazar</span>. All rights reserved. Made with
            <i className="pi pi-heart text-rose-500 mx-1 text-xs" />
            for farmers & families.
          </p>
          <div className="flex items-center gap-4 text-xs text-white/35">
            <Link to="/privacy-policy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link>
            <span>·</span>
            <Link to="/terms" className="hover:text-emerald-400 transition-colors">Terms of Service</Link>
            <span>·</span>
            <Link to="/about" className="hover:text-emerald-400 transition-colors">About Us</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
