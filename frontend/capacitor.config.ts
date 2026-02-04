import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fluffnwoof.portal',
  appName: 'Fluff N Woof',
  webDir: 'dist',

  // Server configuration for API requests
  server: {
    // For development, you can use live reload
    // url: 'http://192.168.x.x:5173', // Your local IP for dev
    androidScheme: 'https',
    iosScheme: 'https',
    // Allow mixed content for development
    allowNavigation: ['*'],
  },

  // Plugin configurations
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#A8E6CF', // Mint green - brand color
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#A8E6CF', // Mint green
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    App: {
      // App-specific configurations
    },
  },

  // Android specific configurations
  android: {
    allowMixedContent: true, // For development
    captureInput: true,
    webContentsDebuggingEnabled: true, // Disable in production
  },

  // iOS specific configurations
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scrollEnabled: true,
  },
};

export default config;
