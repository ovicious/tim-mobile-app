import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { theme } from '../theme';
import { apiPost } from '../api';
import { useAuth } from '../auth';

export default function LoginScreen() {
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
    <View style={styles.container}>
      <Text style={styles.title}>Sign in</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        placeholderTextColor={theme.colors.placeholder}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholderTextColor={theme.colors.placeholder}
      />
      <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: 16, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 24, color: theme.colors.text },
  input: {
    backgroundColor: theme.colors.inputBg, color: theme.colors.text, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.inputBorder,
  },
  button: { backgroundColor: theme.colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
