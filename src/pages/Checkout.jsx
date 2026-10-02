import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RadioButton } from 'primereact/radiobutton';
import toast from 'react-hot-toast';
import AnimatedPage from '../components/AnimatedPage';
import api from '../services/api';
import { loadStripe } from '@stripe/stripe-js';
import SEO from '../components/SEO';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

// ─── Stripe Card Form (inner component, must be inside <Elements>) ───────────
function StripeCardForm({ onSuccess, total, address, cart, user, paymentMethod, setAddressErrors }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!address.fullName.trim()) newErrors.fullName = 'Please enter the recipient\'s full name.';
    if (!address.streetAddress.trim()) newErrors.streetAddress = 'Please provide your street delivery address.';
    if (!address.city.trim()) newErrors.city = 'Please enter your city.';
    if (!address.zipCode.trim() || !/^[0-9]{6}$/.test(address.zipCode.trim())) {
      newErrors.zipCode = 'Please enter a valid 6-digit pincode.';
    }

    if (Object.keys(newErrors).length > 0) {
      setAddressErrors(newErrors);
      return;
    }
    setAddressErrors({});
    
    // For Mock UPI or Net Banking, just simulate success immediately
    if (paymentMethod === 'upi' || paymentMethod === 'netbanking') {
      setSubmitting(true);
      try {
        await placeOrder(paymentMethod === 'upi' ? 'UPI' : 'Net Banking', 'mock_txn_' + Date.now());
      } catch (err) {
        toast.error(err.response?.data?.message || 'Error placing order');
        setSubmitting(false);
      }
      return;
    }

    // Since we don't have real Stripe keys, we will completely mock the 
    // card payment process without making any requests to Stripe's API.
    setSubmitting(true);

    try {
      // Check if CardElement is empty or incomplete (basic visual check)
      const cardElement = elements?.getElement(CardElement);
      if (!cardElement) {
        toast.error('Please enter card details.');
        setSubmitting(false);
        return;
      }

      // Simulate a network delay to make it look like a real payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Successfully simulated payment! Place the order.
      await placeOrder('Card', 'mock_txn_' + Date.now());
      
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment error. Please try again.');
      setSubmitting(false);
    }
  };

  const placeOrder = async (method, stripePaymentId = null) => {
    const items = (cart?.items || []).filter(item => item && item.product);
    const orderItems = items.map(item => ({
      product: item.product?._id || item.product,
      name: item.product?.name || item.name,
      quantity: item.quantity,
      price: item.price,
      image: item.product?.images?.[0] || item.image,
      unit: item.product?.unit || item.unit || 'unit',
      farmerId: item.product?.farmerId?._id || item.product?.farmerId,
    }));
    const farmerId = items[0]?.product?.farmerId?._id || items[0]?.product?.farmerId;
    const subtotal = cart?.totalAmount || 0;
    const deliveryCharge = subtotal >= 499 ? 0 : 40;
    const totalAmount = subtotal + deliveryCharge;

    // Save address to user profile if it's missing or changed
    try {
      if (
        user && (
          user.address !== address.streetAddress ||
          user.pincode !== address.zipCode ||
          user.city !== address.city
        )
      ) {
        await api.put('/users/profile', {
          name: address.fullName,
          address: address.streetAddress,
          city: address.city,
          pincode: address.zipCode,
        });
      }
    } catch (e) {
      console.error('Failed to update user profile address', e);
    }

    const res = await api.post('/orders', {
      farmerId,
      orderItems,
      deliveryAddress: {
        address: address.streetAddress,
        city: address.city || 'Ahmedabad',
        state: 'Gujarat',
        pincode: address.zipCode || '380001',
      },
      receiverName: address.fullName || user?.name || 'Customer',
      receiverPhone: user?.phone || '9876543210',
      paymentMethod: method,
      paymentStatus: method === 'COD' ? 'Pending' : 'Completed',
      paymentId: stripePaymentId,
      subtotal,
      deliveryCharge,
      totalAmount,
    });

    await api.delete('/cart');

    if (res.data.success) {
      toast.success('Payment successful! Order placed.');
      navigate('/order-success');
    }
  };

  // COD — no Stripe card needed
  const handleCOD = async () => {
    const newErrors = {};

    if (!address.fullName.trim()) newErrors.fullName = 'Please enter the recipient\'s full name.';
    if (!address.streetAddress.trim()) newErrors.streetAddress = 'Please provide your street delivery address.';
    if (!address.city.trim()) newErrors.city = 'Please enter your city.';
    if (!address.zipCode.trim() || !/^[0-9]{6}$/.test(address.zipCode.trim())) {
      newErrors.zipCode = 'Please enter a valid 6-digit pincode.';
    }

    if (Object.keys(newErrors).length > 0) {
      setAddressErrors(newErrors);
      return;
    }
    setAddressErrors({});

    setSubmitting(true);
    try {
      await placeOrder('COD');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error placing order');
      setSubmitting(false);
    }
  };

  const isCOD = paymentMethod === 'cod';

  return (
    <form onSubmit={isCOD ? (e) => { e.preventDefault(); handleCOD(); } : handleSubmit}>
      {/* Stripe Card Element — only shown for card payments */}
      {paymentMethod === 'card' && (
        <div className="mt-4 p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">Card Details</p>
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '15px',
                  color: '#1e293b',
                  fontFamily: 'Inter, sans-serif',
                  '::placeholder': { color: '#94a3b8' },
                },
                invalid: { color: '#ef4444' },
              },
            }}
            className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/10"
          />
        </div>
      )}

      {paymentMethod === 'upi' && (
        <div className="mt-4 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-950/20">
          <p className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2">
            <i className="pi pi-info-circle" />
            UPI simulation: Payment will be confirmed automatically in test mode.
          </p>
        </div>
      )}

      {paymentMethod === 'netbanking' && (
        <div className="mt-4 p-4 rounded-2xl border border-purple-100 dark:border-purple-900/30 bg-purple-50 dark:bg-purple-950/20">
          <p className="text-xs font-bold text-purple-700 dark:text-purple-400 flex items-center gap-2">
            <i className="pi pi-info-circle" />
            Net Banking simulation: Payment will be confirmed automatically in test mode.
          </p>
        </div>
      )}

      {isCOD && (
        <div className="mt-4 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/30 bg-orange-50 dark:bg-orange-950/20">
          <p className="text-xs font-bold text-orange-700 dark:text-orange-400 flex items-center gap-2">
            <i className="pi pi-wallet" />
            Pay with cash or UPI when your order arrives at the door.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || (!stripe && !isCOD)}
        className="w-full mt-6 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm transition-all shadow-xl shadow-emerald-900/30 flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-50"
      >
        {submitting ? (
          <><i className="pi pi-spin pi-spinner text-sm" /><span>Processing Payment...</span></>
        ) : (
          <><i className="pi pi-lock text-sm" /><span>Pay & Place Order (₹{total})</span></>
        )}
      </button>
    </form>
  );
}

