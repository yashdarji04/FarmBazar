import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setGoogleUser } from '../store/slices/authSlice';

/**
 * This page is the landing point after Google redirects the user back.
 * The backend appends JWT + user info as URL query params.
 * We parse them, store them in Redux + sessionStorage, then navigate to the
 * correct dashboard.
 */
export default function GoogleAuthCallback() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');

    if (error) {
      // Pass the backend's error message through as-is — it already contains
      // a user-friendly role-mismatch message or other explanation.
      navigate('/login?error=' + error);
      return;
    }

    const token = params.get('token');
    const id = params.get('id');
    const name = params.get('name');
    const email = params.get('email');
    const role = params.get('role');
    const isNew = params.get('isNew') === '1';
    const hasPassword = params.get('hasPassword') === '1';
    const profileImage = params.get('profileImage') || 'default.jpg';

    if (!token || !id) {
      navigate('/login?error=' + encodeURIComponent('Authentication failed. Missing credentials.'));
      return;
    }

    const userData = { _id: id, name, email, role, profileImage, token, hasPassword };
    dispatch(setGoogleUser(userData));

    // New Google user
    if (isNew) {
      if (role === 'farmer') {
        // Farmers need to complete their profile (Farm Name, etc)
        navigate('/choose-role?role=farmer');
      } else {
        // Customers can go straight to the dashboard
        navigate('/');
      }
      return;
    }

    // Existing user → straight to their dashboard
    if (role === 'admin') navigate('/dashboard/admin');
    else if (role === 'farmer') navigate('/dashboard/farmer');
    else navigate('/');
  }, [navigate, dispatch]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
          <span className="absolute inset-0 flex items-center justify-center">
            <i className="pi pi-leaf text-2xl text-primary" />
          </span>
        </div>
        <h2 className="text-xl font-semibold text-on-surface mb-2">Signing you in…</h2>
        <p className="text-sm text-on-surface-variant">Connecting your Google account to FarmBazar</p>
      </div>
    </div>
  );
}
