/**
 * Gym Utilities
 * Helper functions for gym name extraction and display
 */

export interface Business {
  business_id?: string;
  id?: string;
  business_name?: string;
  name?: string;
  membership_status?: string;
  status?: string;
  logo_url?: string;
  logoUrl?: string;
}

export interface ProfileData {
  business_name?: string;
  business_id?: string;
  businesses?: Business[];
  data?: {
    business_name?: string;
    business_id?: string;
    businesses?: Business[];
  };
}

/**
 * Extract gym name from profile data
 * Tries multiple sources in priority order
 */
export function getGymName(profileData: any): string {
  if (!profileData) return 'My Gym';

  const data = profileData.data ?? profileData;

  // 1. Try direct business_name
  if (data.business_name) return data.business_name;

  // 2. Try businesses array
  const businesses: Business[] = data.businesses || [];
  
  if (businesses.length > 0) {
    // Prefer active/approved business
    const activeBusiness = businesses.find((b: Business) =>
      /(active|approved)/i.test(b?.membership_status || b?.status || '')
    );
    
    const targetBusiness = activeBusiness || businesses[0];
    const name = targetBusiness?.business_name || targetBusiness?.name;
    
    if (name) return name;
  }

  // 3. Fallback
  return 'My Gym';
}

/**
 * Extract gym short name (2-3 letter initials)
 * Examples:
 * - "TK Sport" → "TK"
 * - "MyBoxing" → "MYB"
 * - "Gym" → "GYM"
 */
export function getGymShortName(gymName: string): string {
  if (!gymName) return 'GYM';

  const words = gymName.trim().split(/\s+/).filter(w => w.length > 0);

  if (words.length === 0) return 'GYM';
  
  if (words.length === 1) {
    // Single word: take first 3 letters
    return words[0].substring(0, 3).toUpperCase();
  }
  
  // Multiple words: take first letter of first two words
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Extract business ID from profile
 */
export function getBusinessId(profileData: any): string | null {
  if (!profileData) return null;

  const data = profileData.data ?? profileData;

  // 1. Direct business_id
  if (data.business_id) return data.business_id;

  // 2. From businesses array
  const businesses: Business[] = data.businesses || [];
  
  if (businesses.length > 0) {
    const activeBusiness = businesses.find((b: Business) =>
      /(active|approved)/i.test(b?.membership_status || b?.status || '')
    );
    
    const targetBusiness = activeBusiness || businesses[0];
    return targetBusiness?.business_id || targetBusiness?.id || null;
  }

  return null;
}

/**
 * Get gym initials for logo placeholder
 * Examples:
 * - "TK Sport" → "TK"
 * - "MyBoxing Club" → "MB"
 * - "F" → "F"
 */
export function getGymInitials(gymName: string): string {
  if (!gymName) return 'GYM';

  const words = gymName.trim().split(/\s+/).filter(w => w.length > 0);

  if (words.length === 0) return 'GYM';
  
  if (words.length === 1) {
    // Single word: first 2 chars or just first if very short
    return words[0].substring(0, 2).toUpperCase();
  }
  
  // Multiple words: first letter of first two words
  return (words[0][0] + words[1][0]).toUpperCase();
}
