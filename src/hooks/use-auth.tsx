
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signOut: async () => {},
  clearError: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set up a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError('Authentication service is taking longer than expected. Please refresh the page.');
      }
    }, 10000); // 10 second timeout

    const unsubscribe = onAuthStateChanged(
      auth, 
      (user) => {
        clearTimeout(loadingTimeout);
        setUser(user);
        setLoading(false);
        setError(null);
        console.log('Auth state changed:', user ? `User logged in: ${user.uid}` : 'User logged out');
      },
      (error) => {
        clearTimeout(loadingTimeout);
        console.error('Auth state change error:', error);
        setLoading(false);
        setError('Authentication error occurred. Please try refreshing the page.');
      }
    );

    return () => {
      clearTimeout(loadingTimeout);
      unsubscribe();
    };
  }, [loading]);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setError(null);
    } catch (error: any) {
      console.error('Sign out error:', error);
      setError('Failed to sign out. Please try again.');
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = { user, loading, error, signOut, clearError };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};
