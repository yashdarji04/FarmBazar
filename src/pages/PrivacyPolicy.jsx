import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  const sections = [
    {
      icon: 'pi-id-card',
      title: '1. What Information We Collect',
      items: [
        'Your name, phone number, and email address when you sign up.',
        'Your delivery address so our farmers and riders can deliver your orders.',
        'Basic farm details if you register as a farmer to sell produce.',
      ],
    },
    {
      icon: 'pi-truck',
      title: '2. Why We Collect It',
      items: [
        'To harvest, pack, and deliver fresh vegetables, fruits, and dairy to your doorstep.',
        'To send you order updates and delivery notifications via SMS or WhatsApp.',
        'To provide fast customer support whenever you need help.',
      ],
    },
    {
      icon: 'pi-shield',
      title: '3. How We Protect Your Data',
      items: [
        'Your payments are 100% secure and processed through encrypted gateways (UPI, Cards, NetBanking).',
        'We never store your card PIN or CVV numbers.',
        'Your account passwords are encrypted and kept safe.',
      ],
    },
    {
      icon: 'pi-ban',
      title: '4. We Never Sell Your Data',
      items: [
        'We never sell, rent, or trade your personal details to advertisers or third parties.',
        'We only share your address and phone number with our delivery driver to complete your order.',
      ],
    },
    {
      icon: 'pi-check-circle',
      title: '5. Your Control & Choices',
      items: [
        'You can update your name, address, or phone number anytime in your profile.',
        'You can choose to stop receiving promotional emails or messages whenever you want.',
        'You can request to delete your account by contacting our support team.',
      ],
    },
    {
      icon: 'pi-envelope',
      title: '6. Questions & Contact',
      items: [
        'If you have any questions about this privacy policy, feel free to email us at support@farmbazar.com.',
        'Our support team is always happy to assist you.',
      ],
    },
  ];

  return (
    <main className="flex-grow w-full pt-28 sm:pt-32 bg-background text-on-background">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-primary/10 via-surface-container-low to-background py-14 border-b border-outline-variant/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
            Simple & Transparent
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-on-background tracking-tight mb-3">
            Privacy Policy
          </h1>
          <p className="text-on-surface-variant text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            At <span className="font-semibold text-primary">FarmBazar</span>, we believe in keeping things simple and honest. Here is how we look after your information.
          </p>
        </div>
      </section>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* Quick promise box */}
        <div className="mb-8 p-5 rounded-2xl bg-secondary-container/40 border border-secondary/20 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
            <i className="pi pi-heart-fill text-base" />
          </div>
          <div>
            <h2 className="text-base font-bold text-on-background mb-1">Our Simple Promise</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              We only use your information to deliver fresh, local produce to your home and pay our farmers fairly.
            </p>
          </div>
        </div>

        {/* Section Cards */}
        <div className="space-y-6">
          {sections.map((section, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-surface border border-outline-variant/50 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                  <i className={`pi ${section.icon} text-sm`} />
                </div>
                <h3 className="text-lg font-bold text-on-background">
                  {section.title}
                </h3>
              </div>

              <ul className="space-y-2.5">
                {section.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="flex items-start gap-2.5 text-sm text-on-surface-variant leading-relaxed">
                    <span className="w-2 h-2 rounded-full bg-primary/80 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Help CTA */}
        <div className="mt-10 p-6 rounded-2xl bg-gradient-to-r from-emerald-800 to-green-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-base mb-1">Have any questions?</h4>
            <p className="text-white/80 text-xs">Reach out to our team anytime. We're here to help.</p>
          </div>
          <Link
            to="/contact"
            className="px-5 py-2.5 rounded-xl bg-white text-emerald-900 font-semibold text-xs hover:bg-emerald-50 transition-colors shrink-0 flex items-center gap-2"
          >
            <i className="pi pi-envelope text-xs" />
            Contact Us
          </Link>
        </div>

      </div>
    </main>
  );
}
