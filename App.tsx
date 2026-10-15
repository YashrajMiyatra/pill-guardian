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
import { Calendar, Pill, Activity, ShieldCheck } from 'lucide-react-native';
import { ActiveTab } from './src/types';
import { StorageService } from './src/services/storage';
import { TodayScreen } from './src/screens/TodayScreen';
import { CabinetScreen } from './src/screens/CabinetScreen';
import { VitalsScreen } from './src/screens/VitalsScreen';
import { CaregiverScreen } from './src/screens/CaregiverScreen';
import { Colors } from './src/theme/colors';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await StorageService.initDefaults();
      } catch (e) {
        console.warn('Init error:', e);
      } finally {
        setIsReady(true);
      }
    }
    prepare();
  }, []);

  if (!isReady) {
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
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
