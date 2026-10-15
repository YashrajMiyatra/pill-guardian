# 💊 PillGuardian: Medication & Chronic Care Companion

A cross-platform mobile application built with **React Native**, **Expo (SDK 57)**, and **TypeScript**, engineered for direct deployment to the **Apple App Store** and **Google Play Store**.

Designed to solve a major real-world healthcare challenge: **medication non-adherence and chronic illness management** (Hypertension, Diabetes, Asthma, Heart conditions).

---

## 🌟 Key Real-World Features

### 1. 📅 Daily Regimen & Adherence Engine (`TodayScreen`)
- **Time Slot Categorization**: Categorizes scheduled doses by Morning (08:00), Afternoon (13:00), Evening (19:00), and Night (22:00).
- **Interactive Dose Actions**: One-tap "Take Dose" with haptic feedback, "Skip" with optional clinical reasoning, and "Undo" support.
- **Dynamic Adherence Ring & Streak**: Real-time adherence score calculation (percentage of doses taken on time) with streak gamification to keep patients motivated.
- **Inventory Refill Alert Banner**: Automatic detection when pill count drops below threshold, warning patients before they run out of vital medications.

### 2. 🗄️ Prescription Medicine Cabinet (`CabinetScreen`)
- **Prescription Catalog**: Visual pill identifier (custom form and color coding: tablets, capsules, drops, inhalers, liquids).
- **Search & Filtering**: Search by medication name, condition, or instructions.
- **Stock Tracking & Quick Refill**: Displays exact remaining pills with an automated one-tap "+30 Refill" increment button when new prescriptions are picked up from the pharmacy.
- **Add / Edit Medication**: Modal supporting custom schedules, dosages, prescriber details, and refill alert thresholds.

### 3. 🩺 Chronic Biomarkers & Vitals Tracker (`VitalsScreen`)
- **Blood Pressure Logging**: Systolic and Diastolic logging with automatic AHA clinical severity categorization (Optimal, Elevated, Stage 2 Alert).
- **Blood Glucose Logging**: Fasting and Post-meal context tracking in mg/dL.
- **Pulse Rate & Body Weight**: Resting heart rate and weight tracking over time.
- **Historical Timeline**: Visual log with context tags and notes.

### 4. 🛡️ Care Team, Emergency SOS & Clinical PDF Export (`CaregiverScreen`)
- **Emergency Medical ID**: Blood type (e.g. O+), critical drug allergies (e.g. Penicillin, Sulfa drugs), diagnosed chronic conditions, and emergency directives.
- **One-Touch Caregiver SOS**: Direct phone calling and pre-composed SMS status check-in to primary caregivers.
- **Doctor Contact**: Quick call to attending cardiologist/physician.
- **Doctor Consultation Dossier (PDF Export)**: Generates a clinical-grade PDF report (powered by `expo-print` & `expo-sharing`) detailing active medications, 7-day adherence rates, vitals trends, and physician signature lines for medical appointments.

---

## 🚀 Quick Start (Live Preview on your Phone)

1. Navigate to the project directory:
   ```bash
   cd pill-guardian
   ```

2. Start the Expo development server:
   ```bash
   npx expo start
   ```

3. Open on your device:
   - **Android**: Open **Expo Go** and scan the QR code.
   - **iOS**: Open the native **Camera** app, scan the QR code, and tap "Open in Expo Go".

---

## 📦 App Store & Play Store Deployment

See [DEPLOYMENT_GUIDE.md](file:///c:/Users/yashr/Desktop/PROJECTS%202/pill-guardian/DEPLOYMENT_GUIDE.md) for full step-by-step instructions:
- **Play Store (.aab / .apk)**: `eas build --platform android --profile production`
- **App Store (.ipa)**: `eas build --platform ios --profile production` (builds in the cloud, no Mac required!)
