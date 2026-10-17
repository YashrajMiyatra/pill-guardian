# 💊 PillGuardian & PillGuardian MD: Dual Healthcare Ecosystem

A production-grade healthcare monorepo built with **React Native**, **Expo (SDK 57)**, **TypeScript**, and **Supabase**, engineered for concurrent deployment of two distinct production apps and a dedicated clinical web workstation from a unified codebase.

---

## 📱 Dual Production Applications (Monorepo Architecture)

| App | Target Audience | Android Package | Bundle ID | Theme Color |
| :--- | :--- | :--- | :--- | :--- |
| **PillGuardian** | Patients & Caregivers | `com.pillguardian.app` | `com.pillguardian.app` | Sky Blue (`#0284C7`) |
| **PillGuardian MD** | Physicians & Care Teams | `com.pillguardian.doctor` | `com.pillguardian.doctor` | Clinical Teal (`#0D9488`) |

---

## 🏷️ GitHub Release Tags

This repository tracks production builds with semantic release tags:

- **`v1.0.0`**: Unified base release covering both apps, shared health models, and Supabase cloud synchronization.
- **`v1.0.0-patient`**: Production Patient Mobile Companion (`com.pillguardian.app`).
- **`v1.0.0-doctor`**: Production Physician Clinical Workstation & Mobile App (`com.pillguardian.doctor`).

---

## 🌟 Key Platform Features

### 👤 1. Patient Companion App (`PillGuardian`)
- **Daily Regimen & Adherence Engine (`TodayScreen`)**: Time-slot dose scheduling (Morning, Afternoon, Evening, Night) with one-tap dose logging, skip reasons, streak gamification, and refill warning banners.
- **Digital Medicine Cabinet (`CabinetScreen`)**: Visual pill forms/colors, remaining stock tracking, and one-tap pharmacy refill increments.
- **Chronic Biomarkers & Vitals Tracker (`VitalsScreen`)**: Blood pressure (AHA classification), blood glucose (mg/dL), heart rate, and weight logging.
- **Emergency Medical ID & Caregiver SOS (`CaregiverScreen`)**: Blood group, critical allergies, emergency directives, one-tap caregiver phone/SMS alerts, and clinical consultation PDF export.

### 🩺 2. Physician Workstation & App (`PillGuardian MD`)
- **Active Patient Cohort Triage**: Real-time risk stratification (`HIGH`, `MEDIUM`, `STABLE`), adherence rates, and critical biomarker alerts.
- **Digital Rx Pad & Dynamic Prescription Management**:
  - Add new prescriptions with drug interaction warnings.
  - Modify dosages, instructions, or refill thresholds.
  - Discontinue or taper medications with audit logging.
  - Digital prescription stamp with physician license and NPI signature.
- **Medicare RPM Billing Tracker (Remote Patient Monitoring)**:
  - CPT 99453: Initial device setup ($19.20).
  - CPT 99454: 16+ days transmission of physiologic readings ($54.20).
  - CPT 99457: 20+ min monthly clinical care management ($46.00).
- **Directives & Care Plan Dispatch**: Push clinical orders (dietary adjustments, titration orders) directly to the patient's device.

---

## 📦 Building Standalone APKs (Cloud EAS Build)

You can compile standalone Android APKs for both applications using EAS Build:

### Patient App APK
```bash
npx eas-cli build --platform android --profile preview-patient
```
*Generates `PillGuardian.apk` with package name `com.pillguardian.app`.*

### Doctor App APK
```bash
npx eas-cli build --platform android --profile preview-doctor
```
*Generates `PillGuardian-MD.apk` with package name `com.pillguardian.doctor`.*

---

## 💻 Doctor Web Workstation (Live Two-Device Testing)

The clinical portal is available as a zero-dependency web workstation:

1. **Start the local portal server**:
   ```bash
   node doctor-portal/server.js
   ```

2. **Access across your local network**:
   - **Local Machine**: `http://localhost:8080`
   - **Second Phone / Tablet / Doctor Laptop**: `http://<YOUR_LAN_IP>:8080` (e.g. `http://192.168.0.76:8080`)

Any adjustments made by the physician to prescriptions, vitals alerts, or care orders sync in real time with the patient app via Supabase.

---

## 🚀 Local Development (Expo)

```bash
# Run Patient App variant (default)
npx expo start

# Run Doctor App variant
APP_VARIANT=doctor npx expo start
```
