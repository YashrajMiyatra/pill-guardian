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
  DollarSign,
  Sparkles,
  ClipboardList,
} from 'lucide-react-native';
import { Medication, VitalLog, UserProfile, CaregiverContact, DoseItem } from '../types';
import { StorageService } from '../services/storage';
import { ReportGeneratorService } from '../services/reportGenerator';
import { InteractionCheckerService, DrugInteractionAlert } from '../services/interactionChecker';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/colors';

type DoctorTab = 'patients' | 'rx' | 'vitals' | 'orders';

interface PatientRecord {
  id: string;
  name: string;
  age: number;
  dob: string;
  gender: string;
  bloodType: string;
  weight: string;
  height: string;
  bmi: string;
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
    bmi: '26.5 (Overweight I)',
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
    bmi: '23.6 (Normal)',
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
    bmi: '27.2 (Overweight I)',
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

const CLINICAL_PRESETS = [
  'Titrate Lisinopril to 20mg PO daily for systolic control. Re-check BP in 7 days.',
  'Order Fasting Metabolic Panel (HbA1c, BUN, Serum Creatinine, eGFR).',
  'Restrict dietary sodium to <2,000 mg/day and log morning weights.',
  'Schedule 14-day Telehealth RPM follow-up with cardiology team.',
];

export const DoctorDashboardScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<DoctorTab>('patients');
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

  // Prescription Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedMedForAdjust, setSelectedMedForAdjust] = useState<Medication | null>(null);

