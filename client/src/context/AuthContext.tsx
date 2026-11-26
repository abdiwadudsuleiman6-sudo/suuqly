import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiRequest, getToken, setToken } from '../lib/api';
import { GarissaZone, Supplier, User } from '../types';

interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'customer' | 'seller';
  businessName?: string;
  neighborhood?: GarissaZone;
  category?: string;
  address?: string;
}

interface AuthContextValue {
  user: User | null;
  supplier: Supplier | null;
  loading: boolean;
  selectedZone: GarissaZone;
  setSelectedZone: (zone: GarissaZone) => void;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  toggleWishlist: (productId: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<GarissaZone>('Garissa Town');

  const refreshMe = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setSupplier(null);
      setLoading(false);
      return;
    }
    try {
      const data = await apiRequest<{ user: User; supplier: Supplier | null }>('/auth/me');
      setUser(data.user);
      setSupplier(data.supplier);
    } catch {
      setToken(null);
      setUser(null);
      setSupplier(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  const login = async (email: string, password: string): Promise<User> => {
    const data = await apiRequest<{ token: string; user: User; supplier: Supplier | null }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );
    setToken(data.token);
    setUser(data.user);
    setSupplier(data.supplier);
    return data.user;
  };

  const register = async (payload: RegisterPayload): Promise<User> => {
    const data = await apiRequest<{ token: string; user: User; supplier: Supplier | null }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    setToken(data.token);
    setUser(data.user);
    setSupplier(data.supplier);
    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setSupplier(null);
  };

  const toggleWishlist = async (productId: string): Promise<boolean> => {
    const data = await apiRequest<{ wishlist: string[]; added: boolean }>(
      `/auth/wishlist/${productId}`,
      { method: 'POST' }
    );
    setUser((prev) => (prev ? { ...prev, wishlist: data.wishlist } : prev));
    return data.added;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        supplier,
        loading,
        selectedZone,
        setSelectedZone,
        login,
        register,
        logout,
        refreshMe,
        toggleWishlist,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
