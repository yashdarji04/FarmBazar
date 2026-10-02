import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { Wheat, Phone } from 'lucide-react';
import AnimatedPage from '../components/AnimatedPage';
import { logout } from '../store/slices/authSlice';
import api from '../services/api';
import { Chart } from 'primereact/chart';
import { Dialog } from 'primereact/dialog';
import { useNotifications } from '../context/NotificationContext';
import SEO from '../components/SEO';

// Time-ago helper
function getTimeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTabState] = useState(searchParams.get('tab') || 'dashboard');
  const [selectedOrderModal, setSelectedOrderModal] = useState(null);

  // Notification context
  const {
    notifications: notifList,
    unreadCount: notifUnreadCount,
    loading: notifLoading,
    markAsRead: notifMarkAsRead,
    markAllAsRead: notifMarkAllAsRead,
    deleteNotification: notifDelete,
    clearAll: notifClearAll,
  } = useNotifications();

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    setSearchParams({ tab });
  };
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCustomers: 0,
    totalFarmers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingFarmers: []
  });
  const [users, setUsers] = useState([]);
  const [removeDialogVisible, setRemoveDialogVisible] = useState(false);
  const [userToRemove, setUserToRemove] = useState(null);
  const [removeReason, setRemoveReason] = useState('');
  const [orders, setOrders] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  // Analytics state
  const [analyticsData, setAnalyticsData] = useState({
    monthlyOrders: [],
    monthlyRevenue: [],
    ordersStatus: [],
    usersRole: [],
    productsCategory: [],
    topProducts: [],
    sales: []
  });

  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsYear, setAnalyticsYear] = useState(new Date().getFullYear());
  const [salesInterval, setSalesInterval] = useState('daily');
  const [salesRange, setSalesRange] = useState({ start: '', end: '' });

  const [loading, setLoading] = useState(true);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalyticsData();
    }
  }, [activeTab, analyticsYear, salesInterval, salesRange]);

  const fetchAnalyticsData = async () => {
    setAnalyticsLoading(true);
    try {
      const dateParams = `${salesRange.start ? '?start=' + salesRange.start : '?'}${salesRange.end ? '&end=' + salesRange.end : ''}`;

      const [ordersRes, revenueRes, statusRes, roleRes, categoryRes, topRes, salesRes] = await Promise.all([
        api.get(`/analytics/monthly-orders?year=${analyticsYear}`),
        api.get(`/analytics/monthly-revenue?year=${analyticsYear}`),
        api.get(`/analytics/orders-status${dateParams}`),
        api.get(`/analytics/users-role${dateParams}`),
        api.get(`/analytics/products-category${dateParams}`),
        api.get(`/analytics/top-selling${dateParams}`),
        api.get(`/analytics/sales${dateParams === '?' ? '?interval=' + salesInterval : dateParams + '&interval=' + salesInterval}`),
      ]);
      setAnalyticsData({
        monthlyOrders: ordersRes.data.data,
        monthlyRevenue: revenueRes.data.data,
        ordersStatus: statusRes.data.data,
        usersRole: roleRes.data.data,
        productsCategory: categoryRes.data.data,
        topProducts: topRes.data.data,
        sales: salesRes.data.data,
      });
    } catch (error) {
      console.error('Error fetching analytics', error);
      toast.error('Failed to load analytics data');
    } finally {
      setAnalyticsLoading(false);
    }
  };





  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.get('/users/admin/dashboard');
      setStats(statsRes.data.data);

      const usersRes = await api.get('/users');
      setUsers(usersRes.data.data);

      const ordersRes = await api.get('/orders/admin/all');
      setOrders(ordersRes.data.data);

      const inquiriesRes = await api.get('/contact/admin/all');
      setInquiries(inquiriesRes.data.data || []);
    } catch (error) {
      console.error("Error fetching admin data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleApproveFarmer = async (farmerId) => {
    try {
      await api.put(`/users/admin/farmers/${farmerId}/approve`);
      toast.success("Farmer approved successfully!");
      fetchDashboardData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to approve farmer");
    }
  };

  const handleRejectFarmer = async (farmerId) => {
    try {
      await api.put(`/users/admin/farmers/${farmerId}/reject`);
      toast.success("Farmer rejected successfully!");
      fetchDashboardData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to reject farmer");
    }
  };

  const handleRemoveUser = (userId, userName) => {
    setUserToRemove({ id: userId, name: userName });
    setRemoveReason('');
    setRemoveDialogVisible(true);
  };

  const confirmRemoveUser = async () => {
    if (!removeReason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    
    try {
      await api.delete(`/users/admin/${userToRemove.id}/remove`, { data: { reason: removeReason } });
      toast.success("User removed successfully and email sent!");
      fetchDashboardData();
      setRemoveDialogVisible(false);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to remove user");
    }
  };

  const handleResolveInquiry = async (inquiryId) => {
    try {
      await api.put(`/contact/admin/${inquiryId}/status`, { status: 'Resolved' });
      toast.success("Inquiry marked as resolved!");
      fetchDashboardData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to resolve inquiry");
    }
  };

  const farmers = users.filter(u => u.role === 'farmer');
  const customers = users.filter(u => u.role === 'customer');

  const renderDashboard = () => (
    <div className="animate-fade-in space-y-8">

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">

        {/* Total Users */}
        <div className="relative overflow-hidden bg-white/70 dark:bg-[#111827]/70 backdrop-blur-xl rounded-[2rem] p-6 shadow-xl shadow-slate-200/40 dark:shadow-none border border-white/50 dark:border-white/5 group hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300">
          <div className="relative z-10 flex justify-between items-start mb-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            </div>
            <span className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold tracking-wide uppercase flex items-center gap-1">
              <span className="text-[10px]">↑</span> ACTIVE
            </span>
          </div>
          <div className="relative z-10">
            <div className="text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none">{loading ? '...' : stats.totalUsers || 0}</div>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-wider">Total Users</h3>
          </div>
        </div>

        {/* Active Farmers */}
        <div className="relative overflow-hidden bg-white/70 dark:bg-[#111827]/70 backdrop-blur-xl rounded-[2rem] p-6 shadow-xl shadow-slate-200/40 dark:shadow-none border border-white/50 dark:border-white/5 group hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300">
          <div className="relative z-10 flex justify-between items-start mb-8">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
            </div>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wide uppercase">
              VERIFIED
            </span>
          </div>
          <div className="relative z-10">
            <div className="text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none">{loading ? '...' : stats.totalFarmers || 0}</div>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-wider">Active Farmers</h3>
          </div>
        </div>

        {/* Active Customers */}
        <div className="relative overflow-hidden bg-white/70 dark:bg-[#111827]/70 backdrop-blur-xl rounded-[2rem] p-6 shadow-xl shadow-slate-200/40 dark:shadow-none border border-white/50 dark:border-white/5 group hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
          <div className="relative z-10 flex justify-between items-start mb-8">
            <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center text-white shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </div>
            <span className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-wide uppercase">
              BUYERS
            </span>
          </div>
          <div className="relative z-10">
            <div className="text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none">{loading ? '...' : stats.totalCustomers || 0}</div>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-wider">Active Customers</h3>
          </div>
        </div>

        {/* Total GMV */}
        <div className="relative overflow-hidden bg-white/70 dark:bg-[#111827]/70 backdrop-blur-xl rounded-[2rem] p-6 shadow-xl shadow-slate-200/40 dark:shadow-none border border-white/50 dark:border-white/5 group hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300">
          <div className="relative z-10 flex justify-between items-start mb-8">
            <div className="w-12 h-12 rounded-2xl bg-[#F97316] flex items-center justify-center text-white shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a2 2 0 0 0 2-2v-2" /><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" /></svg>
            </div>
            <span className="px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-bold tracking-wide uppercase">
              REVENUE
            </span>
          </div>
          <div className="relative z-10">
            <div className="text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none">₹{loading ? '...' : stats.totalRevenue?.toLocaleString('en-IN') || 0}</div>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-wider">Total GMV</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Pending Farmer Approvals */}
        <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-slate-200/30 dark:shadow-none border border-white/50 dark:border-white/5 overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-100/50 dark:border-white/5 flex justify-between items-center bg-gradient-to-b from-slate-50/50 to-transparent dark:from-white/[0.02]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100/50 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <i className="pi pi-verified text-xl"></i>
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Pending Approvals</h2>
                <p className="text-sm font-medium text-slate-500 mt-0.5">Review and authorize new farmer accounts</p>
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 font-bold text-xs px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              {stats.pendingFarmers?.length || 0} New
            </div>
          </div>

          <div className="p-0 overflow-y-auto max-h-[450px] custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <span className="text-slate-400 font-bold tracking-wide animate-pulse">Loading approvals...</span>
              </div>
            ) : stats.pendingFarmers?.length === 0 || !stats.pendingFarmers ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-300 dark:text-slate-600 mb-2">
                  <i className="pi pi-check-circle text-3xl"></i>
                </div>
                <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300">All Caught Up!</h3>
                <p className="text-sm font-medium text-slate-400 max-w-[250px]">There are no pending farmer approvals at this time.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100/50 dark:divide-white/5">
                {stats.pendingFarmers.map(farmer => (
                  <div key={farmer._id} className="p-6 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-6 group">
                    <div className="flex items-start sm:items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-white dark:border-slate-700 shadow-sm flex items-center justify-center shrink-0 text-slate-400 dark:text-slate-500 font-bold text-xl uppercase">
                        {farmer.farmName?.charAt(0) || 'F'}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{farmer.farmName}</h3>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-sm font-semibold text-slate-500 flex items-center gap-1.5">
                            <i className="pi pi-user text-xs"></i> {farmer.ownerName || farmer.userId?.name}
                          </p>
                          <p className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                            <i className="pi pi-map-marker text-[10px]"></i> {farmer.city}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 shrink-0 transition-opacity">
                      <button onClick={() => handleRejectFarmer(farmer._id)} className="px-5 py-2.5 bg-red-50 hover:bg-red-500 hover:text-white dark:bg-red-500/10 dark:hover:bg-red-500 text-red-600 rounded-xl border-none font-bold text-sm shadow-sm transition-all flex items-center gap-2">
                        <i className="pi pi-times"></i> Reject
                      </button>
                      <button onClick={() => handleApproveFarmer(farmer._id)} className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl border-none font-bold text-sm shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all flex items-center gap-2">
                        <i className="pi pi-check"></i> Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderFarmers = () => (
    <div className="animate-fade-in bg-white/80 dark:bg-[#111827]/80 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-slate-200/30 dark:shadow-none border border-white/50 dark:border-white/5 overflow-hidden">
      <div className="p-8 border-b border-slate-100/50 dark:border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-gradient-to-b from-slate-50/50 to-transparent dark:from-white/[0.02]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100/50 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner">
            <i className="pi pi-briefcase text-xl"></i>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Farmers Directory</h2>
            <p className="text-sm font-medium text-slate-500 mt-0.5">Manage and review seller accounts</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2">
          <i className="pi pi-search text-slate-400"></i>
          <input type="text" placeholder="Search farmers..." className="bg-transparent border-none outline-none text-sm font-semibold w-full sm:w-48 text-slate-700 dark:text-slate-200 placeholder-slate-400" />
        </div>
      </div>
      <div className="overflow-x-auto pb-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-white/[0.01] border-b border-slate-100 dark:border-white/5">
              <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Farmer Info</th>
              <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Contact</th>
              <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Location</th>
              <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/50 dark:divide-white/5">
            {loading ? (
              <tr><td colSpan="5" className="p-16 text-center"><div className="inline-block w-8 h-8 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin"></div></td></tr>
            ) : farmers.length === 0 ? (
              <tr><td colSpan="5" className="p-16 text-center text-slate-400 font-bold">No farmers found in directory.</td></tr>
            ) : (
              farmers.map(f => (
                <tr key={f._id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors group">
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg uppercase shadow-sm">
                        {f.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-white">{f.farmerProfile?.farmName || 'Pending Setup'}</div>
                        <div className="text-sm font-semibold text-slate-500">{f.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <div className="font-semibold text-slate-600 dark:text-slate-300">{f.email}</div>
                  </td>
                  <td className="px-4 py-5">
                    <div className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <i className="pi pi-map-marker text-slate-400 text-xs"></i>
                      {f.farmerProfile ? `${f.farmerProfile.city}, ${f.farmerProfile.state}` : 'N/A'}
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wide uppercase shadow-sm ${f.farmerProfile?.verificationStatus === 'approved'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
                        : 'bg-orange-50 text-orange-600 border border-orange-100 dark:bg-orange-500/10 dark:border-orange-500/20 dark:text-orange-400'
                      }`}>
                      {f.farmerProfile?.verificationStatus || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-5 text-right">
                    {f.farmerProfile?.verificationStatus === 'pending' ? (
                      <div className="flex justify-end gap-2 opacity-100">
                        <button onClick={() => handleRejectFarmer(f.farmerProfile._id)} className="px-4 py-2 bg-red-50 hover:bg-red-500 hover:text-white text-red-600 rounded-xl border-none font-bold text-xs shadow-sm transition-all">Reject</button>
                        <button onClick={() => handleApproveFarmer(f.farmerProfile._id)} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl border-none font-bold text-xs shadow-md shadow-emerald-500/20 transition-all">Approve</button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2 opacity-100">
                        <button onClick={() => handleRemoveUser(f._id, f.name)} className="px-4 py-2 bg-red-50 hover:bg-red-500 hover:text-white text-red-600 rounded-xl border-none font-bold text-xs shadow-sm transition-all flex items-center gap-1">
                          <i className="pi pi-trash text-[10px]"></i> Remove
                        </button>
                      </div>
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

  const renderCustomers = () => (
    <div className="animate-fade-in bg-white/80 dark:bg-[#111827]/80 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-slate-200/30 dark:shadow-none border border-white/50 dark:border-white/5 overflow-hidden">
      <div className="p-8 border-b border-slate-100/50 dark:border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-gradient-to-b from-slate-50/50 to-transparent dark:from-white/[0.02]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100/50 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner">
            <i className="pi pi-users text-xl"></i>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Customers Directory</h2>
            <p className="text-sm font-medium text-slate-500 mt-0.5">View and manage buyer accounts</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-2">
          <i className="pi pi-search text-slate-400"></i>
          <input type="text" placeholder="Search customers..." className="bg-transparent border-none outline-none text-sm font-semibold w-full sm:w-48 text-slate-700 dark:text-slate-200 placeholder-slate-400" />
        </div>
      </div>
      <div className="overflow-x-auto pb-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-white/[0.01] border-b border-slate-100 dark:border-white/5">
              <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Customer Profile</th>
              <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Contact Info</th>
              <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Location</th>
              <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/50 dark:divide-white/5">
            {loading ? (
              <tr><td colSpan="4" className="p-16 text-center"><div className="inline-block w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div></td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan="4" className="p-12 text-center text-slate-400 font-bold">No customers found.</td></tr>
            ) : (
              customers.map(c => (
                <tr key={c._id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors group">
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg uppercase shadow-sm">
                        {c.name?.charAt(0) || 'U'}
                      </div>
                      <div className="font-bold text-slate-800 dark:text-white">{c.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <div className="font-semibold text-slate-600 dark:text-slate-300">{c.email}</div>
                    <div className="text-sm font-medium text-slate-400">{c.phone || 'No phone'}</div>
                  </td>
                  <td className="px-4 py-5">
                    <div className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <i className="pi pi-map-marker text-slate-400 text-xs"></i>
                      {c.city ? `${c.city}, ${c.state || ''}` : 'Location unknown'}
                    </div>
                  </td>
                  <td className="px-4 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-100">
                      <button onClick={() => handleRemoveUser(c._id, c.name)} className="px-4 py-2 bg-red-50 hover:bg-red-500 hover:text-white text-red-600 rounded-xl border-none font-bold text-xs shadow-sm transition-all flex items-center gap-1">
                        <i className="pi pi-trash text-[10px]"></i> Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="animate-fade-in bg-white/80 dark:bg-[#111827]/80 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-slate-200/30 dark:shadow-none border border-white/50 dark:border-white/5 overflow-hidden">
      <div className="p-8 border-b border-slate-100/50 dark:border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-gradient-to-b from-slate-50/50 to-transparent dark:from-white/[0.02]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100/50 dark:bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-inner">
            <i className="pi pi-receipt text-xl"></i>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Order Management</h2>
            <p className="text-sm font-medium text-slate-500 mt-0.5">Track and verify all platform transactions</p>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto pb-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-white/[0.01] border-b border-slate-100 dark:border-white/5">
              <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Order ID & Date</th>
              <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Customer</th>
              <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Farmer(s)</th>
              <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Amount</th>
              <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/50 dark:divide-white/5">
            {loading ? (
              <tr><td colSpan="6" className="p-16 text-center"><div className="inline-block w-8 h-8 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin"></div></td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan="6" className="p-12 text-center text-slate-400 font-bold">No orders found.</td></tr>
            ) : (
              orders.map(o => (
                <tr key={o._id} onClick={() => setSelectedOrderModal(o)} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer">
                  <td className="px-4 py-5">
                    <div className="font-black text-indigo-600 dark:text-indigo-400">#{o.orderNumber || o._id.substring(o._id.length - 6).toUpperCase()}</div>
                    <div className="text-xs font-bold text-slate-400 mt-1">{new Date(o.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                  </td>
                  <td className="px-4 py-5">
                    <div className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-500">{o.customerId?.name?.charAt(0) || 'U'}</div>
                      {o.customerId?.name || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    {o.farmerOrders && o.farmerOrders.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {o.farmerOrders.map((fo, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-xs">
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                              <Wheat className="w-3 h-3" /> {fo.farmerId?.farmName || `Farmer #${idx + 1}`}
                            </span>
                            <span className="text-[10px] text-slate-400">(₹{fo.subtotal})</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                        <i className="pi pi-briefcase text-slate-400"></i>
                        {o.farmerId?.farmName || 'Unknown'}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-5">
                    <div className="font-black text-slate-800 dark:text-white text-lg">₹{o.totalAmount?.toLocaleString('en-IN')}</div>
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wide shadow-sm border ${o.orderStatus === 'Delivered' || o.orderStatus === 'Completed' ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' :
                          o.orderStatus === 'Processing' || o.orderStatus === 'Shipped' || o.orderStatus === 'Packed' || o.orderStatus === 'Out For Delivery' ? 'bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400' :
                            o.orderStatus === 'Cancelled' ? 'bg-red-50 border-red-100 text-red-600 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400' :
                              'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                        }`}>
                        {o.orderStatus}
                      </span>
                      {o.farmerOrders && o.farmerOrders.length > 1 && (
                        <div className="flex flex-col gap-0.5">
                          {o.farmerOrders.map((fo, idx) => (
                            <span key={idx} className="text-[10px] text-slate-500 font-medium">
                              {fo.farmerId?.farmName?.split(' ')?.[0] || `Farmer ${idx + 1}`}: <strong className="text-slate-700 dark:text-slate-300">{fo.farmerOrderStatus}</strong>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-5 text-right">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedOrderModal(o); }}
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 dark:text-indigo-400 font-bold text-xs transition-all shadow-sm"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderInquiries = () => (
    <div className="animate-fade-in bg-white/80 dark:bg-[#111827]/80 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-slate-200/30 dark:shadow-none border border-white/50 dark:border-white/5 overflow-hidden">
      <div className="p-8 border-b border-slate-100/50 dark:border-white/5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-gradient-to-b from-slate-50/50 to-transparent dark:from-white/[0.02]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100/50 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-inner">
            <i className="pi pi-inbox text-xl"></i>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Support Tickets</h2>
            <p className="text-sm font-medium text-slate-500 mt-0.5">Manage user inquiries and complaints</p>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto pb-4">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-white/[0.01] border-b border-slate-100 dark:border-white/5">
              <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
              <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Reporter</th>
              <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Subject & Message</th>
              <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/50 dark:divide-white/5">
            {loading ? (
              <tr><td colSpan="5" className="p-16 text-center"><div className="inline-block w-8 h-8 border-4 border-purple-100 border-t-purple-500 rounded-full animate-spin"></div></td></tr>
            ) : inquiries.length === 0 ? (
              <tr><td colSpan="5" className="p-12 text-center text-slate-400 font-bold">No active inquiries.</td></tr>
            ) : (
              inquiries.map(i => (
                <tr key={i._id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors group">
                  <td className="px-4 py-5 font-bold text-slate-500">{new Date(i.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="px-4 py-5">
                    <div className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-500">{i.firstName?.charAt(0) || 'U'}</div>
                      <div>
                        {i.firstName} {i.lastName}
                        <div className="text-slate-400 font-semibold text-[10px]">{i.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <div className="font-black text-slate-700 dark:text-slate-200">{i.subject}</div>
                    <div className="text-slate-500 font-medium text-xs max-w-sm truncate mt-0.5" title={i.message}>{i.message}</div>
                  </td>
                  <td className="px-4 py-5">
                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border ${i.status === 'Resolved'
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
                        : 'bg-orange-50 border-orange-100 text-orange-600 dark:bg-orange-500/10 dark:border-orange-500/20 dark:text-orange-400 animate-pulse'
                      }`}>
                      {i.status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-5 text-right">
                    {i.status !== 'Resolved' ? (
                      <button onClick={() => handleResolveInquiry(i._id)} className="px-4 py-2 bg-indigo-50 hover:bg-indigo-500 hover:text-white text-indigo-600 dark:bg-indigo-500/10 dark:hover:bg-indigo-500 dark:text-indigo-400 dark:hover:text-white rounded-xl border-none font-bold text-xs shadow-sm transition-all flex items-center gap-2 ml-auto">
                        <i className="pi pi-check-circle"></i> Resolve
                      </button>
                    ) : (
                      <div className="text-slate-400 font-bold text-xs flex items-center justify-end gap-1"><i className="pi pi-check"></i> Closed</div>
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

  const renderAnalytics = () => {
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const formatMoney = (value) => '₹' + value.toLocaleString('en-IN');
    const formatNumber = (value) => Math.round(value).toString();

    // Chart Options
    const lineChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { 
          backgroundColor: '#0f172a', 
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
          padding: 16, 
          cornerRadius: 12, 
          titleFont: { size: 15, family: 'Inter, sans-serif', weight: 'bold' }, 
          bodyFont: { size: 13, family: 'Inter, sans-serif', weight: 'medium' },
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          boxPadding: 6,
        }
      },
      scales: {
        y: { 
          ticks: { color: '#94a3b8', font: { weight: '600' }, callback: formatNumber, precision: 0 }, 
          grid: { color: '#f1f5f9', drawBorder: false, lineWidth: 1.5 }, 
          border: { display: false }, 
          beginAtZero: true 
        },
        x: { 
          ticks: { color: '#94a3b8', font: { weight: '600' } }, 
          grid: { display: false }, 
          border: { display: false } 
        }
      },
      tension: 0.4,
      interaction: { mode: 'index', intersect: false }
    };

    const moneyLineChartOptions = {
      ...lineChartOptions,
      scales: {
        ...lineChartOptions.scales,
        y: { ...lineChartOptions.scales.y, callback: function (value) { return '₹' + value; } }
      }
    };

    const doughnutOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: '#475569', font: { family: 'Inter, sans-serif', weight: '500' }, usePointStyle: true, padding: 20 } },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: 12, cornerRadius: 8, titleFont: { size: 14 }, bodyFont: { size: 13 },
          callbacks: {
            label: function (context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      },
      cutout: '75%',
      borderWidth: 0
    };

    const doughnutColors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];

    const barChartOptions = {
      ...lineChartOptions,
      indexAxis: 'x',
      borderRadius: { topLeft: 8, topRight: 8, bottomLeft: 0, bottomRight: 0 },
      barPercentage: 0.6,
      categoryPercentage: 0.8,
      plugins: {
        ...lineChartOptions.plugins,
        tooltip: {
          backgroundColor: 'rgba(139, 147, 158, 0.95)', // The specific translucent gray
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          padding: 14, 
          cornerRadius: 12, 
          titleFont: { size: 16, family: 'Inter, sans-serif', weight: 'bold' }, 
          bodyFont: { size: 15, family: 'Inter, sans-serif', weight: 'bold' },
          borderColor: 'transparent',
          borderWidth: 0,
          boxPadding: 8,
          usePointStyle: true,
          callbacks: {
            title: function (context) {
              return context[0].label;
            }
          }
        },
        legend: { display: false }
      },
      scales: {
        y: { 
          ticks: { color: '#64748b', font: { weight: '700' }, precision: 0 }, 
          grid: { color: '#f1f5f9', drawBorder: false, lineWidth: 1.5 }, 
          border: { display: false }, 
          beginAtZero: true 
        },
        x: { 
          ticks: { color: '#64748b', font: { weight: '700' } }, 
          grid: { display: false }, 
          border: { display: false } 
        }
      }
    };

    const polarAreaOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: '#475569', font: { family: 'Inter, sans-serif', weight: '700', size: 12 }, usePointStyle: true, pointStyle: 'circle', padding: 25 } },
        tooltip: { 
          backgroundColor: '#0f172a', 
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
          padding: 16, 
          cornerRadius: 12, 
          titleFont: { size: 15, family: 'Inter, sans-serif', weight: 'bold' }, 
          bodyFont: { size: 13, family: 'Inter, sans-serif', weight: 'medium' },
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          boxPadding: 6,
          usePointStyle: true
        }
      },
      cutout: '65%', // Added for Doughnut chart
      borderWidth: 0,
      animation: { animateRotate: true, animateScale: true }
    };

    const radarOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: '#475569', font: { family: 'Inter, sans-serif', weight: '500' }, usePointStyle: true, padding: 20 } },
        tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: 12, cornerRadius: 8, titleFont: { size: 14 }, bodyFont: { size: 13 } }
      },
      scales: {
        r: {
          ticks: { display: false },
          grid: { color: '#f1f5f9' },
          angleLines: { color: '#f1f5f9' },
          pointLabels: { color: '#64748b', font: { size: 12, weight: '600' } }
        }
      }
    };

    const horizontalBarOptions = {
      ...lineChartOptions,
      indexAxis: 'y',
      borderRadius: { topRight: 6, bottomRight: 6, topLeft: 6, bottomLeft: 6 },
      barPercentage: 0.8,
      categoryPercentage: 0.8,
      plugins: {
        ...lineChartOptions.plugins,
        tooltip: {
          backgroundColor: 'rgba(139, 147, 158, 0.95)', // Match the Users by Role tooltip design
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          padding: 14, 
          cornerRadius: 12, 
          titleFont: { size: 16, family: 'Inter, sans-serif', weight: 'bold' }, 
          bodyFont: { size: 15, family: 'Inter, sans-serif', weight: 'bold' },
          borderColor: 'transparent',
          borderWidth: 0,
          boxPadding: 8,
          usePointStyle: true,
          callbacks: {
            title: function (context) {
              return context[0].label;
            }
          }
        },
        legend: { display: false } // Hide legend to make it cleaner
      },
      scales: {
        x: { ticks: { color: '#94a3b8', font: { weight: '600' }, precision: 0 }, grid: { color: '#f1f5f9', drawBorder: false, lineWidth: 1.5 }, border: { display: false }, beginAtZero: true },
        y: { ticks: { color: '#475569', font: { weight: '700', size: 12 }, autoSkip: false }, grid: { display: false }, border: { display: false } }
      }
    };

    // Prepare Data
    const revenueData = {
      labels: monthLabels,
      datasets: [{
        label: 'Revenue (₹)',
        data: analyticsData.monthlyRevenue,
        backgroundColor: 'rgba(79,70,229,0.85)',
        hoverBackgroundColor: '#4338ca',
      }]
    };

    const ordersData = {
      labels: monthLabels,
      datasets: [{
        label: 'Orders',
        data: analyticsData.monthlyOrders,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16,185,129,0.1)',
        borderWidth: 3,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#10B981',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
      }]
    };

    const totalOrdersStatus = analyticsData.ordersStatus.reduce((acc, curr) => acc + curr.count, 0);
    const statusData = {
      labels: analyticsData.ordersStatus.map(d => d.status),
      datasets: [{ data: analyticsData.ordersStatus.map(d => d.count), backgroundColor: doughnutColors, hoverOffset: 4 }]
    };

    const roleData = {
      labels: analyticsData.usersRole.map(d => d.role),
      datasets: [{
        label: 'Users Count',
        data: analyticsData.usersRole.map(d => d.count),
        backgroundColor: ['#2929ff', '#05c46b', '#ffa801', '#EF4444', '#8B5CF6'], // Exact bright colors
        hoverBackgroundColor: ['#1e1eff', '#04a359', '#e69700', '#dc2626', '#7c3aed'],
        borderWidth: 0,
      }]
    };

    const categoryData = {
      labels: analyticsData.productsCategory.map(d => d.category),
      datasets: [{
        label: 'Products',
        data: analyticsData.productsCategory.map(d => d.count),
        backgroundColor: ['rgba(79, 70, 229, 0.75)', 'rgba(16, 185, 129, 0.75)', 'rgba(245, 158, 11, 0.75)', 'rgba(239, 68, 68, 0.75)', 'rgba(139, 92, 246, 0.75)'],
        borderColor: '#ffffff',
        borderWidth: 3,
        hoverBackgroundColor: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
        hoverBorderWidth: 0,
        hoverOffset: 10
      }]
    };

    const topProductsData = {
      labels: analyticsData.topProducts.map(d => d.name.length > 25 ? d.name.substring(0, 25) + '...' : d.name),
      datasets: [{ 
        label: 'Quantity Sold', 
        data: analyticsData.topProducts.map(d => d.quantity), 
        backgroundColor: 'rgba(16, 185, 129, 0.85)', // Modern emerald green
        hoverBackgroundColor: '#059669', // Darker emerald on hover
        borderWidth: 0,
        borderRadius: { topRight: 8, bottomRight: 8, topLeft: 4, bottomLeft: 4 }
      }]
    };

    const salesData = {
      labels: analyticsData.sales.map(d => d.label),
      datasets: [{
        label: 'Revenue (₹)',
        data: analyticsData.sales.map(d => d.revenue),
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.2)', // Slightly stronger purple
        borderWidth: 4, // Thicker line
        pointBackgroundColor: '#ffffff', // Clean white dots
        pointBorderColor: '#8B5CF6',
        pointBorderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: '#8B5CF6',
        pointHoverBorderColor: '#ffffff',
        fill: true,
        borderRadius: analyticsData.sales.length === 1 ? 12 : 0, // rounded corners if it renders as a bar
        barPercentage: 0.5,
      }]
    };

    return (
      <div className="animate-fade-in bg-white dark:bg-[#141f15] rounded-[2rem] p-6 lg:p-8 shadow-xl shadow-slate-200/40 border border-slate-100 dark:border-white/5">
      <SEO title="Admin Dashboard - FarmBazar" description="Manage the FarmBazar marketplace." />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Analytics Dashboard</h2>
            <p className="text-slate-500 font-medium mt-1">Comprehensive overview of FarmBazar performance</p>
          </div>
        </div>

        {/* Global Analytics Filters */}
        <div className="mb-6 bg-slate-50/80 dark:bg-white/[0.02] p-5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <i className="pi pi-filter text-indigo-500"></i> Global Filters
            </h3>

            <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-[#1a2b1c] p-2 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm w-max">
              <select value={salesInterval} onChange={e => setSalesInterval(e.target.value)} className="px-3 py-1.5 bg-transparent text-slate-800 dark:text-white text-sm font-bold focus:outline-none cursor-pointer">
                <option value="daily">Daily View</option>
                <option value="weekly">Weekly View</option>
              </select>
              <div className="h-5 w-px bg-slate-200 dark:bg-white/10 hidden sm:block"></div>
              <div className="flex items-center gap-2 px-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">From</span>
                <input type="date" value={salesRange.start} onChange={e => setSalesRange({ ...salesRange, start: e.target.value })} className="bg-transparent text-slate-800 dark:text-white text-sm font-bold focus:outline-none cursor-pointer" />
              </div>
              <div className="flex items-center gap-2 px-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">To</span>
                <input type="date" value={salesRange.end} onChange={e => setSalesRange({ ...salesRange, end: e.target.value })} className="bg-transparent text-slate-800 dark:text-white text-sm font-bold focus:outline-none cursor-pointer" />
              </div>
            </div>
          </div>
        </div>

        {analyticsLoading ? (
          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <span className="text-sm font-bold text-slate-500 tracking-wide animate-pulse">Processing Analytics Data...</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

            {/* Monthly Orders Line */}
            <div className="p-5 lg:p-6 bg-white dark:bg-[#141f15] rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 group hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <i className="pi pi-shopping-cart text-lg"></i>
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Order Progress Graph</h3>
              </div>
              <div className="flex-1 min-h-[300px] w-full relative">
                {analyticsData.monthlyOrders.every(v => v === 0) ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-white/[0.01] rounded-xl border border-dashed border-slate-200 dark:border-white/10 m-2">
                    <i className="pi pi-shopping-cart text-3xl text-slate-300 mb-3"></i>
                    <span className="text-slate-500 font-semibold text-sm">No orders for selected period</span>
                  </div>
                ) : (
                  <Chart type="line" data={ordersData} options={lineChartOptions} />
                )}
              </div>
            </div>

            {/* Monthly Revenue Bar */}
            <div className="p-5 lg:p-6 bg-white dark:bg-[#141f15] rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 group hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <i className="pi pi-dollar text-lg"></i>
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Revenue Progress Graph (₹)</h3>
              </div>
              <div className="flex-1 min-h-[300px] w-full relative">
                {analyticsData.monthlyRevenue.every(v => v === 0) ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-white/[0.01] rounded-xl border border-dashed border-slate-200 dark:border-white/10 m-2">
                    <i className="pi pi-dollar text-3xl text-slate-300 mb-3"></i>
                    <span className="text-slate-500 font-semibold text-sm">No revenue for selected period</span>
                  </div>
                ) : (
                  <Chart type="bar" data={revenueData} options={moneyLineChartOptions} />
                )}
              </div>
            </div>

            {/* Orders by Status Doughnut */}
            <div className="p-5 lg:p-6 bg-white dark:bg-[#141f15] rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 group hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <i className="pi pi-chart-pie text-lg"></i>
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Orders by Status</h3>
              </div>
              <div className="flex-1 min-h-[300px] w-full relative flex items-center justify-center">
                {analyticsData.ordersStatus.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-white/[0.01] rounded-xl border border-dashed border-slate-200 dark:border-white/10 m-2">
                    <i className="pi pi-chart-pie text-3xl text-slate-300 mb-3"></i>
                    <span className="text-slate-500 font-semibold text-sm">No order data for selected period</span>
                  </div>
                ) : (
                  <>
                    <Chart type="doughnut" data={statusData} options={doughnutOptions} className="w-full h-full relative z-10" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0 pr-16 md:pr-24">
                      <span className="text-3xl font-black text-slate-800 dark:text-white">{totalOrdersStatus}</span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Orders</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Users by Role Bar */}
            <div className="p-5 lg:p-6 bg-white dark:bg-[#141f15] rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 group hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                  <i className="pi pi-users text-lg"></i>
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Users by Role</h3>
              </div>
              <div className="flex-1 min-h-[300px] w-full relative">
                {analyticsData.usersRole.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-white/[0.01] rounded-xl border border-dashed border-slate-200 dark:border-white/10 m-2">
                    <i className="pi pi-users text-3xl text-slate-300 mb-3"></i>
                    <span className="text-slate-500 font-semibold text-sm">No user data for selected period</span>
                  </div>
                ) : (
                  <Chart type="bar" data={roleData} options={barChartOptions} />
                )}
              </div>
            </div>

            {/* Products by Category Polar Area */}
            <div className="p-5 lg:p-6 bg-white dark:bg-[#141f15] rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 group hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <i className="pi pi-tags text-lg"></i>
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Products by Category</h3>
              </div>
              <div className="flex-1 min-h-[300px] w-full relative flex items-center justify-center">
                {analyticsData.productsCategory.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-white/[0.01] rounded-xl border border-dashed border-slate-200 dark:border-white/10 m-2">
                    <i className="pi pi-tags text-3xl text-slate-300 mb-3"></i>
                    <span className="text-slate-500 font-semibold text-sm">No product data for selected period</span>
                  </div>
                ) : (
                  <Chart type="doughnut" data={categoryData} options={polarAreaOptions} className="w-full h-full" />
                )}
              </div>
            </div>

            {/* Top Selling Products Horizontal Bar */}
            <div className="p-5 lg:p-6 bg-white dark:bg-[#141f15] rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 group hover:shadow-md transition-shadow flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <i className="pi pi-star text-lg"></i>
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Top Selling Products</h3>
              </div>
              <div className="flex-1 min-h-[300px] w-full relative">
                {analyticsData.topProducts.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-white/[0.01] rounded-xl border border-dashed border-slate-200 dark:border-white/10 m-2">
                    <i className="pi pi-star text-3xl text-slate-300 mb-3"></i>
                    <span className="text-slate-500 font-semibold text-sm">No top products for selected period</span>
                  </div>
                ) : (
                  <Chart type="bar" data={topProductsData} options={horizontalBarOptions} />
                )}
              </div>
            </div>

            {/* Sales Time Series Line */}
            <div className="col-span-1 lg:col-span-2 p-5 lg:p-6 bg-white dark:bg-[#141f15] rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 group hover:shadow-md transition-shadow flex flex-col">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <i className="pi pi-chart-line text-lg"></i>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Sales Over Time</h3>
                </div>
              </div>

              <div className="flex-1 min-h-[350px] w-full relative">
                {analyticsData.sales.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-white/[0.01] rounded-xl border border-dashed border-slate-200 dark:border-white/10">
                    <i className="pi pi-inbox text-3xl text-slate-300 mb-3"></i>
                    <span className="text-slate-500 font-semibold text-sm">No sales data for selected period</span>
                  </div>
                ) : (
                  <Chart type={analyticsData.sales.length === 1 ? "bar" : "line"} data={salesData} options={moneyLineChartOptions} className="w-full h-full" />
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    );
  };

  return (
    <AnimatedPage className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] flex flex-col pt-24 sm:pt-28 pb-20 relative transition-colors duration-500">

      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px]"></div>
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-[150px]"></div>
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] rounded-full bg-blue-500/10 dark:bg-blue-500/5 blur-[120px]"></div>
      </div>

      <main className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex-grow flex flex-col">
        <div className="mb-10 mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Admin Dashboard</h1>
            <p className="text-base font-semibold text-slate-500 dark:text-slate-400">Control center for FarmBazar operations</p>
          </div>
          <div className="hidden md:flex items-center gap-4 relative">
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-colors relative"
              >
                <i className="pi pi-bell text-xl"></i>
                {notifUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-[10px] font-black text-white">
                    {notifUnreadCount > 99 ? '99+' : notifUnreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 origin-top-right animate-fade-in">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 dark:text-white">Notifications</h3>
                    <div className="flex items-center gap-2">
                      {notifUnreadCount > 0 && (
                        <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold px-2 py-0.5 rounded-full">
                          {notifUnreadCount} New
                        </span>
                      )}
                      {notifList.length > 0 && (
                        <button
                          onClick={() => notifMarkAllAsRead()}
                          className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto custom-scrollbar">
                    {notifLoading ? (
                      <div className="p-8 text-center">
                        <i className="pi pi-spin pi-spinner text-xl text-slate-400"></i>
                      </div>
                    ) : notifList.length > 0 ? (
                      <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                        {notifList.map(notif => {
                          const iconMap = {
                            'shopping-cart': 'pi-shopping-cart',
                            'package': 'pi-box',
                            'package-check': 'pi-check-circle',
                            'truck': 'pi-truck',
                            'check-circle': 'pi-check-circle',
                            'x-circle': 'pi-times-circle',
                            'star': 'pi-star',
                            'mail': 'pi-envelope',
                            'user-plus': 'pi-user-plus',
                            'bell': 'pi-bell',
                          };
                          const colorMap = {
                            emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600',
                            blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
                            red: 'bg-red-100 dark:bg-red-900/30 text-red-600',
                            amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
                            orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600',
                            indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600',
                            violet: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600',
                          };
                          const piIcon = iconMap[notif.icon] || 'pi-bell';
                          const colorClass = colorMap[notif.color] || colorMap.blue;
                          const timeAgo = getTimeAgo(notif.createdAt);

                          return (
                            <div 
                              key={notif._id} 
                              onClick={() => {
                                if (!notif.isRead) notifMarkAsRead(notif._id);
                                if (notif.link) {
                                  setShowNotifications(false);
                                  navigate(notif.link);
                                }
                              }}
                              className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer flex gap-3 ${
                                !notif.isRead ? 'bg-indigo-50/40 dark:bg-indigo-950/10' : ''
                              }`}
                            >
                              <div className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center shrink-0`}>
                                <i className={`pi ${piIcon} text-sm`}></i>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className={`text-sm leading-tight ${!notif.isRead ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                                    {notif.title}
                                  </p>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      notifDelete(notif._id);
                                    }}
                                    className="text-slate-300 hover:text-red-400 transition-colors shrink-0"
                                  >
                                    <i className="pi pi-times text-[10px]"></i>
                                  </button>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{notif.message}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <i className="pi pi-clock text-[8px]"></i> {timeAgo}
                                  </span>
                                  {!notif.isRead && (
                                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-8 text-center flex flex-col items-center">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 mb-3">
                          <i className="pi pi-check text-xl"></i>
                        </div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">You're all caught up!</p>
                        <p className="text-xs text-slate-400 mt-1">No notifications yet</p>
                      </div>
                    )}
                  </div>
                  {notifList.length > 0 && (
                    <div className="p-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/30 flex justify-between items-center">
                      <button
                        onClick={() => {
                          notifClearAll();
                        }}
                        className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors"
                      >
                        Clear All
                      </button>
                      <span className="text-[10px] text-slate-400">{notifList.length} notification{notifList.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="h-12 flex items-center gap-3 bg-white dark:bg-slate-800 pl-2 pr-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold">A</div>
              <span className="font-bold text-sm text-slate-700 dark:text-slate-200">Admin Mode</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Floating Sidebar Nav */}
          <aside className="w-full lg:w-72 shrink-0 lg:sticky lg:top-32 z-20">
            <nav className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-xl rounded-[2rem] p-4 shadow-xl shadow-slate-200/40 dark:shadow-none border border-white/50 dark:border-white/5 flex flex-col gap-2 relative">
              {/* Active Tab Indicator (Visual only, CSS handles the active state on buttons) */}

              <div className="px-4 py-2 mb-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Main Menu</span>
              </div>

              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-sm transition-all duration-300 group ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 -translate-y-0.5' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}
              >
                <i className={`pi pi-home text-lg transition-transform ${activeTab === 'dashboard' ? 'scale-110' : 'group-hover:scale-110'}`}></i> Overview
              </button>

              <button
                onClick={() => setActiveTab('farmers')}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl font-bold text-sm transition-all duration-300 group ${activeTab === 'farmers' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 -translate-y-0.5' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}
              >
                <div className="flex items-center gap-4">
                  <i className={`pi pi-briefcase text-lg transition-transform ${activeTab === 'farmers' ? 'scale-110' : 'group-hover:scale-110'}`}></i> Farmers
                </div>
                {stats.pendingFarmers?.length > 0 && (
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${activeTab === 'farmers' ? 'bg-white text-emerald-600 shadow-sm' : 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'}`}>
                    {stats.pendingFarmers.length} New
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('customers')}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-sm transition-all duration-300 group ${activeTab === 'customers' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 -translate-y-0.5' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}
              >
                <i className={`pi pi-users text-lg transition-transform ${activeTab === 'customers' ? 'scale-110' : 'group-hover:scale-110'}`}></i> Customers
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-sm transition-all duration-300 group ${activeTab === 'orders' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30 -translate-y-0.5' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}
              >
                <i className={`pi pi-receipt text-lg transition-transform ${activeTab === 'orders' ? 'scale-110' : 'group-hover:scale-110'}`}></i> All Orders
              </button>

              <button
                onClick={() => setActiveTab('inquiries')}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl font-bold text-sm transition-all duration-300 group ${activeTab === 'inquiries' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 -translate-y-0.5' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}
              >
                <div className="flex items-center gap-4">
                  <i className={`pi pi-envelope text-lg transition-transform ${activeTab === 'inquiries' ? 'scale-110' : 'group-hover:scale-110'}`}></i> Support
                </div>
                {inquiries.filter(i => i.status !== 'Resolved').length > 0 && (
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${activeTab === 'inquiries' ? 'bg-white text-purple-600 shadow-sm' : 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400'}`}>
                    {inquiries.filter(i => i.status !== 'Resolved').length}
                  </span>
                )}
              </button>

              <div className="px-4 py-2 mt-4 mb-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Reports</span>
              </div>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-sm transition-all duration-300 group ${activeTab === 'analytics' ? 'bg-indigo-900 dark:bg-white text-white dark:text-slate-900 shadow-lg shadow-slate-500/20 dark:shadow-white/20 -translate-y-0.5' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}
              >
                <i className={`pi pi-chart-pie text-lg transition-transform ${activeTab === 'analytics' ? 'scale-110' : 'group-hover:scale-110'}`}></i> Analytics
              </button>

              <div className="h-px bg-slate-200/50 dark:bg-white/10 my-4 mx-4"></div>

              <button onClick={handleLogout} className="w-full flex items-center gap-4 px-5 py-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl font-bold text-sm transition-colors mt-auto">
                <i className="pi pi-sign-out text-lg"></i> Logout
              </button>
            </nav>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 z-10">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'farmers' && renderFarmers()}
            {activeTab === 'customers' && renderCustomers()}
            {activeTab === 'orders' && renderOrders()}
            {activeTab === 'inquiries' && renderInquiries()}
            {activeTab === 'analytics' && renderAnalytics()}
          </div>
        </div>
      </main>

      {/* Admin Order Details Dialog */}
      <Dialog
        visible={!!selectedOrderModal}
        onHide={() => setSelectedOrderModal(null)}
        header={`Order #${selectedOrderModal?.orderNumber || selectedOrderModal?._id?.substring(selectedOrderModal._id.length - 6).toUpperCase()}`}
        className="w-[94vw] md:w-[700px] border-none shadow-2xl rounded-3xl overflow-hidden"
        headerClassName="bg-slate-50 dark:bg-[#1f2937] text-slate-800 dark:text-white font-black p-6 border-b border-slate-100 dark:border-white/5"
        contentClassName="p-6 bg-white dark:bg-[#111827] max-h-[80vh] overflow-y-auto"
        pt={{ mask: { className: 'backdrop-blur-sm bg-black/60' } }}
      >
        {selectedOrderModal && (
          <div className="flex flex-col gap-6">
            {/* Customer & Order overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Customer</span>
                <p className="text-sm font-bold text-slate-800 dark:text-white">{selectedOrderModal.customerId?.name || 'Customer'}</p>
                <p className="text-xs text-slate-500">{selectedOrderModal.customerId?.email}</p>
                {selectedOrderModal.receiverPhone && (
                  <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedOrderModal.receiverPhone}</p>
                )}
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Delivery & Payment</span>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium line-clamp-2">
                  {selectedOrderModal.deliveryAddress?.address}, {selectedOrderModal.deliveryAddress?.city}
                </p>
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                  {selectedOrderModal.paymentMethod} • {selectedOrderModal.paymentStatus}
                </p>
              </div>
            </div>

            {/* Farmer-wise Sub-orders */}
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                Farmer Sub-orders ({selectedOrderModal.farmerOrders?.length || 1})
              </h3>

              {selectedOrderModal.farmerOrders && selectedOrderModal.farmerOrders.length > 0 ? (
                <div className="space-y-4">
                  {selectedOrderModal.farmerOrders.map((subOrder, idx) => (
                    <div key={idx} className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-200/60 dark:border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                            <Wheat className="w-4 h-4" />
                          </span>
                          <div>
                            <span className="text-sm font-black text-slate-800 dark:text-white">
                              {subOrder.farmerId?.farmName || `Farmer #${idx + 1}`}
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              {subOrder.farmerId?.ownerName ? `${subOrder.farmerId.ownerName} • ` : ''}
                              {subOrder.farmerId?.phone || ''}
                            </span>
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

                      <div className="space-y-2">
                        {subOrder.items?.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 text-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img loading="lazy" src={item.image || 'https://placehold.co/50'} alt={item.name} className="w-8 h-8 rounded-lg object-cover bg-slate-100 shrink-0" />
                              <div className="min-w-0">
                                <span className="font-bold text-slate-800 dark:text-white truncate block">{item.name}</span>
                                <span className="text-[11px] text-slate-400">{item.quantity} × ₹{item.price}</span>
                              </div>
                            </div>
                            <span className="font-bold text-slate-800 dark:text-white">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-white/5 flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-medium">{subOrder.items?.length} produce items</span>
                        <span className="font-black text-slate-800 dark:text-white">Subtotal: ₹{subOrder.subtotal}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedOrderModal.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 text-xs">
                      <span>{item.name} (Qty: {item.quantity})</span>
                      <span className="font-bold">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>₹{selectedOrderModal.subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Delivery</span>
                <span>₹{selectedOrderModal.deliveryCharge}</span>
              </div>
              <div className="pt-2 border-t border-slate-200/60 dark:border-white/5 flex justify-between items-baseline font-bold text-sm">
                <span className="text-slate-800 dark:text-white">Grand Total</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">₹{selectedOrderModal.totalAmount}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedOrderModal(null)}
                className="px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white font-bold text-xs transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Remove User Modal */}
      <Dialog
        header={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
              <i className="pi pi-exclamation-triangle text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white">Remove User</h2>
              <p className="text-xs text-slate-500">This action cannot be undone.</p>
            </div>
          </div>
        }
        visible={removeDialogVisible}
        style={{ width: '100%', maxWidth: '450px' }}
        onHide={() => setRemoveDialogVisible(false)}
        className="mx-4 overflow-hidden rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#141f15]"
        headerClassName="pb-4 px-6 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]"
        contentClassName="p-6"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Are you sure you want to remove <span className="font-bold text-slate-800 dark:text-white">{userToRemove?.name}</span>?
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-white/90">Reason for removal</label>
            <textarea
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none focus:border-red-500 transition-all text-sm resize-none"
              placeholder="This reason will be sent to the user's email..."
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setRemoveDialogVisible(false)}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmRemoveUser}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all shadow-md shadow-red-500/20"
            >
              Remove User
            </button>
          </div>
        </div>
      </Dialog>
    </AnimatedPage>
  );
}
