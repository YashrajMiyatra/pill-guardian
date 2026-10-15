import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Plus, Activity, Heart, Droplets, CheckCircle, AlertTriangle } from 'lucide-react-native';
import { VitalLog } from '../types';
import { StorageService } from '../services/storage';
import { LogVitalModal } from '../components/LogVitalModal';
import { Colors } from '../theme/colors';

export const VitalsScreen: React.FC = () => {
  const [vitals, setVitals] = useState<VitalLog[]>([]);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadVitals = useCallback(async () => {
    const list = await StorageService.getVitals();
    setVitals(list);
  }, []);

  useEffect(() => {
    loadVitals();
  }, [loadVitals]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVitals();
    setRefreshing(false);
  };

  const handleSaveVital = async (vital: VitalLog) => {
    try {
      const updated = await StorageService.addVital(vital);
      setVitals(updated);
    } catch (e) {
      Alert.alert('Error', 'Could not record vital reading.');
    }
  };

  // Find latest readings
  const latestBP = vitals.find(v => v.type === 'blood_pressure');
  const latestGlucose = vitals.find(v => v.type === 'blood_glucose');
  const latestHR = vitals.find(v => v.type === 'heart_rate');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>CHRONIC BIOMARKERS</Text>
          <Text style={styles.headerTitle}>Health Vitals</Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setIsLogModalOpen(true)}
          activeOpacity={0.8}
        >
          <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.addBtnText}>Log</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* KPI Overview Cards */}
        <View style={styles.kpiContainer}>
          {/* Blood Pressure Card */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Activity size={18} color="#0284C7" />
              <Text style={styles.kpiTitle}>Blood Pressure</Text>
            </View>
            <Text style={styles.kpiValue}>
              {latestBP?.value.systolic
                ? `${latestBP.value.systolic}/${latestBP.value.diastolic}`
                : '--/--'}
              <Text style={styles.kpiUnit}> mmHg</Text>
            </Text>
            <View
              style={[
                styles.kpiBadge,
                latestBP?.severity === 'alert'
                  ? styles.kpiBadgeAlert
                  : latestBP?.severity === 'warning'
                  ? styles.kpiBadgeWarn
                  : styles.kpiBadgeNormal,
              ]}
            >
              <Text
                style={[
                  styles.kpiBadgeText,
                  latestBP?.severity === 'alert'
                    ? styles.kpiBadgeTextAlert
                    : latestBP?.severity === 'warning'
                    ? styles.kpiBadgeTextWarn
                    : styles.kpiBadgeTextNormal,
                ]}
              >
                {latestBP?.severity === 'alert'
                  ? 'Stage 2 Alert'
                  : latestBP?.severity === 'warning'
                  ? 'Elevated'
                  : 'Normal Optimal'}
              </Text>
            </View>
          </View>

          {/* Blood Glucose Card */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <Droplets size={18} color="#0D9488" />
              <Text style={styles.kpiTitle}>Blood Glucose</Text>
            </View>
            <Text style={styles.kpiValue}>
              {latestGlucose?.value.numeric ?? '--'}
              <Text style={styles.kpiUnit}> mg/dL</Text>
            </Text>
            <View
              style={[
                styles.kpiBadge,
                latestGlucose?.severity === 'alert'
                  ? styles.kpiBadgeAlert
                  : latestGlucose?.severity === 'warning'
                  ? styles.kpiBadgeWarn
                  : styles.kpiBadgeNormal,
              ]}
            >
              <Text
                style={[
                  styles.kpiBadgeText,
                  latestGlucose?.severity === 'alert'
                    ? styles.kpiBadgeTextAlert
                    : latestGlucose?.severity === 'warning'
                    ? styles.kpiBadgeTextWarn
                    : styles.kpiBadgeTextNormal,
                ]}
              >
                {latestGlucose?.severity === 'alert'
                  ? 'High'
                  : latestGlucose?.severity === 'warning'
                  ? 'Borderline'
                  : 'Fasting Target'}
              </Text>
            </View>
          </View>
        </View>

        {/* Heart Rate Secondary Card */}
        {latestHR && (
          <View style={styles.wideKpiCard}>
            <View style={styles.wideKpiLeft}>
              <Heart size={20} color="#F43F5E" />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.wideKpiLabel}>Resting Pulse</Text>
                <Text style={styles.wideKpiSub}>{latestHR.tag || 'Standard'}</Text>
              </View>
            </View>
            <Text style={styles.wideKpiValue}>
              {latestHR.value.numeric} <Text style={{ fontSize: 13, color: '#64748B' }}>BPM</Text>
            </Text>
          </View>
        )}

        {/* History Log Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Readings History</Text>
          <Text style={styles.sectionSub}>{vitals.length} records</Text>
        </View>

        {/* Vitals History List */}
        <View style={styles.historyList}>
          {vitals.map(v => {
            const isAlert = v.severity === 'alert';
            const isWarn = v.severity === 'warning';
            let formattedVal = '';
            if (v.type === 'blood_pressure') {
              formattedVal = `${v.value.systolic}/${v.value.diastolic} mmHg`;
            } else {
              formattedVal = `${v.value.numeric} ${v.unit}`;
            }

            const dateStr = new Date(v.timestamp).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });
            const timeStr = new Date(v.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <View key={v.id} style={styles.logCard}>
                <View style={styles.logLeft}>
                  <View style={styles.logTimeCol}>
                    <Text style={styles.logDate}>{dateStr}</Text>
                    <Text style={styles.logTime}>{timeStr}</Text>
                  </View>

                  <View style={styles.logInfoCol}>
                    <Text style={styles.logTypeName}>
                      {v.type.replace('_', ' ').toUpperCase()}
                    </Text>
                    <Text style={styles.logValueText}>{formattedVal}</Text>
                    {v.notes && <Text style={styles.logNotes}>{v.notes}</Text>}
                  </View>
                </View>

                <View style={styles.logRight}>
                  {v.tag && <Text style={styles.tagChip}>{v.tag}</Text>}
                  <View
                    style={[
                      styles.statusDot,
                      isAlert
                        ? styles.statusDotAlert
                        : isWarn
                        ? styles.statusDotWarn
                        : styles.statusDotNormal,
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Log Vital Modal */}
      <LogVitalModal
        visible={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onSave={handleSaveVital}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 4,
  },
  kpiContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  kpiTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginLeft: 6,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  kpiUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
  },
  kpiBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 8,
  },
  kpiBadgeNormal: {
    backgroundColor: '#DCFCE7',
  },
  kpiBadgeWarn: {
    backgroundColor: '#FEF3C7',
  },
  kpiBadgeAlert: {
    backgroundColor: '#FEE2E2',
  },
  kpiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  kpiBadgeTextNormal: {
    color: '#15803D',
  },
  kpiBadgeTextWarn: {
    color: '#B45309',
  },
  kpiBadgeTextAlert: {
    color: '#B91C1C',
  },
  wideKpiCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  wideKpiLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wideKpiLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  wideKpiSub: {
    fontSize: 11,
    color: '#64748B',
  },
  wideKpiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: 12,
    color: '#94A3B8',
  },
  historyList: {
    paddingHorizontal: 16,
  },
  logCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logTimeCol: {
    width: 65,
    borderRightWidth: 1,
    borderRightColor: '#F1F5F9',
    paddingRight: 8,
  },
  logDate: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  logTime: {
    fontSize: 10,
    color: '#94A3B8',
  },
  logInfoCol: {
    marginLeft: 12,
    flex: 1,
  },
  logTypeName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  logValueText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  logNotes: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontStyle: 'italic',
  },
  logRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  tagChip: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotNormal: {
    backgroundColor: '#10B981',
  },
  statusDotWarn: {
    backgroundColor: '#F59E0B',
  },
  statusDotAlert: {
    backgroundColor: '#EF4444',
  },
});
