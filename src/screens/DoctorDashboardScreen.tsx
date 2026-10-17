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
  conditions: string[];
  riskLevel: 'high' | 'medium' | 'stable';
  adherenceRate: number;
  latestBP: string;
  latestGlucose: string;
  phone: string;
}

const SAMPLE_PATIENTS: PatientRecord[] = [
  {
    id: 'pat-1',
    name: 'Arthur Bennett',
    age: 68,
    conditions: ['Type 2 Diabetes', 'Hypertension', 'Mild Asthma'],
    riskLevel: 'medium',
    adherenceRate: 85,
    latestBP: '122/78',
    latestGlucose: '104 mg/dL',
    phone: '+1 (555) 721-0044',
  },
  {
    id: 'pat-2',
    name: 'Eleanor Vance',
    age: 72,
    conditions: ['Heart Failure', 'Atrial Fibrillation'],
    riskLevel: 'high',
    adherenceRate: 64,
    latestBP: '148/92',
    latestGlucose: '138 mg/dL',
    phone: '+1 (555) 342-9912',
  },
  {
    id: 'pat-3',
    name: 'Marcus Davis',
    age: 59,
    conditions: ['Hypertension', 'Hyperlipidemia'],
    riskLevel: 'stable',
    adherenceRate: 96,
    latestBP: '118/74',
    latestGlucose: '98 mg/dL',
    phone: '+1 (555) 481-2201',
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
    const matchesSearch = p.name.toLowerCase().includes(patientSearch.toLowerCase());
    const matchesRisk = riskFilter === 'all' || p.riskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  });

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
            <Stethoscope size={20} color="#0D9488" />
          </View>
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.portalSub}>CLINICAL CARE TEAM & RPM PORTAL</Text>
            <Text style={styles.doctorName}>Dr. Robert Henderson, M.D.</Text>
            <Text style={styles.hospitalText}>Metropolitan Medical Center • Cardiology</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.switchRoleBtn}
          onPress={() => switchRole('patient')}
          activeOpacity={0.8}
        >
          <Text style={styles.switchRoleText}>Exit to Patient View</Text>
        </TouchableOpacity>
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
            placeholder="Search patient name or condition..."
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

      {/* Selected Patient Detailed View */}
      <View style={styles.detailContainer}>
        <View style={styles.detailHeader}>
          <View>
            <Text style={styles.detailTitle}>{selectedPatient.name}</Text>
            <Text style={styles.detailSub}>
              Conditions: {selectedPatient.conditions.join(', ')}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.exportDossierBtn}
            onPress={handleExportAuditPDF}
            disabled={isExporting}
            activeOpacity={0.8}
          >
            <FileDown size={14} color="#FFFFFF" />
            <Text style={styles.exportDossierText}>Export Dossier</Text>
          </TouchableOpacity>
        </View>

        {/* Drug Interactions Safety Alert for Clinician */}
        {interactionAlerts.length > 0 && (
          <View style={styles.clinicianAlertBox}>
            <View style={styles.alertTop}>
              <ShieldAlert size={18} color="#B91C1C" />
              <Text style={styles.alertHeading}>Clinical Drug Interaction Alert</Text>
            </View>
            {interactionAlerts.map(alert => (
              <View key={alert.id} style={{ marginTop: 4 }}>
                <Text style={styles.alertDrugs}>
                  ⚠️ {alert.medicationA} ↔ {alert.medicationB}
                </Text>
                <Text style={styles.alertDetail}>{alert.description}</Text>
                <Text style={styles.alertAdvice}>Doctor Rec: {alert.clinicalAdvice}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Current Active Prescriptions */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardHeading}>Current Prescription Regimen</Text>
          {activeMeds.slice(0, 4).map(med => (
            <View key={med.id} style={styles.medRow}>
              <View style={styles.medInfo}>
                <Text style={styles.medNameText}>{med.name} ({med.dosage})</Text>
                <Text style={styles.medInstructionText}>{med.instructions}</Text>
              </View>
              <View style={styles.stockCol}>
                <Text style={styles.stockText}>
                  {med.stockCurrent} left {med.stockCurrent <= med.stockRefillAlert ? '🔴' : '🟢'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Recent Vitals Biomarkers */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardHeading}>Recent Biomarkers & Vitals</Text>
          <View style={styles.vitalsGrid}>
            <View style={styles.vitalBox}>
              <Text style={styles.vitalBoxLabel}>Latest Blood Pressure</Text>
              <Text style={styles.vitalBoxValue}>{selectedPatient.latestBP}</Text>
              <Text style={styles.vitalBoxSub}>Target: &lt;120/80 mmHg</Text>
            </View>
            <View style={styles.vitalBox}>
              <Text style={styles.vitalBoxLabel}>Blood Glucose</Text>
              <Text style={styles.vitalBoxValue}>{selectedPatient.latestGlucose}</Text>
              <Text style={styles.vitalBoxSub}>Fasting Target: 80-130</Text>
            </View>
          </View>
        </View>

        {/* Clinical Directives & Messages */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardHeading}>Send Clinical Directive to Patient App</Text>
          <TextInput
            style={styles.directiveInput}
            placeholder="e.g. Adjust Lisinopril to 20mg daily. Log morning resting pulse."
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
            <Text style={styles.sendDirectiveText}>Push Clinical Directive</Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: 10,
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
  switchRoleBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  switchRoleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
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
    width: 200,
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
  cardPatientMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  adherenceMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  adherenceMiniText: {
    fontSize: 10,
    color: '#334155',
    fontWeight: '600',
    marginLeft: 4,
  },
  detailContainer: {
    paddingHorizontal: 16,
    marginTop: 6,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  detailSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  exportDossierBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  exportDossierText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 4,
  },
  clinicianAlertBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  alertTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B91C1C',
    marginLeft: 6,
  },
  alertDrugs: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7F1D1D',
  },
  alertDetail: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  alertAdvice: {
    fontSize: 11,
    color: '#0F766E',
    fontWeight: '600',
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  cardHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  medRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  medInfo: {
    flex: 1,
  },
  medNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  medInstructionText: {
    fontSize: 11,
    color: '#64748B',
  },
  stockCol: {
    alignItems: 'flex-end',
  },
  stockText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  vitalsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  vitalBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vitalBoxLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  vitalBoxValue: {
    fontSize: 16,
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
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 12,
    color: '#0F172A',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  sendDirectiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D9488',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  sendDirectiveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 6,
  },
});
