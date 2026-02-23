import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { login as apiLogin, logout as apiLogout, getCurrentUser } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isOperador: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = getCurrentUser();
    if (storedUser) setUser(storedUser);
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const r = await apiLogin(username, password);
    setUser(r.data.user);
  };

  const logout = () => {
    apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      logout,
      isAdmin: user?.role === 'admin',
      isOperador: user?.role === 'admin' || user?.role === 'operador',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
