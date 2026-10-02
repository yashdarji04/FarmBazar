import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { motion } from 'framer-motion';
import { Wheat, Star, Check } from 'lucide-react';
import Confetti from '../components/Confetti';
import api from '../services/api';

const STEPS = [
  { key: 'placedAt', status: 'Placed', title: 'Order Placed', desc: "We've received your order and sent it to the farmer." },
  { key: 'acceptedAt', status: 'Accepted', title: 'Accepted by Farmer', desc: 'Your farmer has accepted the order and is getting it ready.' },
  { key: 'packedAt', status: 'Packed', title: 'Packed', desc: 'Your fresh produce has been harvested and packaged.' },
  { key: 'outForDeliveryAt', status: 'Out For Delivery', title: 'Out For Delivery', desc: 'Your order is on its way to you.' },
  { key: 'deliveredAt', status: 'Delivered', title: 'Delivered', desc: 'Your order has been dropped off at your location.' },
];

const STATUS_ORDER = ['Placed', 'Accepted', 'Packed', 'Out For Delivery', 'Delivered'];

export default function TrackOrder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useSelector((state) => state.auth);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFarmerIndex, setSelectedFarmerIndex] = useState('all');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get('/orders/myorders');
        const orders = res.data.data || [];
        const paramId = searchParams.get('id') || searchParams.get('orderId');
        let matched = null;
        if (paramId) {
          matched = orders.find(o => o._id === paramId || o.orderNumber === paramId);
        }
        if (!matched) {
          // Prefer the most recent order that isn't finished; fall back to the latest order overall
          matched = orders.find(o => o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled') || orders[0] || null;
        }
        setOrder(matched);
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching your orders');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrder();
    } else {
      setLoading(false);
    }
  }, [user, searchParams]);

  if (!user) {
    return (
      <main className="flex-grow w-full max-w-container-max mx-auto px-4 md:px-gutter pt-32 sm:pt-36 pb-16 flex flex-col items-center text-center">
        <h1 className="font-headline-md text-headline-md text-on-background mb-4">Track Your Order</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mb-6">Please log in to view your order status.</p>
        <Button label="Log In" onClick={() => navigate('/login')} className="bg-primary text-white px-6 py-3 rounded-lg" />
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex-grow w-full flex items-center justify-center min-h-[60vh] pt-32 sm:pt-36 pb-16">
        <ProgressSpinner />
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-grow w-full max-w-container-max mx-auto px-4 pt-32 sm:pt-36 pb-16 text-center text-error font-label-lg">
        {error}
      </main>
    );
  }

  if (!order) {
    return (
      <main className="flex-grow w-full max-w-container-max mx-auto px-4 md:px-gutter pt-32 sm:pt-36 pb-16 flex flex-col items-center text-center">
        <h1 className="font-headline-md text-headline-md text-on-background mb-4">Track Your Order</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mb-6">You don't have any orders yet.</p>
        <Button label="Start Shopping" onClick={() => navigate('/products')} className="bg-primary text-white px-6 py-3 rounded-lg" />
      </main>
    );
  }

  const validFarmerIndex = (selectedFarmerIndex !== 'all' && typeof selectedFarmerIndex === 'number' && order.farmerOrders?.[selectedFarmerIndex])
    ? selectedFarmerIndex
    : 'all';

  const currentSubOrder = validFarmerIndex !== 'all' ? order.farmerOrders[validFarmerIndex] : null;

  const rawStatus = currentSubOrder ? (currentSubOrder.farmerOrderStatus || 'Placed') : (order.orderStatus || 'Placed');
  const activeStatus = rawStatus;
  const normalizedStatus = rawStatus === 'Pending' ? 'Placed' : (rawStatus === 'Processing' ? 'Packed' : (rawStatus === 'Shipped' ? 'Out For Delivery' : rawStatus));
  const isCancelled = rawStatus === 'Cancelled';
  const currentIndex = Math.max(0, STATUS_ORDER.indexOf(normalizedStatus));
  const isDelivered = rawStatus === 'Delivered';

  const displayedItems = currentSubOrder ? (currentSubOrder.items || []) : (order.items || []);
  const displayedTotal = currentSubOrder ? currentSubOrder.subtotal : (order.totalAmount || 0);

  const formatTimestamp = (val) => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d.toLocaleString();
  };

  return (
    <main className="flex-grow w-full max-w-container-max mx-auto px-4 md:px-gutter pt-32 sm:pt-36 pb-16 flex flex-col items-center">
      {isDelivered && <Confetti duration={5000} />}

      <div className="w-full max-w-3xl text-center mb-8">
        <h1 className="font-headline-md-mobile md:font-headline-md text-headline-md-mobile md:text-headline-md text-on-background mb-3">Track Your Order</h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-xl mx-auto">
          Here's the real-time status of your farm-fresh delivery.
        </p>
      </div>

      {/* Delivered Celebration Card */}
      {isDelivered && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-4xl mb-8 relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-500/25 border border-emerald-400 text-white"
        >
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-5">
              <div className="relative flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/50 opacity-75"></span>
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg text-emerald-600">
                  <i className="pi pi-check-circle text-3xl sm:text-4xl font-bold"></i>
                </div>
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider mb-2 backdrop-blur-sm border border-white/20">
                  <i className="pi pi-sparkles text-amber-300"></i> Order Delivered Successfully!
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                  Your Harvest Has Arrived!
                </h2>
                <p className="text-emerald-50 text-xs sm:text-sm max-w-md mt-1 font-medium">
                  Your fresh produce has been safely dropped off at your location. Please check your harvest and share your review!
                </p>
              </div>
            </div>

            <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Button
                label={<span className="flex items-center gap-2">Rate & Review Products <Star className="w-4 h-4 fill-current" /></span>}
                className="w-full sm:w-auto bg-white hover:bg-emerald-50 text-emerald-700 font-black rounded-xl px-6 py-3.5 shadow-lg border-none transition-all hover:scale-105 active:scale-95"
                onClick={() => navigate(`/delivery-success/${order._id}`)}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Multiple Farmers Tabs if order has items from multiple farms */}
      {order.farmerOrders && order.farmerOrders.length > 0 && (
        <div className="w-full max-w-4xl mb-6 flex flex-wrap gap-2.5 p-2 bg-surface-container-low rounded-2xl border border-outline-variant/30">
          <button
            onClick={() => setSelectedFarmerIndex('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              selectedFarmerIndex === 'all'
                ? 'bg-primary text-white shadow-md'
                : 'bg-surface hover:bg-surface-container text-on-surface-variant'
            }`}
          >
            <span>All Produce</span>
            <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">
              {order.orderStatus}
            </span>
          </button>

          {order.farmerOrders.map((fo, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedFarmerIndex(idx)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                selectedFarmerIndex === idx
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-surface hover:bg-surface-container text-on-surface-variant'
              }`}
            >
              <span className="flex items-center gap-1.5"><Wheat className="w-3.5 h-3.5" /> {fo.farmerId?.farmName || `Farmer #${idx + 1}`}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                selectedFarmerIndex === idx ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              }`}>
                {fo.farmerOrderStatus}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="w-full max-w-4xl glass-panel rounded-2xl soft-shadow overflow-hidden border border-outline-variant/20">
        {/* Order Header info */}
        <div className="bg-surface-container-low p-6 md:p-8 border-b border-outline-variant/30 flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h2 className="font-title-lg text-title-lg text-on-background mb-1">
              Order #{order.orderNumber || (order._id ? order._id.substring(Math.max(0, order._id.length - 6)).toUpperCase() : 'ORDER')}
              {currentSubOrder && (
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 ml-2">
                  (<Wheat className="w-3.5 h-3.5 inline-block mr-1" /> {currentSubOrder.farmerId?.farmName || currentSubOrder.farmerId?.name || 'Farmer Sub-order'})
                </span>
              )}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Placed on {order.placedAt ? new Date(order.placedAt).toLocaleDateString() : (order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Recently')}
            </p>
          </div>
          <div className="text-left md:text-right">
            <p className="font-label-sm text-label-sm text-outline mb-1 uppercase tracking-wider">
              {currentSubOrder ? 'Farmer Status' : 'Overall Status'}
            </p>
            <p className={`font-title-lg text-title-lg font-bold ${isCancelled ? 'text-error' : 'text-primary'}`}>{activeStatus}</p>
          </div>
        </div>

        <div className="p-6 md:p-10 flex flex-col md:flex-row gap-xl">
          {/* Timeline */}
          <div className="flex-1">
            <h3 className="font-title-lg text-title-lg text-on-background mb-8">
              {currentSubOrder ? `Tracking: ${currentSubOrder.farmerId?.farmName || 'Farmer Sub-order'}` : 'Tracking History'}
            </h3>

            {isCancelled ? (
              <div className="flex items-start gap-4 p-4 bg-error-container/20 rounded-lg border border-error/20">
                <i className="pi pi-times-circle text-error text-2xl mt-1"></i>
                <div>
                  <h4 className="font-label-md text-label-md text-error font-bold mb-1">Cancelled</h4>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    {currentSubOrder?.cancelReason || order.cancelReason || 'This order was cancelled.'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative border-l-2 border-primary/20 ml-4 md:ml-6 space-y-10 pb-4">
                {STEPS.map((step, idx) => {
                  const timestamp = currentSubOrder ? currentSubOrder[step.key] : order[step.key];
                  const isDelivered = currentIndex === STATUS_ORDER.length - 1;
                  const isComplete = idx <= currentIndex;
                  const isActive = idx === currentIndex && !isDelivered;
                  const isDeliveredStep = isDelivered && idx === currentIndex;

                  return (
                    <div key={step.key} className={`relative pl-8 md:pl-10 ${!isComplete && !isActive ? 'opacity-50' : ''}`}>
                      <div className={`absolute -left-[17px] top-0 w-8 h-8 rounded-full flex items-center justify-center border-4 border-surface shadow-sm z-10 ${
                        isDeliveredStep ? 'bg-emerald-500 text-white shadow-emerald-500/50 ring-4 ring-emerald-300/40' :
                        isActive ? 'bg-primary text-white ring-4 ring-primary/30 animate-pulse' :
                        isComplete ? 'bg-primary text-white' :
                        'bg-surface-container-high border-2 border-outline-variant'
                      }`}>
                        {isDeliveredStep ? (
                          <i className="pi pi-check text-sm font-black"></i>
                        ) : isComplete ? (
                          <i className="pi pi-check text-sm"></i>
                        ) : (
                          <i className="pi pi-circle text-outline-variant text-xs"></i>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <h4 className={`font-label-md text-label-md font-bold mb-1 ${isDeliveredStep ? 'text-emerald-600 dark:text-emerald-400' : isActive ? 'text-primary' : 'text-on-background'}`}>
                          {step.title}
                        </h4>
                        {isDeliveredStep && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 animate-pulse">
                            Delivered <Check className="w-3 h-3 inline-block ml-0.5" />
                          </span>
                        )}
                      </div>
                      <p className="font-body-md text-body-md text-on-surface-variant">{step.desc}</p>
                      {formatTimestamp(timestamp) && (
                        <p className="font-label-sm text-label-sm text-outline mt-2">{formatTimestamp(timestamp)}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Order Snapshot & Help */}
          <div className="w-full md:w-72 shrink-0 flex flex-col gap-6">
            <div className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant/30 soft-shadow">
              <h3 className="font-label-md text-label-md text-on-background font-bold mb-4 border-b border-outline-variant/20 pb-2">
                {currentSubOrder ? `${currentSubOrder.farmerId?.farmName || 'Farmer'} Produce` : 'Order Snapshot'}
              </h3>
              <ul className="space-y-3 mb-4">
                {displayedItems.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <img
                      src={item.image || item.product?.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100&auto=format&fit=crop'}
                      alt={item.name || 'Produce'}
                      onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100&auto=format&fit=crop'; }}
                      className="w-10 h-10 rounded bg-surface-container object-cover"
                    />
                    <div>
                      <p className="font-label-sm text-label-sm text-on-background line-clamp-1">{item.name || 'Product'}</p>
                      <p className="font-label-sm text-[10px] text-on-surface-variant">Qty: {item.quantity} {item.unit || ''}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between font-label-sm text-label-sm text-on-background font-bold border-t border-outline-variant/20 pt-3 mb-4">
                <span>{currentSubOrder ? 'Subtotal' : 'Total'}</span>
                <span>₹{displayedTotal}</span>
              </div>
              
              {currentIndex === STATUS_ORDER.length - 1 && (
                <div className="mb-4">
                  <Button
                    label={<span className="flex items-center gap-2">Rate & Review Products <Star className="w-4 h-4 fill-current" /></span>}
                    className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-black rounded-xl px-4 py-3.5 shadow-lg shadow-emerald-600/30 border-none transition-all hover:scale-[1.02] active:scale-[0.98]"
                    onClick={() => navigate(`/delivery-success/${order._id}`)}
                  />
                </div>
              )}
              
              <Button
                label="View Full Details"
                text
                className="w-full text-center font-label-sm text-label-sm text-primary hover:underline p-0"
                onClick={() => navigate('/dashboard/customer')}
              />
            </div>

            <div className="bg-secondary-container/20 rounded-xl p-5 border border-secondary-container/30 text-center flex flex-col items-center">
              <i className="pi pi-user text-secondary text-3xl mb-2"></i>
              <h3 className="font-label-md text-label-md text-on-background font-bold mb-2">Need Help?</h3>
              <p className="font-body-md text-body-md text-on-surface-variant text-sm mb-4">Is there an issue with your tracking or order?</p>
              <Button
                label="Contact Support"
                outlined
                className="px-4 py-2 bg-white text-secondary border border-secondary/20 rounded-lg font-label-sm text-label-sm hover:bg-surface-container-lowest transition-colors shadow-sm"
                onClick={() => navigate('/contact')}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
