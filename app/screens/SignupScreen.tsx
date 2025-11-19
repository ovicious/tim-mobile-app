import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '../theme';
import { createSharedStyles } from '../styles/sharedStyles';
import { Button } from '../components';
import { apiPost } from '../api';
import { logger } from '../utils/logger';

interface PasswordStrength {
  score: number; // 0-5
  hasLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasDigit: boolean;
  hasSpecial: boolean;
}

export default function SignupScreen({ navigation }: any) {
  const { theme } = useThemeColors();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sharedStyles = useMemo(() => createSharedStyles(theme), [theme]);
  const styles = useMemo(() => createSignupStyles(theme), [theme]);

  // Password strength evaluation
  const evaluatePasswordStrength = (pwd: string): PasswordStrength => {
    const strength: PasswordStrength = {
      score: 0,
      hasLength: pwd.length >= 8,
      hasUppercase: /[A-Z]/.test(pwd),
      hasLowercase: /[a-z]/.test(pwd),
      hasDigit: /\d/.test(pwd),
      hasSpecial: /[@$!%*?&]/.test(pwd),
    };

    if (strength.hasLength) strength.score++;
    if (strength.hasUppercase) strength.score++;
    if (strength.hasLowercase) strength.score++;
    if (strength.hasDigit) strength.score++;
    if (strength.hasSpecial) strength.score++;

    return strength;
  };

  const passwordStrength = evaluatePasswordStrength(password);
  const isPasswordValid =
    passwordStrength.hasLength &&
    passwordStrength.hasUppercase &&
    passwordStrength.hasLowercase &&
    passwordStrength.hasDigit &&
    passwordStrength.hasSpecial;

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score === 0) return theme.colors.textMuted;
    if (passwordStrength.score <= 2) return theme.colors.error;
    if (passwordStrength.score <= 3) return theme.colors.warning;
    return theme.colors.success;
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength.score === 0) return 'N/A';
    if (passwordStrength.score <= 2) return 'Weak';
    if (passwordStrength.score <= 3) return 'Fair';
    return 'Strong';
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!isPasswordValid) {
      newErrors.password =
        'Password must be at least 8 characters with uppercase, lowercase, digit, and special character';
    }

    // Confirm password
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Terms acceptance
    if (!acceptedTerms) {
      newErrors.terms = 'You must accept Terms and Privacy Policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      logger.warn('SignupScreen', 'Form validation failed', errors);
      return;
    }

    setLoading(true);
    try {
      logger.info('SignupScreen', 'Signing up with email', { email });
      
      const response = await apiPost('/api/v1/auth/signup', {
        email: email.trim().toLowerCase(),
        password,
      });

      logger.info('SignupScreen', 'Signup successful', { email });
      Alert.alert(
        'Success',
        'Please check your email to verify your account',
        [
          {
            text: 'OK',
            onPress: () =>
              navigation.replace('VerifyEmail', { email: email.trim().toLowerCase() }),
          },
        ]
      );
    } catch (error: any) {
      logger.error('SignupScreen', 'Signup failed', error);
      const errorMessage =
        error?.message || error?.response?.data?.message || 'Signup failed. Please try again.';
      
      if (errorMessage.includes('already')) {
        setErrors({ email: 'Email is already registered' });
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const PasswordRequirement = ({
    met,
    label,
  }: {
    met: boolean;
    label: string;
  }) => (
    <View style={styles.requirementItem}>
      <MaterialIcons
        name={met ? 'check-circle' : 'radio-button-unchecked'}
        size={18}
        color={met ? theme.colors.success : theme.colors.textMuted}
      />
      <Text
        style={[
          styles.requirementLabel,
          { color: met ? theme.colors.success : theme.colors.textMuted },
        ]}
      >
        {label}
      </Text>
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          Sign up to get started with TIM
        </Text>
      </View>

      <View style={styles.form}>
        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            Email Address <Text style={{ color: theme.colors.error }}>*</Text>
          </Text>
          <TextInput
            style={[
              sharedStyles.input,
              {
                color: theme.colors.text,
                borderColor: errors.email ? theme.colors.error : theme.colors.border,
              },
            ]}
            placeholder="Enter your email"
            placeholderTextColor={theme.colors.textMuted}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors({ ...errors, email: '' });
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
          {errors.email && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {errors.email}
            </Text>
          )}
        </View>

        {/* Password */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            Password <Text style={{ color: theme.colors.error }}>*</Text>
          </Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[
                styles.passwordInput,
                {
                  color: theme.colors.text,
                  borderColor: errors.password
                    ? theme.colors.error
                    : theme.colors.border,
                  backgroundColor: theme.colors.surface,
                },
              ]}
              placeholder="At least 8 characters"
              placeholderTextColor={theme.colors.textMuted}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: '' });
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              <MaterialIcons
                name={showPassword ? 'visibility' : 'visibility-off'}
                size={20}
                color={theme.colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Password Strength Indicator */}
          {password && (
            <View style={styles.strengthCard}>
              <View style={styles.strengthHeader}>
                <Text style={[styles.strengthLabel, { color: theme.colors.text }]}>
                  Password Strength:
                </Text>
                <Text
                  style={[
                    styles.strengthValue,
                    { color: getPasswordStrengthColor() },
                  ]}
                >
                  {getPasswordStrengthLabel()}
                </Text>
              </View>
              <View style={styles.strengthBar}>
                <View
                  style={[
                    styles.strengthFill,
                    {
                      width: `${(passwordStrength.score / 5) * 100}%`,
                      backgroundColor: getPasswordStrengthColor(),
                    },
                  ]}
                />
              </View>
              <View style={styles.requirementsList}>
                <PasswordRequirement
                  met={passwordStrength.hasLength}
                  label="At least 8 characters"
                />
                <PasswordRequirement
                  met={passwordStrength.hasUppercase}
                  label="One uppercase letter (A-Z)"
                />
                <PasswordRequirement
                  met={passwordStrength.hasLowercase}
                  label="One lowercase letter (a-z)"
                />
                <PasswordRequirement
                  met={passwordStrength.hasDigit}
                  label="One digit (0-9)"
                />
                <PasswordRequirement
                  met={passwordStrength.hasSpecial}
                  label="One special character (@$!%*?&)"
                />
              </View>
            </View>
          )}

          {errors.password && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {errors.password}
            </Text>
          )}
        </View>

        {/* Confirm Password */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            Confirm Password <Text style={{ color: theme.colors.error }}>*</Text>
          </Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[
                styles.passwordInput,
                {
                  color: theme.colors.text,
                  borderColor: errors.confirmPassword
                    ? theme.colors.error
                    : theme.colors.border,
                  backgroundColor: theme.colors.surface,
                },
              ]}
              placeholder="Re-enter your password"
              placeholderTextColor={theme.colors.textMuted}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword)
                  setErrors({ ...errors, confirmPassword: '' });
              }}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading}
            >
              <MaterialIcons
                name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                size={20}
                color={theme.colors.textMuted}
              />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {errors.confirmPassword}
            </Text>
          )}
        </View>

        {/* Terms & Privacy */}
        <View style={styles.termsContainer}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => {
              setAcceptedTerms(!acceptedTerms);
              if (errors.terms) setErrors({ ...errors, terms: '' });
            }}
            disabled={loading}
          >
            <MaterialIcons
              name={acceptedTerms ? 'check-box' : 'check-box-outline-blank'}
              size={24}
              color={
                acceptedTerms ? theme.colors.primary : theme.colors.textMuted
              }
            />
            <View style={styles.termsText}>
              <Text style={[styles.termsLabel, { color: theme.colors.text }]}>
                I accept the{' '}
                <Text
                  style={{ color: theme.colors.primary }}
                  onPress={() =>
                    Linking.openURL('https://tim.app/terms').catch(() => {})
                  }
                >
                  Terms of Service
                </Text>{' '}
                and{' '}
                <Text
                  style={{ color: theme.colors.primary }}
                  onPress={() =>
                    Linking.openURL('https://tim.app/privacy').catch(() => {})
                  }
                >
                  Privacy Policy
                </Text>
              </Text>
            </View>
          </TouchableOpacity>
          {errors.terms && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {errors.terms}
            </Text>
          )}
        </View>

        {/* Sign Up Button */}
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
          <Text style={[styles.footerText, { color: theme.colors.textMuted }]}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
          >
            <Text style={[styles.link, { color: theme.colors.primary }]}>
              Log In
            </Text>
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
      paddingTop: 40,
      paddingBottom: 40,
    },
    header: {
      marginBottom: 32,
    },
    title: {
      fontSize: 32,
      fontWeight: '700',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 15,
      lineHeight: 22,
    },
    form: {
      gap: 16,
    },
    inputGroup: {
      marginBottom: 8,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
    },
    errorText: {
      fontSize: 12,
      marginTop: 6,
      fontWeight: '500',
    },
    passwordContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 8,
      backgroundColor: theme.colors.surface,
    },
    passwordInput: {
      flex: 1,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
    },
    eyeButton: {
      padding: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    strengthCard: {
      marginTop: 12,
      padding: 12,
      borderRadius: 8,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    strengthHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    strengthLabel: {
      fontSize: 13,
      fontWeight: '600',
    },
    strengthValue: {
      fontSize: 12,
      fontWeight: '700',
    },
    strengthBar: {
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.border,
      overflow: 'hidden',
      marginBottom: 12,
    },
    strengthFill: {
      height: '100%',
      borderRadius: 3,
    },
    requirementsList: {
      gap: 8,
    },
    requirementItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    requirementLabel: {
      fontSize: 12,
      fontWeight: '500',
    },
    termsContainer: {
      marginBottom: 8,
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    termsText: {
      flex: 1,
      marginTop: 2,
    },
    termsLabel: {
      fontSize: 13,
      fontWeight: '500',
      lineHeight: 18,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 20,
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


