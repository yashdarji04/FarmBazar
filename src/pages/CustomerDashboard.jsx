import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import toast from 'react-hot-toast';
import { Wheat, Phone } from 'lucide-react';
import AnimatedPage from '../components/AnimatedPage';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout, updateUser } from '../store/slices/authSlice';
import api from '../services/api';
import SEO from '../components/SEO';

export default function CustomerDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTabState] = useState(searchParams.get('tab') || 'dashboard');

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    setSearchParams({ tab });
  };
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [selectedCancelReason, setSelectedCancelReason] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Profile State
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        pincode: user.pincode || ''
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        console.log("Fetching orders for customer...");
        const res = await api.get('/orders/myorders');
        console.log("Orders response:", res.data);
        setOrders(res.data.data || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching orders', error);
        setErrorMsg(error.response?.data?.message || error.message || "Unknown error");
        setOrders([]);
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!profileData.name || !profileData.name.trim()) {
      newErrors.name = 'Full name is required';
    }
    if (!profileData.email || !profileData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (profileData.phone && !/^[0-9]{10}$/.test(profileData.phone.replace(/[\s+\-]/g, '').replace(/^91/, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    if (profileData.pincode && !/^[0-9]{6}$/.test(profileData.pincode.trim())) {
      newErrors.pincode = 'Please enter a valid 6-digit pincode';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    
    setUpdatingProfile(true);
    try {
      const res = await api.put('/users/profile', profileData);
      dispatch(updateUser(res.data.data));
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const activeOrder = orders.find(o => o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled');

  const renderDashboard = () => (
    <div className="animate-fade-in">
      {!user?.hasPassword && (
        <div className="mb-8 p-5 rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-700 dark:text-amber-300 shadow-sm flex-shrink-0">
              <i className="pi pi-lock text-xl"></i>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Enable Email & Password Login</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                You currently sign in with Google. Set a password so you can also log in directly by typing your email and password.
              </p>
            </div>
          </div>
          <Link to="/set-password">
            <button className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all whitespace-nowrap hover:-translate-y-0.5">
              Set Password Now
            </button>
          </Link>
        </div>
      )}


      {activeOrder && (
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-3xl p-6 shadow-lg shadow-emerald-500/30 mb-8 border border-emerald-400 group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-all duration-500"></div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
            <div>
              <span className="inline-block px-3 py-1 bg-white/20 text-white rounded-full text-xs font-bold uppercase tracking-wider mb-3 shadow-sm border border-white/20 backdrop-blur-md">Active Order</span>
              <h3 className="text-2xl font-black text-white mb-1">Order #{activeOrder._id.substring(activeOrder._id.length - 6).toUpperCase()}</h3>
              <p className="font-semibold text-emerald-50">Status: {activeOrder.orderStatus}</p>
            </div>
            <Link to={`/track-order?id=${activeOrder._id}`}>
              <Button label="Track Order" outlined className="px-6 py-2.5 bg-white text-emerald-600 border-none rounded-xl font-bold shadow-sm hover:bg-emerald-50 hover:-translate-y-0.5 transition-all whitespace-nowrap" />
            </Link>
          </div>
        </div>
      )}

      {/* Last Order Products Card */}
      {!loading && orders.length > 0 && (() => {
        const lastOrder = orders[0];
        return (
          <div className="bg-white dark:bg-[#141f15] rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden mb-8">
      <SEO title="Customer Dashboard - FarmBazar" description="Manage your FarmBazar orders and profile." />
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <i className="pi pi-shopping-bag text-lg"></i>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">Last Order</h2>
                  <p className="text-xs text-slate-500">#{lastOrder._id.substring(lastOrder._id.length - 6).toUpperCase()} &bull; {new Date(lastOrder.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                lastOrder.orderStatus === 'Delivered' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                lastOrder.orderStatus === 'Cancelled' ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' :
                'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
              }`}>{lastOrder.orderStatus}</span>
            </div>
            <div className="p-6">
              {lastOrder.farmerOrders && lastOrder.farmerOrders.length > 0 ? (
                <div className="space-y-5">
                  {lastOrder.farmerOrders.map((subOrder, fIdx) => (
                    <div key={fIdx} className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-200/50 dark:border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">
                            <Wheat className="w-4 h-4" />
                          </span>
                          <div>
                            <span className="font-bold text-sm text-slate-800 dark:text-white">
                              {subOrder.farmerId?.farmName || `Farmer #${fIdx + 1}`}
                            </span>
                            {subOrder.farmerId?.city && (
                              <span className="text-[11px] text-slate-400 block">{subOrder.farmerId.city}</span>
                            )}
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          subOrder.farmerOrderStatus === 'Delivered' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                          subOrder.farmerOrderStatus === 'Cancelled' ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' :
                          'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                        }`}>
                          {subOrder.farmerOrderStatus}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {subOrder.items?.map((item, idx) => (
                          <div key={idx} style={{ animationDelay: `${idx * 60}ms` }} className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-100 dark:border-white/5">
                            <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 overflow-hidden">
                              {item.image ? (
                                <img loading="lazy" src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <i className="pi pi-apple text-emerald-600 dark:text-emerald-400 text-lg"></i>
                              )}
                            </div>
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <span className="text-xs font-bold text-slate-800 dark:text-white truncate">{item.name}</span>
                              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">₹{item.price} / {item.unit || 'unit'}</span>
                              <span className="text-[11px] text-slate-400">Qty: {item.quantity}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-right">
                        <span className="text-xs font-semibold text-slate-500">Subtotal: </span>
                        <span className="text-xs font-black text-slate-800 dark:text-white">₹{subOrder.subtotal}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {lastOrder.items?.map((item, idx) => (
                    <div key={idx} style={{ animationDelay: `${idx * 80}ms`, opacity: 0 }} className="animate-fade-in-up flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 hover:border-emerald-200 dark:hover:border-emerald-900/50 hover:shadow-sm transition-all">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 overflow-hidden">
                        {item.image ? (
                          <img loading="lazy" src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <i className="pi pi-apple text-emerald-600 dark:text-emerald-400 text-xl"></i>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm font-bold text-slate-800 dark:text-white truncate">{item.name}</span>
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">₹{item.price} / {item.unit || 'unit'}</span>
                        <span className="text-xs text-slate-400 font-medium">Qty: {item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-5 pt-5 border-t border-slate-100 dark:border-white/5 flex flex-wrap justify-between items-center gap-3">
                <span className="text-sm text-slate-500 font-medium">
                  {lastOrder.farmerOrders?.length ? `${lastOrder.farmerOrders.length} Farmer(s) • ` : ''}
                  {lastOrder.items?.length} item{lastOrder.items?.length !== 1 ? 's' : ''} &bull; Total: <span className="font-black text-slate-800 dark:text-white">₹{lastOrder.totalAmount}</span>
                </span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedOrderDetails(lastOrder)} className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-bold text-slate-700 dark:text-white transition-all">
                    Order Details
                  </button>
                  <button onClick={() => setActiveTab('orders')} className="text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:underline">
                    View all orders →
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="bg-white dark:bg-[#141f15] rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <i className="pi pi-history text-lg"></i>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Recent Orders</h2>
            </div>
          </div>
          <button onClick={() => setActiveTab('orders')} className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Farmers & Items</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status & Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-400 font-medium">Loading orders...</td></tr>
              ) : errorMsg ? (
                <tr><td colSpan="5" className="p-8 text-center text-red-500 font-medium">Error: {errorMsg}</td></tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <i className="pi pi-box text-2xl"></i>
                    </div>
                    <p className="text-slate-500 font-medium">You have no orders yet.</p>
                  </td>
                </tr>
              ) : (
                orders.slice(0, 5).map(order => (
                  <tr key={order._id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-white">#{order._id.substring(order._id.length - 6).toUpperCase()}</td>
                    <td className="px-6 py-4 font-semibold text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      {order.farmerOrders && order.farmerOrders.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          {order.farmerOrders.map((fo, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-200">
                                <Wheat className="w-3 h-3" /> {fo.farmerId?.farmName || `Farmer #${idx + 1}`}:
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                fo.farmerOrderStatus === 'Delivered' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                fo.farmerOrderStatus === 'Cancelled' ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' :
                                'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                              }`}>
                                {fo.farmerOrderStatus}
                              </span>
                            </div>
                          ))}
                          <span className="text-[11px] text-slate-400">{order.items?.length || 0} total item{order.items?.length !== 1 ? 's' : ''}</span>
                        </div>
                      ) : (
                        <span className="font-semibold text-slate-600">{order.items?.length || 0} items</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-black text-slate-800 dark:text-white">₹{order.totalAmount}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          order.orderStatus === 'Delivered' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                          order.orderStatus === 'Cancelled' ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' :
                          'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                        }`}>
                          {order.orderStatus}
                        </span>
                        <button onClick={() => setSelectedOrderDetails(order)} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold shadow-sm transition-all whitespace-nowrap">
                          Details
                        </button>
                        {order.orderStatus !== 'Delivered' && order.orderStatus !== 'Cancelled' && (
                          <Link to={`/track-order?id=${order._id}`}>
                            <button className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold shadow-sm transition-all whitespace-nowrap">
                              Track
                            </button>
                          </Link>
                        )}
                      </div>
                      {order.orderStatus === 'Cancelled' && order.cancelReason && (
                        <button onClick={() => setSelectedCancelReason(order.cancelReason)} className="px-2 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 rounded-lg text-[10px] font-bold shadow-sm transition-all whitespace-nowrap">
                          Reason <i className="pi pi-info-circle ml-0.5 text-[9px]"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="animate-fade-in bg-white dark:bg-[#141f15] rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
            <i className="pi pi-receipt text-lg"></i>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Order History</h2>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Farmers & Items</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Total</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status & Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {loading ? (
              <tr><td colSpan="5" className="p-8 text-center text-slate-400 font-medium">Loading orders...</td></tr>
            ) : errorMsg ? (
              <tr><td colSpan="5" className="p-8 text-center text-red-500 font-medium">Error: {errorMsg}</td></tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <i className="pi pi-box text-2xl"></i>
                  </div>
                  <p className="text-slate-500 font-medium">You have no orders yet.</p>
                </td>
              </tr>
            ) : (
              orders.map(order => (
                <tr key={order._id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4 font-bold text-slate-700 dark:text-white">#{order._id.substring(order._id.length - 6).toUpperCase()}</td>
                  <td className="px-6 py-4 font-semibold text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    {order.farmerOrders && order.farmerOrders.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        {order.farmerOrders.map((fo, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-200">
                              <Wheat className="w-3 h-3" /> {fo.farmerId?.farmName || `Farmer #${idx + 1}`}:
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              fo.farmerOrderStatus === 'Delivered' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                              fo.farmerOrderStatus === 'Cancelled' ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' :
                              'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                            }`}>
                              {fo.farmerOrderStatus}
                            </span>
                          </div>
                        ))}
                        <span className="text-[11px] text-slate-400">{order.items?.length || 0} total item{order.items?.length !== 1 ? 's' : ''}</span>
                      </div>
                    ) : (
                      <span className="font-semibold text-slate-600">{order.items?.length || 0} items</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-black text-slate-800 dark:text-white">₹{order.totalAmount}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          order.orderStatus === 'Delivered' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                          order.orderStatus === 'Cancelled' ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' :
                          'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                        }`}>
                        {order.orderStatus}
                      </span>
                      <button onClick={() => setSelectedOrderDetails(order)} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold shadow-sm transition-all whitespace-nowrap">
                        Details
                      </button>
                      {order.orderStatus !== 'Delivered' && order.orderStatus !== 'Cancelled' && (
                        <Link to={`/track-order?id=${order._id}`}>
                          <button className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold shadow-sm transition-all whitespace-nowrap">
                            Track
                          </button>
                        </Link>
                      )}
                    </div>
                    {order.orderStatus === 'Cancelled' && order.cancelReason && (
                      <button onClick={() => setSelectedCancelReason(order.cancelReason)} className="px-2 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 rounded-lg text-[10px] font-bold shadow-sm transition-all whitespace-nowrap">
                        Reason <i className="pi pi-info-circle ml-0.5 text-[9px]"></i>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="animate-fade-in bg-white dark:bg-[#141f15] rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden p-6 md:p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <i className="pi pi-user text-xl"></i>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Profile Settings</h2>
          <p className="text-sm font-medium text-slate-500">Manage your personal information</p>
        </div>
      </div>
      
      <form onSubmit={handleProfileUpdate} className="flex flex-col gap-6 max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Full Name</label>
            <InputText value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} className={`p-3.5 bg-slate-50 dark:bg-white/5 border rounded-xl focus:ring-2 transition-all shadow-sm ${errors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:ring-indigo-500 focus:border-indigo-500'}`} placeholder="Yash Darji" required />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Email Address</label>
            <InputText type="email" value={profileData.email} onChange={(e) => setProfileData({...profileData, email: e.target.value})} className={`p-3.5 bg-slate-50 dark:bg-white/5 border rounded-xl focus:ring-2 transition-all shadow-sm ${errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:ring-indigo-500 focus:border-indigo-500'}`} placeholder="yash@example.com" required />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Phone Number</label>
          <div className="flex items-stretch">
            <span className="inline-flex items-center px-4 rounded-l-xl bg-slate-100 dark:bg-white/10 border border-r-0 border-slate-200 dark:border-white/10 text-sm font-bold text-slate-600 dark:text-white/70 select-none">+91</span>
            <InputText value={profileData.phone} onChange={(e) => { const val = e.target.value.replace(/\D/g, ''); setProfileData({...profileData, phone: val}); }} className={`w-full p-3.5 rounded-r-xl rounded-l-none bg-slate-50 dark:bg-white/5 border border-l-0 focus:ring-2 transition-all shadow-sm ${errors.phone ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:ring-indigo-500 focus:border-indigo-500'}`} placeholder="9876543210" maxLength={10} required />
          </div>
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Street Address</label>
          <InputText value={profileData.address} onChange={(e) => setProfileData({...profileData, address: e.target.value})} className="p-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm" placeholder="Flat 401, Bodakdev, SG Highway" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">City</label>
            <InputText value={profileData.city} onChange={(e) => setProfileData({...profileData, city: e.target.value})} className="p-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm" placeholder="Ahmedabad" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">State</label>
            <InputText value={profileData.state} onChange={(e) => setProfileData({...profileData, state: e.target.value})} className="p-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm" placeholder="Gujarat" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Pincode</label>
            <InputText value={profileData.pincode} onChange={(e) => setProfileData({...profileData, pincode: e.target.value})} className={`p-3.5 bg-slate-50 dark:bg-white/5 border rounded-xl focus:ring-2 transition-all shadow-sm ${errors.pincode ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:ring-indigo-500 focus:border-indigo-500'}`} placeholder="380054" maxLength={6} />
            {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>}
          </div>
        </div>

        <div className="flex justify-start mt-4 pt-6 border-t border-slate-100 dark:border-white/10">
          <Button type="submit" label={updatingProfile ? "Saving..." : "Save Changes"} disabled={updatingProfile} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl border-none font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all" />
        </div>
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03]">
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-white">Account Password & Security</h4>
            <p className="text-xs text-slate-500">
              {user?.hasPassword
                ? 'Your password is active. You can change it anytime.'
                : 'You signed in with Google. Set a password to also enable email and password login.'}
            </p>
          </div>
          <Link to="/set-password">
            <Button
              type="button"
              label={user?.hasPassword ? "Change Password" : "Set Password"}
              outlined
              className="px-4 py-2 text-xs font-bold rounded-xl border border-indigo-500 text-indigo-600 hover:bg-indigo-50"
            />
          </Link>
        </div>
      </form>
    </div>
  );

  return (
    <AnimatedPage className="min-h-screen bg-slate-50 dark:bg-[#0f1711] flex flex-col pt-32 sm:pt-36 pb-20">
      <main className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex-grow">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-emerald-800 dark:text-emerald-400 tracking-tight mb-2">My Dashboard</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Welcome back, {user?.name}! Here's an overview of your activity.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Nav */}
          <aside className="col-span-1">
            <nav className="bg-white dark:bg-[#141f15] rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-white/5 flex flex-col gap-2 sticky top-24">
              <button 
                onClick={() => setActiveTab('dashboard')} 
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}
              >
                <i className={`pi pi-home ${activeTab === 'dashboard' ? 'text-white' : 'text-slate-400'}`}></i> Overview
              </button>
              
              <button 
                onClick={() => setActiveTab('orders')} 
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 ${activeTab === 'orders' ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}
              >
                <i className={`pi pi-receipt ${activeTab === 'orders' ? 'text-white' : 'text-slate-400'}`}></i> Order History
              </button>
              
              <button 
                onClick={() => setActiveTab('profile')} 
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 ${activeTab === 'profile' ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}
              >
                <i className={`pi pi-user ${activeTab === 'profile' ? 'text-white' : 'text-slate-400'}`}></i> Profile Settings
              </button>

              <Link 
                to="/set-password" 
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
              >
                <i className="pi pi-lock text-slate-400"></i> Password & Security
              </Link>

              <div className="h-px bg-slate-100 dark:bg-white/10 my-2 mx-4"></div>
              
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl font-bold text-sm transition-colors mt-auto">
                <i className="pi pi-sign-out"></i> Logout
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <div className="col-span-1 lg:col-span-3">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'orders' && renderOrders()}
            {activeTab === 'profile' && renderProfile()}
          </div>
        </div>
      </main>
      
      {/* Cancel Reason Dialog */}
      <Dialog visible={!!selectedCancelReason} onHide={() => setSelectedCancelReason(null)} header="Cancellation Reason" className="w-[90vw] md:w-[25vw] border-none shadow-2xl rounded-2xl overflow-hidden" headerClassName="bg-slate-50 dark:bg-[#1a291a] text-slate-800 dark:text-white font-title-lg p-6 border-b border-slate-100 dark:border-white/5" contentClassName="p-6 bg-white dark:bg-[#141f15]" pt={{ mask: { className: 'backdrop-blur-sm bg-black/40' } }}>
        <div className="flex flex-col gap-4">
          <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl text-sm text-red-800 dark:text-red-300 font-medium">
            "{selectedCancelReason}"
          </div>
          <div className="flex justify-end mt-2">
            <Button label="Close" onClick={() => setSelectedCancelReason(null)} className="px-6 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 border-none font-bold text-sm transition-colors" />
          </div>
        </div>
      </Dialog>

      {/* Order Details Dialog (Farmer-wise grouping) */}
      <Dialog 
        visible={!!selectedOrderDetails} 
        onHide={() => setSelectedOrderDetails(null)} 
        header={`Order #${selectedOrderDetails?.orderNumber || selectedOrderDetails?._id?.substring(selectedOrderDetails._id.length - 6).toUpperCase()}`}
        className="w-[94vw] md:w-[680px] border-none shadow-2xl rounded-3xl overflow-hidden" 
        headerClassName="bg-slate-50 dark:bg-[#1a291a] text-slate-800 dark:text-white font-title-lg p-6 border-b border-slate-100 dark:border-white/5" 
        contentClassName="p-6 bg-white dark:bg-[#141f15] max-h-[80vh] overflow-y-auto" 
        pt={{ mask: { className: 'backdrop-blur-sm bg-black/50' } }}
      >
        {selectedOrderDetails && (
          <div className="flex flex-col gap-6">
            {/* Top metadata */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Placed On</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {new Date(selectedOrderDetails.createdAt).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Payment</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {selectedOrderDetails.paymentMethod} ({selectedOrderDetails.paymentStatus})
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Overall Status</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  selectedOrderDetails.orderStatus === 'Delivered' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                  selectedOrderDetails.orderStatus === 'Cancelled' ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' :
                  'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                }`}>
                  {selectedOrderDetails.orderStatus}
                </span>
              </div>
            </div>

            {/* Delivery address */}
            <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Delivery Destination</span>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">
                {selectedOrderDetails.receiverName || selectedOrderDetails.customerId?.name}
                {selectedOrderDetails.receiverPhone ? ` • ${selectedOrderDetails.receiverPhone}` : ''}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedOrderDetails.deliveryAddress?.address}, {selectedOrderDetails.deliveryAddress?.city}, {selectedOrderDetails.deliveryAddress?.state} {selectedOrderDetails.deliveryAddress?.pincode}
              </p>
            </div>

            {/* Farmer-wise Sub-orders */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  Products Grouped by Farmer ({selectedOrderDetails.farmerOrders?.length || 1})
                </h3>
              </div>

              {selectedOrderDetails.farmerOrders && selectedOrderDetails.farmerOrders.length > 0 ? (
                <div className="space-y-4">
                  {selectedOrderDetails.farmerOrders.map((subOrder, idx) => (
                    <div key={idx} className="p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-950/10">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-emerald-100/60 dark:border-emerald-900/30">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs">
                            <Wheat className="w-4 h-4" />
                          </span>
                          <div>
                            <span className="text-sm font-bold text-slate-800 dark:text-white">
                              {subOrder.farmerId?.farmName || `Farmer #${idx + 1}`}
                            </span>
                            {subOrder.farmerId?.phone && (
                              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-normal"><Phone className="w-3 h-3" /> {subOrder.farmerId.phone}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-medium">Status:</span>
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            subOrder.farmerOrderStatus === 'Delivered' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
                            subOrder.farmerOrderStatus === 'Cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' :
                            'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                          }`}>
                            {subOrder.farmerOrderStatus}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        {subOrder.items?.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-3 min-w-0">
                              <img loading="lazy" 
                                src={item.image || 'https://placehold.co/60'} 
                                alt={item.name} 
                                className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0" 
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{item.name}</p>
                                <p className="text-[11px] text-slate-400 font-medium">{item.quantity} × ₹{item.price}</p>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-slate-800 dark:text-white shrink-0">
                              ₹{item.price * item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 pt-2 border-t border-emerald-100/60 dark:border-emerald-900/20 flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">{subOrder.items?.length} produce item(s)</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                          Farmer Subtotal: ₹{subOrder.subtotal}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedOrderDetails.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-3">
                        <img loading="lazy" src={item.image || 'https://placehold.co/60'} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-white">{item.name}</p>
                          <p className="text-[11px] text-slate-400">{item.quantity} × ₹{item.price}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-white">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total breakdown */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">₹{selectedOrderDetails.subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Delivery Fee</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {selectedOrderDetails.deliveryCharge === 0 ? 'FREE' : `₹${selectedOrderDetails.deliveryCharge}`}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200/60 dark:border-white/5 flex justify-between items-baseline text-sm font-bold text-slate-800 dark:text-white">
                <span>Total Paid</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">₹{selectedOrderDetails.totalAmount}</span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-between items-center gap-3 pt-2">
              <Link to={`/track-order?id=${selectedOrderDetails._id}`}>
                <Button label="Track Real-time Progress" icon="pi pi-compass" className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs border-none shadow-md shadow-emerald-600/20" />
              </Link>
              <Button label="Close" onClick={() => setSelectedOrderDetails(null)} className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 border-none font-bold text-xs" />
            </div>
          </div>
        )}
      </Dialog>
    </AnimatedPage>
  );
}
