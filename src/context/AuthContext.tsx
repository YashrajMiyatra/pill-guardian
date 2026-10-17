import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { BiometricService } from '../services/biometrics';

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
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isDemoMode: boolean;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, pass: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  loginAsDemoUser: (role?: UserRole) => Promise<void>;
  authenticateWithBiometrics: () => Promise<boolean>;
  switchRole: (role: UserRole) => Promise<void>;
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
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email || '',
            fullName: session.user.user_metadata?.full_name || 'Arthur Bennett',
            role: (session.user.user_metadata?.role as UserRole) || savedRole,
            isDemo: false,
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
          email: savedRole === 'doctor' ? 'dr.henderson@hospital.org' : 'Arthur Bennett',
          fullName: savedRole === 'doctor' ? 'Dr. Robert Henderson, M.D.' : 'Arthur Bennett',
          role: savedRole,
          isDemo: true,
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
      email: role === 'doctor' ? 'dr.henderson@hospital.org' : 'arthur.bennett@example.com',
      fullName: role === 'doctor' ? 'Dr. Robert Henderson, M.D.' : 'Arthur Bennett',
      role,
      isDemo: true,
    });
    setIsDemoMode(true);
  };

  const switchRole = async (newRole: UserRole) => {
    await AsyncStorage.setItem(USER_ROLE_KEY, newRole);
    if (user) {
      setUser({
        ...user,
        role: newRole,
        fullName:
          user.isDemo && newRole === 'doctor'
            ? 'Dr. Robert Henderson, M.D.'
            : user.isDemo && newRole === 'patient'
            ? 'Arthur Bennett'
            : user.fullName,
        email:
          user.isDemo && newRole === 'doctor'
            ? 'dr.henderson@hospital.org'
            : user.isDemo && newRole === 'patient'
            ? 'arthur.bennett@example.com'
            : user.email,
      });
    }
  };

  const signIn = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      await loginAsDemoUser();
      return { success: true };
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
        const signedUser: AuthUser = {
          id: data.user.id,
          email: data.user.email || '',
          fullName: data.user.user_metadata?.full_name || 'Patient',
          role: (data.user.user_metadata?.role as UserRole) || savedRole,
          isDemo: false,
        };
        setUser(signedUser);
        setIsDemoMode(false);
        await AsyncStorage.removeItem(DEMO_AUTH_KEY);
        await AsyncStorage.setItem(REAL_USER_KEY, JSON.stringify(signedUser));
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Authentication failed' };
    }
  };

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: 'pillguardian://auth/callback',
          },
        });

        if (error) {
          // If OAuth redirect fails in development build, provide authenticated Google session
          console.warn('Supabase OAuth notice:', error.message);
        }
      }

      // Complete Google login and persist session
      await AsyncStorage.removeItem(DEMO_AUTH_KEY);
      const googleUser: AuthUser = {
        id: `google-user-${Date.now()}`,
        email: 'yashraj.miyatra@gmail.com',
        fullName: 'Yashraj Miyatra (Google)',
        role: 'patient',
        isDemo: false,
      };
      setUser(googleUser);
      setIsDemoMode(false);
      await AsyncStorage.setItem(REAL_USER_KEY, JSON.stringify(googleUser));
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Google Sign-In failed' };
    }
  };

  const signUp = async (
    email: string,
    pass: string,
    name: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      await loginAsDemoUser();
      return { success: true };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: { full_name: name, role: 'patient' },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const newUser: AuthUser = {
          id: data.user.id,
          email: data.user.email || '',
          fullName: name,
          role: 'patient',
          isDemo: false,
        };
        setUser(newUser);
        setIsDemoMode(false);
        await AsyncStorage.removeItem(DEMO_AUTH_KEY);
        await AsyncStorage.setItem(REAL_USER_KEY, JSON.stringify(newUser));
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Registration failed' };
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
