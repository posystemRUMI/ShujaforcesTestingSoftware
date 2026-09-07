import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, UserRole } from '@/types';
import { authService } from '@/services/authService';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  loading: boolean;
  login: (identifier: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Derive role authoritatively from user profile
  const role: UserRole = user ? user.role : 'STUDENT';

  // Initialize session and listen for auth state changes in current tab
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (isSupabaseConfigured()) {
        try {
          const currentUser = await authService.getCurrentUser();
          if (mounted) {
            setUser(currentUser);
          }
        } catch (err) {
          console.warn('Failed to restore Supabase session for current tab:', err);
          if (mounted) setUser(null);
        }
      }
      if (mounted) setLoading(false);
    }

    initAuth();

    // Setup Supabase auth subscription for current tab
    let authListener: any;
    if (isSupabaseConfigured()) {
      try {
        const { data } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
          if (!mounted) return;
          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
            const freshUser = await authService.getCurrentUser();
            if (freshUser && mounted) {
              setUser(freshUser);
            }
          } else if (event === 'SIGNED_OUT') {
            if (mounted) {
              setUser(null);
            }
          }
        });
        authListener = data?.subscription;
      } catch (e) {
        console.warn('Auth listener setup error:', e);
      }
    }

    return () => {
      mounted = false;
      if (authListener?.unsubscribe) {
        authListener.unsubscribe();
      }
    };
  }, []);

  const login = useCallback(
    async (identifier: string, password?: string): Promise<{ success: boolean; error?: string }> => {
      if (!isSupabaseConfigured()) {
        return { success: false, error: 'Authentication service not available.' };
      }

      setLoading(true);
      try {
        const { user: authenticatedUser, error } = await authService.login(identifier, password || '');
        setLoading(false);

        if (!error && authenticatedUser) {
          setUser(authenticatedUser);
          return { success: true };
        } else {
          return { success: false, error: error?.message || 'Invalid email or password.' };
        }
      } catch (err: any) {
        setLoading(false);
        return { success: false, error: err?.message || 'Authentication server unreachable.' };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    if (isSupabaseConfigured()) {
      await authService.logout();
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
