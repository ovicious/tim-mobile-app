import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColors } from '../theme';
import { createSharedStyles } from '../styles/sharedStyles';
import { Button } from '../components';
import { apiPost } from '../api';
import { logger } from '../utils/logger';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PasswordStrength {
  score: number; // 0-5
  hasLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasDigit: boolean;
  hasSpecial: boolean;
}

interface FormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

type RootStackParamList = {
  Profile: undefined;
  [key: string]: undefined | object;
};

export default function ChangePasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useThemeColors();
  const insets = useSafeAreaInsets();
  const sharedStyles = useMemo(() => createSharedStyles(theme), [theme]);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.background,
        },
        header: {
          paddingHorizontal: 16,
          paddingTop: insets.top + 12,
          paddingBottom: 16,
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        backButton: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 12,
        },
        backButtonText: {
          fontSize: 16,
          color: theme.colors.primary,
          fontWeight: '500',
          marginLeft: 4,
        },
        headerTitle: {
          fontSize: 24,
          fontWeight: 'bold',
          color: theme.colors.text,
        },
        scrollContent: {
          padding: 16,
          paddingBottom: 40,
        },
        infoBox: {
          backgroundColor: theme.colors.primary + '10',
          borderLeftWidth: 3,
          borderLeftColor: theme.colors.primary,
          borderRadius: 8,
          padding: 12,
          marginBottom: 20,
        },
        infoText: {
          fontSize: 13,
          color: theme.colors.text,
          lineHeight: 18,
        },
        inputGroup: {
          marginBottom: 16,
        },
        label: {
          fontSize: 14,
          fontWeight: '600',
          color: theme.colors.text,
          marginBottom: 8,
        },
        passwordContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 8,
          backgroundColor: theme.colors.surface,
          paddingHorizontal: 12,
        },
        passwordContainerError: {
          borderColor: theme.colors.error,
        },
        passwordInput: {
          flex: 1,
          paddingHorizontal: 2,
          paddingVertical: 12,
          fontSize: 15,
          color: theme.colors.text,
        },
        eyeButton: {
          padding: 12,
          justifyContent: 'center',
          alignItems: 'center',
        },
        errorText: {
          fontSize: 12,
          color: theme.colors.error,
          marginTop: 6,
        },
        strengthCard: {
          marginTop: 12,
          padding: 12,
          backgroundColor: theme.colors.surface,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        strengthBar: {
          height: 6,
          borderRadius: 3,
          backgroundColor: theme.colors.border,
          overflow: 'hidden',
          marginBottom: 8,
        },
        strengthFill: {
          height: '100%',
          borderRadius: 3,
        },
        strengthLabel: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 8,
        },
        strengthText: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        requirementsList: {
          gap: 6,
          marginTop: 8,
        },
        requirementItem: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
        },
        requirementLabel: {
          fontSize: 12,
          flex: 1,
        },
        actionButtons: {
          gap: 12,
          marginTop: 24,
        },
        cautionBox: {
          backgroundColor: theme.colors.error + '10',
          borderLeftWidth: 3,
          borderLeftColor: theme.colors.error,
          borderRadius: 8,
          padding: 12,
          marginBottom: 20,
        },
        cautionContent: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 8,
        },
        cautionText: {
          fontSize: 12,
          color: theme.colors.error,
          lineHeight: 16,
          flex: 1,
        },
      }),
    [theme, insets]
  );

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

  const passwordStrength = evaluatePasswordStrength(newPassword);

  const getPasswordStrengthColor = (): string => {
    if (passwordStrength.score <= 1) return theme.colors.error;
    if (passwordStrength.score <= 3) return theme.colors.warning;
    return theme.colors.success;
  };

  const getPasswordStrengthLabel = (): string => {
    if (!newPassword) return '';
    if (passwordStrength.score <= 1) return 'Weak';
    if (passwordStrength.score <= 3) return 'Fair';
    return 'Strong';
  };

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (!passwordStrength.hasUppercase || !passwordStrength.hasLowercase || !passwordStrength.hasDigit || !passwordStrength.hasSpecial) {
      newErrors.newPassword = 'Password must contain uppercase, lowercase, digit, and special character';
    } else if (currentPassword === newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (confirmPassword !== newPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [currentPassword, newPassword, confirmPassword, passwordStrength]);

  const handleChangePassword = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      logger.debug('ChangePasswordScreen', 'Attempting password change');

      const response = await apiPost('/api/v1/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (response?.status === 'success' || response?.data) {
        logger.info('ChangePasswordScreen', 'Password changed successfully');
        Alert.alert('Success', 'Your password has been changed successfully.', [
          {
            text: 'Done',
            onPress: () => {
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
              setErrors({});
              navigation.goBack();
            },
          },
        ]);
      } else {
        throw new Error(response?.message || 'Failed to change password');
      }
    } catch (err: any) {
      logger.error('ChangePasswordScreen', 'Password change failed', { error: err });
      const errorMsg = err?.message || 'Failed to change password. Please try again.';
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  }, [validateForm, currentPassword, newPassword, navigation]);

  const handleClear = useCallback(() => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
  }, []);

  const PasswordRequirement = ({ met, label }: { met: boolean; label: string }) => (
    <View style={styles.requirementItem}>
      <MaterialIcons
        name={met ? 'check-circle' : 'radio-button-unchecked'}
        size={14}
        color={met ? theme.colors.success : theme.colors.textMuted}
      />
      <Text style={[styles.requirementLabel, { color: met ? theme.colors.text : theme.colors.textMuted }]}>
        {label}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="chevron-left" size={24} color={theme.colors.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            🔒 Keep your account secure by using a strong password with uppercase, lowercase, numbers, and special characters.
          </Text>
        </View>

        {/* Current Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Current Password *</Text>
          <View style={[styles.passwordContainer, errors.currentPassword && styles.passwordContainerError]}>
            <TextInput
              style={[styles.passwordInput, { color: theme.colors.text }]}
              placeholder="Enter your current password"
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry={!showCurrentPassword}
              value={currentPassword}
              onChangeText={(text) => {
                setCurrentPassword(text);
                if (errors.currentPassword) {
                  setErrors((prev) => ({ ...prev, currentPassword: undefined }));
                }
              }}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons
                name={showCurrentPassword ? 'visibility' : 'visibility-off'}
                size={22}
                color={theme.colors.textMuted}
              />
            </TouchableOpacity>
          </View>
          {errors.currentPassword && <Text style={styles.errorText}>{errors.currentPassword}</Text>}
        </View>

        {/* New Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>New Password *</Text>
          <View style={[styles.passwordContainer, errors.newPassword && styles.passwordContainerError]}>
            <TextInput
              style={[styles.passwordInput, { color: theme.colors.text }]}
              placeholder="Create a new password"
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry={!showNewPassword}
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                if (errors.newPassword) {
                  setErrors((prev) => ({ ...prev, newPassword: undefined }));
                }
              }}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowNewPassword(!showNewPassword)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons
                name={showNewPassword ? 'visibility' : 'visibility-off'}
                size={22}
                color={theme.colors.textMuted}
              />
            </TouchableOpacity>
          </View>
          {errors.newPassword && <Text style={styles.errorText}>{errors.newPassword}</Text>}

          {/* Password Strength Meter */}
          {newPassword && (
            <View style={styles.strengthCard}>
              <Text style={[styles.strengthLabel, { color: theme.colors.text }]}>Password Strength</Text>
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
              <Text style={[styles.strengthText, { color: getPasswordStrengthColor() }]}>
                {getPasswordStrengthLabel()}
              </Text>

              <View style={styles.requirementsList}>
                <PasswordRequirement met={passwordStrength.hasLength} label="At least 8 characters" />
                <PasswordRequirement met={passwordStrength.hasUppercase} label="Uppercase letter (A-Z)" />
                <PasswordRequirement met={passwordStrength.hasLowercase} label="Lowercase letter (a-z)" />
                <PasswordRequirement met={passwordStrength.hasDigit} label="Number (0-9)" />
                <PasswordRequirement met={passwordStrength.hasSpecial} label="Special character (@$!%*?&)" />
              </View>
            </View>
          )}
        </View>

        {/* Confirm Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm Password *</Text>
          <View style={[styles.passwordContainer, errors.confirmPassword && styles.passwordContainerError]}>
            <TextInput
              style={[styles.passwordInput, { color: theme.colors.text }]}
              placeholder="Confirm your new password"
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword) {
                  setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }
              }}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons
                name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                size={22}
                color={theme.colors.textMuted}
              />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
        </View>

        <View style={styles.cautionBox}>
          <View style={styles.cautionContent}>
            <Ionicons name="warning" size={20} color={theme.colors.warning} />
            <Text style={styles.cautionText}>
              You will be logged out on all devices after changing your password. You'll need to log in again.
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <Button
            theme={theme}
            onPress={handleChangePassword}
            title={loading ? 'Changing Password...' : 'Change Password'}
            variant="primary"
            disabled={loading}
            loading={loading}
            fullWidth
          />
          <Button
            theme={theme}
            onPress={handleClear}
            title="Clear Form"
            variant="secondary"
            disabled={loading}
            fullWidth
          />
        </View>
      </ScrollView>
    </View>
  );
}
