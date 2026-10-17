import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Linking,
  ActivityIndicator,
} from 'react-native';
import {
  Stethoscope,
  Users,
  AlertTriangle,
  Activity,
  Pill,
  Search,
  FileDown,
  Send,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Phone,
  ChevronRight,
  TrendingUp,
  Plus,
  Edit3,
  Trash2,
  X,
  FileText,
  HeartPulse,
  LogOut,
  ShieldCheck,
} from 'lucide-react-native';
import { Medication, VitalLog, UserProfile, CaregiverContact, DoseItem } from '../types';
import { StorageService } from '../services/storage';
import { ReportGeneratorService } from '../services/reportGenerator';
import { InteractionCheckerService, DrugInteractionAlert } from '../services/interactionChecker';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/colors';

interface PatientRecord {
  id: string;
  name: string;
  age: number;
  dob: string;
  gender: string;
  bloodType: string;
  weight: string;
  height: string;
  conditions: string[];
  allergies: string[];
  riskLevel: 'high' | 'medium' | 'stable';
  adherenceRate: number;
  latestBP: string;
  latestGlucose: string;
  phone: string;
  caregiverName: string;
  caregiverPhone: string;
}

const SAMPLE_PATIENTS: PatientRecord[] = [
  {
    id: 'pat-1',
    name: 'Arthur Bennett',
    age: 68,
    dob: '1958-03-14',
    gender: 'Male',
    bloodType: 'O+',
    weight: '84 kg (185 lbs)',
    height: '178 cm (5 ft 10 in)',
    conditions: ['Type 2 Diabetes', 'Essential Hypertension', 'Mild Persistent Asthma'],
    allergies: ['Penicillin (Anaphylaxis)', 'Sulfa Drugs (Rash)'],
    riskLevel: 'medium',
    adherenceRate: 85,
    latestBP: '122/78',
    latestGlucose: '104 mg/dL',
    phone: '+1 (555) 721-0044',
    caregiverName: 'Sarah Bennett (Daughter)',
    caregiverPhone: '+1 (555) 902-1144',
  },
  {
    id: 'pat-2',
    name: 'Eleanor Vance',
    age: 72,
    dob: '1954-08-22',
    gender: 'Female',
    bloodType: 'A-',
    weight: '62 kg (136 lbs)',
    height: '162 cm (5 ft 4 in)',
    conditions: ['Congestive Heart Failure', 'Atrial Fibrillation', 'CKD Stage 2'],
    allergies: ['Aspirin (GI Bleeding)', 'ACE Inhibitors (Severe Cough)'],
    riskLevel: 'high',
    adherenceRate: 64,
    latestBP: '148/92',
    latestGlucose: '138 mg/dL',
    phone: '+1 (555) 342-9912',
    caregiverName: 'David Vance (Son)',
    caregiverPhone: '+1 (555) 883-4412',
  },
  {
    id: 'pat-3',
    name: 'Marcus Davis',
    age: 59,
    dob: '1967-11-05',
    gender: 'Male',
    bloodType: 'B+',
    weight: '91 kg (200 lbs)',
    height: '183 cm (6 ft 0 in)',
    conditions: ['Hypertension', 'Hyperlipidemia', 'Pre-diabetes'],
    allergies: ['No Known Drug Allergies (NKDA)'],
    riskLevel: 'stable',
    adherenceRate: 96,
    latestBP: '118/74',
    latestGlucose: '98 mg/dL',
    phone: '+1 (555) 481-2201',
    caregiverName: 'Elena Davis (Spouse)',
    caregiverPhone: '+1 (555) 774-3321',
  },
];

