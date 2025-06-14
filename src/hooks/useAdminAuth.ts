"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isAdminAuthenticated as checkAuthStatus, clearAdminAuthentication } from '@/lib/adminAuth';

export const useAdminAuth = (redirectIfUnauthenticated: boolean = true) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const authStatus = checkAuthStatus();
    setIsAuthenticated(authStatus);
    setLoading(false);

    if (redirectIfUnauthenticated && !authStatus) {
      router.replace('/admin/login');
    }
  }, [router, redirectIfUnauthenticated]);

  const logout = useCallback(() => {
    clearAdminAuthentication();
    setIsAuthenticated(false);
    router.push('/admin/login');
  }, [router]);

  return { isAuthenticated, loading, logout };
};
