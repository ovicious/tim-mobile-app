// Simple API client for backend integration
import { Platform } from 'react-native';
import { getStoredToken } from './auth';
import { logger } from './utils/logger';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'https://51vjye6t5m.execute-api.eu-central-1.amazonaws.com/dev';
const API_TOKEN = process.env.API_TOKEN;

logger.debug('API', 'API_BASE_URL configured', { url: API_BASE_URL });

function joinUrl(base: string, path: string) {
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

export async function apiGet(path: string) {
  const stored = await getStoredToken();
  const res = await fetch(joinUrl(API_BASE_URL, path), {
    headers: {
      ...(stored ? { Authorization: `Bearer ${stored}` } : API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
    },
  });
  if (res.status === 401 || res.status === 403) {
    const err = new Error('Unauthorized');
    (err as any).code = 401;
    throw err;
  }
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPost(path: string, body: any) {
  const stored = await getStoredToken();
  const url = joinUrl(API_BASE_URL, path);
  logger.debug('apiPost', 'Making POST request', { url, bodyKeys: Object.keys(body) });
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(stored ? { Authorization: `Bearer ${stored}` } : API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
    },
    body: JSON.stringify(body),
  });
  
  const text = await res.text();
  logger.debug('apiPost', 'Received response', { status: res.status });
  
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    logger.error('apiPost', 'Failed to parse JSON response', e);
    throw new Error('API response is not valid JSON');
  }
  
  logger.debug('apiPost', 'Response parsed successfully', { status: res.status });
  
  if (res.status === 401 || res.status === 403) {
    logger.warn('apiPost', 'Unauthorized response', { status: res.status });
    const err = new Error('Unauthorized');
    (err as any).code = 401;
    throw err;
  }
  
  if (!res.ok) {
    logger.error('apiPost', 'Request failed', { status: res.status, response: text });
    throw new Error(text);
  }
  
  return json;
}

export async function apiDelete(path: string) {
  const stored = await getStoredToken();
  const res = await fetch(joinUrl(API_BASE_URL, path), {
    method: 'DELETE',
    headers: {
      ...(stored ? { Authorization: `Bearer ${stored}` } : API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
    },
  });
  if (res.status === 401 || res.status === 403) {
    const err = new Error('Unauthorized');
    (err as any).code = 401;
    throw err;
  }
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Gym classes API (generic helpers kept for compatibility)
export type GymClass = { id: string; name: string };

export async function getClasses(): Promise<GymClass[]> {
  return await apiGet('/api/v1/classes');
}

export async function bookClass(classId: string): Promise<any> {
  return await apiPost('/api/v1/bookings', { classId });
}

// Profile
export async function getProfile(): Promise<any> {
  return await apiGet('/api/v1/auth/profile');
}

// Business-scoped classes and sessions per OpenAPI
export async function getClassesForBusiness(businessId: string): Promise<any> {
  return await apiGet(`/api/v1/${businessId}/classes`);
}

export async function getSessionsForClass(businessId: string, classId: string): Promise<any> {
  return await apiGet(`/api/v1/${businessId}/classes/${classId}/sessions`);
}

export async function bookClassSession(
  businessId: string,
  classId: string,
  sessionId: string
): Promise<any> {
  return await apiPost(`/api/v1/${businessId}/classes/${classId}/book`, { session_id: sessionId });
}

// Bookings
export async function getMyBookings(businessId: string): Promise<any> {
  return await apiGet(`/api/v1/${businessId}/my-bookings`);
}

export async function cancelBooking(
  businessId: string,
  classId: string,
  bookingId: string
): Promise<any> {
  // API uses DELETE at /api/v1/{business_id}/classes/{class_id}/bookings/{booking_id}
  return await apiDelete(`/api/v1/${businessId}/classes/${classId}/bookings/${bookingId}`);
}
