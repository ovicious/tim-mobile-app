/**
 * Authentication Context
 * 
 * Manages member login state, token persistence, and auth lifecycle.
 * - Stores token in SecureStore on login
 * - Validates token on app startup (auto-login)
 * - Periodic polling to detect 401 token invalidation
 * - Gracefully clears auth on token expiration
 * 
 * Follows admin-app patterns for consistency across mobile apps.
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { logger } from './utils/logger';

const TOKEN_KEY = 'authToken';

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

  // On app startup, load stored token (auto-login)
  useEffect(() => {
    (async () => {
      try {
        logger.debug('AuthContext', 'Loading stored token on app startup');
        const t = await SecureStore.getItemAsync(TOKEN_KEY);
        if (t) {
          logger.info('AuthContext', 'Token loaded from SecureStore (auto-login)', { 
            tokenPrefix: t.substring(0, 10) + '...' 
          });
          setToken(t);
        } else {
          logger.debug('AuthContext', 'No stored token found');
        }
      } catch (e) {
        logger.error('AuthContext', 'Failed to load stored token', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Periodic check: if token was cleared by API interceptor (e.g., 401 error),
  // logout the user. This ensures UI stays in sync if backend invalidates token.
  useEffect(() => {
    if (!token) return; // Only check if we think we have a token

    const interval = setInterval(async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        if (!storedToken) {
          logger.warn('AuthContext', 'Token was cleared (likely 401 error), logging out');
          setToken(null);
        }
      } catch (e) {
        logger.error('AuthContext', 'Failed to check token status', e);
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [token]);

  const login = async (t: string) => {
    try {
      logger.debug('AuthContext', 'Storing token in SecureStore');
      await SecureStore.setItemAsync(TOKEN_KEY, t);
      logger.info('AuthContext', 'Token stored successfully', { 
        tokenPrefix: t.substring(0, 10) + '...' 
      });
      setToken(t);
    } catch (e) {
      logger.error('AuthContext', 'Failed to store token', e);
      throw e;
    }
  };

  const logout = async () => {
    try {
      logger.debug('AuthContext', 'Clearing token from SecureStore');
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      setToken(null);
      logger.info('AuthContext', 'Logout complete');
    } catch (e) {
      logger.error('AuthContext', 'Failed to clear token', e);
      throw e;
    }
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
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (e) {
    logger.error('Auth', 'Failed to retrieve stored token', e);
    return null;
  }
}

export async function storeToken(token: string): Promise<void> {
  return await SecureStore.setItemAsync(TOKEN_KEY, token);
}
