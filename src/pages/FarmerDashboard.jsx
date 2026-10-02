import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';

import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useConfirm } from '../context/ConfirmContext';
import toast from 'react-hot-toast';
import AnimatedPage from '../components/AnimatedPage';
import { logout, updateUser } from '../store/slices/authSlice';
import api from '../services/api';
import SEO from '../components/SEO';

export default function FarmerDashboard() {
  const confirm = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTabState] = useState(searchParams.get('tab') || 'dashboard');

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    setSearchParams({ tab });
  };
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Cancel Order State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  
  // Profile State
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    farmName: '',
    farmLocation: '',
    farmDescription: '',
    imageFile: null
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});

  // Add Product State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);
  const [addErrors, setAddErrors] = useState({});
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: '',
    price: null,
    unit: 'kg',
    stock: null,
    organic: false,
    imageFile: null
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editErrors, setEditErrors] = useState({});
  const [updatingProduct, setUpdatingProduct] = useState(false);
  
  const fileInputRef = useRef(null);

  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
        farmName: user.farmerProfile?.farmName || '',
        farmLocation: user.farmerProfile?.city ? (user.farmerProfile?.state ? `${user.farmerProfile.city}, ${user.farmerProfile.state}` : user.farmerProfile.city) : '',
        farmDescription: user.farmerProfile?.farmDescription || '',
        imageFile: null
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const [profileRes, ordersRes, productsRes, categoriesRes] = await Promise.allSettled([
          api.get('/users/profile'),
          api.get('/orders/farmer/all'),
          api.get(`/products?farmerId=${user._id}&limit=100`),
          api.get('/categories')
        ]);
        
        if (profileRes.status === 'fulfilled' && profileRes.value.data.data) {
          dispatch(updateUser(profileRes.value.data.data));
        }
        if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.data.data);
        if (productsRes.status === 'fulfilled') setProducts(productsRes.value.data.data.products);
        
        let dbCategories = [];
        if (categoriesRes.status === 'fulfilled') {
          dbCategories = categoriesRes.value.data.data || [];
        }
        
        const defaultCats = ['Vegetables', 'Fruits', 'Dairy', 'Grains', 'Spices'];
        const allCats = [...new Set([...dbCategories, ...defaultCats])].map(cat => ({ label: cat, value: cat }));
        setCategories(allCats);
      } catch (error) {
        console.error('Error fetching farmer data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?._id]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const processOrder = async (orderId, newStatus = 'Accepted', reason = '') => {
    try {
      const payload = { status: newStatus };
      if (reason) payload.cancelReason = reason;
      await api.put(`/orders/${orderId}/status`, payload);
      const ordersRes = await api.get('/orders/farmer/all');
      setOrders(ordersRes.data.data);
      toast.success(`Order ${newStatus.toLowerCase()} successfully`);
    } catch (error) {
      console.error(error);
      toast.error('Error updating order');
    }
  };

  const handleCancelClick = (orderId) => {
    setOrderToCancel(orderId);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const [cancelError, setCancelError] = useState('');

  const submitCancel = async () => {
    if (!cancelReason.trim()) {
      setCancelError('Please provide a reason for cancellation');
      return;
    }
    setCancelError('');
    await processOrder(orderToCancel, 'Cancelled', cancelReason);
    setShowCancelModal(false);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!profileData.name || !profileData.name.trim()) {
      errors.name = 'Full name is required';
    }
    if (profileData.phone && !/^[0-9]{10}$/.test(profileData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Please enter a valid 10-digit phone number';
    }
    if (!profileData.farmName || !profileData.farmName.trim()) {
      errors.farmName = 'Farm/Store name is required';
    }
    if (!profileData.farmLocation || !profileData.farmLocation.trim()) {
      errors.farmLocation = 'Farm location is required (e.g. Ahmedabad, Gujarat)';
    }

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }
    setProfileErrors({});
    
    setUpdatingProfile(true);
    try {
      let profilePayload = { ...profileData };
      if (profileData.imageFile) {
        const formData = new FormData();
        formData.append('image', profileData.imageFile);
        const uploadRes = await api.post('/uploads', formData);
        profilePayload.farmImage = uploadRes.data.data.url;
      }
      
      const res = await api.put('/users/profile', profilePayload);
      dispatch(updateUser(res.data.data));
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!newProduct.name || !newProduct.name.trim()) errors.name = 'Please enter a product name';
    if (!newProduct.description || !newProduct.description.trim()) errors.description = 'Please enter a product description';
    if (newProduct.price === null || newProduct.price === undefined || Number(newProduct.price) <= 0) {
      errors.price = 'Please enter a valid price (greater than ₹0)';
    }
    if (!newProduct.unit) errors.unit = 'Please select a unit';
    if (newProduct.stock === null || newProduct.stock === undefined || Number(newProduct.stock) < 0) {
      errors.stock = 'Please enter a valid stock quantity (0 or more)';
    }
    if (!newProduct.category) errors.category = 'Please select a category';

    if (Object.keys(errors).length > 0) {
      setAddErrors(errors);
      return;
    }
    setAddErrors({});

    setAddingProduct(true);
    try {
      let imagePath = null;
      if (newProduct.imageFile) {
        const formData = new FormData();
        formData.append('image', newProduct.imageFile);
        const uploadRes = await api.post('/uploads', formData);
        imagePath = uploadRes.data.data.url;
      }

      const productData = {
        name: newProduct.name.trim(),
        description: newProduct.description.trim(),
        category: newProduct.category,
        price: Number(newProduct.price),
        unit: newProduct.unit,
        quantity: Number(newProduct.stock),
        isOrganic: newProduct.organic || false,
        images: imagePath ? [imagePath] : []
      };

      await api.post('/products', productData);
      
      // Refresh products
      const productsRes = await api.get(`/products?farmerId=${user._id}&limit=100`);
      setProducts(productsRes.data.data.products);
      
      setShowAddModal(false);
      setNewProduct({ name: '', description: '', category: '', price: null, unit: 'kg', stock: null, organic: false, imageFile: null });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast.success('Product added successfully!');
    } catch (error) {
      console.error('Error adding product:', error);
      const msg = error.response?.data?.message || (error.code === 'ERR_NETWORK' ? 'Network error: Backend server is not reachable on port 5001. Please make sure the backend is running.' : error.message) || 'Error adding product';
      toast.error(msg);
    } finally {
      setAddingProduct(false);
    }
  };

  const handleUpdateProduct = async (e) => {
  e.preventDefault();
  if (!editingProduct) return;
  
  const errors = {};
  if (!editingProduct.name || !editingProduct.name.trim()) errors.name = 'Product name is required';
  if (!editingProduct.description || !editingProduct.description.trim()) errors.description = 'Product description is required';
  if (!editingProduct.category) errors.category = 'Please select a category';
  if (editingProduct.price === null || editingProduct.price === undefined || Number(editingProduct.price) <= 0) {
    errors.price = 'Please enter a valid price (greater than ₹0)';
  }
  if (!editingProduct.unit) errors.unit = 'Please select a unit';
  if (editingProduct.stock === null || editingProduct.stock === undefined || Number(editingProduct.stock) < 0) {
    errors.stock = 'Please enter a valid stock quantity';
  }

  if (Object.keys(errors).length > 0) {
    setEditErrors(errors);
    return;
  }
  setEditErrors({});

  setUpdatingProduct(true);
  try {
    let imagePath = null;
    if (editingProduct.imageFile) {
      const formData = new FormData();
      formData.append('image', editingProduct.imageFile);
      const uploadRes = await api.post('/uploads', formData);
      imagePath = uploadRes.data.data.url;
    }
    const productData = {
      name: editingProduct.name.trim(),
      description: editingProduct.description.trim(),
      category: editingProduct.category,
      price: Number(editingProduct.price),
      unit: editingProduct.unit,
      quantity: Number(editingProduct.stock),
      isOrganic: editingProduct.organic || false,
      images: imagePath ? [imagePath] : editingProduct.images || []
    };
    await api.put(`/products/${editingProduct._id}`, productData);
    const productsRes = await api.get(`/products?farmerId=${user._id}&limit=100`);
    setProducts(productsRes.data.data.products);
    toast.success('Product updated successfully!');
    setShowEditModal(false);
    setEditingProduct(null);
  } catch (error) {
    console.error('Error updating product:', error);
    const msg = error.response?.data?.message || error.message || 'Error updating product';
    toast.error(msg);
  } finally {
    setUpdatingProduct(false);
  }
};

const handleDeleteProduct = async (productId) => {
    const ok = await confirm({
      title: 'Delete Product?',
      message: 'This action cannot be undone. The product will be permanently removed from your listings.',
      confirmLabel: 'Yes, Delete',
      cancelLabel: 'Keep it',
      type: 'danger',
    });
    if (ok) {
      try {
        await api.delete(`/products/${productId}`);
        const productsRes = await api.get(`/products?farmerId=${user._id}&limit=100`);
        setProducts(productsRes.data.data.products);
      } catch (error) {
        console.error(error);
        toast.error('Error deleting product');
      }
    }
  };
  const handleEditClick = (product) => {
    setEditingProduct(product);
    setShowEditModal(true);
  };

  const totalSales = orders.filter(o => o.paymentStatus === 'Completed' || o.orderStatus === 'Delivered').reduce((sum, o) => sum + o.totalAmount, 0);
  const activeOrders = orders.filter(o => o.orderStatus !== 'Delivered' && o.orderStatus !== 'Cancelled');
  const lowStockCount = products.filter(p => p.quantity < 5).length;
  const pendingOrders = orders.filter(o => o.orderStatus === 'Placed');

  const unitOptions = [
    { label: 'Kilogram (kg)', value: 'kg' },
    { label: 'Gram (g)', value: 'gram' },
    { label: 'Litre (l)', value: 'litre' },
    { label: 'Piece', value: 'piece' },
    { label: 'Dozen', value: 'dozen' }
  ];

  const orderStatusOptions = [
    { label: 'Placed', value: 'Placed' },
    { label: 'Accepted', value: 'Accepted' },
    { label: 'Packed', value: 'Packed' },
    { label: 'Out For Delivery', value: 'Out For Delivery' },
    { label: 'Delivered', value: 'Delivered' },
    { label: 'Cancelled', value: 'Cancelled' }
  ];

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
                You're currently signed in via Google. Set a password so you can also log in directly by typing your email and password.
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
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Sales Card */}
        <div className="relative overflow-hidden bg-white dark:bg-[#141f15] rounded-3xl p-6 shadow-md hover:shadow-2xl border border-slate-200/60 dark:border-white/10 group hover:-translate-y-1.5 transition-all duration-300 cursor-pointer">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-50 dark:bg-emerald-900/20 rounded-full blur-2xl group-hover:bg-emerald-100 transition-colors"></div>
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
              <i className="pi pi-wallet text-xl"></i>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wide uppercase">Revenue</span>
          </div>
          <div className="relative z-10">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Total Sales</h3>
            <div className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">₹{totalSales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 w-fit px-2 py-1 rounded-md">
              <i className="pi pi-chart-line"></i><span>Updated Just Now</span>
            </div>
          </div>
        </div>

        {/* Active Orders Card */}
        <div className="relative overflow-hidden bg-white dark:bg-[#141f15] rounded-3xl p-6 shadow-md hover:shadow-2xl border border-slate-200/60 dark:border-white/10 group hover:-translate-y-1.5 transition-all duration-300 cursor-pointer">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-50 dark:bg-blue-900/20 rounded-full blur-2xl group-hover:bg-blue-100 transition-colors"></div>
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <i className="pi pi-shopping-bag text-xl"></i>
            </div>
            <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-wide uppercase">Orders</span>
          </div>
          <div className="relative z-10">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Active Orders</h3>
            <div className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">{activeOrders.length}</div>
            <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 w-fit px-2 py-1 rounded-md">
              <i className="pi pi-clock"></i><span>{pendingOrders.length} Pending Action</span>
            </div>
          </div>
        </div>

        {/* Products Listed Card */}
        <div className="relative overflow-hidden bg-white dark:bg-[#141f15] rounded-3xl p-6 shadow-md hover:shadow-2xl border border-slate-200/60 dark:border-white/10 group hover:-translate-y-1.5 transition-all duration-300 cursor-pointer">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-orange-50 dark:bg-orange-900/20 rounded-full blur-2xl group-hover:bg-orange-100 transition-colors"></div>
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
              <i className="pi pi-box text-xl"></i>
            </div>
            <span className="px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-bold tracking-wide uppercase">Inventory</span>
          </div>
          <div className="relative z-10">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Products Listed</h3>
            <div className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">{products.length}</div>
            <div className={`flex items-center gap-2 mt-4 text-xs font-semibold w-fit px-2 py-1 rounded-md ${lowStockCount > 0 ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'}`}>
              <i className={lowStockCount > 0 ? "pi pi-exclamation-triangle" : "pi pi-check-circle"}></i>
              <span>{lowStockCount > 0 ? `${lowStockCount} Low Stock Items` : 'All Stock OK'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Orders Table */}
      <div className="bg-white dark:bg-[#141f15] rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <i className="pi pi-clock text-lg"></i>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Pending Orders</h2>
              <p className="text-xs font-medium text-slate-500">Orders waiting for your confirmation</p>
            </div>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-full py-12 text-center text-slate-400 font-medium">
              <i className="pi pi-spin pi-spinner text-2xl mb-3 block text-emerald-600"></i>
              Loading orders...
            </div>
          ) : pendingOrders.length === 0 ? (
            <div className="col-span-full py-16 text-center">
              <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-5 text-slate-300">
                <i className="pi pi-inbox text-3xl"></i>
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-white mb-1">No pending orders</h3>
              <p className="text-sm text-slate-500 font-medium">You're all caught up for now!</p>
            </div>
          ) : pendingOrders.map((order, index) => (
            <div key={order._id} style={{ animationDelay: `${index * 50}ms`, opacity: 0 }} className="animate-fade-in-up bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-3xl p-5 hover:shadow-xl transition-all flex flex-col justify-between group hover:-translate-y-1">
              <div>
                <div className="flex justify-between items-start mb-5">
                  <span className="px-3 py-1 bg-white dark:bg-[#141f15] border border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-black text-[10px] uppercase tracking-wider rounded-xl shadow-sm">
                    #{order.orderNumber || order._id.substring(order._id.length - 6).toUpperCase()}
                  </span>
                  <span className="font-black text-slate-800 dark:text-white text-lg">₹{order.totalAmount}</span>
                </div>
                
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                    {order.customerId?.name?.charAt(0) || 'G'}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700 dark:text-white text-sm">{order.customerId?.name || 'Guest User'}</span>
                    <span className="text-xs text-slate-500 font-medium">Customer</span>
                  </div>
                </div>

                <div className="mb-5 bg-white dark:bg-[#141f15] p-3.5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><i className="pi pi-map-marker text-[9px]"></i> Delivery Address</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-0.5">{order.receiverName || order.customerId?.name}</p>
                  <p className="text-xs text-slate-500 leading-relaxed mb-0.5">{order.deliveryAddress?.address}</p>
                  <p className="text-xs text-slate-500 font-medium">{order.deliveryAddress?.city}, {order.deliveryAddress?.state} {order.deliveryAddress?.pincode}</p>
                </div>

                <div className="mb-6">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5"><i className="pi pi-shopping-bag text-[9px]"></i> Order Items</p>
                  <div className="flex flex-wrap gap-2">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white dark:bg-[#141f15] border border-slate-100 dark:border-white/5 px-3 py-2 rounded-xl shadow-sm">
                        <span className="w-5 h-5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                          {item.quantity}x
                        </span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button onClick={() => processOrder(order._id, 'Accepted')} className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 group-hover:scale-[1.02]">
                  <i className="pi pi-check"></i> Accept Order
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="animate-fade-in bg-white dark:bg-[#141f15] rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <i className="pi pi-box text-lg"></i>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">All Listed Products</h2>
            <p className="text-xs font-medium text-slate-500">Manage your farm's inventory</p>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Produce</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Price</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {loading ? (
              <tr><td colSpan="6" className="p-8 text-center text-slate-400 font-medium">Loading inventory...</td></tr>
            ) : products.length === 0 ? (
              <tr>
                  <td colSpan="6" className="p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <i className="pi pi-box text-2xl"></i>
                    </div>
                    <p className="text-slate-500 font-medium">No products listed yet.</p>
                  </td>
              </tr>
            ) : products.map(product => (
              <tr key={product._id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <img loading="lazy" src={product.images[0] || 'https://placehold.co/100'} alt={product.name} className="w-12 h-12 object-cover rounded-xl border border-slate-200 dark:border-white/10 shadow-sm" />
                    <span className="font-bold text-slate-800 dark:text-white">{product.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold">{product.category}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-black text-slate-800 dark:text-white">₹{product.price}</span>
                  <span className="text-xs text-slate-400 font-semibold">/{product.unit}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${product.quantity > 10 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                    {product.quantity} {product.unit}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`flex items-center gap-1.5 text-xs font-bold ${product.isAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${product.isAvailable ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                    {product.isAvailable ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleEditClick(product)} className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors flex items-center justify-center mr-2" aria-label="Edit">
                    <i className="pi pi-pencil text-sm"></i>
                  </button>
                  <button onClick={() => handleDeleteProduct(product._id)} className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center ml-auto" aria-label="Delete">
                    <i className="pi pi-trash text-sm"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="bg-white dark:bg-[#141f15] rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
        <div className="p-6 flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <i className="pi pi-truck text-lg"></i>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Order History</h2>
              <p className="text-xs font-medium text-slate-500">Track and manage your deliveries</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 font-medium">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white dark:bg-[#141f15] rounded-3xl p-12 text-center border border-slate-100 dark:border-white/5">
          <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
            <i className="pi pi-shopping-bag text-2xl"></i>
          </div>
          <p className="text-slate-500 font-medium">No orders have been placed yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {orders.map((order, index) => (
            <div key={order._id} style={{ animationDelay: `${index * 100}ms`, opacity: 0 }} className="animate-fade-in-up bg-white dark:bg-[#141f15] rounded-3xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 duration-300 border border-slate-100 dark:border-white/5 hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-all flex flex-col gap-4 group">
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-white">#{order.orderNumber || order._id.substring(order._id.length - 6).toUpperCase()}</span>
                    <span className="text-xs text-slate-400 font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 font-bold text-[10px]">
                      {order.customerId?.name?.charAt(0) || 'G'}
                    </span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300 text-sm">{order.customerId?.name || 'Guest User'}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="font-black text-lg text-slate-800 dark:text-white">₹{order.totalAmount}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Items Ordered</h4>
                  <div className="flex flex-col gap-1.5 bg-slate-50 dark:bg-white/[0.02] p-3 rounded-xl border border-slate-100 dark:border-white/5 h-full">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-[10px] font-black text-emerald-600 dark:text-emerald-400 shrink-0">
                          {item.quantity}x
                        </span>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delivery Details</h4>
                  <div className="flex flex-col gap-1 bg-slate-50 dark:bg-white/[0.02] p-3 rounded-xl border border-slate-100 dark:border-white/5 h-full justify-center">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      <i className="pi pi-user mr-1.5 text-slate-400 text-xs"></i>
                      {order.receiverName || order.customerId?.name}
                    </span>
                    <span className="text-xs text-slate-500 mt-1 line-clamp-2">
                      <i className="pi pi-map-marker mr-1.5 text-slate-400 text-xs"></i>
                      {order.deliveryAddress?.address}
                    </span>
                    <span className="text-xs text-slate-500 pl-4">{order.deliveryAddress?.city}, {order.deliveryAddress?.state} {order.deliveryAddress?.pincode}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex justify-between items-center mt-auto">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status: <span className="text-slate-700 dark:text-white">{order.orderStatus}</span></span>
                <div>
                  {(() => {
                    if (order.orderStatus === 'Placed' || order.orderStatus === 'Pending') {
                      return (
                        <div className="flex gap-2">
      <SEO title="Farmer Dashboard - FarmBazar" description="Manage your farm products and orders on FarmBazar." />
                          <button onClick={() => processOrder(order._id, 'Accepted')} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm text-center shadow-indigo-500/30">Accept</button>
                          <button onClick={() => handleCancelClick(order._id)} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm text-center shadow-red-500/30">Cancel</button>
                        </div>
                      );
                    } else if (order.orderStatus === 'Accepted') {
                      return <button onClick={() => processOrder(order._id, 'Packed')} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm text-center shadow-blue-500/30">Mark as Packed</button>;
                    } else if (order.orderStatus === 'Packed') {
                      return <button onClick={() => processOrder(order._id, 'Out For Delivery')} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm text-center shadow-orange-500/30">Send for Delivery</button>;
                    } else if (order.orderStatus === 'Out For Delivery') {
                      return <button onClick={() => processOrder(order._id, 'Delivered')} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm text-center shadow-emerald-500/30">Mark Delivered</button>;
                    } else if (order.orderStatus === 'Delivered') {
                      return <span className="px-4 py-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-xl text-xs font-bold inline-block text-center border border-emerald-100 dark:border-emerald-500/20 shadow-sm">Delivered <i className="pi pi-check text-[10px] ml-1"></i></span>;
                    } else if (order.orderStatus === 'Cancelled') {
                      return <span className="px-4 py-2 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-xl text-xs font-bold inline-block text-center border border-red-100 dark:border-red-500/20 shadow-sm">Cancelled</span>;
                    }
                    return null;
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="animate-fade-in bg-white dark:bg-[#141f15] rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
      <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <i className="pi pi-id-card text-lg"></i>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Store Profile Details</h2>
            <p className="text-xs font-medium text-slate-500">Manage your public farm presence</p>
          </div>
        </div>
      </div>
      <div className="p-8">
        <form onSubmit={handleProfileUpdate} className="flex flex-col gap-6 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
              <InputText value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border outline-none transition-all shadow-sm font-semibold dark:text-white ${profileErrors.name ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-purple-500 focus:bg-white'}`} placeholder="Enter your full name" required />
              {profileErrors.name && <p className="text-red-500 text-[11px] font-semibold mt-1">{profileErrors.name}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
              <div className="flex items-stretch">
                <span className="inline-flex items-center px-4 rounded-l-xl bg-slate-100 dark:bg-white/10 border border-r-0 border-slate-200 dark:border-white/10 text-sm font-bold text-slate-600 dark:text-white/70 select-none">+91</span>
                <InputText value={profileData.phone} onChange={(e) => { const val = e.target.value.replace(/\D/g, ''); setProfileData({...profileData, phone: val}); }} className={`w-full px-4 py-3 rounded-r-xl rounded-l-none bg-slate-50 dark:bg-white/5 border outline-none transition-all shadow-sm font-semibold dark:text-white ${profileErrors.phone ? 'border-red-500 focus:border-red-500 border-l-0' : 'border-slate-200 dark:border-white/10 focus:border-purple-500 focus:bg-white border-l-0'}`} placeholder="9876543210" maxLength={10} required />
              </div>
              {profileErrors.phone && <p className="text-red-500 text-[11px] font-semibold mt-1">{profileErrors.phone}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Farm/Store Name</label>
            <InputText value={profileData.farmName} onChange={(e) => setProfileData({...profileData, farmName: e.target.value})} className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border outline-none transition-all shadow-sm font-semibold dark:text-white ${profileErrors.farmName ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-purple-500 focus:bg-white'}`} placeholder="Green Valley Farms" required />
            {profileErrors.farmName && <p className="text-red-500 text-[11px] font-semibold mt-1">{profileErrors.farmName}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Farm Cover Image</label>
            <input type="file" accept="image/*" onChange={(e) => setProfileData({...profileData, imageFile: e.target.files[0]})} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 outline-none transition-all shadow-sm text-sm text-slate-600 dark:text-white" />
            <p className="text-[10px] text-slate-400 font-semibold">Upload a beautiful cover image for your farm profile.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Farm Location</label>
            <InputText value={profileData.farmLocation} onChange={(e) => setProfileData({...profileData, farmLocation: e.target.value})} className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border outline-none transition-all shadow-sm font-semibold dark:text-white ${profileErrors.farmLocation ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-purple-500 focus:bg-white'}`} placeholder="City, State" required />
            {profileErrors.farmLocation && <p className="text-red-500 text-[11px] font-semibold mt-1">{profileErrors.farmLocation}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Farm Description & Story</label>
            <InputTextarea value={profileData.farmDescription} onChange={(e) => setProfileData({...profileData, farmDescription: e.target.value})} rows={5} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-purple-500 focus:bg-white outline-none transition-all shadow-sm font-semibold resize-none dark:text-white" placeholder="Tell your customers about your farming practices and history..." />
          </div>

          <div className="flex justify-start mt-4 pt-6 border-t border-slate-100 dark:border-white/5">
            <button type="submit" disabled={updatingProfile} className="px-8 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black transition-all shadow-lg shadow-purple-900/20 disabled:opacity-70 hover:-translate-y-0.5">
              {updatingProfile ? <><i className="pi pi-spin pi-spinner mr-2"></i>Saving...</> : 'Save Profile Changes'}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02]">
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">Account Password & Security</h4>
              <p className="text-xs text-slate-500">
                {user?.hasPassword
                  ? 'Your password is active. You can change it anytime.'
                  : 'You signed in with Google. Set a password to also enable email and password login.'}
              </p>
            </div>
            <Link to="/set-password">
              <button
                type="button"
                className="px-4 py-2 text-xs font-bold rounded-xl border border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all"
              >
                {user?.hasPassword ? 'Change Password' : 'Set Password'}
              </button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );

  const isApproved = user?.farmerProfile?.verificationStatus === 'approved';

  if (!isApproved) {
    return (
      <AnimatedPage className="min-h-screen bg-slate-50 dark:bg-[#0a0f0a] flex flex-col font-sans relative overflow-hidden">
        {/* Decorative Background Patterns */}
        <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#15803d 2px, transparent 2px)', backgroundSize: '32px 32px' }}></div>
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-300/20 dark:bg-emerald-900/20 blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-teal-300/20 dark:bg-teal-900/20 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] rounded-full bg-blue-300/10 dark:bg-blue-900/10 blur-[100px] animate-pulse" style={{ animationDelay: '4s' }}></div>
        </div>
        <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-36 pb-20 flex-grow relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">Farmer Dashboard</h1>
              <p className="text-sm font-semibold text-slate-500 dark:text-white/50">Account Setup & Verification</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#141f15] rounded-3xl shadow-lg border border-slate-200/50 dark:border-white/5 max-w-2xl mx-auto p-12 text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-6 shadow-inner border border-orange-200/50 dark:border-orange-900/50">
               <i className="pi pi-clock text-4xl text-orange-500 dark:text-orange-400"></i>
            </div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-3 tracking-tight">Pending Admin Approval</h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
              Your application to join as a farmer is currently under review by our administration team. We'll verify your details shortly so you can start selling!
            </p>
            <div className="flex gap-4">
              <Link to="/set-password">
                <button className="px-6 py-3 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-emerald-600 font-bold border border-emerald-200 dark:border-emerald-800 rounded-xl shadow-sm transition-colors">
                  {user?.hasPassword ? 'Change Password' : 'Set Password'}
                </button>
              </Link>
              <button onClick={handleLogout} className="px-8 py-3 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-red-500 font-bold border border-red-200 dark:border-red-900/50 rounded-xl shadow-sm transition-colors">Log Out</button>
            </div>
          </div>
        </main>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="min-h-screen bg-slate-50 dark:bg-[#0a0f0a] flex flex-col font-sans relative overflow-hidden">
      {/* Rich Decorative Background */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] dark:opacity-[0.02]"></div>
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-br from-emerald-100/80 via-teal-50/40 to-transparent dark:from-emerald-950/60 dark:via-teal-950/20 dark:to-transparent z-0 pointer-events-none"></div>
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[40%] rounded-full bg-emerald-400/30 dark:bg-emerald-600/20 blur-[140px] animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-300/20 dark:bg-amber-600/10 blur-[140px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }}></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[40%] rounded-full bg-green-400/20 dark:bg-green-800/20 blur-[140px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }}></div>
      </div>
      
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-36 pb-20 flex-grow relative z-10">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-emerald-800 dark:text-emerald-400 tracking-tight mb-2">My Dashboard</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Welcome back, {user?.name}! Here's an overview of your activity.</p>
          </div>
          {activeTab !== 'profile' && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all hover:-translate-y-0.5"
            >
              <i className="pi pi-plus"></i> Add Product
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Nav */}
          <aside className="col-span-1">
            <nav className="bg-white dark:bg-[#141f15] rounded-3xl p-3 shadow-sm border border-slate-100 dark:border-white/5 flex flex-col gap-1 sticky top-24">
              <button 
                onClick={() => setActiveTab('dashboard')} 
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}
              >
                <i className={`pi pi-home ${activeTab === 'dashboard' ? 'text-white' : 'text-slate-400'}`}></i> Overview
              </button>
              
              <button 
                onClick={() => setActiveTab('products')} 
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 ${activeTab === 'products' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}
              >
                <i className={`pi pi-box ${activeTab === 'products' ? 'text-white' : 'text-slate-400'}`}></i> My Inventory
              </button>
              
              <button 
                onClick={() => setActiveTab('orders')} 
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 ${activeTab === 'orders' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}
              >
                <div className="flex items-center gap-3">
                  <i className={`pi pi-truck ${activeTab === 'orders' ? 'text-white' : 'text-slate-400'}`}></i> Orders
                </div>
                {pendingOrders.length > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${activeTab === 'orders' ? 'bg-white text-emerald-600' : 'bg-red-50 text-red-600'}`}>{pendingOrders.length} New</span>
                )}
              </button>
              
              <button 
                onClick={() => setActiveTab('profile')} 
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 ${activeTab === 'profile' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}
              >
                <i className={`pi pi-id-card ${activeTab === 'profile' ? 'text-white' : 'text-slate-400'}`}></i> Farm Profile
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
            {activeTab === 'products' && renderProducts()}
            {activeTab === 'orders' && renderOrders()}
            {activeTab === 'profile' && renderProfile()}
          </div>
        </div>

      {/* Add Product Modal */}
      <Dialog 
        header={
          <div className="flex items-center gap-3 pt-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/40 dark:to-emerald-800/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner border border-emerald-200/50 dark:border-emerald-700/30">
              <i className="pi pi-sparkles text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Add Fresh Produce</h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-white/60 mt-0.5">Expand your farm's digital catalog</p>
            </div>
          </div>
        }
        visible={showAddModal} 
        style={{ width: '100%', maxWidth: '650px' }} 
        onHide={() => setShowAddModal(false)}
        contentClassName="pb-6 px-6"
        headerClassName="pb-4 px-6 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-[#141f15]"
        className="mx-4 overflow-hidden rounded-3xl shadow-2xl border border-slate-200/80 dark:border-emerald-900/40 bg-white dark:bg-[#141f15]"
      >
        <form onSubmit={handleAddProduct} className="flex flex-col gap-6 mt-6">
          
          {/* Section 1: Basic Info */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-white/5 pb-2">1. Basic Details</h3>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700 dark:text-white/90">Product Name</label>
              <InputText required value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} placeholder="E.g. Organic Heritage Tomatoes" className={`w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border outline-none transition-all shadow-sm font-medium text-sm text-slate-900 dark:text-white ${addErrors.name ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#182318]'}`} />
              {addErrors.name && <p className="text-red-500 text-[11px] font-semibold mt-1">{addErrors.name}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700 dark:text-white/90">Description</label>
              <InputTextarea required rows={3} value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} placeholder="Highlight the freshness, origin, and quality of your harvest..." className={`w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border outline-none transition-all shadow-sm font-medium text-sm text-slate-900 dark:text-white resize-none ${addErrors.description ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#182318]'}`} />
              {addErrors.description && <p className="text-red-500 text-[11px] font-semibold mt-1">{addErrors.description}</p>}
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700 dark:text-white/90">Category</label>
              <Dropdown required value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.value})} options={categories} optionLabel="label" optionValue="value" placeholder="Select Produce Category" className={`w-full bg-slate-50 dark:bg-white/5 border rounded-xl shadow-sm transition-all ${addErrors.category ? 'border-red-500 hover:border-red-500' : 'border-slate-200 dark:border-white/10 hover:border-emerald-400'}`} pt={{ input: { className: 'px-4 py-3.5 font-medium text-sm text-slate-700 dark:text-white' }, trigger: { className: 'w-12 text-slate-400' } }} />
              {addErrors.category && <p className="text-red-500 text-[11px] font-semibold mt-1">{addErrors.category}</p>}
            </div>
          </div>

          {/* Section 2: Pricing & Stock */}
          <div className="space-y-4 pt-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-white/5 pb-2">2. Pricing & Inventory</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-white/90">Selling Price</label>
                <div className="relative">
                  <i className="pi pi-indian-rupee absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm z-10" />
                  <InputNumber required value={newProduct.price} onValueChange={(e) => setNewProduct({...newProduct, price: e.value})} className="w-full" inputClassName={`w-full pl-9 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border outline-none transition-all shadow-sm font-medium text-sm text-slate-900 dark:text-white ${addErrors.price ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#182318]'}`} placeholder="0.00" />
                </div>
                {addErrors.price && <p className="text-red-500 text-[11px] font-semibold mt-1">{addErrors.price}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-white/90">Unit of Measurement</label>
                <Dropdown required value={newProduct.unit} onChange={(e) => setNewProduct({...newProduct, unit: e.value})} options={unitOptions} optionLabel="label" optionValue="value" placeholder="Select Unit" className={`w-full bg-slate-50 dark:bg-white/5 border rounded-xl shadow-sm transition-all ${addErrors.unit ? 'border-red-500 hover:border-red-500' : 'border-slate-200 dark:border-white/10 hover:border-emerald-400'}`} pt={{ input: { className: 'px-4 py-3.5 font-medium text-sm text-slate-700 dark:text-white' }, trigger: { className: 'w-12 text-slate-400' } }} />
                {addErrors.unit && <p className="text-red-500 text-[11px] font-semibold mt-1">{addErrors.unit}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-white/90">Available Stock</label>
                <div className="relative">
                  <i className="pi pi-box absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm z-10" />
                  <InputNumber required value={newProduct.stock} onValueChange={(e) => setNewProduct({...newProduct, stock: e.value})} className="w-full" inputClassName={`w-full pl-9 pr-4 py-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border outline-none transition-all shadow-sm font-medium text-sm text-slate-900 dark:text-white ${addErrors.stock ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#182318]'}`} placeholder="Quantity" />
                </div>
                {addErrors.stock && <p className="text-red-500 text-[11px] font-semibold mt-1">{addErrors.stock}</p>}
              </div>
              <div className="flex flex-col gap-1.5 justify-center pt-6">
                 <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30 h-full">
                   <Checkbox inputId="organic" checked={newProduct.organic} onChange={e => setNewProduct({...newProduct, organic: e.checked})} className="border-2 border-emerald-500 rounded-md" />
                   <div className="flex flex-col cursor-pointer" onClick={() => setNewProduct({...newProduct, organic: !newProduct.organic})}>
                     <label htmlFor="organic" className="text-sm font-bold text-emerald-800 dark:text-emerald-400 cursor-pointer">Organic Certified</label>
                     <span className="text-[10px] text-emerald-600 dark:text-emerald-500">100% natural farming</span>
                   </div>
                 </div>
              </div>
            </div>
          </div>

          {/* Section 3: Media */}
          <div className="space-y-4 pt-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-white/5 pb-2">3. Product Media</h3>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700 dark:text-white/90">Cover Photo</label>
              <div className="relative border-2 border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors rounded-2xl p-6 text-center cursor-pointer group flex flex-col items-center justify-center overflow-hidden">
                <input 
                  type="file" 
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={(e) => setNewProduct({...newProduct, imageFile: e.target.files[0]})}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                
                {newProduct.imageFile ? (
                  <div className="flex flex-col items-center gap-2 z-0">
                    <div className="w-16 h-16 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <i className="pi pi-image text-2xl" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{newProduct.imageFile.name}</p>
                      <p className="text-[11px] font-semibold text-emerald-600/70 dark:text-emerald-500">Click or drag to change image</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 z-0 group-hover:scale-105 transition-transform duration-300">
                    <div className="w-14 h-14 rounded-full bg-white dark:bg-[#182318] shadow-sm flex items-center justify-center text-emerald-500 border border-emerald-100 dark:border-emerald-900/50">
                      <i className="pi pi-cloud-upload text-xl" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Click to upload product image</p>
                      <p className="text-[11px] font-semibold text-slate-500 dark:text-white/50 mt-1">PNG, JPG up to 5MB</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-4 pt-6 border-t border-slate-100 dark:border-white/5">
            <button 
              type="button" 
              onClick={() => setShowAddModal(false)} 
              className="px-6 py-3.5 rounded-xl font-bold text-sm text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={addingProduct} 
              className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm transition-all shadow-lg shadow-emerald-900/30 flex items-center gap-2 disabled:opacity-70 disabled:hover:bg-emerald-600 hover:-translate-y-0.5"
            >
              {addingProduct ? (
                <><i className="pi pi-spin pi-spinner text-sm" /> Publishing...</>
              ) : (
                <><i className="pi pi-check-circle text-sm" /> Publish Product</>
              )}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog
        header={
          <div className="flex items-center gap-3 pt-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/40 dark:to-emerald-800/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner border border-emerald-200/50 dark:border-emerald-700/30">
              <i className="pi pi-pencil text-xl"></i>
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Edit Product</h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-white/60 mt-0.5">Modify your product details</p>
            </div>
          </div>
        }
        visible={showEditModal}
        style={{ width: '100%', maxWidth: '650px' }}
        onHide={() => setShowEditModal(false)}
        contentClassName="pb-6 px-6"
        headerClassName="pb-4 px-6 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-[#141f15]"
        className="mx-4 overflow-hidden rounded-3xl shadow-2xl border border-slate-200/80 dark:border-emerald-900/40 bg-white dark:bg-[#141f15]"
      >
        {editingProduct && (
          <form onSubmit={handleUpdateProduct} className="flex flex-col gap-6 mt-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-white/5 pb-2">1. Basic Details</h3>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-white/90">Product Name</label>
                <InputText required value={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} placeholder="E.g. Organic Heritage Tomatoes" className={`w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border outline-none transition-all shadow-sm font-medium text-sm text-slate-900 dark:text-white ${editErrors.name ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#182318]'}`} />
                {editErrors.name && <p className="text-red-500 text-[11px] font-semibold mt-1">{editErrors.name}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-white/90">Description</label>
                <InputTextarea required rows={3} value={editingProduct.description} onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })} placeholder="Highlight the freshness, origin, and quality of your harvest..." className={`w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border outline-none transition-all shadow-sm font-medium text-sm text-slate-900 dark:text-white resize-none ${editErrors.description ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-emerald-500 focus:bg-white dark:focus:bg-[#182318]'}`} />
                {editErrors.description && <p className="text-red-500 text-[11px] font-semibold mt-1">{editErrors.description}</p>}
              </div>
            </div>
            {/* Additional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-white/90">Category</label>
                <Dropdown value={editingProduct.category} onChange={(e) => setEditingProduct({ ...editingProduct, category: e.value })} options={categories} optionLabel="label" optionValue="value" placeholder="Select Category" className={`w-full ${editErrors.category ? 'border border-red-500' : ''}`} />
                {editErrors.category && <p className="text-red-500 text-[11px] font-semibold mt-1">{editErrors.category}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-white/90">Price</label>
                <InputNumber value={editingProduct.price} onValueChange={(e) => setEditingProduct({ ...editingProduct, price: e.value })} mode="currency" currency="INR" locale="en-IN" className={`w-full ${editErrors.price ? 'border border-red-500' : ''}`} />
                {editErrors.price && <p className="text-red-500 text-[11px] font-semibold mt-1">{editErrors.price}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-white/90">Unit</label>
                <Dropdown value={editingProduct.unit} onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.value })} options={unitOptions} optionLabel="label" optionValue="value" placeholder="Select Unit" className={`w-full ${editErrors.unit ? 'border border-red-500' : ''}`} />
                {editErrors.unit && <p className="text-red-500 text-[11px] font-semibold mt-1">{editErrors.unit}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-white/90">Stock</label>
                <InputNumber value={editingProduct.stock} onValueChange={(e) => setEditingProduct({ ...editingProduct, stock: e.value })} className={`w-full ${editErrors.stock ? 'border border-red-500' : ''}`} />
                {editErrors.stock && <p className="text-red-500 text-[11px] font-semibold mt-1">{editErrors.stock}</p>}
              </div>
              <div className="flex flex-col gap-1.5 col-span-1 md:col-span-2">
                 <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30">
                   <Checkbox inputId="edit-organic" checked={editingProduct.organic} onChange={e => setEditingProduct({...editingProduct, organic: e.checked})} className="border-2 border-emerald-500 rounded-md" />
                   <div className="flex flex-col cursor-pointer" onClick={() => setEditingProduct({...editingProduct, organic: !editingProduct.organic})}>
                     <label htmlFor="edit-organic" className="text-sm font-bold text-emerald-800 dark:text-emerald-400 cursor-pointer">Organic Certified</label>
                     <span className="text-[10px] text-emerald-600 dark:text-emerald-500">100% natural farming</span>
                   </div>
                 </div>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button type="submit" disabled={updatingProduct} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md">
                {updatingProduct ? <><i className="pi pi-spin pi-spinner mr-2"></i>Updating...</> : 'Update Product'}
              </button>
            </div>
          </form>
        )}
      </Dialog>
      {/* Cancel Order Modal */}
      <Dialog visible={showCancelModal} onHide={() => setShowCancelModal(false)} header="Cancel Order" className="w-[90vw] md:w-[30vw] border-none shadow-2xl rounded-2xl overflow-hidden" headerClassName="bg-slate-50 dark:bg-[#1a291a] text-slate-800 dark:text-white font-title-lg p-6 border-b border-slate-100 dark:border-white/5" contentClassName="p-6 bg-white dark:bg-[#141f15]" pt={{ mask: { className: 'backdrop-blur-sm bg-black/40' } }}>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Please provide a reason for cancelling this order. This message will be sent to the customer.
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Message to Customer</label>
            <InputTextarea 
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Sorry, we are out of stock for some items..."
              rows={4}
              className={`w-full bg-slate-50 dark:bg-white/5 dark:text-white p-3 rounded-xl focus:ring-0 ${cancelError ? 'border-red-500 border-2' : 'border-slate-200 dark:border-white/10 focus:border-emerald-500 border'}`}
              autoResize
            />
            {cancelError && <p className="text-red-500 text-xs mt-1">{cancelError}</p>}
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button label="Keep Order" onClick={() => setShowCancelModal(false)} className="px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 border-none font-bold text-sm transition-colors" />
            <Button label="Confirm Cancel" onClick={submitCancel} className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all shadow-md shadow-red-600/20 border-none" />
          </div>
        </div>
      </Dialog>
    </main>
    </AnimatedPage>
  );
}
