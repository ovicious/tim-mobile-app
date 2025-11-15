import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useThemeColors } from '../theme';
import { createSharedStyles } from '../styles/sharedStyles';
import { Button } from '../components';
import { API_BASE_URL } from '../api';
import { storeToken } from '../auth';
import { logger } from '../utils/logger';

export default function CompleteProfileScreen({ route, navigation }: any) {
  const { email } = route.params;
  const { theme } = useThemeColors();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(false);

  const sharedStyles = useMemo(() => createSharedStyles(theme), [theme]);
  const styles = useMemo(() => createCompleteProfileStyles(theme), [theme]);

  const handleComplete = async () => {
    logger.debug('CompleteProfileScreen', 'User starting profile completion');
    
    // Validation
    if (!firstName || !lastName || !dateOfBirth || !gender) {
      logger.warn('CompleteProfileScreen', 'Validation failed: missing required fields');
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateOfBirth)) {
      logger.warn('CompleteProfileScreen', 'Invalid date format', { dateOfBirth });
      Alert.alert('Error', 'Date of birth must be in format YYYY-MM-DD');
      return;
    }

    logger.debug('CompleteProfileScreen', 'Validation passed, submitting profile');
    setLoading(true);

    try {
      // First, login to get token
      logger.debug('CompleteProfileScreen', 'Logging in user', { email });
      const loginResponse = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password: route.params.password, // Passed from previous screen
        }),
      });

      const loginData = await loginResponse.json();

      if (!loginResponse.ok || !loginData.success) {
        logger.error('CompleteProfileScreen', 'Login failed during profile completion', loginData);
        Alert.alert('Error', 'Please login first');
        navigation.replace('Login');
        return;
      }

      logger.info('CompleteProfileScreen', 'Login successful');
      const token = loginData.data.token;
      await storeToken(token);

      // Now complete profile
      logger.debug('CompleteProfileScreen', 'Submitting profile data');
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/complete-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          date_of_birth: dateOfBirth,
          gender,
          weight: weight ? parseFloat(weight) : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        logger.info('CompleteProfileScreen', 'Profile completed successfully');
        Alert.alert(
          'Success',
          'Profile completed! Now select your gym',
          [
            {
              text: 'OK',
              onPress: () => navigation.replace('SelectGym'),
            },
          ]
        );
      } else {
        logger.error('CompleteProfileScreen', 'Failed to complete profile', data);
        Alert.alert('Error', data.error || 'Failed to complete profile');
      }
    } catch (error: any) {
      logger.error('CompleteProfileScreen', 'Profile completion error', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.background }]} 
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Complete Profile</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>Tell us about yourself</Text>
      </View>

      <View style={styles.form}>
        <Text style={[styles.label, { color: theme.colors.text }]}>First Name *</Text>
        <TextInput
          style={[sharedStyles.input, { color: theme.colors.text, borderColor: theme.colors.secondary }]}
          placeholder="Enter your first name"
          placeholderTextColor={theme.colors.textMuted}
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>Last Name *</Text>
        <TextInput
          style={[sharedStyles.input, { color: theme.colors.text, borderColor: theme.colors.secondary }]}
          placeholder="Enter your last name"
          placeholderTextColor={theme.colors.textMuted}
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>Date of Birth * (YYYY-MM-DD)</Text>
        <TextInput
          style={[sharedStyles.input, { color: theme.colors.text, borderColor: theme.colors.secondary }]}
          placeholder="e.g., 1990-01-31"
          placeholderTextColor={theme.colors.textMuted}
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          keyboardType="numbers-and-punctuation"
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>Gender *</Text>
        <View style={styles.genderContainer}>
          <TouchableOpacity
            style={[
              styles.genderButton,
              { borderColor: theme.colors.secondary },
              gender === 'male' && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary }
            ]}
            onPress={() => setGender('male')}
          >
            <Text style={[styles.genderText, gender === 'male' && { color: '#fff' }, gender !== 'male' && { color: theme.colors.text }]}>
              Male
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.genderButton,
              { borderColor: theme.colors.secondary },
              gender === 'female' && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary }
            ]}
            onPress={() => setGender('female')}
          >
            <Text style={[styles.genderText, gender === 'female' && { color: '#fff' }, gender !== 'female' && { color: theme.colors.text }]}>
              Female
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.genderButton,
              { borderColor: theme.colors.secondary },
              gender === 'other' && { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary }
            ]}
            onPress={() => setGender('other')}
          >
            <Text style={[styles.genderText, gender === 'other' && { color: '#fff' }, gender !== 'other' && { color: theme.colors.text }]}>
              Other
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.label, { color: theme.colors.text }]}>Weight (kg) - Optional</Text>
        <TextInput
          style={[sharedStyles.input, { color: theme.colors.text, borderColor: theme.colors.secondary }]}
          placeholder="Enter your weight"
          placeholderTextColor={theme.colors.textMuted}
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
        />

        <Button
          theme={theme}
          title={loading ? 'Completing...' : 'Continue'}
          onPress={handleComplete}
          disabled={loading}
          loading={loading}
          variant="primary"
          fullWidth
        />
      </View>
    </ScrollView>
  );
}

function createCompleteProfileStyles(theme: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    contentContainer: { padding: 24, paddingTop: 60 },
    header: { marginBottom: 40 },
    title: { fontSize: 32, fontWeight: '700', marginBottom: 8 },
    subtitle: { fontSize: 16 },
    form: { gap: 16 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    genderContainer: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    genderButton: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 2, alignItems: 'center' },
    genderText: { fontWeight: '600', fontSize: 14 },
  });
}
