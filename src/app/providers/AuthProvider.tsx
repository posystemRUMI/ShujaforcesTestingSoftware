import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '@/types';
import { authService } from '@/services/authService';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  loading: boolean;
  login: (roleOrIdentifier: UserRole | string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
}

const DEFAULT_PROFILES: Record<UserRole, UserProfile> = {
  ADMIN: {
    id: 'user-admin-01',
    name: 'Col. Farhan Asif (Chief Proctor)',
    email: 'chief.proctor@forcesacademy.edu.pk',
    role: 'ADMIN',
    rankTitle: 'Colonel, Pakistan Army',
    branch: 'PAKISTAN_ARMY',
  },
  TEACHER: {
    id: 'user-fac-01',
    name: 'Wing Cdr. (R) Kamran Shahid',
    email: 'kamran.shahid@forcesacademy.edu.pk',
    role: 'TEACHER',
    rankTitle: 'Wing Commander (Retd), PAF',
    branch: 'PAKISTAN_AIR_FORCE',
  },
  STUDENT: {
    id: 'user-cadet-01',
    name: 'Cadet Hamza Tariq',
    email: 'hamza.tariq@cadet.forcesacademy.edu.pk',
    role: 'STUDENT',
    cadetId: 'cadet-001',
    rollNumber: 'PMA-2601',
    branch: 'PAKISTAN_ARMY',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('ADMIN');
  const [user, setUser] = useState<UserProfile | null>(DEFAULT_PROFILES.ADMIN);
  const [loading, setLoading] = useState(true);

  // Initialize session and listen for auth state changes
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (isSupabaseConfigured()) {
        try {
          const currentUser = await authService.getCurrentUser();
          if (mounted && currentUser) {
            setUser(currentUser);
            setRole(currentUser.role);
          } else if (mounted) {
            // No active session in production
            setUser(null);
          }
        } catch (err) {
          console.warn('Failed to restore Supabase session:', err);
          if (mounted) setUser(null);
        }
      } else {
        // Fallback for offline development preview
        const savedRole = localStorage.getItem('fa_cbt_role') as UserRole | null;
        if (savedRole && DEFAULT_PROFILES[savedRole]) {
          setRole(savedRole);
          setUser(DEFAULT_PROFILES[savedRole]);
        }
      }
      if (mounted) setLoading(false);
    }

    initAuth();

    // Setup Supabase auth subscription if configured
    let authListener: any;
    if (isSupabaseConfigured()) {
      try {
        const { data } = (supabase as any).auth.onAuthStateChange(async (event: string, session: any) => {
          if (!mounted) return;
          if (event === 'SIGNED_IN' && session?.user) {
            const freshUser = await authService.getCurrentUser();
            if (freshUser) {
              setUser(freshUser);
              setRole(freshUser.role);
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
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

  const login = async (roleOrIdentifier: UserRole | string, password?: string): Promise<{ success: boolean; error?: string }> => {
    // If Supabase is configured and password is provided, perform authentic login
    if (isSupabaseConfigured() && password) {
      setLoading(true);
      const { user: authenticatedUser, error } = await authService.login(roleOrIdentifier, password);
      setLoading(false);

      if (error || !authenticatedUser) {
        return { success: false, error: error?.message || 'Authentication failed' };
      }

      setUser(authenticatedUser);
      setRole(authenticatedUser.role);
      return { success: true };
    }

    // Otherwise fallback for demo/development preview
    const chosenRole: UserRole = (['ADMIN', 'TEACHER', 'STUDENT'].includes(roleOrIdentifier as UserRole))
      ? (roleOrIdentifier as UserRole)
      : 'STUDENT';

    setRole(chosenRole);
    setUser(DEFAULT_PROFILES[chosenRole]);
    if (!isSupabaseConfigured()) {
      localStorage.setItem('fa_cbt_role', chosenRole);
    }
    return { success: true };
  };

  const logout = async () => {
    if (isSupabaseConfigured()) {
      await authService.logout();
    }
    setUser(null);
    localStorage.removeItem('fa_cbt_role');
  };

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    setUser(DEFAULT_PROFILES[newRole]);
    if (!isSupabaseConfigured()) {
      localStorage.setItem('fa_cbt_role', newRole);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        switchRole,
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
