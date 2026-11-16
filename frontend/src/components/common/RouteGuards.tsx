import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useStore } from '../../context/StoreContext';
import { useHomeStore } from '../../store/homeStore';
import { isFeatureEnabled, type FeatureFlagKey } from '../../config/tierCapabilities';
import { getAdminAuthToken } from '../../services/api';

export const ProtectedRoute: React.FC<{
  role?: 'user' | 'admin';
  children: React.ReactNode;
}> = ({ role = 'user', children }) => {
  const { currentUser } = useStore();
  const location = useLocation();

  if (role === 'admin' && !getAdminAuthToken()) {
    if (location.pathname !== '/admin') {
      return <Navigate to="/admin" replace />;
    }
    return <>{children}</>;
  }

  if (role === 'user' && !currentUser) {
    const cleanPath = location.pathname.replace(/\/+$/, '') || '/';
    const publicAccountPaths = new Set([
      '/account',
      '/login',
      '/register',
      '/forgot-password',
      '/account/forgot-password',
      '/reset-password',
      '/account/reset-password',
    ]);
    if (!publicAccountPaths.has(cleanPath)) {
      return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
  }
  return <>{children}</>;
};

export const FeatureRoute: React.FC<{
  feature: FeatureFlagKey;
  children: React.ReactNode;
}> = ({ feature, children }) => {
  const tierCapabilities = useHomeStore((s) => s.tierCapabilities);
  if (!isFeatureEnabled(tierCapabilities, feature)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};
