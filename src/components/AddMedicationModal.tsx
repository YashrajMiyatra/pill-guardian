import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { Medication, MedicationForm, MedicationFrequency } from '../types';
import { Colors } from '../theme/colors';

interface AddMedicationModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (med: Medication) => void;
}

const FORMS: { label: string; value: MedicationForm }[] = [
  { label: 'Tablet', value: 'tablet' },
  { label: 'Capsule', value: 'capsule' },
  { label: 'Drops', value: 'drops' },
  { label: 'Inhaler', value: 'inhaler' },
  { label: 'Liquid', value: 'liquid' },
];

const STANDARD_TIMES = [
  { label: 'Morning (08:00)', value: '08:00' },
  { label: 'Afternoon (13:00)', value: '13:00' },
  { label: 'Evening (19:00)', value: '19:00' },
  { label: 'Night (22:00)', value: '22:00' },
];

export const AddMedicationModal: React.FC<AddMedicationModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [form, setForm] = useState<MedicationForm>('tablet');
  const [selectedColor, setSelectedColor] = useState(Colors.pillColors[0].hex);
  const [instructions, setInstructions] = useState('');
  const [selectedTimes, setSelectedTimes] = useState<string[]>(['08:00']);
  const [stockCurrent, setStockCurrent] = useState('30');
  const [stockRefillAlert, setStockRefillAlert] = useState('7');
  const [prescribedBy, setPrescribedBy] = useState('');

  const toggleTime = (time: string) => {
    if (selectedTimes.includes(time)) {
      if (selectedTimes.length === 1) {
        Alert.alert('Required', 'At least one scheduled time must be selected.');
        return;
      }
      setSelectedTimes(selectedTimes.filter(t => t !== time));
    } else {
      setSelectedTimes([...selectedTimes, time].sort());
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter the medication name.');
      return;
    }
    if (!dosage.trim()) {
      Alert.alert('Validation Error', 'Please enter the dosage (e.g. 10 mg).');
      return;
    }

    const newMed: Medication = {
      id: `med-${Date.now()}`,
      name: name.trim(),
      dosage: dosage.trim(),
      form,
      color: selectedColor,
      instructions: instructions.trim() || 'Take as directed',
      frequency: selectedTimes.length === 1 ? 'daily' : 'twice_daily',
      times: selectedTimes,
      stockCurrent: parseInt(stockCurrent, 10) || 30,
      stockRefillAlert: parseInt(stockRefillAlert, 10) || 7,
      prescribedBy: prescribedBy.trim() || undefined,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    onSave(newMed);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setName('');
    setDosage('');
    setForm('tablet');
    setSelectedColor(Colors.pillColors[0].hex);
    setInstructions('');
    setSelectedTimes(['08:00']);
    setStockCurrent('30');
    setStockRefillAlert('7');
    setPrescribedBy('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.sheetContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.modalTitle}>Add New Medication</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Name & Dosage */}
            <Text style={styles.inputLabel}>Medication Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Atorvastatin, Metformin"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.inputLabel}>Dosage & Strength *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 20 mg, 500 mg, 2 puffs"
              placeholderTextColor="#94A3B8"
              value={dosage}
              onChangeText={setDosage}
            />

            {/* Form Selector */}
            <Text style={styles.inputLabel}>Medication Form</Text>
            <View style={styles.choiceRow}>
              {FORMS.map(f => (
                <TouchableOpacity
                  key={f.value}
                  style={[styles.choicePill, form === f.value && styles.choicePillActive]}
                  onPress={() => setForm(f.value)}
                >
                  <Text
                    style={[
                      styles.choicePillText,
                      form === f.value && styles.choicePillTextActive,
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Color Palette Selector */}
            <Text style={styles.inputLabel}>Visual Identifier Color</Text>
            <View style={styles.colorRow}>
              {Colors.pillColors.map(c => (
                <TouchableOpacity
                  key={c.hex}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c.hex },
                    selectedColor === c.hex && styles.colorCircleSelected,
                  ]}
                  onPress={() => setSelectedColor(c.hex)}
                >
                  {selectedColor === c.hex && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                </TouchableOpacity>
              ))}
            </View>

            {/* Schedule Times */}
            <Text style={styles.inputLabel}>Daily Dose Times</Text>
            <View style={styles.timesGrid}>
              {STANDARD_TIMES.map(t => {
                const isSelected = selectedTimes.includes(t.value);
                return (
                  <TouchableOpacity
                    key={t.value}
                    style={[styles.timeBox, isSelected && styles.timeBoxSelected]}
                    onPress={() => toggleTime(t.value)}
                  >
                    <Text style={[styles.timeBoxText, isSelected && styles.timeBoxTextSelected]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Instructions */}
            <Text style={styles.inputLabel}>Instructions / Notes</Text>
            <TextInput
              style={[styles.textInput, { height: 70, textAlignVertical: 'top' }]}
              placeholder="e.g. Take with morning meal, drink full glass of water"
              placeholderTextColor="#94A3B8"
              multiline
              value={instructions}
              onChangeText={setInstructions}
            />

            {/* Stock Counts */}
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={styles.inputLabel}>Current Stock</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={stockCurrent}
                  onChangeText={setStockCurrent}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.inputLabel}>Refill Warning At</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={stockRefillAlert}
                  onChangeText={setStockRefillAlert}
                />
              </View>
            </View>

            {/* Prescriber */}
            <Text style={styles.inputLabel}>Prescribed By (Doctor / Specialist)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Dr. Robert Henderson (Cardiology)"
              placeholderTextColor="#94A3B8"
              value={prescribedBy}
              onChangeText={setPrescribedBy}
            />

            <View style={{ height: 24 }} />
          </ScrollView>

          {/* Footer Save Button */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save Medication</Text>
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
    maxHeight: '90%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
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
  body: {
    maxHeight: 460,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  choiceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choicePill: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  choicePillActive: {
    backgroundColor: '#0284C7',
  },
  choicePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  choicePillTextActive: {
    color: '#FFFFFF',
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#0F172A',
  },
  timesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  timeBoxSelected: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  timeBoxText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  timeBoxTextSelected: {
    color: '#0284C7',
    fontWeight: '700',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 12,
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
