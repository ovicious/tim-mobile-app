/**
 * Business API
 *
 * Member app business-related endpoints.
 */

import { apiClient } from './client';
import { logger } from '../utils/logger';

export interface Business {
  businessId: string;
  name: string;
  venueName: string;
  address: string;
  email: string;
  phone: string;
  logoUrl?: string;
  shortName?: string;
  active: boolean;
}

export async function getBusiness(businessId: string): Promise<Business> {
  try {
    const response = await apiClient.get(`/api/v1/businesses/${businessId}`);
    const b = response.data?.data?.business || response.data?.business || response.data;

    logger.debug('Business API', 'Business retrieved', { businessId, hasShortName: Boolean(b?.short_name) });

    // Map backend snake_case fields to camelCase
    return {
      businessId: b.business_id || b.id,
      name: b.name,
      venueName: b.venue_name || b.venueName,
      address: b.address,
      email: b.email,
      phone: b.phone,
      logoUrl: b.logo_url || b.logoUrl,
      shortName: b.short_name || b.shortName,
      active: b.active,
    };
  } catch (error) {
    logger.error('Business API', 'Failed to get business', error);
    throw error;
  }
}