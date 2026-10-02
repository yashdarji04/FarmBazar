import { Link, useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { ProgressSpinner } from 'primereact/progressspinner';
import toast from 'react-hot-toast';
import { Sprout } from 'lucide-react';
import AnimatedPage from '../components/AnimatedPage';
import api from '../services/api';
import SEO from '../components/SEO';

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [starFilter, setStarFilter] = useState('all');

  // Customer write review state
  const [eligibleOrder, setEligibleOrder] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching product', error);
        setLoading(false);
      }
    };
    if (id) {
      fetchProduct();
    }
  }, [id]);

  // Fetch product reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoadingReviews(true);
        const res = await api.get(`/reviews/product/${id}`);
        setReviews(res.data.data || []);
      } catch (error) {
        console.error('Error fetching product reviews', error);
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };
    if (id) {
      fetchReviews();
    }
  }, [id]);

  // Check if current logged-in customer has a delivered order eligible for review
  useEffect(() => {
    const checkDeliveredOrder = async () => {
      if (!user || user.role !== 'customer') return;
      try {
        const res = await api.get('/orders/myorders');
        const myOrders = res.data.data || [];
        // Find delivered order containing this product
        const delivered = myOrders.find((ord) =>
          ord.orderStatus === 'Delivered' &&
          ord.items?.some((item) => (item.product?._id || item.product) === id)
        );
        if (delivered) {
          setEligibleOrder(delivered);
        }
      } catch (err) {
        console.error('Error checking user order history', err);
      }
    };
    if (id && user) {
      checkDeliveredOrder();
    }
  }, [id, user]);

  // Has the user already reviewed this product?
  const hasUserReviewed = useMemo(() => {
    if (!user || !reviews.length) return false;
    return reviews.some((r) => (r.user?._id || r.user) === user._id);
  }, [user, reviews]);

  // Derived rating metrics
  const totalReviewsCount = reviews.length > 0 ? reviews.length : (product?.totalReviews || 0);
  const averageRating = useMemo(() => {
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
      return (sum / reviews.length).toFixed(1);
    }
    if (product?.rating > 0) {
      return Number(product.rating).toFixed(1);
    }
    return null;
  }, [reviews, product]);

  // Distribution of star ratings
  const ratingDistribution = useMemo(() => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const rounded = Math.round(r.rating);
      if (dist[rounded] !== undefined) {
        dist[rounded] += 1;
      }
    });
    return dist;
  }, [reviews]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    if (starFilter === 'all') return reviews;
    return reviews.filter((r) => Math.round(r.rating) === Number(starFilter));
  }, [reviews, starFilter]);

  const addToCart = async () => {
    if (!user) {
      toast.error('Please sign in to order.');
      navigate('/login');
      return;
    }
    if (user.role !== 'customer') {
      toast.error('Only customer accounts can place orders.');
      return;
    }
    if ((product.quantity ?? 0) <= 0 || product.isAvailable === false) {
      toast.error('Sorry, this produce is currently out of stock.');
      return;
    }
    try {
      await api.post('/cart', { productId: product._id, quantity });
      toast.success(`Added ${quantity} ${product.unit || 'unit'}(s) to your cart!`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error adding to cart');
    }
  };

  const buyNow = async () => {
    if (!user) {
      toast.error('Please sign in to order.');
      navigate('/login');
      return;
    }
    if (user.role !== 'customer') {
      toast.error('Only customer accounts can place orders.');
      return;
    }
    if ((product.quantity ?? 0) <= 0 || product.isAvailable === false) {
      toast.error('Sorry, this produce is currently out of stock.');
      return;
    }
    try {
      await api.post('/cart', { productId: product._id, quantity });
      navigate('/checkout');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error starting checkout');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newRating) {
      toast.error('Please select a star rating.');
      return;
    }
    if (!eligibleOrder) {
      toast.error('Only customers with a delivered order for this product can leave a review.');
      return;
    }

    setSubmittingReview(true);
    try {
      await api.post('/reviews', {
        productId: product._id,
        orderId: eligibleOrder._id,
        rating: Number(newRating),
        comment: newComment.trim() || 'Fresh and excellent produce direct from the farm!',
      });

      toast.success('Thank you! Your customer review has been published.');
      setIsReviewModalOpen(false);
      setNewComment('');

      // Refresh reviews & product data
      const [resRev, resProd] = await Promise.all([
        api.get(`/reviews/product/${id}`),
        api.get(`/products/${id}`),
      ]);
      setReviews(resRev.data.data || []);
      setProduct(resProd.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error submitting review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const scrollToReviews = () => {
    const el = document.getElementById('customer-reviews');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <AnimatedPage>
      <SEO title="Buy Fresh Farm Products Online - FarmBazar" description="Explore fresh vegetables, fruits, grains, and organic products from trusted local farmers on FarmBazar." />
        <div className="min-h-screen flex items-center justify-center pt-20">
          <ProgressSpinner strokeWidth="4" style={{ width: '48px', height: '48px' }} />
        </div>
      </AnimatedPage>
    );
  }

  if (!product) {
    return (
      <AnimatedPage>
        <div className="min-h-screen flex flex-col items-center justify-center pt-20 text-center px-4">
          <i className="pi pi-exclamation-circle text-4xl text-rose-500 mb-3" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Produce Not Found</h2>
          <p className="text-xs text-slate-500 mb-6">The item you are looking for may have been sold out or unlisted.</p>
          <button
            onClick={() => navigate('/products')}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
          >
            Back to Marketplace
          </button>
        </div>
      </AnimatedPage>
    );
  }

  const allImages = product.images?.length ? product.images : ['https://via.placeholder.com/600x450'];

  return (
    <AnimatedPage>
      <main className="min-h-screen bg-background text-on-background pt-[104px] pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-white/60 mb-8 overflow-x-auto">
            <Link to="/" className="hover:text-emerald-600 transition-colors">Home</Link>
            <i className="pi pi-chevron-right text-[10px] text-slate-400" />
            <Link to="/products" className="hover:text-emerald-600 transition-colors">Marketplace</Link>
            <i className="pi pi-chevron-right text-[10px] text-slate-400" />
            <span className="text-emerald-700 dark:text-emerald-400 truncate max-w-[200px]">{product.name}</span>
          </div>

          {/* Main Product Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left: Images (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-white dark:bg-[#182318] border border-slate-200/80 dark:border-emerald-900/30 shadow-md">
                <img
                  src={allImages[selectedImage] || allImages[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-md">
                  {product.category || '100% Organic'}
                </div>
              </div>

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                        selectedImage === idx ? 'border-emerald-600 shadow-md scale-105' : 'border-slate-200 dark:border-white/10 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img loading="lazy" src={img} alt="thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Guarantee highlights */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="p-3.5 rounded-2xl bg-surface-container-low/60 border border-outline-variant/40 text-center">
                  <i className="pi pi-sun text-amber-500 text-lg mb-1 block" />
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Morning Picked</p>
                  <p className="text-[10px] text-slate-500">Fresh within 24h</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-surface-container-low/60 border border-outline-variant/40 text-center">
                  <i className="pi pi-shield text-emerald-600 text-lg mb-1 block" />
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Pesticide-Free</p>
                  <p className="text-[10px] text-slate-500">Naturally grown</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-surface-container-low/60 border border-outline-variant/40 text-center">
                  <i className="pi pi-refresh text-blue-500 text-lg mb-1 block" />
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Fresh Guarantee</p>
                  <p className="text-[10px] text-slate-500">Instant replace</p>
                </div>
              </div>
            </div>

            {/* Right: Buy & Details Card (5 cols) */}
            <div className="lg:col-span-5">
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#182318] border border-slate-200/80 dark:border-emerald-900/40 shadow-xl space-y-6">
                
                {/* Header info */}
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2">
                    {product.name}
                  </h1>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-3xl font-black text-emerald-700 dark:text-emerald-400">
                      ₹{product.price}
                    </span>
                    <span className="text-sm font-semibold text-slate-400">
                      / {product.unit || 'kg'}
                    </span>
                  </div>

                  {/* Rating with smooth scroll to reviews */}
                  <div className="flex items-center gap-2 text-xs">
                    {averageRating ? (
                      <>
                        <div className="flex items-center text-amber-500">
                          <i className="pi pi-star-fill text-xs mr-1" />
                          <span className="font-extrabold text-slate-900 dark:text-white">{averageRating}</span>
                        </div>
                        <span className="text-slate-400">·</span>
                        <button
                          type="button"
                          onClick={scrollToReviews}
                          className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <span>({totalReviewsCount} customer {totalReviewsCount === 1 ? 'rating' : 'ratings'})</span>
                          <i className="pi pi-arrow-down text-[10px]" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                          <Sprout className="w-3.5 h-3.5 inline-block mr-1" /> Fresh Harvest
                        </span>
                        <span className="text-slate-400">·</span>
                        <button
                          type="button"
                          onClick={scrollToReviews}
                          className="text-slate-500 hover:text-emerald-600 transition-colors"
                        >
                          (No customer ratings yet)
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Farmer Info Bar */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                      <i className="pi pi-shop text-sm" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {product.farmerId?.farmName || 'Gujarat Organic Partner Farm'}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-white/60 flex items-center gap-1">
                        <i className="pi pi-map-marker text-emerald-600 text-[10px]" />
                        {product.farmerId?.city || product.city || 'Ahmedabad District'}
                      </p>
                    </div>
                  </div>
                  {product.farmerId?._id && (
                    <Link
                      to={`/farmer/${product.farmerId._id}`}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-white/10 text-emerald-800 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition-colors shadow-sm"
                    >
                      View Farm
                    </Link>
                  )}
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Harvest Description</h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                    {product.description || 'Carefully cultivated by certified local farming families with pure organic compost and natural irrigation.'}
                  </p>
                </div>

                {/* Quantity & Stock */}
                {(() => {
                  const isOutOfStock = (product.quantity ?? 0) <= 0 || product.isAvailable === false;
                  return (
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Select Quantity</span>
                        <span className={`text-xs font-bold ${isOutOfStock ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                          {isOutOfStock ? 'Out of Stock' : `In Stock: ${product.quantity} ${product.unit || 'units'}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center rounded-2xl border border-slate-200 dark:border-white/20 p-1 bg-slate-50 dark:bg-white/5">
                          <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            disabled={isOutOfStock}
                            className="w-9 h-9 rounded-xl hover:bg-white dark:hover:bg-white/10 flex items-center justify-center font-bold text-slate-700 dark:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <i className="pi pi-minus text-xs" />
                          </button>
                          <span className="w-12 text-center text-sm font-extrabold text-slate-900 dark:text-white">
                            {isOutOfStock ? 0 : quantity}
                          </span>
                          <button
                            onClick={() => setQuantity(Math.min(product.quantity || 1, quantity + 1))}
                            disabled={isOutOfStock}
                            className="w-9 h-9 rounded-xl hover:bg-white dark:hover:bg-white/10 flex items-center justify-center font-bold text-slate-700 dark:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <i className="pi pi-plus text-xs" />
                          </button>
                        </div>

                        <div className="text-xs text-slate-500 font-medium">
                          Total: <span className="font-bold text-slate-900 dark:text-white">₹{isOutOfStock ? 0 : product.price * quantity}</span>
                        </div>
                      </div>

                      {/* Primary Action Buttons */}
                      <div className="grid grid-cols-2 gap-3 pt-5">
                        {isOutOfStock ? (
                          <button
                            disabled
                            className="col-span-2 py-3.5 rounded-2xl bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-white/40 font-bold text-xs sm:text-sm cursor-not-allowed flex items-center justify-center gap-2 border border-slate-200 dark:border-white/10"
                          >
                            <i className="pi pi-ban text-xs" />
                            Currently Out of Stock
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={addToCart}
                              className="py-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 font-bold text-xs sm:text-sm transition-all border border-emerald-300/50 flex items-center justify-center gap-2"
                            >
                              <i className="pi pi-shopping-cart text-xs" />
                              Add to Cart
                            </button>

                            <button
                              onClick={buyNow}
                              className="py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2"
                            >
                              <i className="pi pi-bolt text-xs" />
                              Buy Now
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Delivery promise */}
                <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-white/60">
                  <i className="pi pi-truck text-emerald-600 text-sm" />
                  <span>Delivered fresh across Ahmedabad in 24–48 hours</span>
                </div>

              </div>
            </div>

          </div>

          {/* ── Customer Reviews & Ratings Section ────────────────────────────── */}
          <section id="customer-reviews" className="mt-16 pt-12 border-t border-slate-200/80 dark:border-emerald-900/30">
            
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-2">
                  <i className="pi pi-check-circle text-xs" />
                  Verified Customer Feedback
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  Customer Reviews
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-white/60 mt-1">
                  Authentic ratings and experiences shared by customers who received this harvest
                </p>
              </div>

              {eligibleOrder && !hasUserReviewed && (
                <button
                  onClick={() => setIsReviewModalOpen(true)}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-900/20 transition-all flex items-center gap-2 self-start sm:self-auto hover:-translate-y-0.5"
                >
                  <i className="pi pi-pencil text-xs" />
                  Write a Customer Review
                </button>
              )}
            </div>

            {/* Reviews Overview & List Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Rating Summary Card (4 cols) */}
              <div className="lg:col-span-4 p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#182318] border border-slate-200/80 dark:border-emerald-900/40 shadow-sm space-y-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Overall Rating</h3>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white">
                      {averageRating || '0.0'}
                    </span>
                    <span className="text-sm text-slate-400 font-semibold">out of 5</span>
                  </div>

                  {/* Stars display */}
                  <div className="flex items-center gap-1.5 text-amber-500 text-lg mt-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const numAvg = Number(averageRating) || 0;
                      return (
                        <i
                          key={star}
                          className={`pi ${
                            numAvg >= star
                              ? 'pi-star-fill'
                              : numAvg >= star - 0.5
                              ? 'pi-star-fill text-amber-300'
                              : 'pi-star text-slate-300 dark:text-white/20'
                          }`}
                        />
                      );
                    })}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-white/60 mt-1 font-medium">
                    Based on {reviews.length} verified customer {reviews.length === 1 ? 'review' : 'reviews'}
                  </p>
                </div>

                {/* Rating Distribution Breakdown */}
                <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-white/5">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-white/80 mb-2">Rating Breakdown</h4>
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = ratingDistribution[stars] || 0;
                    const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <button
                        key={stars}
                        onClick={() => setStarFilter(starFilter === String(stars) ? 'all' : String(stars))}
                        className={`w-full flex items-center gap-2 text-xs py-1 px-1.5 rounded-lg transition-colors text-left group ${
                          starFilter === String(stars) ? 'bg-emerald-50 dark:bg-emerald-950/40 font-bold' : 'hover:bg-slate-50 dark:hover:bg-white/5'
                        }`}
                      >
                        <span className="w-7 font-bold text-slate-600 dark:text-white/70 flex items-center gap-0.5">
                          {stars} <i className="pi pi-star-fill text-amber-500 text-[10px]" />
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-amber-400 group-hover:bg-emerald-600 transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="w-6 text-right text-slate-400 text-[11px] font-medium">{count}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Trust highlight */}
                <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-start gap-3 text-xs text-slate-500 dark:text-white/60">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <i className="pi pi-shield text-sm" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white">100% Genuine Reviews</p>
                    <p className="text-[11px] text-slate-400">Only customers with confirmed, delivered orders can submit feedback.</p>
                  </div>
                </div>

              </div>

              {/* Right Column: Customer Reviews Feed (8 cols) */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                
                {/* Filter Pills Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  <button
                    onClick={() => setStarFilter('all')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      starFilter === 'all'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white dark:bg-[#182318] text-slate-600 dark:text-white/70 border border-slate-200 dark:border-emerald-900/30 hover:bg-emerald-50 dark:hover:bg-white/5'
                    }`}
                  >
                    All ({reviews.length})
                  </button>
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = ratingDistribution[stars] || 0;
                    return (
                      <button
                        key={stars}
                        onClick={() => setStarFilter(String(stars))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                          starFilter === String(stars)
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-white dark:bg-[#182318] text-slate-600 dark:text-white/70 border border-slate-200 dark:border-emerald-900/30 hover:bg-emerald-50 dark:hover:bg-white/5'
                        }`}
                      >
                        <span>{stars}</span>
                        <i className="pi pi-star-fill text-[10px] text-amber-400" />
                        <span className="text-[10px] opacity-75">({count})</span>
                      </button>
                    );
                  })}
                  {starFilter !== 'all' && (
                    <button
                      onClick={() => setStarFilter('all')}
                      className="text-xs text-rose-500 font-semibold hover:underline px-2"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Reviews Content */}
                {loadingReviews ? (
                  <div className="p-12 text-center bg-white dark:bg-[#182318] rounded-3xl border border-slate-200/80 dark:border-emerald-900/40">
                    <i className="pi pi-spin pi-spinner text-3xl text-emerald-600 mb-2" />
                    <p className="text-xs text-slate-500">Loading customer reviews...</p>
                  </div>
                ) : filteredReviews.length === 0 ? (
                  <div className="p-10 text-center bg-white dark:bg-[#182318] rounded-3xl border border-slate-200/80 dark:border-emerald-900/40">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                      <i className="pi pi-comments text-2xl" />
                    </div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                      {starFilter === 'all' ? 'No Customer Reviews Yet' : `No ${starFilter}-Star Reviews Yet`}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-white/60 max-w-sm mx-auto mb-4">
                      {starFilter === 'all'
                        ? 'Be the first to try this fresh harvest! Once your delivery arrives, you can share your feedback with the community.'
                        : `No reviews found matching the ${starFilter}-star filter.`}
                    </p>
                    {starFilter !== 'all' && (
                      <button
                        onClick={() => setStarFilter('all')}
                        className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/10 text-xs font-bold text-slate-700 dark:text-white"
                      >
                        Show All Reviews
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredReviews.map((rev) => {
                      const reviewerName = rev.user?.name || 'Customer';
                      const reviewerInitials = reviewerName
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase();
                      const isCurrentUser = user && (rev.user?._id === user._id || rev.user === user._id);

                      return (
                        <div
                          key={rev._id}
                          className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#182318] border border-slate-200/80 dark:border-emerald-900/30 shadow-sm transition-all hover:border-emerald-300 dark:hover:border-emerald-800/60"
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              {/* Avatar */}
                              {rev.user?.profileImage ? (
                                <img
                                  src={rev.user.profileImage}
                                  alt={reviewerName}
                                  className="w-10 h-10 rounded-2xl object-cover border border-slate-200 dark:border-white/10"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white font-extrabold flex items-center justify-center text-xs shadow-sm">
                                  {reviewerInitials}
                                </div>
                              )}

                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                    {reviewerName}
                                  </h4>
                                  {isCurrentUser && (
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-black">
                                      You
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                                    <i className="pi pi-check text-[9px]" /> Verified Purchase
                                  </span>
                                  {rev.createdAt && (
                                    <>
                                      <span className="text-slate-300 dark:text-white/20">·</span>
                                      <span className="text-[11px] text-slate-400">
                                        {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric',
                                        })}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Stars badge */}
                            <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-xl border border-amber-200/60 dark:border-amber-800/40">
                              <i className="pi pi-star-fill text-amber-500 text-xs" />
                              <span className="text-xs font-extrabold text-amber-700 dark:text-amber-300">
                                {rev.rating}
                              </span>
                            </div>
                          </div>

                          {/* Comment */}
                          <p className="text-xs sm:text-sm text-slate-700 dark:text-white/80 leading-relaxed font-normal">
                            {rev.comment}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>

            </div>

          </section>

        </div>
      </main>

      {/* ── Review Submission Modal ────────────────────────────── */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#182318] border border-slate-200 dark:border-emerald-900/60 shadow-2xl p-6 sm:p-8 relative">
            <button
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
            >
              <i className="pi pi-times text-xs" />
            </button>

            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">
              Rate & Review {product.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-white/60 mb-6">
              Share your thoughts on freshness, taste, and delivery with other customers.
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-5">
              {/* Star selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Your Overall Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setNewRating(star)}
                      className="p-1 transition-transform hover:scale-125 focus:outline-none"
                    >
                      <i
                        className={`text-2xl pi ${
                          (hoverRating || newRating) >= star
                            ? 'pi-star-fill text-amber-500'
                            : 'pi-star text-slate-300 dark:text-white/20'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-bold text-slate-800 dark:text-white">
                    {hoverRating || newRating} / 5 Stars
                  </span>
                </div>
              </div>

              {/* Comment text */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Your Review
                </label>
                <textarea
                  rows={4}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="How was the freshness, flavor, and packing of this harvest?"
                  className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  disabled={submittingReview}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
                >
                  {submittingReview ? (
                    <>
                      <i className="pi pi-spin pi-spinner text-xs" />
                      Publishing...
                    </>
                  ) : (
                    'Submit Review'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AnimatedPage>
  );
}