export const DoctorDashboardScreen: React.FC = () => {
  const { user, switchRole, signOut } = useAuth();
  const [selectedPatientId, setSelectedPatientId] = useState<string>('pat-1');
  const [patientSearch, setPatientSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'medium' | 'stable'>('all');
  const [doctorNote, setDoctorNote] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [activeMeds, setActiveMeds] = useState<Medication[]>([]);
  const [vitals, setVitals] = useState<VitalLog[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [caregiver, setCaregiver] = useState<CaregiverContact | null>(null);
  const [doses, setDoses] = useState<DoseItem[]>([]);
  const [interactionAlerts, setInteractionAlerts] = useState<DrugInteractionAlert[]>([]);

  // Modal States for Prescriptions
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedMedForAdjust, setSelectedMedForAdjust] = useState<Medication | null>(null);

  // New Prescription Form Fields
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedInstructions, setNewMedInstructions] = useState('');
  const [newMedTimes, setNewMedTimes] = useState('08:00, 20:00');
  const [newMedStock, setNewMedStock] = useState('60');
  const [newMedForm, setNewMedForm] = useState<'tablet' | 'capsule' | 'injection' | 'inhaler'>('tablet');

  // Adjust Prescription Form Fields
  const [adjustedDosage, setAdjustedDosage] = useState('');
  const [adjustedInstructions, setAdjustedInstructions] = useState('');

  useEffect(() => {
    loadPatientData();
  }, [selectedPatientId]);

  const loadPatientData = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [m, v, p, c, d] = await Promise.all([
        StorageService.getMedications(),
        StorageService.getVitals(),
        StorageService.getProfile(),
        StorageService.getCaregiver(),
        StorageService.getDailyDoses(todayStr),
      ]);
      setActiveMeds(m);
      setVitals(v);
      setProfile(p);
      setCaregiver(c);
      setDoses(d);
      setInteractionAlerts(InteractionCheckerService.checkInteractions(m));
    } catch (e) {
      console.warn('Error loading patient details:', e);
    }
  };

  const selectedPatient =
    SAMPLE_PATIENTS.find(p => p.id === selectedPatientId) || SAMPLE_PATIENTS[0];

  const filteredPatients = SAMPLE_PATIENTS.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
      p.conditions.some(c => c.toLowerCase().includes(patientSearch.toLowerCase()));
    const matchesRisk = riskFilter === 'all' || p.riskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  });

  // Doctor modifies dosage
  const handleOpenAdjustModal = (med: Medication) => {
    setSelectedMedForAdjust(med);
    setAdjustedDosage(med.dosage);
    setAdjustedInstructions(med.instructions);
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjustedPrescription = async () => {
    if (!selectedMedForAdjust) return;
    if (!adjustedDosage.trim()) {
      Alert.alert('Validation Error', 'Dosage cannot be empty.');
      return;
    }

    try {
      await StorageService.updatePrescription(selectedMedForAdjust.id, {
        dosage: adjustedDosage.trim(),
        instructions: adjustedInstructions.trim() || selectedMedForAdjust.instructions,
      });
      await loadPatientData();
      setIsAdjustModalOpen(false);
      Alert.alert(
        'Prescription Updated',
        `Successfully updated ${selectedMedForAdjust.name} to ${adjustedDosage.trim()} for ${selectedPatient.name}. Daily dose schedule synchronized.`
      );
    } catch (e) {
      Alert.alert('Error', 'Could not update prescription.');
    }
  };

  // Doctor discontinues medication
  const handleDiscontinueMedication = (med: Medication) => {
    Alert.alert(
      'Discontinue Prescription',
      `Are you sure you want to discontinue ${med.name} (${med.dosage}) for ${selectedPatient.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discontinue',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.discontinueMedication(med.id);
              await loadPatientData();
              Alert.alert(
                'Prescription Discontinued',
                `${med.name} has been removed from active prescriptions.`
              );
            } catch {
              Alert.alert('Error', 'Could not discontinue medication.');
            }
          },
        },
      ]
    );
  };

  // Doctor adds new prescription
  const handleSaveNewMedication = async () => {
    if (!newMedName.trim() || !newMedDosage.trim()) {
      Alert.alert('Required Fields', 'Please enter both medication name and dosage.');
      return;
    }

    const timesArray = newMedTimes
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const newMed: Medication = {
      id: `med-${Date.now()}`,
      name: newMedName.trim(),
      dosage: newMedDosage.trim(),
      form: newMedForm,
      color: '#0284C7',
      instructions: newMedInstructions.trim() || 'Take as directed by physician',
      frequency: timesArray.length > 1 ? 'twice_daily' : 'daily',
      times: timesArray.length > 0 ? timesArray : ['08:00'],
      stockCurrent: parseInt(newMedStock, 10) || 30,
      stockRefillAlert: 7,
      prescribedBy: 'Dr. Robert Henderson, M.D.',
      rxNumber: `RX-${Math.floor(100000 + Math.random() * 900000)}`,
      pharmacyName: 'Metro Care Pharmacy',
      pharmacyPhone: '(555) 831-2900',
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    try {
      await StorageService.saveMedication(newMed);
      const todayStr = new Date().toISOString().split('T')[0];
      await StorageService.regenerateDailyDoses(todayStr);
      await loadPatientData();
      setIsAddModalOpen(false);

      // Reset form
      setNewMedName('');
      setNewMedDosage('');
      setNewMedInstructions('');
      setNewMedTimes('08:00, 20:00');
      setNewMedStock('60');

      Alert.alert(
        'Prescription Added',
        `New prescription for ${newMed.name} ${newMed.dosage} prescribed to ${selectedPatient.name}. Schedule updated.`
      );
    } catch {
      Alert.alert('Error', 'Could not add prescription.');
    }
  };

  const handleSendMessage = () => {
    if (!doctorNote.trim()) {
      Alert.alert('Empty Directive', 'Please enter a clinical note or prescription adjustment.');
      return;
    }
    Alert.alert(
      'Directive Dispatched',
      `Clinical message sent directly to ${selectedPatient.name}'s PillGuardian mobile app:\n\n"${doctorNote.trim()}"`
    );
    setDoctorNote('');
  };

  const handleExportAuditPDF = async () => {
    if (!profile || !caregiver) return;
    setIsExporting(true);
    try {
      await ReportGeneratorService.generateDoctorReport(
        profile,
        activeMeds,
        vitals,
        caregiver,
        doses
      );
    } catch {
      Alert.alert('Report Error', 'Could not generate clinical dossier.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Clinician Portal Header */}
      <View style={styles.portalHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.doctorBadge}>
            <Stethoscope size={22} color="#0D9488" />
          </View>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.portalSub}>PHYSICIAN CARE PORTAL • ACTIVE</Text>
            <Text style={styles.doctorName}>Dr. Robert Henderson, M.D.</Text>
            <Text style={styles.hospitalText}>Metropolitan Medical Center • Cardiology RPM</Text>
          </View>
        </View>

        <View style={styles.headerActionRow}>
          <TouchableOpacity
            style={styles.switchRoleBtn}
            onPress={() => switchRole('patient')}
            activeOpacity={0.8}
          >
            <Text style={styles.switchRoleText}>Exit to Patient View</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signOutHeaderBtn}
            onPress={signOut}
            activeOpacity={0.8}
          >
            <LogOut size={13} color="#DC2626" />
            <Text style={styles.signOutHeaderText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* RPM Metric KPI Row */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiNumber}>48</Text>
          <Text style={styles.kpiLabel}>Active Patients</Text>
        </View>
        <View style={[styles.kpiCard, styles.kpiCardWarning]}>
          <Text style={[styles.kpiNumber, { color: '#B45309' }]}>3</Text>
          <Text style={styles.kpiLabel}>Critical BP Spikes</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={[styles.kpiNumber, { color: '#15803D' }]}>91%</Text>
          <Text style={styles.kpiLabel}>Cohort Adherence</Text>
        </View>
      </View>

      {/* Patient Search & Roster Selector */}
      <View style={styles.rosterSection}>
        <Text style={styles.sectionHeading}>Patient Roster & Monitoring Queue</Text>
        <View style={styles.searchBar}>
          <Search size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search patient name, condition, or age..."
            placeholderTextColor="#94A3B8"
            value={patientSearch}
            onChangeText={setPatientSearch}
          />
        </View>

        {/* Risk Filter Chips */}
        <View style={styles.chipRow}>
          {(['all', 'high', 'medium', 'stable'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, riskFilter === f && styles.filterChipActive]}
              onPress={() => setRiskFilter(f)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  riskFilter === f && styles.filterChipTextActive,
                ]}
              >
                {f.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Horizontal Patient Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.patientScroll}>
          {filteredPatients.map(pat => {
            const isSelected = pat.id === selectedPatientId;
            const isHigh = pat.riskLevel === 'high';
            const isMed = pat.riskLevel === 'medium';
            return (
              <TouchableOpacity
                key={pat.id}
                style={[styles.patientCard, isSelected && styles.patientCardSelected]}
                onPress={() => setSelectedPatientId(pat.id)}
                activeOpacity={0.8}
              >
                <View style={styles.patientCardTop}>
                  <Text style={styles.cardPatientName}>{pat.name}</Text>
                  <View
                    style={[
                      styles.riskBadge,
                      isHigh
                        ? styles.riskBadgeHigh
                        : isMed
                        ? styles.riskBadgeMed
                        : styles.riskBadgeStable,
                    ]}
                  >
                    <Text
                      style={[
                        styles.riskBadgeText,
                        isHigh
                          ? styles.riskBadgeTextHigh
                          : isMed
                          ? styles.riskBadgeTextMed
                          : styles.riskBadgeTextStable,
                      ]}
                    >
                      {pat.riskLevel.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardPatientMeta}>Age {pat.age} • {pat.conditions[0]}</Text>
                <View style={styles.adherenceMiniRow}>
                  <Activity size={12} color="#0284C7" />
                  <Text style={styles.adherenceMiniText}>
                    BP: {pat.latestBP} • {pat.adherenceRate}% Adherence
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Selected Patient Detailed Profile Dossier */}
      <View style={styles.detailContainer}>
        {/* Patient Identity Card */}
        <View style={styles.patientIdCard}>
          <View style={styles.patientIdTop}>
            <View>
              <Text style={styles.patientIdName}>{selectedPatient.name}</Text>
              <Text style={styles.patientIdDob}>
                DOB: {selectedPatient.dob} ({selectedPatient.age} yrs) • {selectedPatient.gender} • Blood Type: {selectedPatient.bloodType}
              </Text>
              <Text style={styles.patientIdBio}>
                Height: {selectedPatient.height} • Weight: {selectedPatient.weight}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.exportDossierBtn}
              onPress={handleExportAuditPDF}
              disabled={isExporting}
              activeOpacity={0.8}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <FileDown size={14} color="#FFFFFF" />
                  <Text style={styles.exportDossierText}>Export PDF</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Chronic Diagnoses Tags */}
          <View style={styles.diagnosisContainer}>
            <Text style={styles.diagnosisLabel}>DIAGNOSED CONDITIONS:</Text>
            <View style={styles.tagWrap}>
              {selectedPatient.conditions.map((cond, idx) => (
                <View key={idx} style={styles.conditionTag}>
                  <Text style={styles.conditionTagText}>{cond}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Known Allergies Warning */}
          <View style={styles.allergyContainer}>
            <Text style={styles.allergyLabel}>KNOWN DRUG ALLERGIES:</Text>
            <View style={styles.tagWrap}>
              {selectedPatient.allergies.map((allg, idx) => (
                <View key={idx} style={styles.allergyTag}>
                  <ShieldAlert size={12} color="#B91C1C" />
                  <Text style={styles.allergyTagText}>{allg}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Emergency & Caregiver Contact */}
          <View style={styles.contactMiniRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactMiniLabel}>Primary Caregiver / Proxy:</Text>
              <Text style={styles.contactMiniName}>
                {selectedPatient.caregiverName} ({selectedPatient.caregiverPhone})
              </Text>
            </View>
            <TouchableOpacity
              style={styles.callCaregiverBtn}
              onPress={() => Linking.openURL(`tel:${selectedPatient.caregiverPhone}`)}
            >
              <Phone size={13} color="#0D9488" />
              <Text style={styles.callCaregiverBtnText}>Call Caregiver</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Drug Interactions Safety Alert for Clinician */}
        {interactionAlerts.length > 0 && (
          <View style={styles.clinicianAlertBox}>
            <View style={styles.alertTop}>
              <ShieldAlert size={18} color="#B91C1C" />
              <Text style={styles.alertHeading}>Clinical Drug Interaction Alert</Text>
            </View>
            {interactionAlerts.map(alert => (
              <View key={alert.id} style={{ marginTop: 6 }}>
                <Text style={styles.alertDrugs}>
                  ⚠️ {alert.medicationA} ↔ {alert.medicationB}
                </Text>
                <Text style={styles.alertDetail}>{alert.description}</Text>
                <Text style={styles.alertAdvice}>Clinical Directive: {alert.clinicalAdvice}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Prescription Regimen Section (Doctor can Add, Edit, Discontinue) */}
        <View style={styles.sectionCard}>
          <View style={styles.prescriptionsHeaderRow}>
            <View>
              <Text style={styles.cardHeading}>Active Prescription Regimen</Text>
              <Text style={styles.cardSubheading}>
                Manage medications, adjust dosages, or issue new prescriptions
              </Text>
            </View>

            <TouchableOpacity
              style={styles.addPrescriptionBtn}
              onPress={() => setIsAddModalOpen(true)}
              activeOpacity={0.8}
            >
              <Plus size={14} color="#FFFFFF" />
              <Text style={styles.addPrescriptionBtnText}>Add Prescription</Text>
            </TouchableOpacity>
          </View>

          {activeMeds.filter(m => m.isActive).map(med => (
            <View key={med.id} style={styles.medCardInteractive}>
              <View style={styles.medCardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.medCardName}>
                    {med.name} <Text style={styles.medCardDosage}>({med.dosage})</Text>
                  </Text>
                  <Text style={styles.medCardInstructions}>{med.instructions}</Text>
                  <Text style={styles.medCardTimes}>
                    Schedule: {med.times.join(' • ')} | Form: {med.form}
                  </Text>
                </View>

                <View style={styles.stockCol}>
                  <Text style={styles.stockText}>
                    {med.stockCurrent} in stock {med.stockCurrent <= med.stockRefillAlert ? '🔴' : '🟢'}
                  </Text>
                </View>
              </View>

              {/* Action Buttons for Physician */}
              <View style={styles.medActionsRow}>
                <TouchableOpacity
                  style={styles.adjustDoseBtn}
                  onPress={() => handleOpenAdjustModal(med)}
                  activeOpacity={0.8}
                >
                  <Edit3 size={13} color="#0284C7" />
                  <Text style={styles.adjustDoseBtnText}>Adjust Dosage</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.discontinueBtn}
                  onPress={() => handleDiscontinueMedication(med)}
                  activeOpacity={0.8}
                >
                  <Trash2 size={13} color="#DC2626" />
                  <Text style={styles.discontinueBtnText}>Discontinue</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Recent Vitals & Clinical Biomarkers */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardHeading}>Biomarkers & Vitals Monitoring</Text>
          <View style={styles.vitalsGrid}>
            <View style={styles.vitalBox}>
              <Text style={styles.vitalBoxLabel}>Latest Blood Pressure</Text>
              <Text style={styles.vitalBoxValue}>{selectedPatient.latestBP}</Text>
              <Text style={styles.vitalBoxSub}>Target: &lt;120/80 mmHg (AHA Class I)</Text>
            </View>
            <View style={styles.vitalBox}>
              <Text style={styles.vitalBoxLabel}>Blood Glucose</Text>
              <Text style={styles.vitalBoxValue}>{selectedPatient.latestGlucose}</Text>
              <Text style={styles.vitalBoxSub}>Fasting Target: 80-130 mg/dL</Text>
            </View>
          </View>
        </View>

        {/* Clinical Directives & Messages */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardHeading}>Send Direct Medical Directive to Patient App</Text>
          <Text style={styles.cardSubheading}>
            Orders and clinical notes sent here trigger push alerts on the patient's device
          </Text>
          <TextInput
            style={styles.directiveInput}
            placeholder="e.g. Increase Lisinopril to 20mg daily due to elevated systolic BP. Re-check in 7 days."
            placeholderTextColor="#94A3B8"
            multiline
            value={doctorNote}
            onChangeText={setDoctorNote}
          />
          <TouchableOpacity
            style={styles.sendDirectiveBtn}
            onPress={handleSendMessage}
            activeOpacity={0.8}
          >
            <Send size={14} color="#FFFFFF" />
            <Text style={styles.sendDirectiveText}>Dispatch Clinical Order</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* MODAL: Add New Prescription */}
      <Modal
        visible={isAddModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Issue New Prescription</Text>
                <Text style={styles.modalSub}>Patient: {selectedPatient.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Medication Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Amlodipine, Atorvastatin, Metformin"
                placeholderTextColor="#94A3B8"
                value={newMedName}
                onChangeText={setNewMedName}
              />

              <Text style={styles.fieldLabel}>Dosage & Strength *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 10mg, 500mg, 25mcg"
                placeholderTextColor="#94A3B8"
                value={newMedDosage}
                onChangeText={setNewMedDosage}
              />

              <Text style={styles.fieldLabel}>Dosage Form</Text>
              <View style={styles.formPickerRow}>
                {(['tablet', 'capsule', 'injection', 'inhaler'] as const).map(form => (
                  <TouchableOpacity
                    key={form}
                    style={[styles.formChip, newMedForm === form && styles.formChipSelected]}
                    onPress={() => setNewMedForm(form)}
                  >
                    <Text
                      style={[
                        styles.formChipText,
                        newMedForm === form && styles.formChipTextSelected,
                      ]}
                    >
                      {form.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Scheduled Times (comma separated)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 08:00, 20:00"
                placeholderTextColor="#94A3B8"
                value={newMedTimes}
                onChangeText={setNewMedTimes}
              />

              <Text style={styles.fieldLabel}>Instructions / Food Intake</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Take with breakfast. Avoid grapefruit."
                placeholderTextColor="#94A3B8"
                value={newMedInstructions}
                onChangeText={setNewMedInstructions}
              />

              <Text style={styles.fieldLabel}>Initial Pill Stock Count</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 30 or 60"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={newMedStock}
                onChangeText={setNewMedStock}
              />

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSaveNewMedication}
                activeOpacity={0.8}
              >
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.modalSubmitBtnText}>Save & Authorize Prescription</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL: Adjust Dosage */}
      <Modal
        visible={isAdjustModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsAdjustModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Modify Dosage</Text>
                <Text style={styles.modalSub}>
                  {selectedMedForAdjust?.name} for {selectedPatient.name}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsAdjustModalOpen(false)}>
                <X size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Current Dosage: {selectedMedForAdjust?.dosage}</Text>
            <Text style={styles.fieldLabel}>New Adjusted Dosage *</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 20mg"
              placeholderTextColor="#94A3B8"
              value={adjustedDosage}
              onChangeText={setAdjustedDosage}
            />

            <Text style={styles.fieldLabel}>Updated Clinical Instructions</Text>
            <TextInput
              style={[styles.modalInput, { height: 70 }]}
              multiline
              placeholder="e.g. Increased dosage for blood pressure stabilization. Take once daily in morning."
              placeholderTextColor="#94A3B8"
              value={adjustedInstructions}
              onChangeText={setAdjustedInstructions}
            />

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={handleSaveAdjustedPrescription}
              activeOpacity={0.8}
            >
              <CheckCircle2 size={16} color="#FFFFFF" />
              <Text style={styles.modalSubmitBtnText}>Commit Prescription Change</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  portalHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  doctorBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalSub: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0D9488',
    letterSpacing: 0.8,
  },
  doctorName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  hospitalText: {
    fontSize: 11,
    color: '#64748B',
  },
  headerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  switchRoleBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  switchRoleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  signOutHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 4,
  },
  signOutHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  kpiRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 14,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  kpiCardWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  kpiNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  kpiLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  rosterSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    marginLeft: 8,
    color: '#0F172A',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  filterChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  patientScroll: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  patientCard: {
    width: 210,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  patientCardSelected: {
    borderColor: '#0D9488',
    backgroundColor: '#F0FDFA',
  },
  patientCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardPatientName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardPatientMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 3,
  },
  riskBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  riskBadgeHigh: { backgroundColor: '#FEE2E2' },
  riskBadgeMed: { backgroundColor: '#FEF3C7' },
  riskBadgeStable: { backgroundColor: '#DCFCE7' },
  riskBadgeText: { fontSize: 9, fontWeight: '800' },
  riskBadgeTextHigh: { color: '#B91C1C' },
  riskBadgeTextMed: { color: '#B45309' },
  riskBadgeTextStable: { color: '#15803D' },
  adherenceMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  adherenceMiniText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
  detailContainer: {
    paddingHorizontal: 16,
    marginTop: 4,
  },
  patientIdCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  patientIdTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  patientIdName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  patientIdDob: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    fontWeight: '500',
  },
  patientIdBio: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  exportDossierBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  exportDossierText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  diagnosisContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  diagnosisLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  conditionTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  conditionTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  allergyContainer: {
    marginTop: 10,
  },
  allergyLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B91C1C',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  allergyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  allergyTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
  },
  contactMiniRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  contactMiniLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  contactMiniName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 1,
  },
  callCaregiverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  callCaregiverBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D9488',
  },
  clinicianAlertBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    marginBottom: 14,
  },
  alertTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alertHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B91C1C',
  },
  alertDrugs: {
    fontSize: 12,
    fontWeight: '800',
    color: '#991B1B',
    marginTop: 4,
  },
  alertDetail: {
    fontSize: 11,
    color: '#7F1D1D',
    marginTop: 2,
    lineHeight: 15,
  },
  alertAdvice: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D9488',
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  cardHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSubheading: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 10,
  },
  prescriptionsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  addPrescriptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D9488',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addPrescriptionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  medCardInteractive: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  medCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  medCardName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  medCardDosage: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284C7',
  },
  medCardInstructions: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  medCardTimes: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  stockCol: {
    alignItems: 'flex-end',
  },
  stockText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  medActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  adjustDoseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  adjustDoseBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  discontinueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  discontinueBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  vitalsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  vitalBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vitalBoxLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  vitalBoxValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginVertical: 4,
  },
  vitalBoxSub: {
    fontSize: 10,
    color: '#0D9488',
    fontWeight: '600',
  },
  directiveInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 70,
    textAlignVertical: 'top',
    marginTop: 6,
  },
  sendDirectiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D9488',
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 10,
    gap: 6,
  },
  sendDirectiveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 11,
    color: '#64748B',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginTop: 10,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
  },
  formPickerRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 4,
  },
  formChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formChipSelected: {
    backgroundColor: '#CCFBF1',
    borderColor: '#0D9488',
  },
  formChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  formChipTextSelected: {
    color: '#0D9488',
  },
  modalSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D9488',
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 18,
    marginBottom: 10,
    gap: 6,
  },
  modalSubmitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
