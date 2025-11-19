import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../theme';
import { Card, Button, Badge } from '../components';
import { apiGet } from '../api';
import { useAuth } from '../auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logger } from '../utils/logger';
import { usePreferences, ThemePreference } from '../preferences/PreferencesProvider';
import { useTranslations } from '../i18n';

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

export default function ProfileScreen({ navigation }: any) {
  const { logout } = useAuth();
  const { theme } = useThemeColors();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { themePreference, setThemePreference, availableLanguages, language, setLanguage } = usePreferences();
  const { t } = useTranslations();

  const styles = useMemo(() => createProfileStyles(theme), [theme]);
  const alertCardStyle = useMemo(() => StyleSheet.flatten([styles.infoCard, styles.alertCard]), [styles]);
  const fallbackProfile = useMemo<MemberProfile>(() => ({
    user_id: 'fallback',
    email: '',
    first_name: '',
    last_name: '',
    role: '',
  }), []);
  const themeOptions = useMemo(
    () => [
      { value: 'system' as ThemePreference, label: t('preferences.theme.system'), icon: 'phone-iphone' as const },
      { value: 'light' as ThemePreference, label: t('preferences.theme.light'), icon: 'light-mode' as const },
      { value: 'dark' as ThemePreference, label: t('preferences.theme.dark'), icon: 'dark-mode' as const },
    ],
    [t]
  );
  
  const loadProfile = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      logger.debug('ProfileScreen', 'Loading profile data');
      setLoading(true);
    }

    try {
      const resp = await apiGet('/api/v1/auth/profile');
      const data = resp?.data ?? resp;
      logger.info('ProfileScreen', 'Profile loaded successfully', { userId: data?.user_id });
      setProfile(data);
      setLoadError(null);
    } catch (e: any) {
      if (e?.code === 401) {
        logger.warn('ProfileScreen', 'Unauthorized, logging out');
        logout();
        return;
      }
      logger.error('ProfileScreen', 'Failed to load profile', e);
      setProfile(null);
      setLoadError(t('profile.loadError'));
    } finally {
      if (options?.silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
      logger.debug('ProfileScreen', 'Profile loading complete');
    }
  }, [logout, t]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadProfile({ silent: true });
  }, [loadProfile]);

  const handleRetry = useCallback(() => {
    loadProfile();
  }, [loadProfile]);
  
  if (loading && !profile) {
    return <ActivityIndicator style={[styles.container, { backgroundColor: theme.colors.background }]} color={theme.colors.primary} />;
  }

  // Calculate age from date of birth
  const calculateAge = (dob?: string) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const ageDiff = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDiff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const displayProfile = profile ?? fallbackProfile;
  const hasProfileData = Boolean(profile);
  const age = calculateAge(displayProfile.date_of_birth);
  const initialsRaw = `${displayProfile.first_name?.[0] ?? ''}${displayProfile.last_name?.[0] ?? ''}`;
  const initials = initialsRaw ? initialsRaw.toUpperCase() : 'ME';
  const statusColor = displayProfile.approval_status === 'approved' ? theme.colors.success : theme.colors.warning;
  const fullName = [displayProfile.first_name, displayProfile.last_name].filter(Boolean).join(' ');
  const fullNameText = fullName || t('profile.dataUnavailable');
  const emailDisplay = displayProfile.email || t('profile.dataUnavailable');
  const approvalStatusLabel = profile?.approval_status === 'approved'
    ? t('profile.statusApproved')
    : profile?.approval_status === 'pending'
      ? t('profile.statusPending')
      : profile?.approval_status
        ? profile.approval_status.charAt(0).toUpperCase() + profile.approval_status.slice(1)
        : t('profile.dataUnavailable');
  const showDob = Boolean(profile?.date_of_birth);
  const showWeight = typeof profile?.weight === 'number';
  const showGym = Boolean(profile?.business_name);
  const showAddress = Boolean(profile?.address);
  const showMemberSince = Boolean(profile?.created_at);
  
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]} 
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    >
      {/* Header Card with Avatar */}
      <View style={[styles.headerCard, { backgroundColor: theme.colors.surface }]}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={[styles.name, { color: theme.colors.text }]}>
          {fullNameText}
        </Text>
        <Text style={[styles.email, { color: theme.colors.textMuted }]}>{emailDisplay}</Text>
        
        {profile?.approval_status && (
          <Badge 
            theme={theme} 
            text={profile.approval_status === 'approved' ? t('profile.statusApproved') : t('profile.statusPending')}
            variant={profile.approval_status === 'approved' ? 'success' : 'warning'}
            style={styles.statusBadge}
          />
        )}
      </View>

      {loadError && (
        <Card theme={theme} variant="default" style={alertCardStyle}>
          <View style={styles.alertHeader}>
            <MaterialIcons name="warning-amber" size={22} color={theme.colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.alertTitle, { color: theme.colors.text }]}>{loadError}</Text>
              <Text style={[styles.alertMessage, { color: theme.colors.textMuted }]}>
                {hasProfileData ? t('profile.loadErrorDescription') : t('profile.loadErrorEmptyState')}
              </Text>
            </View>
            <TouchableOpacity onPress={handleRetry} style={styles.retryIconWrapper} accessibilityRole="button">
              <MaterialIcons name="refresh" size={22} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          <Button
            theme={theme}
            title={t('profile.retry')}
            onPress={handleRetry}
            variant="secondary"
            fullWidth
          />
        </Card>
      )}

      {/* Basic Information Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{`👤 ${t('profile.basicInfo')}`}</Text>
        
        <Card theme={theme} variant="default" style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialIcons name="person" size={20} color={theme.colors.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Full Name</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {fullNameText}
              </Text>
            </View>
          </View>
        </Card>

        <Card theme={theme} variant="default" style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialIcons name="email" size={20} color={theme.colors.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Email</Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>{emailDisplay}</Text>
            </View>
          </View>
        </Card>

        {profile?.gender && (
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
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{`💪 ${t('profile.healthInfo')}`}</Text>
        
        {showDob && (
          <Card theme={theme} variant="default" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="cake" size={20} color={theme.colors.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Date of Birth</Text>
                <View style={styles.infoValueRow}>
                  <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                    {new Date(profile?.date_of_birth ?? '').toLocaleDateString()}
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

        {showWeight ? (
          <Card theme={theme} variant="default" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="monitor-weight" size={20} color={theme.colors.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Weight</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {profile?.weight} kg
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
                <Text style={[styles.infoValue, { color: theme.colors.textMuted }]}>{t('profile.weightNotSpecified')}</Text>
              </View>
            </View>
          </Card>
        )}
      </View>

      {/* Gym Information Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{`🏋️ ${t('profile.gymInfo')}`}</Text>
        
        {showGym ? (
          <Card theme={theme} variant="primary" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="location-on" size={20} color={theme.colors.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Primary Gym</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {profile?.business_name}
                </Text>
              </View>
            </View>
          </Card>
        ) : (
          <Card theme={theme} variant="default" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="location-off" size={20} color={theme.colors.secondary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Primary Gym</Text>
                <Text style={[styles.infoValue, { color: theme.colors.textMuted }]}>
                  {t('profile.gymPlaceholder')}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {showAddress ? (
          <Card theme={theme} variant="default" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="home" size={20} color={theme.colors.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Address</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {profile?.address}
                </Text>
              </View>
            </View>
          </Card>
        ) : (
          <Card theme={theme} variant="default" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="home-work" size={20} color={theme.colors.secondary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Address</Text>
                <Text style={[styles.infoValue, { color: theme.colors.textMuted }]}>
                  {t('profile.addressPlaceholder')}
                </Text>
              </View>
            </View>
          </Card>
        )}
      </View>

      {/* Member Status Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{`ℹ️ ${t('profile.memberStatus')}`}</Text>
        
        <Card theme={theme} variant="default" style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialIcons name="verified-user" size={20} color={statusColor} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>Approval Status</Text>
              <Text style={[styles.infoValue, { color: statusColor }]}>
                {approvalStatusLabel}
              </Text>
            </View>
          </View>
        </Card>

        {showMemberSince && (
          <Card theme={theme} variant="default" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="calendar-today" size={20} color={theme.colors.primary} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.colors.textMuted }]}>{t('profile.memberSince')}</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {new Date(profile?.created_at ?? '').toLocaleDateString()}
                </Text>
              </View>
            </View>
          </Card>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{`⚙️ ${t('profile.preferences')}`}</Text>

        <Card theme={theme} variant="default" style={styles.infoCard}>
          <View style={styles.preferenceHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.preferenceTitle, { color: theme.colors.text }]}>{t('profile.themeLabel')}</Text>
              <Text style={[styles.preferenceDescription, { color: theme.colors.textMuted }]}>
                {t('profile.themeDescription')}
              </Text>
            </View>
          </View>
          <View style={styles.segmentedControl}>
            {themeOptions.map(option => {
              const isActive = themePreference === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.segmentButton,
                    { borderColor: theme.colors.border },
                    isActive && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                  ]}
                  onPress={() => setThemePreference(option.value)}
                >
                  <MaterialIcons
                    name={option.icon}
                    size={16}
                    color={isActive ? '#FFFFFF' : theme.colors.text}
                  />
                  <Text
                    style={[
                      styles.segmentLabel,
                      { color: isActive ? '#FFFFFF' : theme.colors.text },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <Card theme={theme} variant="default" style={styles.infoCard}>
          <View style={styles.preferenceHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.preferenceTitle, { color: theme.colors.text }]}>{t('profile.languageLabel')}</Text>
              <Text style={[styles.preferenceDescription, { color: theme.colors.textMuted }]}>
                {t('profile.languageDescription')}
              </Text>
            </View>
          </View>
          {availableLanguages.map((langOption, index) => {
            const isActive = language === langOption.code;
            return (
              <TouchableOpacity
                key={langOption.code}
                style={[
                  styles.languageRow,
                  { borderColor: theme.colors.border },
                  index === availableLanguages.length - 1 && { borderBottomWidth: 0 },
                ]}
                onPress={() => setLanguage(langOption.code)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.languageLabel, { color: theme.colors.text }]}>{langOption.label}</Text>
                </View>
                <MaterialIcons
                  name={isActive ? 'radio-button-checked' : 'radio-button-unchecked'}
                  size={20}
                  color={isActive ? theme.colors.primary : theme.colors.textMuted}
                />
              </TouchableOpacity>
            );
          })}
        </Card>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button 
          theme={theme} 
          title={t('profile.editProfile')}
          onPress={() => navigation?.navigate('EditProfile', { initialData: profile, onProfileUpdated: loadProfile })}
          variant="primary"
          fullWidth
          style={styles.editBtn}
        />
        <Button 
          theme={theme} 
          title="Change Password"
          onPress={() => navigation?.navigate('ChangePassword')}
          variant="secondary"
          fullWidth
          style={styles.changePasswordBtn}
        />
        <Button 
          theme={theme} 
          title={t('profile.logout')}
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

    // Preferences
    preferenceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    preferenceTitle: {
      fontSize: 15,
      fontWeight: '600',
      marginBottom: 4,
    },
    preferenceDescription: {
      fontSize: 13,
      lineHeight: 18,
    },
    alertCard: {
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    alertHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
    },
    alertTitle: {
      fontSize: 15,
      fontWeight: '600',
    },
    alertMessage: {
      fontSize: 13,
      lineHeight: 18,
    },
    retryIconWrapper: {
      padding: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    segmentedControl: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
    },
    segmentButton: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    segmentLabel: {
      fontSize: 13,
      fontWeight: '600',
    },
    languageRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      borderBottomWidth: 1,
      gap: 10,
    },
    languageLabel: {
      fontSize: 15,
      fontWeight: '500',
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
    editBtn: { marginTop: 8 },
    changePasswordBtn: { marginTop: 8 },
    logoutBtn: { marginTop: 8 },
  });
}