  // New Prescription Form
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedInstructions, setNewMedInstructions] = useState('');
  const [newMedTimes, setNewMedTimes] = useState('08:00, 20:00');
  const [newMedStock, setNewMedStock] = useState('60');
  const [newMedForm, setNewMedForm] = useState<'tablet' | 'capsule' | 'injection' | 'inhaler'>('tablet');

  // Adjust Form
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
        `Updated ${selectedMedForAdjust.name} to ${adjustedDosage.trim()} for ${selectedPatient.name}. Schedule updated.`
      );
    } catch {
      Alert.alert('Error', 'Could not update prescription.');
    }
  };

  // Doctor discontinues medication
  const handleDiscontinueMedication = (med: Medication) => {
    Alert.alert(
      'Discontinue Prescription',
      `Discontinue ${med.name} (${med.dosage}) for ${selectedPatient.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discontinue',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.discontinueMedication(med.id);
              await loadPatientData();
              Alert.alert('Prescription Discontinued', `${med.name} discontinued from active regimen.`);
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
      Alert.alert('Required Fields', 'Please enter medication name and dosage.');
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
      prescribedBy: user?.fullName || 'Dr. Robert Henderson, M.D.',
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

      setNewMedName('');
      setNewMedDosage('');
      setNewMedInstructions('');
      setNewMedTimes('08:00, 20:00');
      setNewMedStock('60');

      Alert.alert(
        'Prescription Authorized',
        `Prescription for ${newMed.name} (${newMed.dosage}) added to ${selectedPatient.name}'s regimen.`
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
      `Clinical order sent directly to ${selectedPatient.name}'s phone:\n\n"${doctorNote.trim()}"`
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
    <View style={styles.screenWrapper}>
      {/* Doctor Top Clinical Header */}
      <View style={styles.docHeader}>
        <View style={styles.docHeaderLeft}>
          <View style={styles.stethoscopeBadge}>
            <Stethoscope size={20} color="#0D9488" />
          </View>
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.brandMD}>PILLGUARDIAN MD • CLINICAL WORKSTATION</Text>
            <Text style={styles.physicianName}>{user?.fullName || 'Dr. Robert Henderson, M.D.'}</Text>
            <Text style={styles.hospitalAffiliation}>Metropolitan Heart & Chronic Care • NPI #1982736410</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.signOutDocBtn} onPress={signOut} activeOpacity={0.8}>
          <LogOut size={13} color="#DC2626" />
          <Text style={styles.signOutDocText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Patient Active Bar */}
      <View style={styles.activePatientBar}>
        <Text style={styles.activePatientLabel}>CURRENT PATIENT:</Text>
        <Text style={styles.activePatientName}>{selectedPatient.name}</Text>
        <Text style={styles.activePatientMeta}>
          ({selectedPatient.age}y {selectedPatient.gender.charAt(0)} • {selectedPatient.conditions[0]})
        </Text>
      </View>

      {/* Main Content Area */}
      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {/* TAB 1: PATIENTS & COHORT */}
        {activeTab === 'patients' && (
          <View style={styles.tabContent}>
            {/* KPI Cards */}
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiNumber}>48</Text>
                <Text style={styles.kpiLabel}>Enrolled Patients</Text>
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

            {/* Roster & Search */}
            <View style={styles.searchBar}>
              <Search size={15} color="#94A3B8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search patient name, condition..."
                placeholderTextColor="#94A3B8"
                value={patientSearch}
                onChangeText={setPatientSearch}
              />
            </View>

            {/* Risk Chips */}
            <View style={styles.chipRow}>
              {(['all', 'high', 'medium', 'stable'] as const).map(f => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterChip, riskFilter === f && styles.filterChipActive]}
                  onPress={() => setRiskFilter(f)}
                >
                  <Text style={[styles.filterChipText, riskFilter === f && styles.filterChipTextActive]}>
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
                          isHigh ? styles.riskBadgeHigh : isMed ? styles.riskBadgeMed : styles.riskBadgeStable,
                        ]}
                      >
                        <Text
                          style={[
                            styles.riskBadgeText,
                            isHigh ? styles.riskBadgeTextHigh : isMed ? styles.riskBadgeTextMed : styles.riskBadgeTextStable,
                          ]}
                        >
                          {pat.riskLevel.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.cardPatientMeta}>Age {pat.age} • {pat.conditions[0]}</Text>
                    <Text style={styles.cardPatientSub}>BP: {pat.latestBP} • {pat.adherenceRate}% Adherence</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Comprehensive Patient Dossier Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Patient Medical Profile</Text>
                <TouchableOpacity style={styles.exportBtnSmall} onPress={handleExportAuditPDF}>
                  <FileDown size={13} color="#FFFFFF" />
                  <Text style={styles.exportBtnSmallText}>Export PDF</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.dossierName}>{selectedPatient.name}</Text>
              <Text style={styles.dossierMeta}>
                DOB: {selectedPatient.dob} ({selectedPatient.age}y) • {selectedPatient.gender} • Blood Type: {selectedPatient.bloodType}
              </Text>
              <Text style={styles.dossierBio}>
                Height: {selectedPatient.height} • Weight: {selectedPatient.weight} • BMI: {selectedPatient.bmi}
              </Text>

              {/* Diagnoses */}
              <Text style={styles.sectionSubLabel}>DIAGNOSED CONDITIONS:</Text>
              <View style={styles.tagWrap}>
                {selectedPatient.conditions.map((cond, i) => (
                  <View key={i} style={styles.condTag}>
                    <Text style={styles.condTagText}>{cond}</Text>
                  </View>
                ))}
              </View>

              {/* Allergies */}
              <Text style={[styles.sectionSubLabel, { color: '#B91C1C', marginTop: 10 }]}>CRITICAL DRUG ALLERGIES:</Text>
              <View style={styles.tagWrap}>
                {selectedPatient.allergies.map((allg, i) => (
                  <View key={i} style={styles.allgTag}>
                    <ShieldAlert size={12} color="#B91C1C" />
                    <Text style={styles.allgTagText}>{allg}</Text>
                  </View>
                ))}
              </View>

              {/* Caregiver */}
              <View style={styles.caregiverRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.caregiverLabel}>Designated Proxy / Caregiver:</Text>
                  <Text style={styles.caregiverName}>{selectedPatient.caregiverName}</Text>
                  <Text style={styles.caregiverPhone}>{selectedPatient.caregiverPhone}</Text>
                </View>
                <TouchableOpacity
                  style={styles.callProxyBtn}
                  onPress={() => Linking.openURL(`tel:${selectedPatient.caregiverPhone}`)}
                >
                  <Phone size={13} color="#0D9488" />
                  <Text style={styles.callProxyText}>Call Caregiver</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* TAB 2: RX PAD & PRESCRIPTIONS */}
        {activeTab === 'rx' && (
          <View style={styles.tabContent}>
            {/* Drug Interaction Alert */}
            {interactionAlerts.length > 0 && (
              <View style={styles.alertBox}>
                <View style={styles.alertTop}>
                  <ShieldAlert size={16} color="#B91C1C" />
                  <Text style={styles.alertTitle}>Clinical Drug-Drug Interaction Warning</Text>
                </View>
                {interactionAlerts.map(alert => (
                  <View key={alert.id} style={{ marginTop: 4 }}>
                    <Text style={styles.alertDrugs}>⚠️ {alert.medicationA} ↔ {alert.medicationB}</Text>
                    <Text style={styles.alertDesc}>{alert.description}</Text>
                    <Text style={styles.alertAdvice}>Directive: {alert.clinicalAdvice}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Prescription Regimen Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.cardTitle}>Active Prescriptions ({activeMeds.filter(m => m.isActive).length})</Text>
                  <Text style={styles.cardSub}>Authorized medications for {selectedPatient.name}</Text>
                </View>
                <TouchableOpacity style={styles.addRxBtn} onPress={() => setIsAddModalOpen(true)}>
                  <Plus size={14} color="#FFFFFF" />
                  <Text style={styles.addRxBtnText}>+ Prescribe</Text>
                </TouchableOpacity>
              </View>

              {activeMeds.filter(m => m.isActive).map(med => (
                <View key={med.id} style={styles.medItem}>
                  <View style={styles.medItemTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.medItemName}>
                        {med.name} <Text style={styles.medItemDosage}>({med.dosage})</Text>
                      </Text>
                      <Text style={styles.medItemInstructions}>{med.instructions}</Text>
                      <Text style={styles.medItemTimes}>Times: {med.times.join(' • ')} • Form: {med.form}</Text>
                    </View>
                    <View style={styles.stockBadge}>
                      <Text style={styles.stockBadgeText}>{med.stockCurrent} in stock {med.stockCurrent <= 7 ? '🔴' : '🟢'}</Text>
                    </View>
                  </View>

                  <View style={styles.medItemActions}>
                    <TouchableOpacity style={styles.adjustBtn} onPress={() => handleOpenAdjustModal(med)}>
                      <Edit3 size={13} color="#0284C7" />
                      <Text style={styles.adjustBtnText}>Adjust Dosage</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.discontinueBtn} onPress={() => handleDiscontinueMedication(med)}>
                      <Trash2 size={13} color="#DC2626" />
                      <Text style={styles.discontinueBtnText}>Discontinue</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <View style={styles.ePrescribeSignature}>
                <ShieldCheck size={14} color="#0D9488" />
                <Text style={styles.ePrescribeText}>
                  Digitally Authorized by {user?.fullName || 'Dr. Robert Henderson, M.D.'} • E-Prescribe Certified
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* TAB 3: RPM VITALS & REIMBURSEMENT */}
        {activeTab === 'vitals' && (
          <View style={styles.tabContent}>
            {/* Vitals Overview */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Real-time Biomarkers & Vitals</Text>
              <Text style={styles.cardSub}>Continuous remote transmissions from {selectedPatient.name}</Text>

              <View style={styles.vitalsGrid}>
                <View style={styles.vitalCard}>
                  <Text style={styles.vitalLabel}>Blood Pressure</Text>
                  <Text style={styles.vitalValue}>{selectedPatient.latestBP}</Text>
                  <Text style={styles.vitalSub}>AHA Category: Optimal</Text>
                </View>
                <View style={styles.vitalCard}>
                  <Text style={styles.vitalLabel}>Blood Glucose</Text>
                  <Text style={styles.vitalValue}>{selectedPatient.latestGlucose}</Text>
                  <Text style={styles.vitalSub}>ADA Fasting Target</Text>
                </View>
              </View>
            </View>

            {/* Medicare RPM Reimbursement Compliance */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Medicare RPM Billing Tracker</Text>
                <View style={styles.rpmQualifyBadge}>
                  <DollarSign size={12} color="#15803D" />
                  <Text style={styles.rpmQualifyText}>QUALIFIED</Text>
                </View>
              </View>
              <Text style={styles.cardSub}>CMS Remote Patient Monitoring Compliance for {selectedPatient.name}</Text>

              <View style={styles.cptRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cptCode}>CPT 99453 — Initial RPM Setup</Text>
                  <Text style={styles.cptDesc}>Device onboarding & patient training ($19.20)</Text>
                </View>
                <Text style={styles.cptStatus}>✓ Billed</Text>
              </View>

              <View style={styles.cptRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cptCode}>CPT 99454 — 16+ Days Transmissions</Text>
                  <Text style={styles.cptDesc}>21 / 30 transmission days completed ($48.80)</Text>
                </View>
                <Text style={styles.cptStatusActive}>✓ Qualified</Text>
              </View>

              <View style={styles.cptRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cptCode}>CPT 99457 — Clinical RPM Management</Text>
                  <Text style={styles.cptDesc}>24 / 20 minutes clinical staff review ($51.40)</Text>
                </View>
                <Text style={styles.cptStatusActive}>✓ Qualified</Text>
              </View>

              <View style={styles.rpmTotalCard}>
                <Text style={styles.rpmTotalLabel}>Est. Monthly Practice Revenue per Patient:</Text>
                <Text style={styles.rpmTotalAmount}>$119.40 / month</Text>
              </View>
            </View>
          </View>
        )}

        {/* TAB 4: ORDERS & DIRECTIVES */}
        {activeTab === 'orders' && (
          <View style={styles.tabContent}>
            {/* Quick Presets */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>1-Tap Clinical Presets</Text>
              <Text style={styles.cardSub}>Select a preset directive to populate order</Text>

              {CLINICAL_PRESETS.map((preset, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.presetItem}
                  onPress={() => setDoctorNote(preset)}
                  activeOpacity={0.7}
                >
                  <Sparkles size={14} color="#0D9488" />
                  <Text style={styles.presetText}>{preset}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Directive Input */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Dispatch Directive to Patient App</Text>
              <Text style={styles.cardSub}>Pushes a high-priority clinical instruction directly to {selectedPatient.name}'s device</Text>

              <TextInput
                style={styles.orderInput}
                placeholder="Enter customized physician directive or regimen adjustment..."
                placeholderTextColor="#94A3B8"
                multiline
                value={doctorNote}
                onChangeText={setDoctorNote}
              />

              <TouchableOpacity style={styles.dispatchBtn} onPress={handleSendMessage}>
                <Send size={15} color="#FFFFFF" />
                <Text style={styles.dispatchBtnText}>Dispatch Clinical Order</Text>
              </TouchableOpacity>
            </View>

            {/* Clinical Dossier PDF Export */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Complete Medical Dossier PDF</Text>
              <Text style={styles.cardSub}>Generate an audit-grade clinical dossier including all medications, vitals, and logs</Text>
              <TouchableOpacity style={styles.exportFullBtn} onPress={handleExportAuditPDF} disabled={isExporting}>
                {isExporting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <FileDown size={16} color="#FFFFFF" />
                    <Text style={styles.exportFullBtnText}>Export & Share Patient Dossier</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Doctor Bottom Tab Navigation Bar */}
      <View style={styles.docTabBar}>
        <TouchableOpacity
          style={styles.docTabItem}
          onPress={() => setActiveTab('patients')}
          activeOpacity={0.7}
        >
          <Users size={20} color={activeTab === 'patients' ? '#0D9488' : '#94A3B8'} strokeWidth={activeTab === 'patients' ? 2.5 : 2} />
          <Text style={[styles.docTabLabel, activeTab === 'patients' && styles.docTabLabelActive]}>Patients</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.docTabItem}
          onPress={() => setActiveTab('rx')}
          activeOpacity={0.7}
        >
          <Pill size={20} color={activeTab === 'rx' ? '#0D9488' : '#94A3B8'} strokeWidth={activeTab === 'rx' ? 2.5 : 2} />
          <Text style={[styles.docTabLabel, activeTab === 'rx' && styles.docTabLabelActive]}>Rx Pad</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.docTabItem}
          onPress={() => setActiveTab('vitals')}
          activeOpacity={0.7}
        >
          <Activity size={20} color={activeTab === 'vitals' ? '#0D9488' : '#94A3B8'} strokeWidth={activeTab === 'vitals' ? 2.5 : 2} />
          <Text style={[styles.docTabLabel, activeTab === 'vitals' && styles.docTabLabelActive]}>RPM Vitals</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.docTabItem}
          onPress={() => setActiveTab('orders')}
          activeOpacity={0.7}
        >
          <Send size={20} color={activeTab === 'orders' ? '#0D9488' : '#94A3B8'} strokeWidth={activeTab === 'orders' ? 2.5 : 2} />
          <Text style={[styles.docTabLabel, activeTab === 'orders' && styles.docTabLabelActive]}>Directives</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL: Add Prescription */}
      <Modal visible={isAddModalOpen} animationType="slide" transparent onRequestClose={() => setIsAddModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.modalTop}>
              <View>
                <Text style={styles.modalTitle}>Issue New Prescription</Text>
                <Text style={styles.modalSub}>Patient: {selectedPatient.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Medication Name *</Text>
              <TextInput style={styles.input} placeholder="e.g. Amlodipine, Metformin, Losartan" placeholderTextColor="#94A3B8" value={newMedName} onChangeText={setNewMedName} />

              <Text style={styles.label}>Dosage & Strength *</Text>
              <TextInput style={styles.input} placeholder="e.g. 10mg, 500mg, 25mcg" placeholderTextColor="#94A3B8" value={newMedDosage} onChangeText={setNewMedDosage} />

              <Text style={styles.label}>Dosage Form</Text>
              <View style={styles.formRow}>
                {(['tablet', 'capsule', 'injection', 'inhaler'] as const).map(f => (
                  <TouchableOpacity key={f} style={[styles.formChip, newMedForm === f && styles.formChipActive]} onPress={() => setNewMedForm(f)}>
                    <Text style={[styles.formChipText, newMedForm === f && styles.formChipTextActive]}>{f.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Times (comma separated)</Text>
              <TextInput style={styles.input} placeholder="e.g. 08:00, 20:00" placeholderTextColor="#94A3B8" value={newMedTimes} onChangeText={setNewMedTimes} />

              <Text style={styles.label}>Instructions</Text>
              <TextInput style={styles.input} placeholder="e.g. Take with food" placeholderTextColor="#94A3B8" value={newMedInstructions} onChangeText={setNewMedInstructions} />

              <Text style={styles.label}>Initial Dispense Quantity</Text>
              <TextInput style={styles.input} keyboardType="numeric" placeholder="60" placeholderTextColor="#94A3B8" value={newMedStock} onChangeText={setNewMedStock} />

              <TouchableOpacity style={styles.submitModalBtn} onPress={handleSaveNewMedication}>
                <Plus size={15} color="#FFFFFF" />
                <Text style={styles.submitModalBtnText}>Authorize Prescription</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL: Adjust Dosage */}
      <Modal visible={isAdjustModalOpen} animationType="fade" transparent onRequestClose={() => setIsAdjustModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.modalTop}>
              <View>
                <Text style={styles.modalTitle}>Adjust Dosage</Text>
                <Text style={styles.modalSub}>{selectedMedForAdjust?.name} for {selectedPatient.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setIsAdjustModalOpen(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Current Dosage: {selectedMedForAdjust?.dosage}</Text>
            <Text style={styles.label}>New Adjusted Dosage *</Text>
            <TextInput style={styles.input} placeholder="e.g. 20mg" placeholderTextColor="#94A3B8" value={adjustedDosage} onChangeText={setAdjustedDosage} />

            <Text style={styles.label}>Updated Clinical Notes</Text>
            <TextInput style={[styles.input, { height: 60 }]} multiline placeholder="Reason for titration..." placeholderTextColor="#94A3B8" value={adjustedInstructions} onChangeText={setAdjustedInstructions} />

            <TouchableOpacity style={styles.submitModalBtn} onPress={handleSaveAdjustedPrescription}>
              <CheckCircle2 size={15} color="#FFFFFF" />
              <Text style={styles.submitModalBtnText}>Commit Change</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  docHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  docHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  stethoscopeBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMD: {
    fontSize: 9,
    fontWeight: '900',
    color: '#0D9488',
    letterSpacing: 0.8,
  },
  physicianName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  hospitalAffiliation: {
    fontSize: 10,
    color: '#64748B',
  },
  signOutDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  signOutDocText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  activePatientBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderBottomWidth: 1,
    borderBottomColor: '#CCFBF1',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 6,
  },
  activePatientLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0D9488',
    letterSpacing: 0.5,
  },
  activePatientName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  activePatientMeta: {
    fontSize: 11,
    color: '#64748B',
  },
  scrollArea: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
    gap: 14,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  kpiCardWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  kpiNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  kpiLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    marginLeft: 8,
    color: '#0F172A',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 8,
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
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  patientScroll: {
    flexDirection: 'row',
  },
  patientCard: {
    width: 190,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginRight: 8,
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
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardPatientMeta: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  cardPatientSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0284C7',
    marginTop: 4,
  },
  riskBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  riskBadgeHigh: { backgroundColor: '#FEE2E2' },
  riskBadgeMed: { backgroundColor: '#FEF3C7' },
  riskBadgeStable: { backgroundColor: '#DCFCE7' },
  riskBadgeText: { fontSize: 8, fontWeight: '800' },
  riskBadgeTextHigh: { color: '#B91C1C' },
  riskBadgeTextMed: { color: '#B45309' },
  riskBadgeTextStable: { color: '#15803D' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSub: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 10,
  },
  dossierName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  dossierMeta: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  dossierBio: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  sectionSubLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 4,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  condTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  condTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#334155',
  },
  allgTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    gap: 3,
  },
  allgTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B91C1C',
  },
  caregiverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  caregiverLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  caregiverName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  caregiverPhone: {
    fontSize: 10,
    color: '#64748B',
  },
  callProxyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  callProxyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D9488',
  },
  exportBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  exportBtnSmallText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  alertBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#FECACA',
  },
  alertTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B91C1C',
  },
  alertDrugs: {
    fontSize: 11,
    fontWeight: '800',
    color: '#991B1B',
    marginTop: 4,
  },
  alertDesc: {
    fontSize: 10,
    color: '#7F1D1D',
    marginTop: 1,
  },
  alertAdvice: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D9488',
    marginTop: 3,
  },
  addRxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D9488',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  addRxBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  medItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  medItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  medItemName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  medItemDosage: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  medItemInstructions: {
    fontSize: 11,
    color: '#475569',
    marginTop: 1,
  },
  medItemTimes: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  stockBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  medItemActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  adjustBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    gap: 3,
  },
  adjustBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },
  discontinueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    gap: 3,
  },
  discontinueBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  ePrescribeSignature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
    gap: 6,
  },
  ePrescribeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0D9488',
    flex: 1,
  },
  vitalsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  vitalCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vitalLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  vitalValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginVertical: 2,
  },
  vitalSub: {
    fontSize: 9,
    color: '#0D9488',
    fontWeight: '600',
  },
  rpmQualifyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  rpmQualifyText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },
  cptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cptCode: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  cptDesc: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  cptStatus: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  cptStatusActive: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  rpmTotalCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rpmTotalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
  },
  rpmTotalAmount: {
    fontSize: 14,
    fontWeight: '900',
    color: '#15803D',
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 9,
    marginBottom: 6,
    gap: 8,
  },
  presetText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  orderInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: 12,
    color: '#0F172A',
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  dispatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D9488',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  dispatchBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  exportFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
    marginTop: 6,
  },
  exportFullBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Bottom Doctor Tabs
  docTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
    paddingBottom: 14,
  },
  docTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  docTabLabelActive: {
    color: '#0D9488',
    fontWeight: '800',
  },
  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    maxHeight: '85%',
  },
  modalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 10,
    color: '#64748B',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    marginTop: 8,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    color: '#0F172A',
  },
  formRow: {
    flexDirection: 'row',
    gap: 4,
    marginVertical: 4,
  },
  formChip: {
    flex: 1,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formChipActive: {
    backgroundColor: '#CCFBF1',
    borderColor: '#0D9488',
  },
  formChipText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  formChipTextActive: {
    color: '#0D9488',
  },
  submitModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D9488',
    borderRadius: 10,
    paddingVertical: 11,
    marginTop: 14,
    marginBottom: 8,
    gap: 6,
  },
  submitModalBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
