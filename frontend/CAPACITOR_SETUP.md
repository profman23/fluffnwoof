# Capacitor Mobile App Setup - Fluff N' Woof

## Overview
This document describes the Capacitor setup for the Fluff N' Woof customer portal mobile app.

## Platform Support
- **Android**: Minimum SDK 22 (Android 5.1+)
- **iOS**: iOS 13+
- **Web**: Progressive Web App (PWA)

## Project Structure

```
frontend/
├── android/           # Android native project
├── ios/               # iOS native project
├── capacitor.config.ts
├── src/
│   └── utils/
│       └── capacitor.ts  # Capacitor initialization
└── package.json
```

## NPM Scripts

```bash
# Development
npm run dev              # Start Vite dev server

# Build
npm run build:skip-tsc   # Build without TypeScript check (fast)
npm run build            # Build with TypeScript check (strict)

# Mobile Builds
npm run build:mobile     # Build and sync both platforms
npm run build:android    # Build and sync Android
npm run build:ios        # Build and sync iOS

# Capacitor Commands
npm run cap:sync         # Sync web assets to native projects
npm run cap:android      # Open Android project in Android Studio
npm run cap:ios          # Open iOS project in Xcode
```

## Setup Instructions

### 1. Android Development

#### Prerequisites
- Android Studio (latest)
- Android SDK 33+
- Java 17+

#### First Time Setup
```bash
# Build the web app
npm run build:skip-tsc

# Open in Android Studio
npm run cap:android
```

#### App Icon Setup
Replace the following files with your app icon:
```
android/app/src/main/res/
├── mipmap-hdpi/ic_launcher.png      (72x72)
├── mipmap-mdpi/ic_launcher.png      (48x48)
├── mipmap-xhdpi/ic_launcher.png     (96x96)
├── mipmap-xxhdpi/ic_launcher.png    (144x144)
├── mipmap-xxxhdpi/ic_launcher.png   (192x192)
└── mipmap-anydpi-v26/
    ├── ic_launcher.xml              (Adaptive icon config)
    └── ic_launcher_round.xml
```

#### Splash Screen Setup
Create splash screen resources:
```
android/app/src/main/res/
├── drawable/splash.png              (Default splash)
├── drawable-land-hdpi/splash.png    (Landscape)
├── drawable-port-hdpi/splash.png    (Portrait)
└── values/colors.xml                (Background color)
```

### 2. iOS Development

#### Prerequisites
- macOS
- Xcode 15+
- CocoaPods

#### First Time Setup
```bash
# Build the web app
npm run build:skip-tsc

# Open in Xcode
npm run cap:ios

# Install pods (first time only)
cd ios/App && pod install
```

#### App Icon Setup
Replace icons in Xcode:
```
ios/App/App/Assets.xcassets/AppIcon.appiconset/
├── Icon-1024.png         (1024x1024)
├── Icon-40@2x.png        (80x80)
├── Icon-40@3x.png        (120x120)
├── Icon-60@2x.png        (120x120)
├── Icon-60@3x.png        (180x180)
├── Icon-76.png           (76x76)
├── Icon-76@2x.png        (152x152)
├── Icon-83.5@2x.png      (167x167)
└── Contents.json
```

#### Splash Screen Setup
Configure in Xcode under "App" > "General" > "App Icons and Launch Screen"

## Configuration

### capacitor.config.ts

Key configurations:
- `appId`: com.fluffnwoof.portal
- `appName`: Fluff N' Woof
- `webDir`: dist

### Environment Variables

The app uses the same environment variables as the web version:
- `VITE_API_URL`: Backend API URL

For production builds, ensure the API URL points to your production server.

## Push Notifications

### Android
Firebase Cloud Messaging (FCM) is preconfigured. Add your `google-services.json`:
```
android/app/google-services.json
```

### iOS
Apple Push Notification Service (APNs) requires:
1. Apple Developer account
2. Push notification capability enabled
3. APNs key or certificate

## Deep Links

The app supports deep links with the scheme: `fluffnwoof://`

Examples:
- `fluffnwoof://portal/appointments/123` - Open specific appointment
- `fluffnwoof://portal/pets/456` - Open pet details
- `fluffnwoof://portal/forms/789` - Open form for signing

### Android Deep Link Setup
Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="fluffnwoof" />
</intent-filter>
```

### iOS Deep Link Setup
Add URL scheme in Xcode: App > Info > URL Types

## Building for Release

### Android

1. Generate signing key:
```bash
keytool -genkey -v -keystore fluffnwoof-release.keystore -alias fluffnwoof -keyalg RSA -keysize 2048 -validity 10000
```

2. Configure signing in `android/app/build.gradle`

3. Build APK:
```bash
cd android && ./gradlew assembleRelease
```

4. Build App Bundle (for Play Store):
```bash
cd android && ./gradlew bundleRelease
```

### iOS

1. Configure signing in Xcode
2. Archive: Product > Archive
3. Distribute via App Store Connect

## Troubleshooting

### Common Issues

**White screen on app launch**
- Run `npx cap sync` after building
- Check that dist/ folder exists and contains index.html

**API requests failing**
- Check CORS settings on backend
- For development, ensure `allowMixedContent: true` in capacitor.config.ts

**Push notifications not working**
- Verify FCM/APNs configuration
- Check device logs for permission errors

## App Store Submission Checklist

### Google Play Store
- [ ] App icon (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (phone & tablet)
- [ ] Privacy policy URL
- [ ] App description (Arabic & English)
- [ ] Release APK/Bundle signed

### Apple App Store
- [ ] App icon (1024x1024)
- [ ] Screenshots (various device sizes)
- [ ] Privacy policy URL
- [ ] App description (Arabic & English)
- [ ] Archive signed with distribution certificate

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Studio](https://developer.android.com/studio)
- [Xcode](https://developer.apple.com/xcode/)
- [App Store Connect](https://appstoreconnect.apple.com/)
- [Google Play Console](https://play.google.com/console/)
