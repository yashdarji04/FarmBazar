import { Link, useNavigate } from 'react-router-dom';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import AnimatedPage from '../components/AnimatedPage';
import api from '../services/api';
import SEO from '../components/SEO';

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);

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

  useEffect(() => {
    fetchCart();
  }, []);

  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1) return removeItem(productId);
    try {
      await api.put(`/cart/${productId}`, { quantity });
      fetchCart();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating quantity');
    }
  };

  const removeItem = async (productId) => {
    try {
      await api.delete(`/cart/${productId}`);
      fetchCart();
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Error removing item', error);
      toast.error(error.response?.data?.message || 'Error removing item');
    }
  };

  if (loading) {
    return (
      <AnimatedPage>
      <SEO title="Your Cart - FarmBazar" description="Review your fresh farm products cart on FarmBazar." />
        <div className="min-h-screen flex items-center justify-center pt-20">
          <ProgressSpinner strokeWidth="4" style={{ width: '48px', height: '48px' }} />
        </div>
      </AnimatedPage>
    );
  }

  if (user && user.role !== 'customer') {
    return (
      <AnimatedPage>
        <div className="min-h-screen flex flex-col items-center justify-center pt-32 sm:pt-36 pb-20 text-center px-4">
          <i className="pi pi-exclamation-triangle text-4xl text-amber-500 mb-3" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Customer Only Area</h2>
          <p className="text-xs text-slate-500 mb-6">Farmer & Admin accounts manage orders through their dedicated dashboard.</p>
          <button
            onClick={() => navigate(user.role === 'farmer' ? '/dashboard/farmer' : '/dashboard/admin')}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
          >
            Go to My Dashboard
          </button>
        </div>
      </AnimatedPage>
    );
  }

  const items = (cart?.items || []).filter((item) => item && item.product);
  const itemsCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cart?.totalAmount || 0;
  const deliveryFee = items.length > 0 ? (subtotal >= 499 ? 0 : 40) : 0;
  const total = subtotal + deliveryFee;

  return (
    <AnimatedPage>
      <main className="min-h-screen bg-background text-on-background pt-[104px] pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              My Harvest Basket
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-white/60 mt-1">
              You have <span className="font-bold text-emerald-600">{itemsCount} fresh items</span> in your cart.
            </p>
          </div>

          {items.length === 0 ? (
            <div className="p-12 sm:p-16 rounded-3xl bg-white dark:bg-[#182318] border border-slate-200 dark:border-emerald-900/30 text-center max-w-lg mx-auto shadow-sm">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4 text-2xl">
                <i className="pi pi-shopping-cart" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Your Basket is Empty</h3>
              <p className="text-xs text-slate-500 dark:text-white/60 mb-6">
                Discover locally grown vegetables, seasonal fruits, and farm fresh dairy ready for morning harvest.
              </p>
              <button
                onClick={() => navigate('/products')}
                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all"
              >
                Browse Fresh Produce
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Items List (8 cols) */}
              <div className="lg:col-span-8 space-y-4">
                
                {/* Free delivery banner */}
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300">
                    <i className="pi pi-truck text-emerald-600 text-base" />
                    {subtotal >= 499 ? (
                      <span className="font-bold">You qualify for FREE farm-to-door delivery!</span>
                    ) : (
                      <span>Add <strong className="text-emerald-700">₹{499 - subtotal}</strong> more for Free Delivery!</span>
                    )}
                  </div>
                  <span className="font-bold text-emerald-700">₹499 Free Tier</span>
                </div>

                {/* Items */}
                <div className="bg-white dark:bg-[#182318] rounded-3xl border border-slate-200/80 dark:border-emerald-900/30 shadow-sm divide-y divide-slate-100 dark:divide-white/5 overflow-hidden">
                  {items.map((item) => (
                    <div
                      key={item.product._id}
                      className="p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 justify-between group"
                    >
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <img
                          src={item.product.images?.[0] || 'https://via.placeholder.com/150'}
                          alt={item.product.name}
                          className="w-20 h-20 rounded-2xl object-cover bg-slate-100 dark:bg-emerald-950/40 shrink-0"
                        />
                        <div className="flex-grow">
                          <Link
                            to={`/products/${item.product._id}`}
                            className="text-base font-bold text-slate-900 dark:text-white hover:text-emerald-600 transition-colors line-clamp-1"
                          >
                            {item.product.name}
                          </Link>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {item.product.category || 'Farm Produce'} · ₹{item.price} / {item.product.unit || 'kg'}
                          </p>
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-1 block">
                            Subtotal: ₹{item.price * item.quantity}
                          </span>
                        </div>
                      </div>

                      {/* Stepper & Remove */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-white/5">
                        <div className="flex items-center rounded-xl border border-slate-200 dark:border-white/10 p-1 bg-slate-50 dark:bg-white/5">
                          <button
                            onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                            className="w-8 h-8 rounded-lg hover:bg-white dark:hover:bg-white/10 flex items-center justify-center text-slate-700 dark:text-white"
                          >
                            <i className="pi pi-minus text-[10px]" />
                          </button>
                          <span className="w-8 text-center text-xs font-extrabold text-slate-900 dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                            className="w-8 h-8 rounded-lg hover:bg-white dark:hover:bg-white/10 flex items-center justify-center text-slate-700 dark:text-white"
                          >
                            <i className="pi pi-plus text-[10px]" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.product._id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                          title="Remove item"
                        >
                          <i className="pi pi-trash text-sm" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary (4 cols) */}
              <div className="lg:col-span-4">
                <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#182318] border border-slate-200/80 dark:border-emerald-900/40 shadow-xl space-y-5 sticky top-28">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-4">
                    Order Summary
                  </h3>

                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="flex justify-between text-slate-600 dark:text-white/70">
                      <span>Harvest Subtotal ({itemsCount} items)</span>
                      <span className="font-semibold text-slate-900 dark:text-white">₹{subtotal}</span>
                    </div>

                    <div className="flex justify-between text-slate-600 dark:text-white/70">
                      <span>Farm-Direct Delivery</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {deliveryFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `₹${deliveryFee}`}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-600 dark:text-white/70">
                      <span>Eco-Friendly Crate Pack</span>
                      <span className="text-emerald-600 font-bold">FREE</span>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex justify-between items-baseline">
                      <span className="text-base font-extrabold text-slate-900 dark:text-white">Total Amount</span>
                      <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">₹{total}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/checkout')}
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 hover:-translate-y-0.5"
                  >
                    <span>Proceed to Checkout</span>
                    <i className="pi pi-arrow-right text-xs" />
                  </button>

                  <button
                    onClick={() => navigate('/products')}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center justify-center gap-1.5"
                  >
                    <i className="pi pi-arrow-left text-[10px]" />
                    Continue Browsing Fresh Produce
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>
    </AnimatedPage>
  );
}
