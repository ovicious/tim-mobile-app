/**
 * Authentication API
 * 
 * Member app login and auth-related endpoints.
 * Follows the modular pattern from admin-app/app/api/auth.ts
 */

import { apiClient } from './client';
import { logger } from '../utils/logger';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  data?: {
    token: string;
  };
}

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  try {
    logger.debug('Auth API', 'Attempting login', { email: credentials.email });
    
    const response = await apiClient.post('/api/v1/auth/login', credentials);
    
    logger.debug('Auth API', 'Login response received', { 
      hasToken: Boolean(response?.token || response?.data?.token),
    });
    
    // Support both response formats
    const token = response?.token || response?.data?.token;
    
    if (!token) {
      logger.error('Auth API', 'No token in login response', { response });
      throw new Error('No token in login response');
    }
    
    return {
      token,
      data: { token },
    };
  } catch (error) {
    logger.error('Auth API', 'Login failed', error);
    throw error;
  }
}

export async function logout(): Promise<void> {
  try {
    logger.debug('Auth API', 'Logging out (client-side)');
    // No server-side logout needed - token is cleared client-side
  } catch (error) {
    logger.error('Auth API', 'Logout error', error);
    throw error;
  }
}

export async function getProfile() {
  try {
    const response = await apiClient.get('/api/v1/auth/profile');
    logger.debug('Auth API', 'Profile retrieved', { userId: response?.user_id });
    return response;
  } catch (error) {
    logger.error('Auth API', 'Failed to get profile', error);
    throw error;
  }
}
