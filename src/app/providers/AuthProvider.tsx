import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '@/types';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (role: UserRole) => void;
  logout: () => void;
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

  useEffect(() => {
    const savedRole = localStorage.getItem('fa_cbt_role') as UserRole | null;
    if (savedRole && DEFAULT_PROFILES[savedRole]) {
      setRole(savedRole);
      setUser(DEFAULT_PROFILES[savedRole]);
    }
  }, []);

  const login = (newRole: UserRole) => {
    setRole(newRole);
    setUser(DEFAULT_PROFILES[newRole]);
    localStorage.setItem('fa_cbt_role', newRole);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('fa_cbt_role');
  };

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    setUser(DEFAULT_PROFILES[newRole]);
    localStorage.setItem('fa_cbt_role', newRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
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
