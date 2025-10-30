import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'token';

type AuthContextType = {
  token: string | null;
  loading: boolean;
  login: (t: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const t = await SecureStore.getItemAsync(TOKEN_KEY);
        setToken(t);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (t: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, t);
    setToken(t);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
  };

  const value = useMemo(() => ({ token, loading, login, logout }), [token, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export async function getStoredToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}
