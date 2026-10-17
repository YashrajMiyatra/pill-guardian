import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar as RNStatusBar,
  Platform,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Calendar, Pill, Activity, ShieldCheck, User } from 'lucide-react-native';
import { ActiveTab } from './src/types';
import { StorageService } from './src/services/storage';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AuthScreen } from './src/screens/AuthScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { CabinetScreen } from './src/screens/CabinetScreen';
import { VitalsScreen } from './src/screens/VitalsScreen';
import { CaregiverScreen } from './src/screens/CaregiverScreen';
import { DoctorDashboardScreen } from './src/screens/DoctorDashboardScreen';
import { Colors } from './src/theme/colors';

function MainApp() {
  const { user, isLoading, isDemoMode, switchRole, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');
  const [isStorageReady, setIsStorageReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await StorageService.initDefaults();
      } catch (e) {
        console.warn('Init error:', e);
      } finally {
        setIsStorageReady(true);
      }
    }
    prepare();
  }, []);

  if (isLoading || !isStorageReady) {
    return (
      <View style={styles.splashContainer}>
        <Image
          source={require('./assets/logo.png')}
          style={{ width: 88, height: 88, borderRadius: 20 }}
          resizeMode="contain"
        />
        <Text style={styles.splashTitle}>PillGuardian</Text>
        <Text style={styles.splashSub}>Personal Chronic Care Companion</Text>
      </View>
    );
  }

  // If not authenticated, show Auth Screen
  if (!user) {
    return <AuthScreen />;
  }

  // If user is a Doctor / Clinician, show Doctor Care Portal
  if (user.role === 'doctor') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <DoctorDashboardScreen />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* Top App Header Banner */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <Image
              source={require('./assets/logo.png')}
              style={styles.topLogo}
              resizeMode="contain"
            />
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.topAppName}>PillGuardian</Text>
              <Text style={styles.topPatientName}>
                {user.fullName} {isDemoMode ? '• Demo' : ''}
              </Text>
            </View>
          </View>

          <View style={styles.topBarRight}>
            <View style={styles.patientBadge}>
              <Text style={styles.patientBadgeText}>Patient Portal</Text>
            </View>

            <TouchableOpacity
              style={styles.patientSignOutBtn}
              onPress={signOut}
              activeOpacity={0.8}
            >
              <Text style={styles.patientSignOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Demo Mode Notice & Google Sign In Trigger */}
        {isDemoMode && (
          <View style={styles.demoBanner}>
            <Text style={styles.demoBannerText}>
              💡 Exploring Demo Mode
            </Text>
            <TouchableOpacity
              style={styles.demoBannerAction}
              onPress={signOut}
              activeOpacity={0.8}
            >
              <Text style={styles.demoBannerActionText}>Sign In with Google →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Active Screen View */}
        <View style={styles.screenContainer}>
          {activeTab === 'today' && (
            <TodayScreen onNavigateToCabinet={() => setActiveTab('cabinet')} />
          )}
          {activeTab === 'cabinet' && <CabinetScreen />}
          {activeTab === 'vitals' && <VitalsScreen />}
          {activeTab === 'caregiver' && <CaregiverScreen />}
        </View>

        {/* Bottom Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('today')}
            activeOpacity={0.7}
          >
            <Calendar
              size={22}
              color={activeTab === 'today' ? Colors.primary : Colors.textMuted}
              strokeWidth={activeTab === 'today' ? 2.5 : 2}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'today' && styles.tabLabelActive,
              ]}
            >
              Today
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('cabinet')}
            activeOpacity={0.7}
          >
            <Pill
              size={22}
              color={activeTab === 'cabinet' ? Colors.primary : Colors.textMuted}
              strokeWidth={activeTab === 'cabinet' ? 2.5 : 2}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'cabinet' && styles.tabLabelActive,
              ]}
            >
              Cabinet
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('vitals')}
            activeOpacity={0.7}
          >
            <Activity
              size={22}
              color={activeTab === 'vitals' ? Colors.primary : Colors.textMuted}
              strokeWidth={activeTab === 'vitals' ? 2.5 : 2}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'vitals' && styles.tabLabelActive,
              ]}
            >
              Vitals
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('caregiver')}
            activeOpacity={0.7}
          >
            <ShieldCheck
              size={22}
              color={activeTab === 'caregiver' ? Colors.primary : Colors.textMuted}
              strokeWidth={activeTab === 'caregiver' ? 2.5 : 2}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'caregiver' && styles.tabLabelActive,
              ]}
            >
              Care Team
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight || 0 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  topAppName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 16,
  },
  topPatientName: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  syncStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  syncStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  patientBadge: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  patientBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  patientSignOutBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  patientSignOutText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  exitDemoBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  exitDemoText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  demoBanner: {
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  demoBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  demoBannerAction: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  demoBannerActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  screenContainer: {
    flex: 1,
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
  },
  splashSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 12 : 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#0284C7',
    fontWeight: '700',
  },
});
