import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useThemeColors } from '../theme';
import { Button, Card } from '../components';
import { ModularTextInput } from '../components/ModularTextInput';
import { apiPost, apiPut } from '../api';
import { useAuth } from '../auth';
import { logger } from '../utils/logger';

interface EditFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  weight?: string;
  height?: string;
}

interface EditProfileScreenProps {
  route?: {
    params?: {
      initialData?: any;
      onProfileUpdated?: (data: any) => void;
    };
  };
  navigation?: any;
}

export default function EditProfileScreen({ route, navigation }: EditProfileScreenProps) {
  const { theme } = useThemeColors();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const styles = useMemo(() => createEditProfileStyles(theme), [theme]);

  const initialData = route?.params?.initialData || {};
  const onProfileUpdated = route?.params?.onProfileUpdated;

  // Form state
  const [formData, setFormData] = useState<EditFormData>({
    first_name: initialData.first_name || '',
    last_name: initialData.last_name || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    date_of_birth: initialData.date_of_birth || '',
    weight: initialData.weight ? String(initialData.weight) : '',
    height: initialData.height ? String(initialData.height) : '',
  });

  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(
    initialData.profile_pic_url || null
  );
  const [selectedPhotoUri, setSelectedPhotoUri] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Request camera/photo permissions
  const requestMediaPermissions = useCallback(async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const mediaLibraryPermission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    return (
      cameraPermission.status === 'granted' &&
      mediaLibraryPermission.status === 'granted'
    );
  }, []);

  // Pick image from gallery
  const pickImageFromGallery = useCallback(async () => {
    try {
      const hasPermission = await requestMediaPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permission Denied',
          'Camera and photo library access is required to upload a profile picture.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedPhotoUri(result.assets[0].uri);
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      logger.error('EditProfileScreen', 'Failed to pick image from gallery', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  }, [requestMediaPermissions]);

  // Take photo with camera
  const takePhoto = useCallback(async () => {
    try {
      const hasPermission = await requestMediaPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permission Denied',
          'Camera access is required to take a photo.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedPhotoUri(result.assets[0].uri);
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      logger.error('EditProfileScreen', 'Failed to take photo', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  }, [requestMediaPermissions]);

  // Upload photo to backend
  const uploadPhoto = useCallback(async (photoUri: string) => {
    setUploadingPhoto(true);
    try {
      logger.info('EditProfileScreen', 'Uploading profile photo');

      // Create form data for file upload
      const formDataToSend = new FormData();
      const filename = photoUri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formDataToSend.append('profile_picture', {
        uri: photoUri,
        name: filename,
        type,
      } as any);

      // Use POST to upload file
      const response = await apiPost('/api/v1/auth/profile-picture', formDataToSend);
      logger.info('EditProfileScreen', 'Profile photo uploaded successfully');
      setProfilePhotoUri(response?.profile_pic_url || photoUri);
    } catch (error) {
      logger.error('EditProfileScreen', 'Failed to upload profile photo', error);
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  }, []);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    } else if (formData.first_name.length < 2) {
      newErrors.first_name = 'First name must be at least 2 characters';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    } else if (formData.last_name.length < 2) {
      newErrors.last_name = 'Last name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.weight && isNaN(parseFloat(formData.weight))) {
      newErrors.weight = 'Weight must be a valid number';
    }

    if (formData.height && isNaN(parseFloat(formData.height))) {
      newErrors.height = 'Height must be a valid number';
    }

    if (formData.date_of_birth) {
      const dob = new Date(formData.date_of_birth);
      const today = new Date();
      if (dob > today) {
        newErrors.date_of_birth = 'Date of birth cannot be in the future';
      }
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 13) {
        newErrors.date_of_birth = 'You must be at least 13 years old';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      logger.warn('EditProfileScreen', 'Form validation failed', errors);
      return;
    }

    setSaving(true);
    try {
      logger.info('EditProfileScreen', 'Saving profile updates');

      // Prepare payload with only non-empty fields
      const payload: any = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
      };

      if (formData.phone?.trim()) {
        payload.phone = formData.phone.trim();
      }
      if (formData.date_of_birth?.trim()) {
        payload.date_of_birth = formData.date_of_birth.trim();
      }
      if (formData.weight?.trim()) {
        payload.weight = parseFloat(formData.weight);
      }
      if (formData.height?.trim()) {
        payload.height = parseFloat(formData.height);
      }

      // Use PUT endpoint for profile updates
      const response = await apiPut('/api/v1/auth/profile', payload);

      logger.info('EditProfileScreen', 'Profile updated successfully', {
        userId: response?.user_id,
      });
      Alert.alert('Success', 'Your profile has been updated', [
        {
          text: 'OK',
          onPress: () => {
            if (onProfileUpdated) {
              onProfileUpdated(response);
            }
            if (navigation?.goBack) {
              navigation.goBack();
            }
          },
        },
      ]);
    } catch (error: any) {
      logger.error('EditProfileScreen', 'Failed to update profile', error);
      if (error?.code === 401) {
        logout();
        return;
      }
      const errorMessage =
        error?.message || 'Failed to save profile. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  }, [formData, validateForm, errors, onProfileUpdated, navigation, logout]);

  const handleFieldChange = (field: keyof EditFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts editing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };



  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          onPress={() => navigation?.goBack()}
          disabled={saving}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Edit Profile
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        keyboardDismissMode="on-drag"
      >
        {/* Profile Photo Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            📷 Profile Photo
          </Text>
          <Card theme={theme} variant="default" style={styles.photoCard}>
            <View style={styles.photoContainer}>
              {profilePhotoUri || selectedPhotoUri ? (
                <Image
                  source={{ uri: selectedPhotoUri || profilePhotoUri }}
                  style={styles.profileImage}
                />
              ) : (
                <View
                  style={[
                    styles.photoPlaceholder,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <MaterialIcons
                    name="camera-alt"
                    size={48}
                    color="#FFFFFF"
                  />
                </View>
              )}
              {uploadingPhoto && (
                <View style={styles.uploadingOverlay}>
                  <MaterialIcons
                    name="cloud-upload"
                    size={32}
                    color="#FFFFFF"
                  />
                  <Text style={styles.uploadingText}>Uploading...</Text>
                </View>
              )}
            </View>

            <View style={styles.photoButtonsRow}>
              <Button
                theme={theme}
                title="📸 Camera"
                onPress={takePhoto}
                variant="secondary"
                disabled={uploadingPhoto || saving}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                theme={theme}
                title="🖼️ Gallery"
                onPress={pickImageFromGallery}
                variant="secondary"
                disabled={uploadingPhoto || saving}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </Card>
        </View>

        {/* Info Card */}
        <Card theme={theme} variant="default" style={styles.infoCard}>
          <View style={styles.infoContent}>
            <MaterialIcons
              name="info"
              size={20}
              color={theme.colors.info}
              style={{ marginTop: 2 }}
            />
            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              Update your profile information. All fields marked with * are
              required.
            </Text>
          </View>
        </Card>

        {/* Basic Information Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            👤 Basic Information
          </Text>
          <ModularTextInput
            label="First Name"
            field="first_name"
            placeholder="Enter your first name"
            value={formData.first_name}
            onChangeText={(value) => handleFieldChange('first_name', value)}
            error={errors.first_name}
            theme={theme}
            required
            editable={!saving}
          />
          <ModularTextInput
            label="Last Name"
            field="last_name"
            placeholder="Enter your last name"
            value={formData.last_name}
            onChangeText={(value) => handleFieldChange('last_name', value)}
            error={errors.last_name}
            theme={theme}
            required
            editable={!saving}
          />
          <ModularTextInput
            label="Email"
            field="email"
            placeholder="Enter your email"
            value={formData.email}
            onChangeText={(value) => handleFieldChange('email', value)}
            error={errors.email}
            keyboardType="email-address"
            theme={theme}
            required
            editable={!saving}
          />
          <ModularTextInput
            label="Phone"
            field="phone"
            placeholder="Enter your phone number (optional)"
            value={formData.phone || ''}
            onChangeText={(value) => handleFieldChange('phone', value)}
            error={errors.phone}
            keyboardType="phone-pad"
            theme={theme}
            editable={!saving}
          />
        </View>

        {/* Health Information Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            💪 Health Information
          </Text>
          <ModularTextInput
            label="Date of Birth"
            field="date_of_birth"
            placeholder="YYYY-MM-DD (optional)"
            value={formData.date_of_birth || ''}
            onChangeText={(value) => handleFieldChange('date_of_birth', value)}
            error={errors.date_of_birth}
            keyboardType="numbers-and-punctuation"
            theme={theme}
            editable={!saving}
          />
          <View style={styles.twoColumnRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <ModularTextInput
                label="Height (cm)"
                field="height"
                placeholder="e.g., 180"
                value={formData.height || ''}
                onChangeText={(value) => handleFieldChange('height', value)}
                error={errors.height}
                keyboardType="decimal-pad"
                theme={theme}
                editable={!saving}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <ModularTextInput
                label="Weight (kg)"
                field="weight"
                placeholder="e.g., 75"
                value={formData.weight || ''}
                onChangeText={(value) => handleFieldChange('weight', value)}
                error={errors.weight}
                keyboardType="decimal-pad"
                theme={theme}
                editable={!saving}
              />
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            theme={theme}
            title="Cancel"
            variant="secondary"
            fullWidth
            onPress={() => navigation?.goBack()}
            disabled={saving}
            style={styles.cancelButton}
          />
          <Button
            theme={theme}
            title={saving ? 'Saving...' : 'Save Changes'}
            variant="primary"
            fullWidth
            onPress={handleSave}
            disabled={saving}
            loading={saving}
            style={styles.saveButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createEditProfileStyles(theme: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
    },
    backButton: {
      padding: 8,
      borderRadius: 8,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 12,
    },
    photoCard: {
      padding: 16,
      alignItems: 'center',
    },
    photoContainer: {
      marginBottom: 16,
      position: 'relative',
      width: 120,
      height: 120,
    },
    profileImage: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.colors.surface,
    },
    photoPlaceholder: {
      width: 120,
      height: 120,
      borderRadius: 60,
      justifyContent: 'center',
      alignItems: 'center',
    },
    uploadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 60,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    uploadingText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
      marginTop: 8,
    },
    photoButtonsRow: {
      flexDirection: 'row',
      width: '100%',
      gap: 8,
    },
    infoCard: {
      marginBottom: 20,
      padding: 12,
    },
    infoContent: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'flex-start',
    },
    infoText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
    },
    twoColumnRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    actions: {
      gap: 12,
      marginTop: 12,
    },
    cancelButton: {
      marginTop: 8,
    },
    saveButton: {
      marginTop: 8,
    },
  });
}
