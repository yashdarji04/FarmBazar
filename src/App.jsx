import { Suspense, lazy, cloneElement } from 'react';
import { Routes, Route, Navigate, useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import toast, { Toaster, ToastBar } from 'react-hot-toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useSelector } from 'react-redux';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { NotificationProvider } from './context/NotificationContext';

// Route-level code splitting: each page ships as its own chunk and is only
// downloaded when the user actually navigates to it. This keeps the initial
// bundle small and the first paint fast.
const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const FarmerProfile = lazy(() => import('./pages/FarmerProfile'));
const Farmers = lazy(() => import('./pages/Farmers'));
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard'));
const FarmerDashboard = lazy(() => import('./pages/FarmerDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));
const NotFound = lazy(() => import('./pages/NotFound'));
const GoogleAuthCallback = lazy(() => import('./pages/GoogleAuthCallback'));
const ChooseRole = lazy(() => import('./pages/ChooseRole'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsConditions = lazy(() => import('./pages/TermsConditions'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const DeliverySuccess = lazy(() => import('./pages/DeliverySuccess'));
const SetPassword = lazy(() => import('./pages/SetPassword'));

function RouteFallback() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <ProgressSpinner strokeWidth="4" style={{ width: '48px', height: '48px' }} />
    </div>
  );
}

// Redirects farmer users away from customer-only pages
function NonFarmerRoute({ children }) {
  const { user } = useSelector((state) => state.auth);
  if (user && user.role === 'farmer') {
    return <Navigate to="/dashboard/farmer" replace />;
  }
  return children;
}

function StandaloneLayout() {
  const location = useLocation();
  const outlet = useOutlet();
  return (
    <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
      {outlet && cloneElement(outlet, { key: location.pathname })}
    </AnimatePresence>
  );
}

function App() {
  const location = useLocation();

  return (
    <NotificationProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <Toaster 
          position="top-right" 
          containerStyle={{ top: 80, right: 20 }}
          toastOptions={{ 
            duration: 4000, 
            style: { 
              padding: 0,
              borderRadius: '16px', 
              background: '#064e3b', // emerald-900
              color: '#fff',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            },
            success: { style: { background: '#064e3b' } },
            error: { style: { background: '#7f1d1d' } } // red-900
          }} 
        >
          {(t) => (
            <ToastBar 
              toast={t}
              style={{
                ...t.style,
                padding: 0,
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              {({ icon, message }) => (
                <div className="flex flex-col w-full h-full relative min-w-[300px]">
                  <div className="flex items-start gap-3 px-4 py-3.5 relative z-10">
                    <div className="flex-1 text-[13px] font-semibold tracking-wide leading-relaxed pr-2 flex items-center min-h-[32px]">
                      {message}
                    </div>
                    {t.type !== 'loading' && (
                      <button 
                        onClick={() => toast.dismiss(t.id)} 
                        className="ml-2 w-6 h-6 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-all flex-shrink-0 shadow-sm mt-1"
                        title="Dismiss"
                      >
                        <i className="pi pi-times text-[10px]"></i>
                      </button>
                    )}
                  </div>
                  {/* Timeline Progress Bar */}
                  {t.type !== 'loading' && (
                    <motion.div
                      key={t.id}
                      initial={{ width: "100%" }}
                      animate={{ width: "0%" }}
                      transition={{ duration: (t.duration || 4000) / 1000, ease: "linear" }}
                      onAnimationComplete={() => toast.dismiss(t.id)}
                      className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-200 opacity-80"
                    />
                  )}
                </div>
              )}
            </ToastBar>
          )}
        </Toaster>
        <Suspense fallback={<RouteFallback />}>
            <Routes location={location}>
              {/* Pages with full layout (Navbar + Footer) */}
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetails />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/farmers" element={<NonFarmerRoute><Farmers /></NonFarmerRoute>} />
                <Route path="/farmer/:id" element={<FarmerProfile />} />
                <Route path="/dashboard/customer" element={
                  <ProtectedRoute allowedRole="customer">
                    <CustomerDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/farmer" element={
                  <ProtectedRoute allowedRole="farmer">
                    <FarmerDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/admin" element={
                  <ProtectedRoute allowedRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/track-order" element={<TrackOrder />} />
                <Route path="/order-success" element={<OrderSuccess />} />
                <Route path="/delivery-success/:orderId" element={
                  <ProtectedRoute allowedRole="customer">
                    <DeliverySuccess />
                  </ProtectedRoute>
                } />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsConditions />} />
                <Route path="/terms-and-conditions" element={<TermsConditions />} />
                <Route path="*" element={<NotFound />} />
              </Route>

              {/* Standalone pages (No global layout) */}
              <Route element={<StandaloneLayout />}>
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
                <Route path="/choose-role" element={<ChooseRole />} />
                <Route path="/set-password" element={
                  <ProtectedRoute>
                    <SetPassword />
                  </ProtectedRoute>
                } />
              </Route>
            </Routes>
        </Suspense>
      </div>
    </NotificationProvider>
  );
}

export default App;
