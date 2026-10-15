import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertCircle, PlusCircle, Trash2 } from 'lucide-react-native';
import { Medication } from '../types';
import { Colors } from '../theme/colors';
import { PillIcon } from './PillIcon';

interface MedicationCardProps {
  medication: Medication;
  onRefill: (medId: string, count: number) => void;
  onDelete: (medId: string) => void;
}

export const MedicationCard: React.FC<MedicationCardProps> = ({
  medication,
  onRefill,
  onDelete,
}) => {
  const isLowStock = medication.stockCurrent <= medication.stockRefillAlert;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <PillIcon form={medication.form} color={medication.color} size={44} />

        <View style={styles.titleCol}>
          <Text style={styles.medName}>{medication.name}</Text>
          <Text style={styles.dosageText}>
            {medication.dosage} • <Text style={styles.formTag}>{medication.form.toUpperCase()}</Text>
          </Text>
        </View>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => onDelete(medication.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Trash2 size={16} color="#CBD5E1" />
        </TouchableOpacity>
      </View>

      <View style={styles.instructionsBox}>
        <Text style={styles.instructionsText}>{medication.instructions}</Text>
      </View>

      {/* Schedule Info */}
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Scheduled Times:</Text>
        <Text style={styles.infoValue}>{medication.times.join(', ')}</Text>
      </View>

      {medication.prescribedBy && (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Prescriber:</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {medication.prescribedBy}
          </Text>
        </View>
      )}

      {/* Stock & Refill Bar */}
      <View style={[styles.stockContainer, isLowStock && styles.stockContainerLow]}>
        <View style={styles.stockTextGroup}>
          {isLowStock && <AlertCircle size={15} color="#DC2626" style={{ marginRight: 4 }} />}
          <Text style={[styles.stockLabel, isLowStock && styles.stockLabelLow]}>
            Stock: <Text style={styles.stockNumber}>{medication.stockCurrent}</Text> remaining
            {isLowStock ? ' (Refill Alert!)' : ''}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.quickRefillBtn}
          onPress={() => onRefill(medication.id, 30)}
          activeOpacity={0.7}
        >
          <PlusCircle size={14} color="#0284C7" />
          <Text style={styles.quickRefillText}>+30 Refill</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleCol: {
    flex: 1,
    marginLeft: 12,
  },
  medName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  dosageText: {
    fontSize: 13,
    color: '#475569',
    marginTop: 1,
    fontWeight: '500',
  },
  formTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  deleteBtn: {
    padding: 4,
  },
  instructionsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  instructionsText: {
    fontSize: 12,
    color: '#334155',
    fontStyle: 'italic',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    maxWidth: '65%',
  },
  stockContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  stockContainerLow: {
    backgroundColor: '#FEF2F2',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    paddingBottom: 6,
    borderRadius: 8,
    borderTopWidth: 0,
  },
  stockTextGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 12,
    color: '#475569',
  },
  stockLabelLow: {
    color: '#DC2626',
    fontWeight: '700',
  },
  stockNumber: {
    fontWeight: '700',
    color: '#0F172A',
  },
  quickRefillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  quickRefillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
    marginLeft: 4,
  },
});
