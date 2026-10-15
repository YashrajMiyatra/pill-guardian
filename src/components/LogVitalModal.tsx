import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { X, Activity, Heart, Droplets, Scale } from 'lucide-react-native';
import { VitalLog, VitalType } from '../types';

interface LogVitalModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (vital: VitalLog) => void;
}

const VITAL_TYPES: { type: VitalType; label: string; icon: any; unit: string }[] = [
  { type: 'blood_pressure', label: 'Blood Pressure', icon: Activity, unit: 'mmHg' },
  { type: 'blood_glucose', label: 'Blood Glucose', icon: Droplets, unit: 'mg/dL' },
  { type: 'heart_rate', label: 'Heart Rate', icon: Heart, unit: 'bpm' },
  { type: 'weight', label: 'Body Weight', icon: Scale, unit: 'kg' },
];

export const LogVitalModal: React.FC<LogVitalModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const [selectedType, setSelectedType] = useState<VitalType>('blood_pressure');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [numericValue, setNumericValue] = useState('');
  const [contextTag, setContextTag] = useState('Resting');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    let severity: 'normal' | 'warning' | 'alert' = 'normal';

    if (selectedType === 'blood_pressure') {
      const sys = parseInt(systolic, 10);
      const dia = parseInt(diastolic, 10);

      if (!sys || !dia) {
        Alert.alert('Required', 'Please enter both Systolic and Diastolic values.');
        return;
      }

      if (sys >= 140 || dia >= 90) {
        severity = 'alert';
      } else if (sys >= 130 || dia >= 85) {
        severity = 'warning';
      }

      const newVital: VitalLog = {
        id: `vital-${Date.now()}`,
        type: 'blood_pressure',
        value: { systolic: sys, diastolic: dia },
        unit: 'mmHg',
        timestamp: new Date().toISOString(),
        tag: contextTag,
        notes: notes.trim() || undefined,
        severity,
      };

      onSave(newVital);
    } else {
      const num = parseFloat(numericValue);
      if (isNaN(num) || num <= 0) {
        Alert.alert('Required', 'Please enter a valid numeric value.');
        return;
      }

      if (selectedType === 'blood_glucose') {
        if (num >= 180 || num <= 60) severity = 'alert';
        else if (num >= 130) severity = 'warning';
      } else if (selectedType === 'heart_rate') {
        if (num >= 110 || num <= 45) severity = 'alert';
        else if (num >= 95) severity = 'warning';
      }

      const unit =
        selectedType === 'blood_glucose'
          ? 'mg/dL'
          : selectedType === 'heart_rate'
          ? 'bpm'
          : 'kg';

      const newVital: VitalLog = {
        id: `vital-${Date.now()}`,
        type: selectedType,
        value: { numeric: num },
        unit,
        timestamp: new Date().toISOString(),
        tag: contextTag,
        notes: notes.trim() || undefined,
        severity,
      };

      onSave(newVital);
    }

    reset();
    onClose();
  };

  const reset = () => {
    setSystolic('');
    setDiastolic('');
    setNumericValue('');
    setNotes('');
    setContextTag('Resting');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.sheetContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.modalTitle}>Log Health Vital</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Type Selector */}
          <View style={styles.typeGrid}>
            {VITAL_TYPES.map(vt => {
              const Icon = vt.icon;
              const isSelected = selectedType === vt.type;
              return (
                <TouchableOpacity
                  key={vt.type}
                  style={[styles.typeBtn, isSelected && styles.typeBtnSelected]}
                  onPress={() => setSelectedType(vt.type)}
                >
                  <Icon size={18} color={isSelected ? '#0284C7' : '#64748B'} />
                  <Text style={[styles.typeBtnText, isSelected && styles.typeBtnTextSelected]}>
                    {vt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Inputs based on type */}
          {selectedType === 'blood_pressure' ? (
            <View style={styles.bpRow}>
              <View style={styles.col}>
                <Text style={styles.inputLabel}>Systolic (Upper)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  placeholder="120"
                  value={systolic}
                  onChangeText={setSystolic}
                />
              </View>
              <Text style={styles.bpSlash}>/</Text>
              <View style={styles.col}>
                <Text style={styles.inputLabel}>Diastolic (Lower)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  placeholder="80"
                  value={diastolic}
                  onChangeText={setDiastolic}
                />
              </View>
            </View>
          ) : (
            <View>
              <Text style={styles.inputLabel}>
                {selectedType === 'blood_glucose'
                  ? 'Blood Glucose (mg/dL)'
                  : selectedType === 'heart_rate'
                  ? 'Pulse Rate (BPM)'
                  : 'Body Weight (kg)'}
              </Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                placeholder={
                  selectedType === 'blood_glucose'
                    ? 'e.g. 110'
                    : selectedType === 'heart_rate'
                    ? 'e.g. 72'
                    : 'e.g. 74.5'
                }
                value={numericValue}
                onChangeText={setNumericValue}
              />
            </View>
          )}

          {/* Context / Tag */}
          <Text style={styles.inputLabel}>Reading Context</Text>
          <View style={styles.tagRow}>
            {['Resting', 'Fasting', 'Post-Meal', 'Bedtime'].map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.tagPill, contextTag === t && styles.tagPillActive]}
                onPress={() => setContextTag(t)}
              >
                <Text style={[styles.tagPillText, contextTag === t && styles.tagPillTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Notes */}
          <Text style={styles.inputLabel}>Clinical Notes (Optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. After morning coffee, feeling relaxed"
            placeholderTextColor="#94A3B8"
            value={notes}
            onChangeText={setNotes}
          />

          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Record Vital</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  typeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  typeBtnSelected: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  typeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginLeft: 6,
  },
  typeBtnTextSelected: {
    color: '#0284C7',
    fontWeight: '700',
  },
  bpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bpSlash: {
    fontSize: 28,
    fontWeight: '300',
    color: '#94A3B8',
    marginTop: 18,
  },
  col: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  tagPillActive: {
    backgroundColor: '#0284C7',
  },
  tagPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  tagPillTextActive: {
    color: '#FFFFFF',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  saveBtn: {
    flex: 2,
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
