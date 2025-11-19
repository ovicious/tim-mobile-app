import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '../theme';
import { getProfile, getBusinessDetails, switchGym } from '../api';
import { getGymInitials } from '../utils/gymUtils';

type Business = {
  id: string;
  name: string;
  logo_url?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  social_media?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
};

export default function GymProfileScreen() {
  const { theme } = useThemeColors();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [currentGym, setCurrentGym] = useState<Business | null>(null);
  const [availableGyms, setAvailableGyms] = useState<Business[]>([]);
  const [showGymSwitcher, setShowGymSwitcher] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    loadGymProfile();
  }, []);

  const loadGymProfile = async () => {
    try {
      setLoading(true);
      const profile = await getProfile();
      console.log('[GymProfile] Profile:', profile);

      // Get current business ID
      const businessId = profile?.data?.business_id || profile?.business_id;
      
      // Get available businesses
      const businesses: any[] = profile?.data?.businesses || profile?.businesses || [];
      console.log('[GymProfile] Available businesses:', businesses);

      // Normalize businesses
      const normalized: Business[] = businesses.map((b: any) => ({
        id: b.business_id || b.id,
        name: b.business_name || b.name || 'Unnamed Gym',
        logo_url: b.logo_url || b.logoUrl,
        website: b.website,
        contact_email: b.contact_email || b.email,
        contact_phone: b.contact_phone || b.phone,
        address: b.address,
        social_media: b.social_media || {},
      }));

      setAvailableGyms(normalized);

      // Find current gym
      const current = normalized.find(g => g.id === businessId) || normalized[0];
      
      if (current) {
        // Try to fetch detailed info
        try {
          const details = await getBusinessDetails(current.id);
          console.log('[GymProfile] Business details:', details);
          
          const detailData = details?.data || details;
          setCurrentGym({
            ...current,
            website: detailData.website || current.website,
            contact_email: detailData.contact_email || detailData.email || current.contact_email,
            contact_phone: detailData.contact_phone || detailData.phone || current.contact_phone,
            address: detailData.address || current.address,
            social_media: detailData.social_media || current.social_media,
          });
        } catch (err) {
          // Use basic info if details fetch fails
          console.warn('[GymProfile] Failed to fetch details, using basic info');
          setCurrentGym(current);
        }
      }
    } catch (error) {
      console.error('[GymProfile] Error loading gym profile:', error);
      setCurrentGym({
        id: 'unknown',
        name: 'My Gym',
        logo_url: undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchGym = async (gymId: string) => {
    if (gymId === currentGym?.id) {
      setShowGymSwitcher(false);
      return;
    }

    try {
      setSwitching(true);
      await switchGym(gymId);
      
      // Reload profile to get new gym details
      await loadGymProfile();
      setShowGymSwitcher(false);
    } catch (error) {
      console.error('[GymProfile] Error switching gym:', error);
      alert('Failed to switch gym. Please try again.');
    } finally {
      setSwitching(false);
    }
  };

  const handleContact = (type: 'email' | 'phone' | 'map') => {
    if (!currentGym) return;

    switch (type) {
      case 'email':
        if (currentGym.contact_email) {
          Linking.openURL(`mailto:${currentGym.contact_email}`);
        }
        break;
      case 'phone':
        if (currentGym.contact_phone) {
          Linking.openURL(`tel:${currentGym.contact_phone}`);
        }
        break;
      case 'map':
        if (currentGym.address) {
          const query = encodeURIComponent(currentGym.address);
          const url = Platform.OS === 'ios'
            ? `maps://app?q=${query}`
            : `geo:0,0?q=${query}`;
          Linking.openURL(url);
        }
        break;
    }
  };

  const handleSocialMedia = (platform: string) => {
    const url = currentGym?.social_media?.[platform as keyof typeof currentGym.social_media];
    if (url) {
      Linking.openURL(url);
    }
  };

  const handleWebsite = () => {
    if (currentGym?.website) {
      Linking.openURL(currentGym.website);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Gym Switcher */}
      <View style={[styles.switcherContainer, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          style={styles.switcherButton}
          onPress={() => setShowGymSwitcher(!showGymSwitcher)}
          disabled={availableGyms.length <= 1}
        >
          <Text style={[styles.switcherLabel, { color: theme.colors.textMuted }]}>Current Gym</Text>
          <View style={styles.switcherRow}>
            <Text style={[styles.switcherText, { color: theme.colors.text }]}>
              {currentGym?.name || 'My Gym'}
            </Text>
            {availableGyms.length > 1 && (
              <MaterialIcons
                name={showGymSwitcher ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={24}
                color={theme.colors.text}
              />
            )}
          </View>
        </TouchableOpacity>

        {showGymSwitcher && (
          <View style={[styles.gymList, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
            {availableGyms.map(gym => (
              <TouchableOpacity
                key={gym.id}
                style={[
                  styles.gymItem,
                  gym.id === currentGym?.id && { backgroundColor: theme.colors.surface }
                ]}
                onPress={() => handleSwitchGym(gym.id)}
                disabled={switching}
              >
                {gym.logo_url ? (
                  <Image source={{ uri: gym.logo_url }} style={styles.gymItemLogo} />
                ) : (
                  <View style={[styles.gymItemLogoPlaceholder, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.gymItemLogoText}>{getGymInitials(gym.name)}</Text>
                  </View>
                )}
                <Text style={[styles.gymItemText, { color: theme.colors.text }]}>{gym.name}</Text>
                {gym.id === currentGym?.id && (
                  <MaterialIcons name="check" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Gym Logo & Info */}
      <View style={styles.gymInfoSection}>
        {currentGym?.logo_url ? (
          <Image source={{ uri: currentGym.logo_url }} style={styles.gymLogo} />
        ) : (
          <View style={[styles.gymLogoPlaceholder, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.gymLogoText}>{getGymInitials(currentGym?.name || 'GYM')}</Text>
          </View>
        )}

        <Text style={[styles.gymName, { color: theme.colors.text }]}>{currentGym?.name}</Text>

        {currentGym?.website && (
          <TouchableOpacity onPress={handleWebsite}>
            <Text style={[styles.gymWebsite, { color: theme.colors.primary }]}>
              {currentGym.website}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Separator */}
      <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />

      {/* Contact Section */}
      <View style={styles.contactSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Contact</Text>
        <View style={styles.contactRow}>
          {currentGym?.contact_email && (
            <TouchableOpacity
              style={[styles.contactButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={() => handleContact('email')}
            >
              <MaterialIcons name="email" size={28} color={theme.colors.primary} />
              <Text style={[styles.contactLabel, { color: theme.colors.textMuted }]}>Email</Text>
            </TouchableOpacity>
          )}

          {currentGym?.contact_phone && (
            <TouchableOpacity
              style={[styles.contactButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={() => handleContact('phone')}
            >
              <MaterialIcons name="phone" size={28} color={theme.colors.primary} />
              <Text style={[styles.contactLabel, { color: theme.colors.textMuted }]}>Call</Text>
            </TouchableOpacity>
          )}

          {currentGym?.address && (
            <TouchableOpacity
              style={[styles.contactButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              onPress={() => handleContact('map')}
            >
              <MaterialIcons name="location-on" size={28} color={theme.colors.primary} />
              <Text style={[styles.contactLabel, { color: theme.colors.textMuted }]}>Map</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Social Media */}
      {currentGym?.social_media && Object.keys(currentGym.social_media).length > 0 && (
        <View style={styles.socialSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Follow Us</Text>
          <View style={styles.socialRow}>
            {currentGym.social_media.facebook && (
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: '#1877F2' }]}
                onPress={() => handleSocialMedia('facebook')}
              >
                <MaterialIcons name="facebook" size={28} color="#fff" />
              </TouchableOpacity>
            )}
            {currentGym.social_media.instagram && (
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: '#E4405F' }]}
                onPress={() => handleSocialMedia('instagram')}
              >
                <MaterialIcons name="camera-alt" size={28} color="#fff" />
              </TouchableOpacity>
            )}
            {currentGym.social_media.twitter && (
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: '#1DA1F2' }]}
                onPress={() => handleSocialMedia('twitter')}
              >
                <MaterialIcons name="alternate-email" size={28} color="#fff" />
              </TouchableOpacity>
            )}
            {currentGym.social_media.linkedin && (
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: '#0A66C2' }]}
                onPress={() => handleSocialMedia('linkedin')}
              >
                <MaterialIcons name="business" size={28} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* News Menu */}
      <TouchableOpacity
        style={[styles.menuCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        onPress={() => navigation.navigate('News')}
      >
        <View style={styles.menuContent}>
          <MaterialIcons name="article" size={32} color={theme.colors.primary} />
          <View style={styles.menuTextContainer}>
            <Text style={[styles.menuTitle, { color: theme.colors.text }]}>News & Updates</Text>
            <Text style={[styles.menuSubtitle, { color: theme.colors.textMuted }]}>
              Latest announcements and events
            </Text>
          </View>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={theme.colors.textMuted} />
      </TouchableOpacity>

      {/* Shop Menu */}
      <TouchableOpacity
        style={[styles.menuCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        onPress={() => navigation.navigate('Shop')}
      >
        <View style={styles.menuContent}>
          <MaterialIcons name="store" size={32} color={theme.colors.primary} />
          <View style={styles.menuTextContainer}>
            <Text style={[styles.menuTitle, { color: theme.colors.text }]}>Gym Shop</Text>
            <Text style={[styles.menuSubtitle, { color: theme.colors.textMuted }]}>
              Merchandise, supplements & more
            </Text>
          </View>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={theme.colors.textMuted} />
      </TouchableOpacity>

      {/* Bottom Cards Section */}
      <View style={styles.cardsSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick Access</Text>
        <View style={styles.cardsGrid}>
          <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={() => navigation.navigate('Subscriptions')}
          >
            <MaterialIcons name="card-membership" size={32} color={theme.colors.primary} />
            <Text style={[styles.cardText, { color: theme.colors.text }]}>Membership</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={() => navigation.navigate('Vouchers')}
          >
            <MaterialIcons name="local-offer" size={32} color={theme.colors.primary} />
            <Text style={[styles.cardText, { color: theme.colors.text }]}>Vouchers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={() => navigation.navigate('Tickets')}
          >
            <MaterialIcons name="confirmation-number" size={32} color={theme.colors.primary} />
            <Text style={[styles.cardText, { color: theme.colors.text }]}>Tickets</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={() => navigation.navigate('Credit')}
          >
            <MaterialIcons name="account-balance-wallet" size={32} color={theme.colors.primary} />
            <Text style={[styles.cardText, { color: theme.colors.text }]}>Credit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  switcherContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  switcherButton: {
    paddingVertical: 8,
  },
  switcherLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  switcherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switcherText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  gymList: {
    marginTop: 12,
    borderTopWidth: 1,
    paddingTop: 8,
  },
  gymItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  gymItemLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  gymItemLogoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gymItemLogoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  gymItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  gymInfoSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  gymLogo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  gymLogoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gymLogoText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  gymName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  gymWebsite: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  separator: {
    height: 1,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  contactSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  contactButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  contactLabel: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  socialSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  menuContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 12,
  },
  cardsSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '48%',
    aspectRatio: 1.5,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
});
