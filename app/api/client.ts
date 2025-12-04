/**
 * API Client Configuration
 * 
 * Centralized HTTP client using native fetch with request/response logging,
 * following a pattern similar to admin-app but using built-in APIs.
 * 
 * Handles:
 * - Auth token injection via SecureStore
 * - Request/response logging
 * - 401 auth failures with token cleanup
 * - Base URL configuration via env vars
 */

import * as SecureStore from 'expo-secure-store';
import { logger } from '../utils/logger';

// Import expo-constants safely
let ExpoConstants: any = {};
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ExpoConstants = require('expo-constants');
} catch (e) {
  // noop: continue with process.env fallback
}

// Resolve API base URL priority:
// 1. Expo extra.API_URL (app.json/app.config.js)
// 2. EXPO_PUBLIC_API_URL env var
// 3. Fallback to known dev endpoint
const resolvedEnvUrl = (ExpoConstants?.expoConfig?.extra as any)?.API_URL || process.env.EXPO_PUBLIC_API_URL;
const BASE_URL = resolvedEnvUrl || 'https://1pst60knzc.execute-api.eu-central-1.amazonaws.com/dev';

logger.debug('API Client', 'Initialized', { baseURL: BASE_URL });

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
}

async function makeRequest(endpoint: string, config: RequestConfig = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const method = config.method || 'GET';
  
  try {
    // Retrieve auth token
    let authToken: string | null = null;
    try {
      authToken = await SecureStore.getItemAsync('authToken');
    } catch (e) {
      logger.warn('API Client', 'Failed to retrieve authToken from SecureStore', e);
    }

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(config.headers || {}),
    };

    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    // Log request
    logger.debug('API Request', `${method} ${endpoint}`, { 
      url,
      tokenPresent: Boolean(authToken),
    });

    // Make request
    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (config.body) {
      fetchOptions.body = JSON.stringify(config.body);
    }

    const response = await fetch(url, fetchOptions);

    // Log response
    logger.debug('API Response', `${method} ${endpoint}`, { 
      status: response.status,
      url,
    });

    // Handle 401/403 Unauthorized - bubble up without clearing token
    // Rationale: Avoid logging out users on transient/endpoint-specific 401s (requested UX)
    if (response.status === 401 || response.status === 403) {
      logger.warn('API Client', '401/403 Unauthorized - returning error without clearing token', {
        status: response.status,
        endpoint,
      });
      const err = new Error('Unauthorized');
      (err as any).code = 401;
      throw err;
    }

    // Parse response
    const contentType = response.headers.get('content-type');
    let data: any;

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      logger.error('API Error', `${method} ${endpoint}`, { 
        status: response.status,
        response: data,
      });
      throw new Error(typeof data === 'string' ? data : JSON.stringify(data));
    }

    return data;
  } catch (error) {
    logger.error('API Client', `${method} ${endpoint}`, error);
    throw error;
  }
}

export const apiClient = {
  get: (endpoint: string, headers?: Record<string, string>) =>
    makeRequest(endpoint, { method: 'GET', headers }),

  post: (endpoint: string, body: any, headers?: Record<string, string>) =>
    makeRequest(endpoint, { method: 'POST', body, headers }),

  put: (endpoint: string, body: any, headers?: Record<string, string>) =>
    makeRequest(endpoint, { method: 'PUT', body, headers }),

  delete: (endpoint: string, headers?: Record<string, string>) =>
    makeRequest(endpoint, { method: 'DELETE', headers }),

  patch: (endpoint: string, body: any, headers?: Record<string, string>) =>
    makeRequest(endpoint, { method: 'PATCH', body, headers }),
};

export { BASE_URL };
