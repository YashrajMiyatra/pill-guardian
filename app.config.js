module.exports = ({ config }) => {
  const isDoctor = process.env.APP_VARIANT === 'doctor';

  return {
    ...config,
    name: isDoctor ? 'PillGuardian MD' : 'PillGuardian',
    slug: isDoctor ? 'pill-guardian-md' : 'pill-guardian',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      resizeMode: 'contain',
      backgroundColor: isDoctor ? '#0D9488' : '#0284C7',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: isDoctor ? 'com.pillguardian.doctor' : 'com.pillguardian.app',
      infoPlist: {
        UIBackgroundModes: ['remote-notification'],
        NSCameraUsageDescription: 'PillGuardian requires camera access to scan prescription barcodes.',
      },
    },
    android: {
      package: isDoctor ? 'com.pillguardian.doctor' : 'com.pillguardian.app',
      versionCode: 1,
      permissions: [
        'RECEIVE_BOOT_COMPLETED',
        'VIBRATE',
        'SCHEDULE_EXACT_ALARM',
        'POST_NOTIFICATIONS',
      ],
      adaptiveIcon: {
        backgroundColor: isDoctor ? '#0D9488' : '#0284C7',
        foregroundImage: './assets/icon.png',
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-sharing',
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: isDoctor ? '#0D9488' : '#0284C7',
        },
      ],
    ],
    extra: {
      eas: {
        projectId: '114e8bce-a3ed-46e7-b994-4be2d2ed9cd5',
      },
      appVariant: isDoctor ? 'doctor' : 'patient',
    },
    owner: 'yashrajmiyatra',
  };
};
