import { Link } from 'react-router-dom';

export default function TermsConditions() {
  const lastUpdated = 'September 20, 2026';

  const sections = [
    {
      id: 'acceptance',
      icon: 'pi-file-edit',
      title: '1. Acceptance of Terms',
      content: [
        'By accessing or using FarmBazar ("we", "our", or "platform"), you agree to be bound by these Terms and Conditions and our Privacy Policy.',
        'If you do not agree to these terms, please do not use our marketplace services or mobile/web applications.',
        'We reserve the right to modify these terms at any time with prior notice posted on this page.',
      ],
    },
    {
      id: 'marketplace-model',
      icon: 'pi-shop',
      title: '2. Marketplace & Direct Farmer Model',
      content: [
        'FarmBazar operates as a direct-to-consumer platform connecting registered agricultural producers ("Farmers") with buyers ("Customers").',
        'Produce freshness, origin authenticity, and harvest specifics are maintained by partner farms in Ahmedabad and surrounding regions according to verified standards.',
        'FarmBazar facilitates order processing, logistics coordination, customer support, and secure payments between participants.',
      ],
    },
    {
      id: 'accounts',
      icon: 'pi-user',
      title: '3. User Accounts & Registration',
      content: [
        'Users must provide true, accurate, and up-to-date information during registration.',
        'You are responsible for maintaining the confidentiality of your account password and security credentials.',
        'Farmers must provide valid agricultural identification, proof of land/lease, and bank verification to list produce.',
        'FarmBazar reserves the right to suspend or terminate accounts engaging in abusive, fraudulent, or deceptive behavior.',
      ],
    },
    {
      id: 'pricing-orders',
      icon: 'pi-tag',
      title: '4. Pricing, Orders & Payments',
      content: [
        'All prices are listed in Indian Rupees (₹) inclusive of applicable taxes, unless stated otherwise.',
        'Produce prices reflect seasonal market conditions and fair compensation decided directly with farmers.',
        'Payments can be made via authorized online payment gateways (UPI, Cards, NetBanking, Wallets) or Cash on Delivery where applicable.',
        'An order is considered confirmed once successfully processed and acknowledged with an order ID.',
      ],
    },
    {
      id: 'delivery-quality',
      icon: 'pi-truck',
      title: '5. Delivery & Freshness Guarantee',
      content: [
        'We endeavor to deliver farm-harvested products within designated delivery windows (typically 24–48 hours from harvest).',
        'Customers are requested to inspect produce upon arrival. If produce is damaged or fails quality standards, a replacement or refund claim can be raised within 12 hours of delivery.',
        'Delays resulting from natural weather extremities, roadblocks, or unforeseen force majeure events will be communicated promptly.',
      ],
    },
    {
      id: 'cancellations',
      icon: 'pi-refresh',
      title: '6. Cancellations & Refunds',
      content: [
        'Order cancellations are permitted prior to dispatch from the farm hub.',
        'Once produce is harvested and packed for transit, cancellations may be subject to restocking or handling fees.',
        'Approved refunds will be processed to the original payment method within 3 to 7 business days.',
      ],
    },
    {
      id: 'liability',
      icon: 'pi-exclamation-triangle',
      title: '7. Limitation of Liability & Governing Law',
      content: [
        'FarmBazar acts in good faith to verify sellers and produce quality, but cannot be held liable for indirect damages resulting from platform downtime or third-party delivery delays.',
        'These terms shall be governed by and construed in accordance with the laws of India.',
        'Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the competent courts in Ahmedabad, Gujarat, India.',
      ],
    },
  ];

  return (
    <main className="flex-grow w-full pt-28 sm:pt-32 bg-background text-on-background">
      {/* Hero Header */}
      <section className="relative bg-gradient-to-b from-primary/10 via-surface-container-low to-background py-16 border-b border-outline-variant/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
            <i className="pi pi-book text-xs" />
            Terms of Service
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-on-background tracking-tight mb-4">
            Terms & Conditions
          </h1>
          <p className="text-on-surface-variant max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Please read these terms carefully before shopping or listing produce on <span className="font-semibold text-primary">FarmBazar</span>.
          </p>
          <div className="mt-4 text-xs text-on-surface-variant/70">
            Last Updated: <span className="font-medium text-on-background">{lastUpdated}</span>
          </div>
        </div>
      </section>

      {/* Content Body */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Notice Card */}
        <div className="mb-10 p-6 rounded-2xl bg-surface-container-low border border-outline-variant/50 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <i className="pi pi-verified text-lg" />
            </div>
            <div>
              <h2 className="text-base font-bold text-on-background mb-1">Fair & Transparent Marketplace</h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                FarmBazar is built on mutual respect between consumers and agricultural producers. By participating, you support fair trade, transparent pricing, and sustainable farming in Gujarat.
              </p>
            </div>
          </div>
        </div>

        {/* Terms Sections */}
        <div className="space-y-8">
          {sections.map((section) => (
            <div
              key={section.id}
              id={section.id}
              className="p-6 sm:p-8 rounded-2xl bg-surface border border-outline-variant/40 shadow-sm hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-secondary-container text-primary flex items-center justify-center shrink-0">
                  <i className={`pi ${section.icon} text-sm`} />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-on-background">{section.title}</h2>
              </div>
              <ul className="space-y-2.5 pl-2">
                {section.content.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-on-surface-variant leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/70 mt-2 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Support Section */}
        <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-emerald-900 to-green-950 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                <i className="pi pi-comments text-emerald-400" />
                Need clarification on our terms?
              </h3>
              <p className="text-white/70 text-sm max-w-md">
                Our support team is here to assist with any questions regarding policies, orders, or farmer listings.
              </p>
            </div>
            <Link
              to="/contact"
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-all shadow-md shrink-0 inline-flex items-center gap-2"
            >
              <i className="pi pi-send text-xs" />
              Contact Help Center
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
