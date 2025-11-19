import React, { memo } from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  StyleSheet,
} from 'react-native';

interface ModularTextInputProps extends RNTextInputProps {
  label: string;
  field: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  keyboardType?: RNTextInputProps['keyboardType'];
  required?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  theme: any;
}

/**
 * Modular TextInput Component
 * 
 * Prevents keyboard dismissal by memoizing the component
 * and keeping TextInput stable across re-renders.
 * 
 * @usage
 * <ModularTextInput
 *   label="First Name"
 *   field="first_name"
 *   placeholder="Enter your first name"
 *   value={formData.first_name}
 *   onChangeText={(value) => handleFieldChange('first_name', value)}
 *   theme={theme}
 *   required
 * />
 */
export const ModularTextInput = memo(
  ({
    label,
    field,
    placeholder,
    value,
    onChangeText,
    error,
    keyboardType = 'default',
    required = false,
    multiline = false,
    numberOfLines = 1,
    theme,
    ...restProps
  }: ModularTextInputProps) => {
    const styles = createStyles(theme);

    return (
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
          {label}
          {required && <Text style={{ color: theme.colors.error }}>*</Text>}
        </Text>
        <RNTextInput
          {...restProps}
          style={[
            styles.input,
            {
              color: theme.colors.text,
              borderColor: error ? theme.colors.error : theme.colors.border,
              backgroundColor: theme.colors.surface,
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
        />
        {error && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
        )}
      </View>
    );
  },
  // Custom equality check: only re-render if these props change
  (prevProps, nextProps) => {
    return (
      prevProps.value === nextProps.value &&
      prevProps.error === nextProps.error &&
      prevProps.label === nextProps.label &&
      prevProps.placeholder === nextProps.placeholder &&
      prevProps.theme === nextProps.theme
    );
  }
);

ModularTextInput.displayName = 'ModularTextInput';

function createStyles(theme: any) {
  return StyleSheet.create({
    inputGroup: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
    },
    errorText: {
      fontSize: 12,
      marginTop: 6,
      fontWeight: '500',
    },
  });
}
