import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import toast from 'react-hot-toast';
import AnimatedPage from '../components/AnimatedPage';
import api from '../services/api';
import { getFallbackImage } from './Farmers';

export default function FarmerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [farmer, setFarmer] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFarmerProfile = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/users/farmer/${id}/profile`);
        setFarmer(data.data.farmer);
        setProducts(data.data.products || []);
        setError('');

        // Reviews are optional — don't block the page if this fails
        try {
          const reviewsRes = await api.get(`/reviews/farmer/${data.data.farmer._id}`);
          setReviews(reviewsRes.data.data || []);
        } catch {
          setReviews([]);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching farmer profile');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchFarmerProfile();
  }, [id]);

  const addToCart = async (productId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'customer') {
      toast.error('Only customers can place orders.');
      return;
    }
    try {
      await api.post('/cart', { productId, quantity: 1 });
      toast.success('Added to cart!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error adding to cart');
    }
  };

  if (loading) {
    return (
      <AnimatedPage className="flex-grow flex items-center justify-center min-h-screen">
        <ProgressSpinner />
      </AnimatedPage>
    );
  }

  if (error) {
    return (
      <AnimatedPage className="flex-grow flex items-center justify-center min-h-screen">
        <div className="text-red-500 font-title-lg">{error}</div>
      </AnimatedPage>
    );
  }

  if (!farmer) return null;

  const avgRating = farmer.rating ? farmer.rating.toFixed(1) : 'New';
  const location = [farmer.city, farmer.state].filter(Boolean).join(', ');
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];

  return (
    <AnimatedPage className="flex-grow w-full pt-[104px] pb-20">
      <main>
      {/* Cover Image & Profile Header */}
      <div className="w-full h-64 md:h-80 relative bg-emerald-950 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${farmer.coverImage || farmer.farmImage || getFallbackImage(categories, 1400)}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      </div>

      <div className="max-w-container-max mx-auto px-4 md:px-gutter relative -mt-24 mb-xl">
        <div className="glass-panel rounded-2xl p-6 md:p-8 soft-shadow flex flex-col md:flex-row gap-6 md:items-end bg-white/90 backdrop-blur-md">
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl border-4 border-white overflow-hidden bg-gradient-to-tr from-emerald-600 to-green-500 shadow-xl shrink-0 flex items-center justify-center text-white">
            <i className="pi pi-shop text-4xl text-white"></i>
          </div>
          <div className="flex-grow">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="font-headline-md text-headline-md text-on-background mb-1">{farmer.farmName}</h1>
                <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-2">
                  <i className="pi pi-user"></i>
                  Managed by {farmer.ownerName}
                </p>
                <p className="font-body-md text-body-md text-on-surface-variant flex items-center gap-2 mt-1">
                  <i className="pi pi-map-marker"></i>
                  {location || 'Location not specified'}
                </p>
              </div>
              <div className="flex flex-col items-end gap-3">
                <div className="flex items-center gap-2 text-[#F5B041]">
                  <i className="pi pi-star-fill text-xl"></i>
                  <span className="font-title-md text-title-md text-on-surface">{avgRating} <span className="text-on-surface-variant font-normal text-body-md">({reviews.length} Reviews)</span></span>
                </div>
                {farmer.verificationStatus === 'approved' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#e8f5e9] text-[#2e7d32] rounded-full font-label-sm text-sm">
                    <i className="pi pi-verified"></i> Verified Farm
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-container-max mx-auto px-4 md:px-gutter grid grid-cols-1 lg:grid-cols-3 gap-8 mb-xl">

        {/* Left Col: About & Reviews */}
        <div className="col-span-1 space-y-8">
          <div className="bg-white rounded-xl p-6 border border-outline-variant/20 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <i className="pi pi-info-circle text-[#2e7d32] text-xl"></i>
              <h2 className="font-title-lg text-title-lg text-on-background">About the Farm</h2>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed whitespace-pre-line">
              {farmer.farmDescription || 'No details provided about this farm.'}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-outline-variant/20 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <i className="pi pi-comments text-[#2e7d32] text-xl"></i>
              <h2 className="font-title-lg text-title-lg text-on-background">Customer Reviews</h2>
            </div>
            {reviews.length === 0 ? (
              <p className="text-on-surface-variant text-sm">No reviews yet.</p>
            ) : (
              <div className="space-y-4">
                {reviews.slice(0, 5).map((review) => (
                  <div key={review._id} className="border-b border-outline-variant/10 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-label-md text-label-md text-on-background font-semibold">{review.user?.name || 'Anonymous'}</span>
                      <span className="text-[#F5B041] flex items-center gap-1 text-sm">
                        <i className="pi pi-star-fill"></i> {review.rating}
                      </span>
                    </div>
                    {review.product?.name && (
                      <p className="text-xs text-on-surface-variant mb-1">On {review.product.name}</p>
                    )}
                    <p className="font-body-sm text-sm text-on-surface-variant">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Products */}
        <div className="col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-on-background">Current Harvest</h2>
            <Link to="/products" className="text-[#2e7d32] font-label-md text-label-md flex items-center gap-1 hover:underline">
              View All <i className="pi pi-arrow-right text-xs"></i>
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="bg-white p-8 rounded-xl text-center border border-outline-variant/20">
              <p className="text-on-surface-variant">No products currently available from this farm.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {products.map(product => (
                <div key={product._id} className="bg-white rounded-xl overflow-hidden border border-outline-variant/20 shadow-sm group flex flex-col">
                  <Link to={`/products/${product._id}`} className="aspect-[4/3] bg-surface-container relative overflow-hidden block">
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      alt={product.name}
                      src={product.images?.[0] || 'https://via.placeholder.com/400x300'}
                    />
                  </Link>
                  <div className="p-4 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <Link to={`/products/${product._id}`} className="font-title-md text-lg font-semibold text-on-background hover:text-primary transition-colors">{product.name}</Link>
                      <div className="text-right">
                        <span className="font-bold text-[#2e7d32] text-lg">₹{product.price}</span>
                        <span className="text-xs text-on-surface-variant">/{product.unit}</span>
                      </div>
                    </div>

                    <p className="font-body-sm text-sm text-on-surface-variant mb-4 flex-grow line-clamp-2">
                      {product.description}
                    </p>

                    <Button
                      label="Add to Order"
                      className="mt-auto w-full py-2 bg-transparent border border-[#2e7d32] text-[#2e7d32] rounded-lg font-label-md hover:bg-[#e8f5e9] transition-colors"
                      onClick={() => addToCart(product._id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </main>
    </AnimatedPage>
  );
}
