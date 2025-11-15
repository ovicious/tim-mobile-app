import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useThemeColors } from '../theme';
import { createSharedStyles } from '../styles/sharedStyles';
import { Button } from '../components';
import { API_BASE_URL } from '../api';

export default function SignupScreen({ navigation }: any) {
  const { theme } = useThemeColors();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const sharedStyles = useMemo(() => createSharedStyles(theme), [theme]);
  const styles = useMemo(() => createSignupStyles(theme), [theme]);

  const handleSignup = async () => {
    // Validation
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert(
          'Success',
          'Please check your email to verify your account',
          [
            {
              text: 'OK',
              onPress: () => navigation.replace('VerifyEmail', { email }),
            },
          ]
        );
      } else {
        Alert.alert('Error', data.error || 'Signup failed');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>Sign up to get started</Text>
      </View>

      <View style={styles.form}>
        <Text style={[styles.label, { color: theme.colors.text }]}>Email Address</Text>
        <TextInput
          style={[sharedStyles.input, { color: theme.colors.text, borderColor: theme.colors.secondary }]}
          placeholder="Enter your email"
          placeholderTextColor={theme.colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>Password</Text>
        <TextInput
          style={[sharedStyles.input, { color: theme.colors.text, borderColor: theme.colors.secondary }]}
          placeholder="At least 8 characters"
          placeholderTextColor={theme.colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <Text style={[styles.label, { color: theme.colors.text }]}>Confirm Password</Text>
        <TextInput
          style={[sharedStyles.input, { color: theme.colors.text, borderColor: theme.colors.secondary, marginBottom: 20 }]}
          placeholder="Re-enter your password"
          placeholderTextColor={theme.colors.textMuted}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <Button
          theme={theme}
          title={loading ? 'Signing up...' : 'Sign Up'}
          onPress={handleSignup}
          disabled={loading}
          loading={loading}
          variant="primary"
          fullWidth
        />

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textMuted }]}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.link, { color: theme.colors.primary }]}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

function createSignupStyles(theme: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    contentContainer: {
      padding: 24,
      paddingTop: 60,
    },
    header: {
      marginBottom: 40,
    },
    title: {
      fontSize: 32,
      fontWeight: '700',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
    },
    form: {
      gap: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 24,
    },
    footerText: {
      fontSize: 14,
    },
    link: {
      fontSize: 14,
      fontWeight: '600',
    },
  });
}


