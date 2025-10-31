import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { theme } from '../theme';
import { API_BASE_URL } from '../api';
import { getStoredToken } from '../auth';

export default function SelectGymScreen({ navigation }: any) {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Your Gym</Text>
        <Text style={styles.subtitle}>Choose the gym you want to join</Text>
      </View>

      {businesses.map((business) => (
        <TouchableOpacity
          key={business.business_id}
          style={styles.gymCard}
          onPress={() => handleSelectGym(business.business_id, business.name)}
          disabled={submitting}
        >
          <Text style={styles.gymName}>🏢 {business.name}</Text>
          {business.venue_name && (
            <Text style={styles.gymVenue}>{business.venue_name}</Text>
          )}
          {business.address && (
            <Text style={styles.gymAddress}>📍 {business.address}</Text>
          )}
        </TouchableOpacity>
      ))}

      {businesses.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No gyms available at the moment</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: 24,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textMuted,
  },
  gymCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
  },
  gymName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  gymVenue: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  gymAddress: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});
