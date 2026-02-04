/**
 * Capacitor Utilities
 * Handles native plugin initialization and platform detection
 */

import { Capacitor } from '@capacitor/core';

// Safe platform detection with fallbacks
let _isNative = false;
let _isAndroid = false;
let _isIOS = false;
let _isWeb = true;

try {
  _isNative = Capacitor.isNativePlatform();
  _isAndroid = Capacitor.getPlatform() === 'android';
  _isIOS = Capacitor.getPlatform() === 'ios';
  _isWeb = Capacitor.getPlatform() === 'web';
} catch (e) {
  console.log('[Capacitor] Platform detection failed, defaulting to web');
}

export const isNative = _isNative;
export const isAndroid = _isAndroid;
export const isIOS = _isIOS;
export const isWeb = _isWeb;

/**
 * Initialize Capacitor plugins for native platforms
 * Uses dynamic imports to avoid loading native-only plugins on web
 */
export const initializeCapacitor = async () => {
  if (!isNative) {
    console.log('[Capacitor] Running on web, skipping native initialization');
    return;
  }

  // Delay initialization to ensure app is fully loaded
  setTimeout(async () => {
    try {
      // Hide splash screen
      try {
        const { SplashScreen } = await import('@capacitor/splash-screen');
        await SplashScreen.hide();
      } catch (e) {
        console.log('[Capacitor] SplashScreen not available');
      }

      // Configure status bar
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        if (isAndroid) {
          await StatusBar.setBackgroundColor({ color: '#A8E6CF' });
        }
        await StatusBar.setStyle({ style: Style.Light });
      } catch (e) {
        console.log('[Capacitor] StatusBar not available');
      }

      // Set up app listeners
      try {
        const { App: CapacitorApp } = await import('@capacitor/app');
        setupAppListeners(CapacitorApp);
      } catch (e) {
        console.log('[Capacitor] App plugin not available');
      }

      console.log('[Capacitor] Initialized successfully');
    } catch (error) {
      console.error('[Capacitor] Initialization error:', error);
    }
  }, 500);
};

/**
 * Set up app lifecycle listeners
 */
const setupAppListeners = (CapacitorApp: any) => {
  // Handle app state changes (foreground/background)
  CapacitorApp.addListener('appStateChange', ({ isActive }: { isActive: boolean }) => {
    console.log('[Capacitor] App state:', isActive ? 'active' : 'background');

    // You can refresh data when app comes to foreground
    if (isActive) {
      // Dispatch event for components to listen to
      window.dispatchEvent(new CustomEvent('app:foreground'));
    }
  });

  // Handle back button on Android
  CapacitorApp.addListener('backButton', ({ canGoBack }: { canGoBack: boolean }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      // Exit app if can't go back
      CapacitorApp.exitApp();
    }
  });

  // Handle deep links (e.g., fluffnwoof://portal/appointments/123)
  CapacitorApp.addListener('appUrlOpen', ({ url }: { url: string }) => {
    console.log('[Capacitor] Deep link:', url);

    // Parse the URL and navigate accordingly
    const path = url.replace('fluffnwoof://', '/');
    if (path) {
      window.location.href = path;
    }
  });
};

/**
 * Initialize push notifications
 */
export const initializePushNotifications = async () => {
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    // Request permission
    const permission = await PushNotifications.requestPermissions();

    if (permission.receive === 'granted') {
      // Register for push notifications
      await PushNotifications.register();

      // Listen for registration success
      PushNotifications.addListener('registration', (token) => {
        console.log('[Push] Token:', token.value);
        // Send token to your backend
        savePushToken(token.value);
      });

      // Listen for push notification received while app is open
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('[Push] Notification received:', notification);
        // Handle in-app notification display
        window.dispatchEvent(new CustomEvent('push:received', { detail: notification }));
      });

      // Listen for push notification action (user tapped on notification)
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('[Push] Action performed:', action);
        // Navigate based on notification data
        handlePushNotificationAction(action);
      });
    }
  } catch (error) {
    console.log('[Push] Not available or permission denied:', error);
  }
};

/**
 * Save push token to backend
 */
const savePushToken = async (token: string) => {
  try {
    const customerToken = localStorage.getItem('customerToken');
    if (!customerToken) return;

    // Call your API to save the push token
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    await fetch(`${apiUrl}/portal/push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ token, platform: Capacitor.getPlatform() }),
    });
  } catch (error) {
    console.error('[Push] Failed to save token:', error);
  }
};

/**
 * Handle push notification action
 */
const handlePushNotificationAction = (action: any) => {
  const data = action.notification?.data;

  if (data?.type === 'appointment') {
    window.location.href = `/portal/appointments/${data.appointmentId}`;
  } else if (data?.type === 'form') {
    window.location.href = `/portal/forms/${data.formId}`;
  } else if (data?.type === 'reminder') {
    window.location.href = '/portal/appointments';
  }
};

/**
 * Show splash screen (useful for loading states)
 */
export const showSplashScreen = async () => {
  if (!isNative) return;
  const { SplashScreen } = await import('@capacitor/splash-screen');
  await SplashScreen.show({
    autoHide: false,
  });
};

/**
 * Hide splash screen
 */
export const hideSplashScreen = async () => {
  if (!isNative) return;
  const { SplashScreen } = await import('@capacitor/splash-screen');
  await SplashScreen.hide();
};

/**
 * Set status bar color dynamically
 */
export const setStatusBarColor = async (color: string, isDark: boolean) => {
  if (!isNative) return;

  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    if (isAndroid) {
      await StatusBar.setBackgroundColor({ color });
    }
    await StatusBar.setStyle({ style: isDark ? Style.Light : Style.Dark });
  } catch (error) {
    console.error('[StatusBar] Failed to set color:', error);
  }
};

export default {
  isNative,
  isAndroid,
  isIOS,
  isWeb,
  initializeCapacitor,
  initializePushNotifications,
  showSplashScreen,
  hideSplashScreen,
  setStatusBarColor,
};
