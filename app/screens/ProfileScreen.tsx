import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '../theme';
import { createSharedStyles } from '../styles/sharedStyles';
import { Card, Button, Badge } from '../components';
import { apiGet } from '../api';
import { useAuth } from '../auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logger } from '../utils/logger';

interface MemberProfile {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  gender?: string;
  role: string;
  date_of_birth?: string;
  weight?: number;
  business_id?: string;
  business_name?: string;
  address?: string;
  profile_pic_url?: string;
  approval_status?: string;
  created_at?: string;
  businesses?: Array<{ business_id: string; name: string; status: string }>;
}

export default function ProfileScreen() {
  const { logout } = useAuth();
  const { theme } = useThemeColors();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const sharedStyles = useMemo(() => createSharedStyles(theme), [theme]);
  const styles = useMemo(() => createProfileStyles(theme), [theme]);
  
  useEffect(() => {
    logger.debug('ProfileScreen', 'Component mounted, loading profile');
    
    apiGet('/api/v1/auth/profile')
      .then((resp) => {
        const data = resp?.data ?? resp;
        logger.info('ProfileScreen', 'Profile loaded successfully', { userId: data?.user_id });
        setProfile(data);
      })
      .catch((e: any) => {
        if (e?.code === 401) {
          logger.warn('ProfileScreen', 'Unauthorized, logging out');
          logout();
          return;
        }
        logger.error('ProfileScreen', 'Failed to load profile', e);
        setProfile(null);
      })
      .finally(() => {
        setLoading(false);
        logger.debug('ProfileScreen', 'Profile loading complete');
      });
  }, []);
  
  if (loading) {
    return <ActivityIndicator style={[styles.container, { backgroundColor: theme.colors.background }]} color={theme.colors.primary} />;
  }
  
  if (!profile) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.error, { color: theme.colors.error }]}>Failed to load profile.</Text>
      </View>
    );
  }

  // Calculate age from date of birth
  const calculateAge = (dob?: string) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const ageDiff = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDiff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const age = calculateAge(profile.date_of_birth);
  const initials = `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() || 'M';
  const statusColor = profile.approval_status === 'approved' ? theme.colors.success : theme.colors.warning;
  
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]} 
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Card with Avatar */}
      <View style={[styles.headerCard, { backgroundColor: theme.colors.surface }]}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={[styles.name, { color: theme.colors.text }]}>
          {profile.first_name} {profile.last_name}
        </Text>
        <Text style={[styles.email, { color: theme.colors.textMuted }]}>{profile.email}</Text>
        
        {profile.approval_status && (
          <Badge 
            theme={theme} 
            text={profile.approval_status === 'approved' ? '✓ Approved' : 'Pending Approval'}
            variant={profile.approval_status === 'approved' ? 'success' : 'warning'}
            style={styles.statusBadge}
          />
        )}
      </View>

      {/* Basic Information Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>👤 Basic Information</Text>
        
        <Card theme={theme} variant="default" style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialIcons name="person" size={20} color={theme.colors.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Full Name</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {profile.first_name} {profile.last_name}
              </Text>
            </View>
          </View>
        </Card>

        <Card theme={theme} variant="default" style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialIcons name="email" size={20} color={theme.colors.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Email</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>{profile.email}</Text>
            </View>
          </View>
        </Card>

        {profile.gender && (
          <Card theme={theme} variant="default" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="wc" size={20} color={theme.colors.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Gender</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}
                </Text>
              </View>
            </View>
          </Card>
        )}
      </View>

      {/* Health Information Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>💪 Health Information</Text>
        
        {profile.date_of_birth && (
          <Card theme={theme} variant="default" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="cake" size={20} color={theme.colors.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Date of Birth</Text>
                <View style={styles.infoValueRow}>
                  <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                    {new Date(profile.date_of_birth).toLocaleDateString()}
                  </Text>
                  {age && (
                    <Text style={[styles.ageText, { color: theme.colors.secondary }]}>
                      {age} years
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </Card>
        )}

        {profile.weight ? (
          <Card theme={theme} variant="default" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="monitor-weight" size={20} color={theme.colors.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Weight</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {profile.weight} kg
                </Text>
              </View>
            </View>
          </Card>
        ) : (
          <Card theme={theme} variant="default" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="monitor-weight" size={20} color={theme.colors.secondary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Weight</Text>
                <Text style={[styles.infoValue, { color: theme.colors.textMuted }]}>Not specified</Text>
              </View>
            </View>
          </Card>
        )}
      </View>

      {/* Gym Information Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>🏋️ Gym Information</Text>
        
        {profile.business_name && (
          <Card theme={theme} variant="primary" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="location-on" size={20} color={theme.colors.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Primary Gym</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {profile.business_name}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {profile.address && (
          <Card theme={theme} variant="default" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="home" size={20} color={theme.colors.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Address</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {profile.address}
                </Text>
              </View>
            </View>
          </Card>
        )}
      </View>

      {/* Member Status Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>ℹ️ Member Status</Text>
        
        <Card theme={theme} variant="default" style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialIcons name="verified-user" size={20} color={statusColor} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Approval Status</Text>
              <Text style={[styles.infoValue, { color: statusColor }]}>
                {profile.approval_status ? 
                  profile.approval_status.charAt(0).toUpperCase() + profile.approval_status.slice(1) : 
                  'Unknown'
                }
              </Text>
            </View>
          </View>
        </Card>

        {profile.created_at && (
          <Card theme={theme} variant="default" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="calendar-today" size={20} color={theme.colors.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Member Since</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {new Date(profile.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </Card>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button 
          theme={theme} 
          title="Logout" 
          onPress={logout}
          variant="danger"
          fullWidth
          style={styles.logoutBtn}
        />
      </View>
    </ScrollView>
  );
}

function createProfileStyles(theme: any) {
  return StyleSheet.create({
    container: { flex: 1, padding: 16 },
    
    // Header Card
    headerCard: {
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    avatarText: {
      color: '#fff',
      fontSize: 32,
      fontWeight: '700',
    },
    name: {
      fontSize: 22,
      fontWeight: '700',
      marginBottom: 4,
    },
    email: {
      fontSize: 14,
      marginBottom: 12,
    },
    statusBadge: {
      marginTop: 8,
    },

    // Sections
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 12,
    },

    // Info Cards
    infoCard: {
      marginBottom: 10,
      padding: 14,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    infoContent: {
      flex: 1,
    },
    infoLabel: {
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 4,
      textTransform: 'uppercase',
    },
    infoValue: {
      fontSize: 15,
      fontWeight: '500',
    },
    infoValueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    ageText: {
      fontSize: 13,
      fontWeight: '500',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: 'rgba(0,0,0,0.05)',
    },

    // Error
    error: { margin: 16, fontSize: 16, textAlign: 'center' },

    // Actions
    actions: {
      marginTop: 12,
      marginBottom: 8,
    },
    logoutBtn: { marginTop: 8 },
  });
}
