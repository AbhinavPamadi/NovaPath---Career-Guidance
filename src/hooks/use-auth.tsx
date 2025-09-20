
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, User } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';

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
    // Check if Firebase is properly configured
    if (!isFirebaseConfigured) {
      setLoading(false);
      setError('Firebase is not properly configured. Please check your environment variables.');
      console.warn('Firebase configuration is missing or invalid. Authentication will not work.');
      return;
    }

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
    if (!isFirebaseConfigured) {
      setError('Firebase is not properly configured. Cannot sign out.');
      return;
    }
    
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
