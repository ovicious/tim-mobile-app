// Simple API client for backend integration
import { Platform } from 'react-native';
import { getStoredToken } from './auth';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'https://nzxf0l1n9b.execute-api.eu-central-1.amazonaws.com/dev';
const API_TOKEN = process.env.API_TOKEN;

console.log('API_BASE_URL configured as:', API_BASE_URL);

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
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPost(path: string, body: any) {
  const stored = await getStoredToken();
  const url = joinUrl(API_BASE_URL, path);
  console.log('apiPost URL:', url);
  console.log('apiPost body:', JSON.stringify(body));
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(stored ? { Authorization: `Bearer ${stored}` } : API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  console.log('apiPost status:', res.status);
  console.log('apiPost raw response:', text);
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    console.error('API response is not valid JSON:', text);
    throw new Error('API response is not valid JSON');
  }
  console.log('apiPost parsed response:', JSON.stringify(json, null, 2));
  if (!res.ok) throw new Error(text);
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
