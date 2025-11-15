import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useThemeColors } from '../theme';
import { createSharedStyles } from '../styles/sharedStyles';
import { Card, Button } from '../components';
import { API_BASE_URL } from '../api';
import { getStoredToken } from '../auth';

export default function SelectGymScreen({ navigation }: any) {
  const { theme } = useThemeColors();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const sharedStyles = useMemo(() => createSharedStyles(theme), [theme]);
  const styles = useMemo(() => createSelectGymStyles(theme), [theme]);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/businesses`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        setBusinesses(data.data.businesses || []);
      }
    } catch (error) {
      console.error('Failed to fetch businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGym = async (businessID: string, businessName: string) => {
    setSubmitting(true);

    try {
      const token = await getStoredToken();
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/select-gym`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ business_id: businessID }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert(
          'Success',
          `Request sent to ${businessName}. You will be notified once approved.`,
          [
            {
              text: 'OK',
              onPress: () => navigation.replace('PendingApproval', { businessName }),
            },
          ]
        );
      } else {
        Alert.alert('Error', data.error || 'Failed to select gym');
      }
    } catch (error: any) {
      console.error('Gym selection error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Select Your Gym</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>Choose the gym you want to join</Text>
      </View>

      {businesses.map((business) => (
        <Card
          key={business.business_id}
          theme={theme}
          variant="default"
          style={styles.gymCard}
          onPress={() => handleSelectGym(business.business_id, business.name)}
        >
          <Text style={[styles.gymName, { color: theme.colors.text }]}>🏢 {business.name}</Text>
          {business.venue_name && (
            <Text style={[styles.gymVenue, { color: theme.colors.textMuted }]}>{business.venue_name}</Text>
          )}
          {business.address && (
            <Text style={[styles.gymAddress, { color: theme.colors.textMuted }]}>📍 {business.address}</Text>
          )}
        </Card>
      ))}

      {businesses.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>No gyms available at the moment</Text>
        </View>
      )}
    </ScrollView>
  );
}

function createSelectGymStyles(theme: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    contentContainer: { padding: 24, paddingTop: 60 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { marginBottom: 24 },
    title: { fontSize: 32, fontWeight: '700', marginBottom: 8 },
    subtitle: { fontSize: 16 },
    gymCard: { marginBottom: 12 },
    gymName: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
    gymVenue: { fontSize: 14, marginBottom: 4 },
    gymAddress: { fontSize: 14 },
    emptyState: { padding: 40, alignItems: 'center' },
    emptyText: { fontSize: 16, textAlign: 'center' },
  });
}
