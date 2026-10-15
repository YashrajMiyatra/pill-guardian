import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Phone,
  MessageSquare,
  FileDown,
  ShieldAlert,
  UserCheck,
  Stethoscope,
  HeartHandshake,
  AlertCircle,
} from 'lucide-react-native';
import { UserProfile, CaregiverContact, Medication, VitalLog, DoseItem } from '../types';
import { StorageService } from '../services/storage';
import { ReportGeneratorService } from '../services/reportGenerator';
import { Colors } from '../theme/colors';

export const CaregiverScreen: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [caregiver, setCaregiver] = useState<CaregiverContact | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [vitals, setVitals] = useState<VitalLog[]>([]);
  const [doses, setDoses] = useState<DoseItem[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [p, c, m, v, d] = await Promise.all([
        StorageService.getProfile(),
        StorageService.getCaregiver(),
        StorageService.getMedications(),
        StorageService.getVitals(),
        StorageService.getDailyDoses(todayStr),
      ]);
      setProfile(p);
      setCaregiver(c);
      setMedications(m);
      setVitals(v);
      setDoses(d);
    } catch (e) {
      console.error('Error loading Caregiver data:', e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCallCaregiver = () => {
    if (caregiver?.phone) {
      Linking.openURL(`tel:${caregiver.phone}`);
    } else {
      Alert.alert('No Phone', 'No caregiver phone number recorded.');
    }
  };

  const handleSmsCaregiver = () => {
    if (caregiver?.phone) {
      const msg = encodeURIComponent(
        `Hi ${caregiver.name}, sending an update from PillGuardian. My scheduled medications and vitals have been logged.`
      );
      Linking.openURL(`sms:${caregiver.phone}?body=${msg}`);
    }
  };

  const handleCallDoctor = () => {
    if (profile?.primaryDoctor?.phone) {
      Linking.openURL(`tel:${profile.primaryDoctor.phone}`);
    }
  };

  const handleExportPDF = async () => {
    if (!profile || !caregiver) return;
    setIsExporting(true);
    try {
      await ReportGeneratorService.generateDoctorReport(
        profile,
        medications,
        vitals,
        caregiver,
        doses
      );
    } catch (e) {
      Alert.alert('Report Error', 'Could not generate clinical report PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!profile || !caregiver) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284C7" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerSub}>SAFETY & CARE TEAM</Text>
        <Text style={styles.headerTitle}>Caregiver & SOS</Text>
      </View>

      {/* Emergency Medical ID Card */}
      <View style={styles.medicalIdCard}>
        <View style={styles.medicalIdTop}>
          <ShieldAlert size={22} color="#DC2626" />
          <Text style={styles.medicalIdTitle}>Emergency Medical ID</Text>
        </View>

        <View style={styles.patientRow}>
          <Text style={styles.patientName}>{profile.fullName}</Text>
          <View style={styles.bloodBadge}>
            <Text style={styles.bloodBadgeText}>{profile.bloodType}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Drug Allergies */}
        <Text style={styles.infoLabel}>CRITICAL DRUG ALLERGIES:</Text>
        <View style={styles.allergyList}>
          {profile.allergies.map((allergy, i) => (
            <View key={i} style={styles.allergyTag}>
              <AlertCircle size={12} color="#B91C1C" />
              <Text style={styles.allergyText}>{allergy}</Text>
            </View>
          ))}
        </View>

        {/* Chronic Conditions */}
        <Text style={[styles.infoLabel, { marginTop: 10 }]}>CHRONIC CONDITIONS:</Text>
        <Text style={styles.conditionsText}>{profile.chronicConditions.join(' • ')}</Text>

        {profile.emergencyNotes && (
          <View style={styles.emergencyNotesBox}>
            <Text style={styles.emergencyNotesText}>⚠️ {profile.emergencyNotes}</Text>
          </View>
        )}
      </View>

      {/* Primary Caregiver Card */}
      <View style={styles.contactCard}>
        <View style={styles.contactTop}>
          <View style={styles.contactIconBg}>
            <HeartHandshake size={24} color="#0284C7" />
          </View>
          <View style={styles.contactMeta}>
            <Text style={styles.contactRole}>PRIMARY CAREGIVER</Text>
            <Text style={styles.contactName}>{caregiver.name}</Text>
            <Text style={styles.contactRelation}>{caregiver.relationship}</Text>
          </View>
        </View>

        <View style={styles.actionButtonGroup}>
          <TouchableOpacity
            style={styles.callBtn}
            onPress={handleCallCaregiver}
            activeOpacity={0.8}
          >
            <Phone size={16} color="#FFFFFF" />
            <Text style={styles.callBtnText}>Call Caregiver</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.smsBtn}
            onPress={handleSmsCaregiver}
            activeOpacity={0.8}
          >
            <MessageSquare size={16} color="#0284C7" />
            <Text style={styles.smsBtnText}>SMS Check-in</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Attending Physician Card */}
      <View style={styles.contactCard}>
        <View style={styles.contactTop}>
          <View style={[styles.contactIconBg, { backgroundColor: '#CCFBF1' }]}>
            <Stethoscope size={24} color="#0D9488" />
          </View>
          <View style={styles.contactMeta}>
            <Text style={[styles.contactRole, { color: '#0D9488' }]}>ATTENDING PHYSICIAN</Text>
            <Text style={styles.contactName}>{profile.primaryDoctor.name}</Text>
            <Text style={styles.contactRelation}>
              {profile.primaryDoctor.specialty} • {profile.primaryDoctor.hospital}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtonGroup}>
          <TouchableOpacity
            style={[styles.callBtn, { backgroundColor: '#0D9488' }]}
            onPress={handleCallDoctor}
            activeOpacity={0.8}
          >
            <Phone size={16} color="#FFFFFF" />
            <Text style={styles.callBtnText}>Call Clinic</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Export Clinical PDF Card */}
      <View style={styles.exportCard}>
        <View style={styles.exportTop}>
          <FileDown size={28} color="#0284C7" />
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text style={styles.exportTitle}>Clinical Adherence Dossier</Text>
            <Text style={styles.exportSub}>
              Generate a doctor-ready PDF report including current medication regimen, vitals logs, and adherence records.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.exportBtn}
          onPress={handleExportPDF}
          disabled={isExporting}
          activeOpacity={0.8}
        >
          {isExporting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <FileDown size={18} color="#FFFFFF" />
              <Text style={styles.exportBtnText}>Generate & Share Medical PDF</Text>
            </>
          )}
        </TouchableOpacity>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
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
  medicalIdCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  medicalIdTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  medicalIdTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginLeft: 8,
  },
  patientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  bloodBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  bloodBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B91C1C',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  allergyList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  allergyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  allergyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
    marginLeft: 4,
  },
  conditionsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  emergencyNotesBox: {
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
  },
  emergencyNotesText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  contactIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactMeta: {
    marginLeft: 14,
    flex: 1,
  },
  contactRole: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
    letterSpacing: 0.8,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  contactRelation: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  actionButtonGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    borderRadius: 12,
  },
  callBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 6,
  },
  smsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F2FE',
    paddingVertical: 10,
    borderRadius: 12,
  },
  smsBtnText: {
    color: '#0284C7',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 6,
  },
  exportCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 16,
  },
  exportTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  exportTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0369A1',
  },
  exportSub: {
    fontSize: 12,
    color: '#475569',
    marginTop: 3,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  exportBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
});
