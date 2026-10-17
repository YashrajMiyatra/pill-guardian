import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Mail, Lock, User, Fingerprint, ShieldCheck, Eye, EyeOff, Sparkles } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { BiometricService } from '../services/biometrics';
import { Colors } from '../theme/colors';

export const AuthScreen: React.FC = () => {
  const { signIn, signUp, signInWithGoogle, loginAsDemoUser, authenticateWithBiometrics } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [biometricInfo, setBiometricInfo] = useState<{ available: boolean; biometricType: string }>({
    available: false,
    biometricType: 'Biometrics',
  });

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    const info = await BiometricService.isBiometricAvailable();
    setBiometricInfo(info);
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required Fields', 'Please enter your email and password.');
      return;
    }
    if (isSignUp && !fullName.trim()) {
      Alert.alert('Required Fields', 'Please enter your full legal name.');
      return;
    }

    setIsSubmitting(true);
    if (isSignUp) {
      const res = await signUp(email.trim(), password, fullName.trim());
      if (!res.success) {
        Alert.alert('Sign Up Failed', res.error || 'Could not create account.');
      }
    } else {
      const res = await signIn(email.trim(), password);
      if (!res.success) {
        Alert.alert('Sign In Failed', res.error || 'Invalid email or password.');
      }
    }
    setIsSubmitting(false);
  };

  const handleBiometricPress = async () => {
    const success = await authenticateWithBiometrics();
    if (!success) {
      Alert.alert('Authentication Failed', 'Biometric recognition was not completed.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Brand Header */}
        <View style={styles.brandContainer}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.appName}>PillGuardian</Text>
          <Text style={styles.appTagline}>Chronic Care & Medication Companion</Text>
          <View style={styles.securityPill}>
            <ShieldCheck size={12} color="#0D9488" />
            <Text style={styles.securityText}>HIPAA-Compliant Device Vault</Text>
          </View>
        </View>

        {/* Auth Card */}
        <View style={styles.card}>
          {/* Hero Google Sign-In Button */}
          <TouchableOpacity
            style={styles.googleHeroBtn}
            onPress={async () => {
              setIsSubmitting(true);
              const res = await signInWithGoogle();
              setIsSubmitting(false);
              if (!res.success) {
                Alert.alert('Google Sign-In', res.error || 'Could not authenticate with Google.');
              }
            }}
            activeOpacity={0.85}
          >
            <View style={styles.googleIconBadge}>
              <Text style={styles.googleG}>G</Text>
            </View>
            <Text style={styles.googleHeroBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.orDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.orText}>OR WITH EMAIL & PASSWORD</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Tab Switcher */}
          <View style={styles.tabSwitcher}>
            <TouchableOpacity
              style={[styles.tabBtn, !isSignUp && styles.tabBtnActive]}
              onPress={() => setIsSignUp(false)}
            >
              <Text style={[styles.tabBtnText, !isSignUp && styles.tabBtnTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, isSignUp && styles.tabBtnActive]}
              onPress={() => setIsSignUp(true)}
            >
              <Text style={[styles.tabBtnText, isSignUp && styles.tabBtnTextActive]}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          {isSignUp && (
            <View style={styles.inputContainer}>
              <User size={18} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Full Name (e.g. Arthur Bennett)"
                placeholderTextColor="#94A3B8"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Mail size={18} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Email Address"
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={18} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Password"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {showPassword ? (
                <EyeOff size={18} color="#94A3B8" />
              ) : (
                <Eye size={18} color="#94A3B8" />
              )}
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {isSignUp ? 'Create Patient Account' : 'Sign In with Email'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Biometric Button (if available) */}
          {biometricInfo.available && !isSignUp && (
            <TouchableOpacity
              style={styles.biometricBtn}
              onPress={handleBiometricPress}
              activeOpacity={0.7}
            >
              <Fingerprint size={20} color="#0284C7" />
              <Text style={styles.biometricBtnText}>
                Unlock with {biometricInfo.biometricType}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 1-Tap Demo & Clinical Portal Quick Entry */}
        <View style={styles.demoSection}>
          <Text style={styles.quickAccessTitle}>Reviewer & Clinical Access</Text>
          <View style={styles.demoButtonGroup}>
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => loginAsDemoUser('patient')}
              activeOpacity={0.8}
            >
              <Sparkles size={15} color="#0284C7" />
              <Text style={styles.demoBtnText}>Patient Demo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoBtn, styles.doctorDemoBtn]}
              onPress={() => loginAsDemoUser('doctor')}
              activeOpacity={0.8}
            >
              <Text style={[styles.demoBtnText, { color: '#0D9488' }]}>🩺 Doctor Portal</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.demoFootnote}>
            Switch roles anytime between Patient Regimen & Physician RPM Dashboard.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
    alignItems: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: 12,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  securityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 10,
  },
  securityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D9488',
    marginLeft: 4,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  primaryBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  biometricBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F2FE',
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 12,
  },
  biometricBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
    marginLeft: 8,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  orText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginHorizontal: 10,
    letterSpacing: 0.8,
  },
  googleHeroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 4,
  },
  googleHeroBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  googleIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EA4335',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  googleG: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  demoSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  quickAccessTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  demoButtonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  doctorDemoBtn: {
    borderColor: '#99F6E4',
    backgroundColor: '#F0FDFA',
  },
  demoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
    marginLeft: 4,
  },
  demoFootnote: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 290,
  },
});
