import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { BiometricService } from '../services/biometrics';

const DEMO_AUTH_KEY = '@pill_guardian_demo_auth';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  isDemo: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isDemoMode: boolean;
  signIn: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, pass: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  loginAsDemoUser: () => Promise<void>;
  authenticateWithBiometrics: () => Promise<boolean>;
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
      // 1. Check if demo session is saved
      const savedDemo = await AsyncStorage.getItem(DEMO_AUTH_KEY);
      if (savedDemo === 'true') {
        setUser({
          id: 'demo-user-1',
          email: 'arthur.bennett@example.com',
          fullName: 'Arthur Bennett',
          isDemo: true,
        });
        setIsDemoMode(true);
        setIsLoading(false);
        return;
      }

      // 2. Check Supabase session if configured
      if (isSupabaseConfigured()) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            fullName: session.user.user_metadata?.full_name || 'Patient',
            isDemo: false,
          });
        }
      }
    } catch (e) {
      console.warn('Error checking initial auth session:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemoUser = async () => {
    await AsyncStorage.setItem(DEMO_AUTH_KEY, 'true');
    setUser({
      id: 'demo-user-1',
      email: 'arthur.bennett@example.com',
      fullName: 'Arthur Bennett',
      isDemo: true,
    });
    setIsDemoMode(true);
  };

  const signIn = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      // If Supabase not yet configured, allow sign-in with local fallback
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
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          fullName: data.user.user_metadata?.full_name || 'Patient',
          isDemo: false,
        });
        setIsDemoMode(false);
        await AsyncStorage.removeItem(DEMO_AUTH_KEY);
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Authentication failed' };
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
          data: { full_name: name },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          fullName: name,
          isDemo: false,
        });
        setIsDemoMode(false);
        await AsyncStorage.removeItem(DEMO_AUTH_KEY);
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Registration failed' };
    }
  };

  const signOut = async () => {
    await AsyncStorage.removeItem(DEMO_AUTH_KEY);
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
        signOut,
        loginAsDemoUser,
        authenticateWithBiometrics,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
