import { useState } from 'react';
import api from '../services/api';
import AnimatedPage from '../components/AnimatedPage';
import SEO from '../components/SEO';

// Latest brand SVG icons
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

const socialLinks = [
  { component: XIcon,         href: 'https://x.com',           label: 'X',         hoverBg: 'hover:bg-black',        hoverText: 'hover:text-white' },
  { component: InstagramIcon, href: 'https://instagram.com',   label: 'Instagram', hoverBg: 'hover:bg-pink-600',     hoverText: 'hover:text-white' },
  { component: LinkedInIcon,  href: 'https://linkedin.com',    label: 'LinkedIn',  hoverBg: 'hover:bg-blue-600',     hoverText: 'hover:text-white' },
  { component: FacebookIcon,  href: 'https://facebook.com',    label: 'Facebook',  hoverBg: 'hover:bg-[#1877F2]',   hoverText: 'hover:text-white' },
];

const subjects = [
  { label: 'General Inquiry',  value: 'General Inquiry',  icon: 'pi-comment' },
  { label: 'Order Support',    value: 'Order Support',    icon: 'pi-shopping-bag' },
  { label: 'Partner Farm',     value: 'Partner with Us',  icon: 'pi-handshake' },
  { label: 'Feedback',         value: 'Feedback',         icon: 'pi-star' },
];

const contactInfo = [
  { icon: 'pi-map-marker', title: 'Main Office', lines: ['SG Highway, Bodakdev', 'Ahmedabad, Gujarat 380054'] },
  { icon: 'pi-envelope',   title: 'Direct Email', lines: ['support@farmbazar.com'] },
  { icon: 'pi-phone',      title: 'Farmer & Customer Helpline', lines: ['Mon–Sat, 8am – 7pm', '+91 98765 43210'] },
  { icon: 'pi-clock',      title: 'Fast Response', lines: ['Average response under 2 hours'] },
];

export default function Contact() {
  const [selectedSubject, setSelectedSubject] = useState('General Inquiry');
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const onChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg(null);
    try {
      await api.post('/contact', { ...formData, subject: selectedSubject });
      setSubmitted(true);
      setFormData({ firstName: '', lastName: '', email: '', message: '' });
      setSelectedSubject('General Inquiry');
    } catch (error) {
      setStatusMsg(error.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatedPage>
      <SEO title="Contact Us - FarmBazar" description="Get in touch with the FarmBazar team for support and inquiries." />
      <main className="min-h-screen bg-background text-on-background pt-[104px] pb-20">
        
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="relative py-16 text-center bg-gradient-to-b from-emerald-950 via-[#152e18] to-background text-white px-4 border-b border-white/10">
          <div className="max-w-3xl mx-auto relative z-10">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-4 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider border border-emerald-400/30">
              <i className="pi pi-comments text-xs" />
              We Are Here To Assist
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3">
              Get in Touch with FarmBazar
            </h1>
            <p className="text-sm sm:text-base text-white/80 max-w-xl mx-auto">
              Questions regarding orders, partner farmer listings, bulk produce, or delivery in Ahmedabad? We are here to help.
            </p>
          </div>
        </section>

        {/* ── Main Layout ──────────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left Column (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="p-8 rounded-3xl bg-gradient-to-br from-[#1b341f] via-[#162a19] to-[#0f1d12] text-white shadow-xl border border-emerald-800/30 relative overflow-hidden">
                <h2 className="text-xl font-black mb-1">Direct Contact Details</h2>
                <p className="text-white/60 text-xs mb-8">Reach our Ahmedabad operations & support team.</p>

                <div className="space-y-6">
                  {contactInfo.map((item) => (
                    <div key={item.title} className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-400/30">
                        <i className={`pi ${item.icon} text-base`} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">{item.title}</h4>
                        {item.lines.map((l, i) => (
                          <p key={i} className="text-xs text-white/65 mt-0.5">{l}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 flex gap-2.5">
                  {socialLinks.map(({ component: Icon, href, label, hoverBg }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className={`w-9 h-9 rounded-xl bg-white/10 text-white/70 flex items-center justify-center transition-all ${hoverBg} hover:text-white hover:scale-110`}
                    >
                      <Icon />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (7 cols): Contact Form */}
            <div className="lg:col-span-7">
              <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-[#182318] border border-slate-200/80 dark:border-emerald-900/30 shadow-xl">
                {submitted ? (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 text-3xl">
                      <i className="pi pi-check-circle" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Message Sent!</h3>
                    <p className="text-xs text-slate-500 dark:text-white/60 mb-6 max-w-sm mx-auto">
                      Thank you for contacting FarmBazar. Our support staff will respond within 2-4 hours.
                    </p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md hover:bg-emerald-700"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                      Send Us an Inquiry
                    </h2>
                    <p className="text-xs text-slate-400 mb-6">
                      Fill out the form below and we will get right back to you.
                    </p>

                    <form onSubmit={onSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-700 dark:text-white/80 block mb-1">First Name</label>
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={onChange}
                            placeholder="Yash"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 dark:text-white/80 block mb-1">Last Name</label>
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={onChange}
                            placeholder="Darji"
                            required
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-white/80 block mb-1">Email Address</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={onChange}
                          placeholder="yash@gmail.com"
                          required
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-white/80 block mb-1.5">Subject Category</label>
                        <div className="grid grid-cols-2 gap-2">
                          {subjects.map((s) => (
                            <button
                              key={s.value}
                              type="button"
                              onClick={() => setSelectedSubject(s.value)}
                              className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                                selectedSubject === s.value
                                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 hover:border-emerald-300'
                              }`}
                            >
                              <i className={`pi ${s.icon} text-xs ${selectedSubject === s.value ? 'text-emerald-600' : 'text-slate-400'}`} />
                              <span>{s.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 dark:text-white/80 block mb-1">Your Message</label>
                        <textarea
                          name="message"
                          value={formData.message}
                          onChange={onChange}
                          rows={4}
                          placeholder="Tell us what you need help with..."
                          required
                          className="w-full p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all resize-none"
                        />
                      </div>

                      {statusMsg && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs">
                          {statusMsg}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 disabled:opacity-60"
                      >
                        {submitting ? (
                          <>
                            <i className="pi pi-spin pi-spinner text-xs" />
                            <span>Sending Message...</span>
                          </>
                        ) : (
                          <>
                            <i className="pi pi-send text-xs" />
                            <span>Send Message</span>
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </AnimatedPage>
  );
}
