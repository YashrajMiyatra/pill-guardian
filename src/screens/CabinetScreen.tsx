import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { Plus, Search, Pill, AlertCircle } from 'lucide-react-native';
import { Medication } from '../types';
import { StorageService } from '../services/storage';
import { MedicationCard } from '../components/MedicationCard';
import { AddMedicationModal } from '../components/AddMedicationModal';

export const CabinetScreen: React.FC = () => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadMedications = useCallback(async () => {
    const list = await StorageService.getMedications();
    setMedications(list);
  }, []);

  useEffect(() => {
    loadMedications();
  }, [loadMedications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMedications();
    setRefreshing(false);
  };

  const handleSaveMedication = async (med: Medication) => {
    try {
      const updated = await StorageService.saveMedication(med);
      setMedications(updated);
    } catch (e) {
      Alert.alert('Error', 'Could not save medication.');
    }
  };

  const handleRefill = async (medId: string, count: number) => {
    const updatedMed = await StorageService.updateMedicationStock(medId, count);
    if (updatedMed) {
      setMedications(prev => prev.map(m => (m.id === medId ? updatedMed : m)));
      Alert.alert('Stock Updated', `Added ${count} pills to ${updatedMed.name}.`);
    }
  };

  const handleDelete = (medId: string) => {
    Alert.alert(
      'Remove Medication',
      'Are you sure you want to remove this medication from your active cabinet?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = await StorageService.deleteMedication(medId);
            setMedications(updated);
          },
        },
      ]
    );
  };

  const filteredMeds = medications.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.instructions.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockCount = medications.filter(
    m => m.isActive && m.stockCurrent <= m.stockRefillAlert
  ).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>INVENTORY & PRESCRIPTIONS</Text>
          <Text style={styles.headerTitle}>Medicine Cabinet</Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setIsAddModalOpen(true)}
          activeOpacity={0.8}
        >
          <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search size={18} color="#94A3B8" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by medicine name or condition..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Status Counters */}
      <View style={styles.counterRow}>
        <View style={styles.counterCard}>
          <Pill size={16} color="#0284C7" />
          <Text style={styles.counterText}>
            <Text style={styles.counterBold}>{medications.length}</Text> Prescriptions
          </Text>
        </View>

        {lowStockCount > 0 && (
          <View style={[styles.counterCard, styles.counterCardAlert]}>
            <AlertCircle size={16} color="#DC2626" />
            <Text style={[styles.counterText, { color: '#DC2626' }]}>
              <Text style={styles.counterBold}>{lowStockCount}</Text> Need Refill
            </Text>
          </View>
        )}
      </View>

      {/* Medication List */}
      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredMeds.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No medications found</Text>
            <Text style={styles.emptySub}>
              {searchQuery ? 'Try matching a different keyword.' : 'Tap "+ Add" to add your first prescription.'}
            </Text>
          </View>
        ) : (
          filteredMeds.map(med => (
            <MedicationCard
              key={med.id}
              medication={med}
              onRefill={handleRefill}
              onDelete={handleDelete}
            />
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Medication Modal */}
      <AddMedicationModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveMedication}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  counterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  counterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  counterCardAlert: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  counterText: {
    fontSize: 12,
    color: '#475569',
    marginLeft: 6,
  },
  counterBold: {
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  emptySub: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
});
