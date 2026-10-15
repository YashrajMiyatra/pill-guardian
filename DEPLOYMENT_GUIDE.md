# 🚀 PillGuardian: App Store & Google Play Store Deployment Guide

**PillGuardian** is built with React Native and Expo SDK 57, making it ready for cross-platform deployment to both the **Apple App Store** and **Google Play Store** via EAS (Expo Application Services).

---

## 📱 1. Live Testing on Physical iOS & Android Devices

You can test and run the app immediately on your phone without connecting any cables:

1. **Install Expo Go**:
   - iOS: Download **Expo Go** from the Apple App Store.
   - Android: Download **Expo Go** from Google Play Store.
2. **Start the development server**:
   ```bash
   cd pill-guardian
   npx expo start
   ```
3. **Scan the QR Code**:
   - On Android: Scan the terminal QR code using the Expo Go app.
   - On iOS: Scan the QR code using the native Camera app, then tap "Open in Expo Go".

---

## 🛠️ 2. Prerequisites for App Store & Play Store Builds

Install the Expo Application Services (EAS) CLI globally:
```bash
npm install -g eas-cli
```

Log in to your Expo account (free account at [expo.dev](https://expo.dev)):
```bash
eas login
```

Configure the project for EAS builds (already pre-configured in `eas.json`):
```bash
eas project:init
```

---

## 🤖 3. Google Play Store Deployment (Android)

### Step 3.1: Build Android App Bundle (`.aab`)
Google Play Store requires an Android App Bundle (`.aab`) for all new app releases. Run:
```bash
eas build --platform android --profile production
```
*Note: If you want a testable `.apk` file to install directly onto Android devices before store release, run:*
```bash
eas build --platform android --profile preview
```

### Step 3.2: Google Play Console Setup
1. Open the [Google Play Console](https://play.google.com/console).
2. Click **Create app**:
   - **App name**: `PillGuardian - Medication & Vitals Tracker`
   - **Default language**: English (United States)
   - **App or game**: App
   - **Free or paid**: Free (or Paid if monetizing)
3. **Data Safety & Declarations**:
   - **Health & Fitness**: Declare that user health data (medication schedules, vitals) is stored **locally on the user's device** and not sold or shared with 3rd parties without user explicit export.
   - **Permissions**: Declare `POST_NOTIFICATIONS` and `SCHEDULE_EXACT_ALARM` for critical medication reminder alarms.
4. **Store Listing**:
   - High-res icon (512x512 PNG)
   - Feature graphic (1024x500 PNG)
   - Phone & Tablet Screenshots (captured from the app)
5. **Release**:
   - Upload the `.aab` file downloaded from your EAS build dashboard.
   - Roll out to Internal Testing, Closed Testing, or Production!

---

## 🍎 4. Apple App Store Deployment (iOS)

> **Pro Tip**: With EAS Cloud Build, **you do NOT need a Mac** to build or submit the iOS `.ipa`! The build compiles on Expo's macOS cloud servers.

### Step 4.1: Build iOS Production Archive (`.ipa`)
Run:
```bash
eas build --platform ios --profile production
```
EAS will automatically guide you through signing certificates and provisioning profiles using your Apple Developer account credentials.

### Step 4.2: App Store Connect Setup
1. Open [App Store Connect](https://appstoreconnect.apple.com/).
2. Create a **New App**:
   - **Name**: `PillGuardian - Meds & Vitals`
   - **Primary Language**: English
   - **Bundle ID**: `com.pillguardian.app`
   - **SKU**: `pill-guardian-001`
3. **App Privacy & Medical Disclaimers**:
   - Under **Medical Apps Guideline 1.4.1**, include standard disclaimer: *"PillGuardian is designed to assist patients in tracking schedules and is not a substitute for professional medical diagnosis or treatment."*
   - Data Collection: Indicate that health metrics are stored locally on device.
4. **Submit via EAS**:
   You can submit directly from your terminal:
   ```bash
   eas submit --platform ios
   ```
5. **TestFlight**:
   Before releasing publicly, invite internal testers via TestFlight with one click.

---

## 🔒 5. Health Data Privacy & Local Storage
- **Zero Cloud Leakage**: All patient information (names, prescriptions, pill inventories, vitals logs, and doctor details) is stored locally on the client device using encrypted AsyncStorage.
- **Doctor PDF Dossier**: Reports are generated client-side via `expo-print` using standard HTML5 rendering and shared securely via the operating system's native share sheet (`expo-sharing`).
