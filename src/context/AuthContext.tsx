import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { BiometricService } from '../services/biometrics';
import { StorageService } from '../services/storage';
import { PatientApprovalStatus } from '../types';

const DEMO_AUTH_KEY = '@pill_guardian_demo_auth';
const USER_ROLE_KEY = '@pill_guardian_user_role';
const REAL_USER_KEY = '@pill_guardian_real_user';

export type UserRole = 'patient' | 'doctor';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isDemo: boolean;
  approvalStatus?: PatientApprovalStatus;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isDemoMode: boolean;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: string; pendingApproval?: boolean }>;
  signUp: (email: string, pass: string, name: string) => Promise<{ success: boolean; error?: string; pendingApproval?: boolean }>;
  signInWithGoogle: (role?: UserRole) => Promise<{ success: boolean; error?: string; pendingApproval?: boolean }>;
  signOut: () => Promise<void>;
  loginAsDemoUser: (role?: UserRole) => Promise<void>;
  authenticateWithBiometrics: () => Promise<boolean>;
  switchRole: (role: UserRole) => Promise<void>;
  refreshUserApproval: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    checkInitialSession();
  }, []);

  const checkInitialSession = async () => {
    try {
      const savedRole = ((await AsyncStorage.getItem(USER_ROLE_KEY)) as UserRole) || 'patient';

      // 1. Check if a real authenticated user exists (Google or Supabase)
      const savedRealUser = await AsyncStorage.getItem(REAL_USER_KEY);
      if (savedRealUser) {
        try {
          const parsedUser = JSON.parse(savedRealUser);
          if (parsedUser && parsedUser.id) {
            // Live check if doctor has approved or updated access status
            if (parsedUser.role === 'patient') {
              const approval = await StorageService.checkPatientApproval(parsedUser.email);
              parsedUser.approvalStatus = approval.status;
            } else {
              parsedUser.approvalStatus = 'approved';
            }
            setUser(parsedUser);
            setIsDemoMode(false);
            setIsLoading(false);
            return;
          }
        } catch {}
      }

      // 2. Check Supabase session if configured
      if (isSupabaseConfigured()) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const role = (session.user.user_metadata?.role as UserRole) || savedRole;
          let approvalStatus: PatientApprovalStatus = 'approved';
          if (role === 'patient') {
            const approval = await StorageService.checkPatientApproval(session.user.email || '');
            approvalStatus = approval.status;
          }
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email || '',
            fullName:
              session.user.user_metadata?.full_name ||
              (session.user.email ? session.user.email.split('@')[0] : 'Patient User'),
            role,
            isDemo: false,
            approvalStatus,
          };
          setUser(authUser);
          setIsDemoMode(false);
          await AsyncStorage.setItem(REAL_USER_KEY, JSON.stringify(authUser));
          setIsLoading(false);
          return;
        }
      }

      // 3. Check if demo session was explicitly kept
      const savedDemo = await AsyncStorage.getItem(DEMO_AUTH_KEY);
      if (savedDemo === 'true') {
        setUser({
          id: 'demo-user-1',
          email: savedRole === 'doctor' ? 'dr.henderson@hospital.org' : 'patient@example.com',
          fullName: savedRole === 'doctor' ? 'Dr. Robert Henderson, M.D.' : 'Patient User',
          role: savedRole,
          isDemo: true,
          approvalStatus: 'approved',
        });
        setIsDemoMode(true);
        setIsLoading(false);
        return;
      }

      // Otherwise, leave user as null so AuthScreen is presented
      setUser(null);
      setIsDemoMode(false);
    } catch (e) {
      console.warn('Error checking initial auth session:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemoUser = async (role: UserRole = 'patient') => {
    await AsyncStorage.setItem(DEMO_AUTH_KEY, 'true');
    await AsyncStorage.setItem(USER_ROLE_KEY, role);
    setUser({
      id: 'demo-user-1',
      email: role === 'doctor' ? 'dr.henderson@hospital.org' : 'patient@example.com',
      fullName: role === 'doctor' ? 'Dr. Robert Henderson, M.D.' : 'Patient User',
      role,
      isDemo: true,
      approvalStatus: 'approved',
    });
    setIsDemoMode(true);
  };

  const switchRole = async (newRole: UserRole) => {
    await AsyncStorage.setItem(USER_ROLE_KEY, newRole);
    if (user) {
      setUser({
        ...user,
        role: newRole,
        approvalStatus: newRole === 'doctor' ? 'approved' : user.approvalStatus || 'approved',
        fullName:
          user.isDemo && newRole === 'doctor'
            ? 'Dr. Robert Henderson, M.D.'
            : user.isDemo && newRole === 'patient'
            ? 'Patient User'
            : user.fullName,
        email:
          user.isDemo && newRole === 'doctor'
            ? 'dr.henderson@hospital.org'
            : user.isDemo && newRole === 'patient'
            ? 'patient@example.com'
            : user.email,
      });
    }
  };

  const signIn = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; error?: string; pendingApproval?: boolean }> => {
    if (!isSupabaseConfigured()) {
      const approval = await StorageService.checkPatientApproval(email);
      const isApproved = approval.status === 'approved';
      const signedUser: AuthUser = {
        id: `user-${Date.now()}`,
        email,
        fullName: approval.patient?.name || email.split('@')[0],
        role: 'patient',
        isDemo: false,
        approvalStatus: approval.status,
      };
      setUser(signedUser);
      setIsDemoMode(false);
      await AsyncStorage.removeItem(DEMO_AUTH_KEY);
      await AsyncStorage.setItem(REAL_USER_KEY, JSON.stringify(signedUser));
      return { success: true, pendingApproval: !isApproved };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const savedRole = ((await AsyncStorage.getItem(USER_ROLE_KEY)) as UserRole) || 'patient';
        let approvalStatus: PatientApprovalStatus = 'approved';
        if (savedRole === 'patient') {
          const approval = await StorageService.checkPatientApproval(email);
          approvalStatus = approval.status;
        }
        const signedUser: AuthUser = {
          id: data.user.id,
          email: data.user.email || '',
          fullName: data.user.user_metadata?.full_name || 'Patient',
          role: (data.user.user_metadata?.role as UserRole) || savedRole,
          isDemo: false,
          approvalStatus,
        };
        setUser(signedUser);
        setIsDemoMode(false);
        await AsyncStorage.removeItem(DEMO_AUTH_KEY);
        await AsyncStorage.setItem(REAL_USER_KEY, JSON.stringify(signedUser));
        return { success: true, pendingApproval: approvalStatus === 'pending' };
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Authentication failed' };
    }
  };

  const signInWithGoogle = async (
    role: UserRole = 'patient'
  ): Promise<{ success: boolean; error?: string; pendingApproval?: boolean }> => {
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: 'pillguardian://auth/callback',
          },
        });

        if (error) {
          console.warn('Supabase OAuth notice:', error.message);
        }
      }

      // Check approval status for patient
      const googleEmail = 'yashraj.miyatra@gmail.com';
      let approvalStatus: PatientApprovalStatus = 'approved';
      if (role === 'patient') {
        const approval = await StorageService.checkPatientApproval(googleEmail);
        approvalStatus = approval.status;
        if (!approval.patient) {
          // Register as new patient in queue
          await StorageService.registerPendingPatient({
            email: googleEmail,
            name: 'Yashraj Miyatra (Google)',
          });
        }
      }

      await AsyncStorage.removeItem(DEMO_AUTH_KEY);
      await AsyncStorage.setItem(USER_ROLE_KEY, role);
      const googleUser: AuthUser = {
        id: `google-user-${Date.now()}`,
        email: googleEmail,
        fullName: role === 'doctor' ? 'Dr. Yashraj Miyatra, M.D.' : 'Yashraj Miyatra (Google)',
        role,
        isDemo: false,
        approvalStatus,
      };
      setUser(googleUser);
      setIsDemoMode(false);
      await AsyncStorage.setItem(REAL_USER_KEY, JSON.stringify(googleUser));
      return { success: true, pendingApproval: role === 'patient' && approvalStatus === 'pending' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Google Sign-In failed' };
    }
  };

  const signUp = async (
    email: string,
    pass: string,
    name: string
  ): Promise<{ success: boolean; error?: string; pendingApproval?: boolean }> => {
    try {
      // Register new patient account with pending status in clinical records
      await StorageService.registerPendingPatient({
        email,
        name,
      });

      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: {
            data: { full_name: name, role: 'patient', approval_status: 'pending' },
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.user) {
          const newUser: AuthUser = {
            id: data.user.id,
            email: data.user.email || email,
            fullName: name,
            role: 'patient',
            isDemo: false,
            approvalStatus: 'pending',
          };
          setUser(newUser);
          setIsDemoMode(false);
          await AsyncStorage.removeItem(DEMO_AUTH_KEY);
          await AsyncStorage.setItem(REAL_USER_KEY, JSON.stringify(newUser));
        }
      } else {
        const newUser: AuthUser = {
          id: `patient-${Date.now()}`,
          email,
          fullName: name,
          role: 'patient',
          isDemo: false,
          approvalStatus: 'pending',
        };
        setUser(newUser);
        setIsDemoMode(false);
        await AsyncStorage.removeItem(DEMO_AUTH_KEY);
        await AsyncStorage.setItem(REAL_USER_KEY, JSON.stringify(newUser));
      }
      return { success: true, pendingApproval: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Registration failed' };
    }
  };

  const refreshUserApproval = async (): Promise<boolean> => {
    if (!user) return false;
    if (user.role === 'doctor') return true;
    try {
      const check = await StorageService.checkPatientApproval(user.email);
      const updatedUser: AuthUser = {
        ...user,
        approvalStatus: check.status,
      };
      setUser(updatedUser);
      await AsyncStorage.setItem(REAL_USER_KEY, JSON.stringify(updatedUser));
      return check.status === 'approved';
    } catch (e) {
      console.warn('Error refreshing approval status:', e);
      return false;
    }
  };

  const signOut = async () => {
    await AsyncStorage.removeItem(DEMO_AUTH_KEY);
    await AsyncStorage.removeItem(REAL_USER_KEY);
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setIsDemoMode(false);
  };

  const authenticateWithBiometrics = async (): Promise<boolean> => {
    const success = await BiometricService.authenticate();
    if (success && !user) {
      await loginAsDemoUser();
    }
    return success;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isDemoMode,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        loginAsDemoUser,
        authenticateWithBiometrics,
        switchRole,
        refreshUserApproval,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
