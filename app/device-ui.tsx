import React, { createContext, useContext, useMemo } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logger } from './utils/logger';

export type DeviceUi = {
  isGestureNavigation: boolean;
  hasSoftKeys: boolean;
  bottomInset: number;
};

const DeviceUiContext = createContext<DeviceUi | undefined>(undefined);

export function DeviceUiProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const value = useMemo<DeviceUi>(() => {
    const bottom = insets.bottom || 0;
    // Heuristic:
    // - On Android gesture nav, bottom inset is usually small (~8-16)
    // - On 3-button nav, bottom inset is larger (>= 24-48 depending on density)
    // - On iOS, bottom inset reflects the home indicator; treat as gesture-like but has no soft keys
    const isAndroid = Platform.OS === 'android';
    const isGesture = isAndroid ? bottom > 0 && bottom <= 20 : true; // iOS behaves like gesture navigation
    const softKeys = isAndroid ? bottom >= 21 : false;

    return {
      isGestureNavigation: isGesture,
      hasSoftKeys: softKeys,
      bottomInset: bottom,
    };
  }, [insets.bottom]);

  // One-time log to help diagnostics
  React.useEffect(() => {
    logger.debug('DeviceUI', 'Device configuration', {
      bottomInset: insets.bottom,
      isGestureNavigation: value.isGestureNavigation,
      hasSoftKeys: value.hasSoftKeys,
      platform: Platform.OS,
    });
  }, [insets.bottom, value.isGestureNavigation, value.hasSoftKeys]);

  return <DeviceUiContext.Provider value={value}>{children}</DeviceUiContext.Provider>;
}

export function useDeviceUi(): DeviceUi {
  const ctx = useContext(DeviceUiContext);
  if (!ctx) throw new Error('useDeviceUi must be used within DeviceUiProvider');
  return ctx;
}
