import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import syncService from '../api/sync';

interface User {
  id: string;
  companyId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  phoneCode: string;
  role: string;
  isSuperAdmin: boolean;
  avatar?: string;
}

interface Company {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  currency: string;
  language: string;
  timezone: string;
  maxUsers?: number;
}

interface AuthContextType {
  user: User | null;
  company: Company | null;
  loading: boolean;
  login: (phoneCode: string, phone: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    if (!api.isAuthenticated()) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get('/auth/me');
      if (data.success) {
        setUser(data.data.user);
        setCompany(data.data.company);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        localStorage.setItem('company', JSON.stringify(data.data.company));
      }
    } catch {
      api.logout();
      setUser(null);
      setCompany(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedCompany = localStorage.getItem('company');

    if (storedUser && api.isAuthenticated()) {
      setUser(JSON.parse(storedUser));
      setCompany(storedCompany ? JSON.parse(storedCompany) : null);
      setLoading(false);
      loadUser();
    } else {
      setLoading(false);
    }
  }, [loadUser]);

  const login = async (phoneCode: string, phone: string, password: string) => {
    const { data } = await api.post('/auth/login', { phoneCode, phone, password });
    if (data.success) {
      api.setTokens(data.data.accessToken, data.data.refreshToken);
      setUser(data.data.user);
      setCompany(data.data.company);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      localStorage.setItem('company', JSON.stringify(data.data.company));

      syncService.startAutoSync();
    }
    return data.data;
  };

  const register = async (registerData: any) => {
    const { data } = await api.post('/auth/register', registerData);
    if (data.success) {
      api.setTokens(data.data.accessToken, data.data.refreshToken);
      setUser(data.data.user);
      setCompany(data.data.company);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      localStorage.setItem('company', JSON.stringify(data.data.company));

      syncService.startAutoSync();
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}

    api.logout();
    syncService.stopSync();
    setUser(null);
    setCompany(null);
    localStorage.removeItem('user');
    localStorage.removeItem('company');
    localStorage.removeItem('lastSyncAt');
  };

  const refreshUser = async () => {
    await loadUser();
  };

  return (
    <AuthContext.Provider value={{ user, company, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
