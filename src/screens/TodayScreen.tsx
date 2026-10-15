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
import { Bell, AlertTriangle, Calendar, Sparkles } from 'lucide-react-native';
import { DoseItem, DoseStatus, Medication } from '../types';
import { StorageService } from '../services/storage';
import { NotificationService } from '../services/notifications';
import { AdherenceSummary } from '../components/AdherenceRing';
import { DoseCard } from '../components/DoseCard';
import { Colors } from '../theme/colors';

interface TodayScreenProps {
  onNavigateToCabinet: () => void;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({ onNavigateToCabinet }) => {
  const [doses, setDoses] = useState<DoseItem[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Morning' | 'Afternoon' | 'Evening' | 'Night'>('All');
  const [refreshing, setRefreshing] = useState(false);

  // Today string YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  const loadData = useCallback(async () => {
    try {
      const [fetchedDoses, fetchedMeds] = await Promise.all([
        StorageService.getDailyDoses(todayStr),
        StorageService.getMedications(),
      ]);
      setDoses(fetchedDoses);
      setMedications(fetchedMeds);
    } catch (e) {
      console.error('Error loading Today data:', e);
    }
  }, [todayStr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleUpdateStatus = async (doseId: string, status: DoseStatus) => {
    try {
      const updated = await StorageService.updateDoseStatus(todayStr, doseId, status);
      setDoses(updated);
      // Reload medications to update stock numbers
      const refreshedMeds = await StorageService.getMedications();
      setMedications(refreshedMeds);
    } catch (e) {
      Alert.alert('Error', 'Could not update dose status.');
    }
  };

  const handleTestNotification = async () => {
    await NotificationService.triggerTestReminder(
      'Metformin HCl (500mg)',
      'Scheduled Morning Dose'
    );
    Alert.alert(
      'Notification Sent!',
      'A sample medication reminder has been triggered on your device.'
    );
  };

  // Filter low stock meds
  const lowStockMeds = medications.filter(
    m => m.isActive && m.stockCurrent <= m.stockRefillAlert
  );

  // Filtered doses
  const filteredDoses = doses.filter(d => {
    if (selectedFilter === 'All') return true;
    return d.timeCategory === selectedFilter;
  });

  const totalDoses = doses.length;
  const takenDoses = doses.filter(d => d.status === 'taken').length;

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerDate}>{formattedDate.toUpperCase()}</Text>
          <Text style={styles.headerTitle}>Today's Regimen</Text>
        </View>

        <TouchableOpacity
          style={styles.testNotifyBtn}
          onPress={handleTestNotification}
          activeOpacity={0.7}
        >
          <Bell size={18} color="#0284C7" />
        </TouchableOpacity>
      </View>

      {/* Adherence Summary Card */}
      <AdherenceSummary totalDoses={totalDoses} takenDoses={takenDoses} streakDays={14} />

      {/* Low Stock Warning Banner */}
      {lowStockMeds.length > 0 && (
        <TouchableOpacity
          style={styles.alertBanner}
          onPress={onNavigateToCabinet}
          activeOpacity={0.8}
        >
          <AlertTriangle size={20} color="#B91C1C" />
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Prescription Refill Required</Text>
            <Text style={styles.alertSub}>
              {lowStockMeds.map(m => `${m.name} (${m.stockCurrent} left)`).join(', ')}. Tap to view cabinet.
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Time Filter Tabs */}
      <View style={styles.filterScroll}>
        {(['All', 'Morning', 'Afternoon', 'Evening', 'Night'] as const).map(filter => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterChip, selectedFilter === filter && styles.filterChipActive]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === filter && styles.filterChipTextActive,
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Doses List */}
      <View style={styles.listContainer}>
        {filteredDoses.length === 0 ? (
          <View style={styles.emptyCard}>
            <Sparkles size={32} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Doses in this Slot</Text>
            <Text style={styles.emptySub}>
              {selectedFilter === 'All'
                ? 'You have no scheduled doses today.'
                : `No medications scheduled for ${selectedFilter}.`}
            </Text>
          </View>
        ) : (
          filteredDoses.map(dose => (
            <DoseCard
              key={dose.id}
              dose={dose}
              onUpdateStatus={handleUpdateStatus}
            />
          ))
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
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
    paddingBottom: 14,
  },
  headerDate: {
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
  testNotifyBtn: {
    backgroundColor: '#E0F2FE',
    padding: 10,
    borderRadius: 14,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  alertContent: {
    marginLeft: 12,
    flex: 1,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B91C1C',
  },
  alertSub: {
    fontSize: 12,
    color: '#7F1D1D',
    marginTop: 2,
  },
  filterScroll: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 14,
  },
  filterChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContainer: {
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 32,
    marginHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
});
