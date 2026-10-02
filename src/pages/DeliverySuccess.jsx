import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { InputTextarea } from 'primereact/inputtextarea';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import AnimatedPage from '../components/AnimatedPage';
import Confetti from '../components/Confetti';
import api from '../services/api';

const StarRating = ({ rating, onRatingChange }) => {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.button
          key={star}
          type="button"
          whileHover={{ scale: 1.25 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onRatingChange(star)}
          className={`text-2xl transition-colors ${star <= rating ? 'text-amber-400' : 'text-slate-200 dark:text-white/10 hover:text-amber-300'}`}
        >
          <i className="pi pi-star-fill"></i>
        </motion.button>
      ))}
    </div>
  );
};

export default function DeliverySuccess() {
  const { orderId } = useParams();
  const { user } = useSelector((state) => state.auth);
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Track review state per product: { [productId]: { rating: 0, comment: '', submitting: false, submitted: false } }
  const [reviews, setReviews] = useState({});

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const res = await api.get('/orders/myorders');
        const orders = res.data.data || [];
        const foundOrder = orders.find(o => o._id === orderId);
        
        if (!foundOrder) {
          setError('Order not found or unauthorized.');
        } else if (foundOrder.orderStatus !== 'Delivered') {
          setError('This order is not yet marked as delivered.');
        } else {
          setOrder(foundOrder);
          // Initialize reviews state
          const initialReviews = {};
          foundOrder.items.forEach(item => {
            initialReviews[item.product] = { rating: 0, comment: '', submitting: false, submitted: false };
          });
          setReviews(initialReviews);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching order details');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrderDetails();
    } else {
      setLoading(false);
    }
  }, [orderId, user]);

  const handleReviewChange = (productId, field, value) => {
    setReviews(prev => ({
      ...prev,
      [productId]: { ...prev[productId], [field]: value }
    }));
  };

  const submitReview = async (productId) => {
    const reviewData = reviews[productId];
    if (reviewData.rating === 0) {
      handleReviewChange(productId, 'error', 'Please select a star rating first.');
      return;
    }
    handleReviewChange(productId, 'error', null);
    
    handleReviewChange(productId, 'submitting', true);
    
    try {
      await api.post('/reviews', {
        productId,
        orderId,
        rating: reviewData.rating,
        comment: reviewData.comment || 'Great product!'
      });
      
      toast.success('Thank you for your review!');
      handleReviewChange(productId, 'submitted', true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error submitting review');
    } finally {
      handleReviewChange(productId, 'submitting', false);
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0f1711]">
        <ProgressSpinner strokeWidth="4" style={{ width: '48px', height: '48px' }} />
      </div>
    );
  }

  if (error) {
    return (
      <AnimatedPage className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0f1711] pt-20 px-4 text-center">
        <div className="bg-white dark:bg-[#141f15] p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 max-w-md w-full">
          <i className="pi pi-exclamation-circle text-4xl text-rose-500 mb-4"></i>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Oops!</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <Link to="/track-order">
            <Button label="Back to Tracking" className="bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-xl font-bold px-6 py-3 w-full" />
          </Link>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="min-h-screen bg-slate-50 dark:bg-[#0f1711] pt-32 sm:pt-36 pb-20">
      <Confetti duration={5000} />
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Success Banner */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-3xl p-8 sm:p-10 shadow-xl shadow-emerald-500/25 mb-8 border border-emerald-400 text-center"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10">
            <motion.div 
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 15, delay: 0.15 }}
              className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center"
            >
              <div className="absolute inset-0 rounded-full bg-white/40 animate-ping"></div>
              <div className="relative w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl">
                <i className="pi pi-check text-4xl text-emerald-600 font-black"></i>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider mb-3 backdrop-blur-sm border border-white/20">
                <i className="pi pi-sparkles text-amber-300"></i> Order Delivered Successfully
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">Delivery Confirmed!</h1>
              <p className="text-emerald-50 font-medium max-w-lg mx-auto text-sm sm:text-base">
                Your order #{order.orderNumber || order._id.substring(order._id.length - 6).toUpperCase()} has been dropped off at your location. We hope you enjoy your farm-fresh produce!
              </p>
            </motion.div>
          </div>
        </motion.div>

        <div className="mb-6 text-center sm:text-left">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Rate Your Products</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Your feedback helps local farmers improve and assists other buyers.</p>
        </div>

        {/* Product Reviews List */}
        <div className="space-y-6">
          {order.items.map(item => {
            const revState = reviews[item.product] || {};
            
            return (
              <div key={item.product} className="bg-white dark:bg-[#141f15] rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 p-6 flex flex-col md:flex-row gap-6 items-start">
                {/* Product Info */}
                <div className="flex items-center gap-4 w-full md:w-1/3 shrink-0">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                    <img loading="lazy" src={item.image || 'https://via.placeholder.com/150'} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg line-clamp-2 leading-tight mb-1">{item.name}</h3>
                    <p className="text-sm font-semibold text-slate-500">Qty: {item.quantity}</p>
                  </div>
                </div>

                {/* Review Form */}
                <div className="flex-grow w-full border-t md:border-t-0 md:border-l border-slate-100 dark:border-white/10 pt-6 md:pt-0 md:pl-6">
                  {revState.submitted ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-4">
                      <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                        <i className="pi pi-star-fill text-emerald-500 text-xl"></i>
                      </div>
                      <h4 className="font-bold text-emerald-600 mb-1">Review Submitted</h4>
                      <p className="text-xs text-slate-500 font-medium">Thank you for supporting this farmer!</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Rate this item</label>
                          <StarRating rating={revState.rating} onRatingChange={(val) => {
                            handleReviewChange(item.product, 'rating', val);
                            handleReviewChange(item.product, 'error', null);
                          }} />
                          {revState.error && <p className="text-red-500 text-[11px] font-semibold mt-1">{revState.error}</p>}
                        </div>
                        <Button 
                          label={revState.submitting ? 'Submitting...' : 'Submit Review'} 
                          disabled={revState.submitting || revState.rating === 0}
                          onClick={() => submitReview(item.product)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-xl font-bold px-6 py-2.5 shadow-md shadow-indigo-500/20 transition-all shrink-0"
                        />
                      </div>
                      <div>
                        <InputTextarea 
                          value={revState.comment} 
                          onChange={(e) => handleReviewChange(item.product, 'comment', e.target.value)} 
                          placeholder="Tell us what you thought about this product... (optional)"
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all resize-none"
                          rows={2}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link to="/dashboard/customer">
            <Button label="Back to Dashboard" outlined className="border-2 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 rounded-xl font-bold px-8 py-3.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-all" />
          </Link>
        </div>
      </main>
    </AnimatedPage>
  );
}
