import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_KEY = '@pill_guardian_biometric_enabled';

export const BiometricService = {
  // Check if device supports biometrics and has enrolled fingerprints or FaceID
  async isBiometricAvailable(): Promise<{ available: boolean; biometricType: string }> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        return { available: false, biometricType: 'None' };
      }

      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      let biometricType = 'Biometrics';
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometricType = 'Face ID';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometricType = 'Fingerprint / Touch ID';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        biometricType = 'Iris Recognition';
      }

      return { available: true, biometricType };
    } catch (e) {
      console.warn('Biometric availability check failed:', e);
      return { available: false, biometricType: 'None' };
    }
  },

  // Prompt the user for biometric authentication
  async authenticate(promptMessage: string = 'Unlock PillGuardian with Biometrics'): Promise<boolean> {
    try {
      const { available } = await this.isBiometricAvailable();
      if (!available) return false;

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Use Password',
        fallbackLabel: 'Enter Passcode',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (e) {
      console.warn('Biometric authentication failed:', e);
      return false;
    }
  },

  // Get user preference for biometric lock
  async isBiometricLockEnabled(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem(BIOMETRIC_KEY);
      return val === 'true';
    } catch {
      return false;
    }
  },

  async setBiometricLockEnabled(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(BIOMETRIC_KEY, enabled ? 'true' : 'false');
    } catch (e) {
      console.warn('Could not save biometric preference:', e);
    }
  },
};