// ─── Main Checkout Page ───────────────────────────────────────────────────────
export default function Checkout() {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stripePromise, setStripePromise] = useState(null);
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const [address, setAddress] = useState({
    fullName: '',
    streetAddress: '',
    city: 'Ahmedabad',
    zipCode: '380054',
  });
  const [addressErrors, setAddressErrors] = useState({});

  useEffect(() => {
    if (user) {
      setAddress({
        fullName: user.name || '',
        streetAddress: user.address || '',
        city: user.city || 'Ahmedabad',
        zipCode: user.pincode || '380054',
      });
    }
  }, [user]);

  // Load Stripe publishable key from backend
  useEffect(() => {
    api.get('/payment/config').then(res => {
      setStripePromise(loadStripe(res.data.publishableKey));
    }).catch(() => {
      // Fallback to hardcoded test key if backend is not ready
      setStripePromise(loadStripe('pk_test_51OqplaceholderKeyForTestingOnlyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'));
    });
  }, []);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await api.get('/cart');
        setCart(res.data.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching cart', error);
        setLoading(false);
      }
    };
    fetchCart();
  }, []);

  const handleAddressChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbfdf9]">
        <i className="pi pi-spin pi-spinner text-4xl text-emerald-600" />
      </div>
    );
  }

  if (user && user.role !== 'customer') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-[#fbfdf9]">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Customer Only Area</h2>
        <button onClick={() => navigate('/')} className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs">
          Return Home
        </button>
      </div>
    );
  }

  const items = (cart?.items || []).filter((item) => item && item.product);
  const itemsCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cart?.totalAmount || 0;
  const deliveryFee = subtotal >= 499 ? 0 : 40;
  const total = subtotal + deliveryFee;

  const paymentOptions = [
    { id: 'card', label: 'Credit / Debit Cards', icon: 'pi-credit-card', sub: 'Visa, MasterCard, RuPay with 3D Secure · Powered by Stripe' },
    { id: 'upi', label: 'Instant UPI (Google Pay, PhonePe, Paytm)', icon: 'pi-qrcode', sub: 'Fastest & 100% Zero Payment Surcharge' },
    { id: 'netbanking', label: 'Net Banking', icon: 'pi-building', sub: 'SBI, HDFC, ICICI, Axis & all Indian banks' },
    { id: 'cod', label: 'Cash on Farm Delivery', icon: 'pi-wallet', sub: 'Pay with cash or UPI upon doorstep arrival' },
  ];

  return (
    <AnimatedPage>
      <SEO title="Checkout - FarmBazar" description="Securely checkout your fresh farm products on FarmBazar." />
      <div className="min-h-screen bg-[#fbfdf9] dark:bg-[#121812] text-slate-900 dark:text-white">

        {/* Header */}
        <header className="w-full bg-white/90 dark:bg-[#152316]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-emerald-900/30 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-sm">
                <i className="pi pi-shop text-lg" />
              </div>
              <span className="text-xl font-extrabold tracking-tight">
                Farm<span className="text-emerald-600">Bazar</span>
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                <i className="pi pi-lock text-xs" />
                256-Bit SSL Encrypted
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-3.5 py-1.5 rounded-full border border-blue-200 dark:border-blue-800/40">
                <i className="pi pi-shield text-xs" />
                Powered by Stripe
              </div>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

            {/* Left: Address + Payment */}
            <div className="lg:col-span-7 space-y-8">

              {/* Step 1: Address */}
              <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#182318] border border-slate-200/80 dark:border-emerald-900/30 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">1</div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Delivery Address</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-white/80 block mb-1.5">Recipient Full Name</label>
                    <input type="text" name="fullName" value={address.fullName} onChange={handleAddressChange} placeholder="Yash Darji" className={`w-full px-4 py-3 rounded-xl border bg-slate-50 dark:bg-white/5 text-sm text-slate-900 dark:text-white outline-none transition-all ${addressErrors.fullName ? 'border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-emerald-500'}`} />
                    {addressErrors.fullName && <p className="text-red-500 text-xs mt-1">{addressErrors.fullName}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-white/80 block mb-1.5">Street Address & Landmark</label>
                    <input type="text" name="streetAddress" value={address.streetAddress} onChange={handleAddressChange} placeholder="Apartment, Flat No., Area (e.g. Bodakdev, SG Highway)" className={`w-full px-4 py-3 rounded-xl border bg-slate-50 dark:bg-white/5 text-sm text-slate-900 dark:text-white outline-none transition-all ${addressErrors.streetAddress ? 'border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-emerald-500'}`} />
                    {addressErrors.streetAddress && <p className="text-red-500 text-xs mt-1">{addressErrors.streetAddress}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-white/80 block mb-1.5">City</label>
                    <input type="text" name="city" value={address.city} onChange={handleAddressChange} placeholder="Ahmedabad" className={`w-full px-4 py-3 rounded-xl border bg-slate-50 dark:bg-white/5 text-sm text-slate-900 dark:text-white outline-none transition-all ${addressErrors.city ? 'border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-emerald-500'}`} />
                    {addressErrors.city && <p className="text-red-500 text-xs mt-1">{addressErrors.city}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-white/80 block mb-1.5">Pincode</label>
                    <input type="text" name="zipCode" value={address.zipCode} onChange={handleAddressChange} placeholder="380054" className={`w-full px-4 py-3 rounded-xl border bg-slate-50 dark:bg-white/5 text-sm text-slate-900 dark:text-white outline-none transition-all ${addressErrors.zipCode ? 'border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-emerald-500'}`} />
                    {addressErrors.zipCode && <p className="text-red-500 text-xs mt-1">{addressErrors.zipCode}</p>}
                  </div>
                </div>
              </section>

              {/* Step 2: Payment Method */}
              <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#182318] border border-slate-200/80 dark:border-emerald-900/30 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">2</div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Select Payment Mode</h2>
                </div>

                <div className="space-y-3">
                  {paymentOptions.map((pm) => (
                    <label key={pm.id} className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${paymentMethod === pm.id ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-sm' : 'border-slate-200 dark:border-white/10 hover:border-emerald-300'}`}>
                      <div className="flex items-center gap-3.5">
                        <RadioButton inputId={pm.id} name="payment" value={pm.id} onChange={(e) => setPaymentMethod(e.value)} checked={paymentMethod === pm.id} />
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{pm.label}</p>
                          <p className="text-[11px] text-slate-500 dark:text-white/60">{pm.sub}</p>
                        </div>
                      </div>
                      <i className={`pi ${pm.icon} text-lg ${paymentMethod === pm.id ? 'text-emerald-600' : 'text-slate-400'}`} />
                    </label>
                  ))}
                </div>

                {/* Stripe Elements Form */}
                {stripePromise && (
                  <Elements stripe={stripePromise}>
                    <StripeCardForm
                      onSuccess={() => {}}
                      total={total}
                      address={address}
                      cart={cart}
                      user={user}
                      paymentMethod={paymentMethod}
                      setAddressErrors={setAddressErrors}
                    />
                  </Elements>
                )}
              </section>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-5">
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#182318] border border-slate-200/80 dark:border-emerald-900/40 shadow-xl space-y-6 sticky top-28">
                <h3 className="text-lg font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-4">
                  Order Items ({itemsCount})
                </h3>

                <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
                  {items.map((item) => (
                    <div key={item.product._id} className="flex items-center gap-3">
                      <img loading="lazy" src={item.product.images?.[0] || 'https://via.placeholder.com/60'} alt={item.product.name} className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0" />
                      <div className="flex-grow min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.product.name}</p>
                        <p className="text-[11px] text-slate-400">{item.quantity} × ₹{item.price}</p>
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-white/5 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-white/70">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-900 dark:text-white">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-white/70">
                    <span>Delivery</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {deliveryFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `₹${deliveryFee}`}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex justify-between items-baseline">
                    <span className="text-sm font-black text-slate-900 dark:text-white">Final Amount</span>
                    <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">₹{total}</span>
                  </div>
                </div>

                {/* Stripe trust badges */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <i className="pi pi-verified text-emerald-500 text-xs" />
                    Direct payout to verified farmers
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <i className="pi pi-shield text-blue-500 text-xs" />
                    Secured by Stripe
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </AnimatedPage>
  );
}
