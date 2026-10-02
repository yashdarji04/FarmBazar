import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { updateUser } from '../store/slices/authSlice';
import AnimatedPage from '../components/AnimatedPage';
import { Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

/**
 * SetPassword page
 * ─────────────────────────────────────────────────────────────
 * Allows a Google-registered user to set an email+password so
 * they can also log in without Google.
 *
 * If the user already has a password (they registered with email),
 * this page acts as a "Change Password" screen and requires their
 * current password before accepting the new one.
 */
export default function SetPassword() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Determine whether this is "Set Password" (Google user, no existing password)
  // or "Change Password" (email user who wants to update).
  const hasExistingPassword = !!user?.hasPassword;
  const pageTitle = hasExistingPassword ? 'Change Password' : 'Set Password';
  const pageSubtitle = hasExistingPassword
    ? 'Update your email/password login credentials.'
    : 'Add email and password login to your Google account so you can sign in either way.';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (hasExistingPassword && !currentPassword) {
      newErrors.currentPassword = 'Please enter your current password';
    }
    if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      const payload = { newPassword };
      if (hasExistingPassword) payload.currentPassword = currentPassword;

      await api.post('/auth/set-password', payload);
      dispatch(updateUser({ hasPassword: true }));
      toast.success(
        hasExistingPassword
          ? 'Password changed successfully!'
          : 'Password set! You can now log in with email and password.',
        { duration: 5000 }
      );
      // Go back to dashboard
      if (user?.role === 'farmer') navigate('/dashboard/farmer');
      else navigate('/dashboard/customer');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to set password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedPage>
      <main className="min-h-screen flex items-center justify-center bg-[#fbfdf9] dark:bg-[#0f1710] px-4">
        <div className="w-full max-w-md bg-white dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl p-8 sm:p-10">

          {/* Header */}
          <div className="mb-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center mx-auto mb-4 text-emerald-700 dark:text-emerald-300">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">{pageTitle}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{pageSubtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Current password (only for users who already have one) */}
            {hasExistingPassword && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="current-password">
                  Current Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-white/5 border text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${errors.currentPassword ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-white/10 focus:ring-emerald-500'}`}
                  />
                </div>
                {errors.currentPassword && <p className="text-red-500 text-[11px] font-semibold mt-1">{errors.currentPassword}</p>}
              </div>
            )}

            {/* New password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="new-password">
                {hasExistingPassword ? 'New Password' : 'Password'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="new-password"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className={`w-full pl-10 pr-11 py-3 rounded-xl bg-white dark:bg-white/5 border text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${errors.newPassword ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-white/10 focus:ring-emerald-500'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.newPassword && <p className="text-red-500 text-[11px] font-semibold mt-1">{errors.newPassword}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="confirm-password">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className={`w-full pl-10 pr-11 py-3 rounded-xl bg-white dark:bg-white/5 border text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-white/10 focus:ring-emerald-500'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-[11px] font-semibold mt-1">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              id="set-password-submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <i className="pi pi-spin pi-spinner text-sm" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>{hasExistingPassword ? 'Change Password' : 'Set Password'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

          <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            <button
              onClick={() => navigate(-1)}
              className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              ← Go back
            </button>
          </p>
        </div>
      </main>
    </AnimatedPage>
  );
}
