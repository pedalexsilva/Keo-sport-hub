import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useProfile } from '../../hooks/useProfile';

/**
 * RequireAdmin - Route guard that ensures the user is authenticated AND has admin role.
 * Redirects non-admin users to /app.
 */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
    const { user, loading: authLoading } = useAuth();
    const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
    const location = useLocation();

    // Show loading while checking auth and profile
    if (authLoading || profileLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-10 h-10 animate-spin rounded-full border-4 border-[#002D72] border-t-transparent mx-auto mb-4"></div>
                    <p className="text-sm text-gray-500">Verifying permissions...</p>
                </div>
            </div>
        );
    }

    // Not authenticated - redirect to login
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Not admin - redirect to app home
    if (profile?.role !== 'admin') {
        console.warn('Access denied: User attempted to access admin route without admin role');
        return <Navigate to="/app" replace />;
    }

    return children;
}
