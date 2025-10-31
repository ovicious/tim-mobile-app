import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useThemeColors } from '../theme';
import { apiPost } from '../api';
import { useAuth } from '../auth';

export default function LoginScreen({ navigation }: any) {
  const { theme } = useThemeColors();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      console.log('Attempting login with email:', email);
      const resp = await apiPost('/api/v1/auth/login', { email, password });
      console.log('Login API response:', JSON.stringify(resp, null, 2));
      
      // Handle different approval states
      if (resp?.error) {
        if (resp.error.includes('verify your email')) {
          Alert.alert('Email Not Verified', 'Please verify your email before logging in. Check your inbox for the verification link.');
        } else if (resp.error.includes('pending approval')) {
          Alert.alert('Approval Pending', 'Your account is awaiting approval from the gym administrator. You will receive an email once approved.');
        } else if (resp.error.includes('rejected')) {
          Alert.alert('Account Rejected', 'Your membership request was rejected. Please contact the gym for more information.');
        } else {
          Alert.alert('Login Failed', resp.error);
        }
        return;
      }
      
      const token = resp?.data?.token || resp?.token;
      console.log('Extracted token:', token ? 'Found' : 'Not found');
      if (!token) {
        console.error('Full response:', resp);
        throw new Error('No token in response');
      }
      console.log('Calling login with token...');
      await login(token);
      console.log('Login successful!');
    } catch (e: any) {
      console.error('Login error:', e);
      Alert.alert('Login failed', e?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };  return (
    <View style={[styles.containerBase, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Sign in</Text>
      <TextInput
        style={[styles.input, { backgroundColor: theme.colors.inputBg, color: theme.colors.text, borderColor: theme.colors.inputBorder }]}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        placeholderTextColor={theme.colors.placeholder}
      />
      <TextInput
        style={[styles.input, { backgroundColor: theme.colors.inputBg, color: theme.colors.text, borderColor: theme.colors.inputBorder }]}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholderTextColor={theme.colors.placeholder}
      />
      <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.primary }]} onPress={onSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.signupLink} onPress={() => navigation.navigate('Signup')}>
        <Text style={[styles.signupText, { color: theme.colors.textMuted }]}>Don't have an account? <Text style={[styles.signupBold, { color: theme.colors.primary }]}>Sign up</Text></Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  containerBase: { flex: 1, padding: 16, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 24 },
  input: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, borderWidth: 1 },
  button: { borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  signupLink: { marginTop: 20, alignItems: 'center' },
  signupText: { fontSize: 14 },
  signupBold: { fontWeight: '700' },
});
