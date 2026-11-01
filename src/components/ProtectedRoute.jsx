import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function ProtectedRoute({ children, allowedRole }) {
  const { user } = useSelector((state) => state.auth);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user role does not match the page's allowed role, safely redirect them
  // to their own role dashboard instead of destroying their login session.
  if (allowedRole && user.role !== allowedRole) {
    const targetDashboard =
      user.role === 'farmer'
        ? '/dashboard/farmer'
        : user.role === 'admin'
        ? '/dashboard/admin'
        : '/dashboard/customer';
    return <Navigate to={targetDashboard} replace />;
  }

  return children;
}
