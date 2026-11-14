import React from 'react';
import { Navigate } from 'react-router';
import { useStore } from '../../context/StoreContext';
import { useHomeStore } from '../../store/homeStore';
import { isFeatureEnabled, type FeatureFlagKey } from '../../config/tierCapabilities';

export const ProtectedRoute: React.FC<{
  role?: 'user' | 'admin';
  children: React.ReactNode;
}> = ({ role = 'user', children }) => {
  const { currentUser } = useStore();
  if (role === 'user' && !currentUser) {
    // Allow AccountPage to render its own inline login/register screen
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
