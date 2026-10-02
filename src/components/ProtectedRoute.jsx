import { Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { useEffect, useState } from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';

export default function ProtectedRoute({ children, allowedRole }) {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsReady(true);
      return;
    }

    // If user exists but role doesn't match, log them out
    if (allowedRole && user.role !== allowedRole) {
      dispatch(logout()).then(() => {
        setIsReady(true);
      });
    } else {
      setIsReady(true);
    }
  }, [user, allowedRole, dispatch]);

  if (!isReady) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <ProgressSpinner strokeWidth="4" style={{ width: '48px', height: '48px' }} />
      </div>
    );
  }

  if (!user || (allowedRole && user.role !== allowedRole)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
