/**
 * Shared Styles Utility
 * 
 * Contains reusable theme-aware style definitions used across multiple screens.
 * This eliminates code duplication and ensures consistent styling throughout the app.
 * 
 * Usage:
 * import { createSharedStyles } from '../styles/sharedStyles';
 * 
 * const styles = React.useMemo(() => ({
 *   ...createSharedStyles(theme),
 *   // Screen-specific styles here
 * }), [theme]);
 */

import { StyleSheet } from 'react-native';
import { AppTheme } from '../theme/types';

/**
 * Creates theme-aware shared styles
 * @param theme - The app theme object from useThemeColors hook
 * @returns Object containing reusable style definitions
 */
export const createSharedStyles = (theme: AppTheme) => ({
  // ============ MESSAGE BOXES ============

  /**
   * Error Box - Used for displaying error messages
   * - Light mode: Red background with 15% opacity
   * - Dark mode: Red background with 10% opacity
   */
  errorBox: StyleSheet.create({
    errorBox: {
      margin: 16,
      padding: 12,
      borderRadius: 8,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(255, 77, 79, 0.1)'
          : 'rgba(220, 38, 38, 0.15)',
    },
  }).errorBox,

  /**
   * Error Text - Text styling for error messages
   */
  errorText: StyleSheet.create({
    errorText: {
      color: theme.colors.error,
    },
  }).errorText,

  /**
   * Info Box - Used for displaying informational messages
   */
  infoBox: StyleSheet.create({
    infoBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      marginTop: 24,
      padding: 16,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(59, 130, 246, 0.1)'
          : 'rgba(59, 130, 246, 0.08)',
      borderRadius: 8,
    },
  }).infoBox,

  /**
   * Info Text - Text styling for info messages
   */
  infoText: StyleSheet.create({
    infoText: {
      color: theme.colors.text,
      fontSize: 13,
      lineHeight: 18,
    },
  }).infoText,

  /**
   * Success Box - Used for displaying success messages
   */
  successBox: StyleSheet.create({
    successBox: {
      margin: 16,
      padding: 12,
      borderRadius: 8,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(40, 199, 111, 0.1)'
          : 'rgba(22, 163, 74, 0.15)',
    },
  }).successBox,

  /**
   * Success Text - Text styling for success messages
   */
  successText: StyleSheet.create({
    successText: {
      color: theme.colors.success,
    },
  }).successText,

  /**
   * Warning Box - Used for displaying warning messages
   */
  warningBox: StyleSheet.create({
    warningBox: {
      margin: 16,
      padding: 12,
      borderRadius: 8,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(255, 169, 64, 0.1)'
          : 'rgba(245, 158, 11, 0.15)',
    },
  }).warningBox,

  /**
   * Warning Text - Text styling for warning messages
   */
  warningText: StyleSheet.create({
    warningText: {
      color: theme.colors.warning,
    },
  }).warningText,

  // ============ STATUS BADGES ============

  /**
   * Status Badge - Neutral/inactive state styling
   */
  statusBadge: StyleSheet.create({
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.1)'
          : 'rgba(0, 0, 0, 0.05)',
    },
  }).statusBadge,

  /**
   * Active Badge - Active/enabled status styling
   */
  activeBadge: StyleSheet.create({
    activeBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: `${theme.colors.primary}20`,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
  }).activeBadge,

  /**
   * Inactive Badge - Inactive/disabled status styling
   */
  inactiveBadge: StyleSheet.create({
    inactiveBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor:
        theme.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.05)'
          : 'rgba(0, 0, 0, 0.03)',
      borderWidth: 1,
      borderColor:
        theme.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.1)'
          : 'rgba(0, 0, 0, 0.05)',
    },
  }).inactiveBadge,

  /**
   * Success Badge - Success status styling
   */
  successBadge: StyleSheet.create({
    successBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: `${theme.colors.success}20`,
      borderWidth: 1,
      borderColor: theme.colors.success,
    },
  }).successBadge,

  /**
   * Error Badge - Error status styling
   */
  errorBadge: StyleSheet.create({
    errorBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: `${theme.colors.error}20`,
      borderWidth: 1,
      borderColor: theme.colors.error,
    },
  }).errorBadge,

  // ============ CONTAINERS & CARDS ============

  /**
   * Card - Basic card container styling
   * - Used in: ClassesScreen, MyBookingsScreen, etc.
   */
  card: StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.mode === 'dark' ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
  }).card,

  /**
   * Card Alt - Alternative card styling (lighter)
   */
  cardAlt: StyleSheet.create({
    cardAlt: {
      backgroundColor: theme.colors.surfaceAlt,
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
  }).cardAlt,

  /**
   * Primary Card - Card with primary accent
   */
  primaryCard: StyleSheet.create({
    primaryCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.mode === 'dark' ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
  }).primaryCard,

  // ============ CONTAINERS ============

  /**
   * Safe Area Container - Full screen container
   */
  safeAreaContainer: StyleSheet.create({
    safeAreaContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
  }).safeAreaContainer,

  /**
   * Screen Container - Standard screen padding
   */
  screenContainer: StyleSheet.create({
    screenContainer: {
      flex: 1,
      padding: 16,
      backgroundColor: theme.colors.background,
    },
  }).screenContainer,

  /**
   * Centered Container - Centered content container
   */
  centeredContainer: StyleSheet.create({
    centeredContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
  }).centeredContainer,

  // ============ TEXT STYLES ============

  /**
   * Title - Large text for screen titles
   */
  title: StyleSheet.create({
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 16,
    },
  }).title,

  /**
   * Subtitle - Medium text for secondary titles
   */
  subtitle: StyleSheet.create({
    subtitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
  }).subtitle,

  /**
   * Body - Standard body text
   */
  body: StyleSheet.create({
    body: {
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 20,
    },
  }).body,

  /**
   * Body Secondary - Secondary body text (muted)
   */
  bodySecondary: StyleSheet.create({
    bodySecondary: {
      fontSize: 14,
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
  }).bodySecondary,

  /**
   * Caption - Small text for captions
   */
  caption: StyleSheet.create({
    caption: {
      fontSize: 12,
      color: theme.colors.textMuted,
      lineHeight: 16,
    },
  }).caption,

  // ============ BUTTONS & ACTIONS ============

  /**
   * Primary Button - Primary action button
   */
  primaryButton: StyleSheet.create({
    primaryButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
  }).primaryButton,

  /**
   * Primary Button Text - Text for primary buttons
   */
  primaryButtonText: StyleSheet.create({
    primaryButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 14,
    },
  }).primaryButtonText,

  /**
   * Secondary Button - Secondary action button
   */
  secondaryButton: StyleSheet.create({
    secondaryButton: {
      backgroundColor: 'transparent',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
  }).secondaryButton,

  /**
   * Secondary Button Text - Text for secondary buttons
   */
  secondaryButtonText: StyleSheet.create({
    secondaryButtonText: {
      color: theme.colors.primary,
      fontWeight: '600',
      fontSize: 14,
    },
  }).secondaryButtonText,

  /**
   * Danger Button - Destructive action button
   */
  dangerButton: StyleSheet.create({
    dangerButton: {
      backgroundColor: theme.colors.error,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
  }).dangerButton,

  /**
   * Danger Button Text - Text for danger buttons
   */
  dangerButtonText: StyleSheet.create({
    dangerButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 14,
    },
  }).dangerButtonText,

  // ============ INPUT STYLES ============

  /**
   * Input Field - Standard input field styling
   */
  input: StyleSheet.create({
    input: {
      backgroundColor: theme.colors.inputBg,
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: theme.colors.text,
    },
  }).input,

  /**
   * Input Error - Input with error state
   */
  inputError: StyleSheet.create({
    inputError: {
      backgroundColor: theme.colors.inputBg,
      borderWidth: 2,
      borderColor: theme.colors.error,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: theme.colors.text,
    },
  }).inputError,

  // ============ LIST & SEPARATORS ============

  /**
   * List Item - Standard list item styling
   */
  listItem: StyleSheet.create({
    listItem: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
  }).listItem,

  /**
   * Separator - List separator styling
   */
  separator: StyleSheet.create({
    separator: {
      height: 1,
      backgroundColor: theme.colors.divider,
      marginVertical: 8,
    },
  }).separator,

  // ============ UTILITIES ============

  /**
   * Spacer - Vertical spacing utility
   */
  spacerSmall: StyleSheet.create({
    spacerSmall: {
      height: 8,
    },
  }).spacerSmall,

  spacerMedium: StyleSheet.create({
    spacerMedium: {
      height: 16,
    },
  }).spacerMedium,

  spacerLarge: StyleSheet.create({
    spacerLarge: {
      height: 24,
    },
  }).spacerLarge,

  /**
   * Row - Flex row with centered items
   */
  row: StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
  }).row,

  /**
   * Row Start - Flex row aligned to start
   */
  rowStart: StyleSheet.create({
    rowStart: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  }).rowStart,
});
