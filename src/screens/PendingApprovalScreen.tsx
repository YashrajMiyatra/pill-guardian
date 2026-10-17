import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Clock, ShieldAlert, CheckCircle2, Stethoscope, RefreshCw, LogOut, PhoneCall } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storage';

export const PendingApprovalScreen: React.FC = () => {
  const { user, signOut, refreshUserApproval } = useAuth();
  const [isChecking, setIsChecking] = useState(false);

  const handleCheckStatus = async () => {
    setIsChecking(true);
    const approved = await refreshUserApproval();
    setIsChecking(false);
    if (approved) {
      Alert.alert(
        'Access Granted!',
        'Your attending physician has authorized your PillGuardian account. Welcome aboard!'
      );
    } else {
      Alert.alert(
        'Still Pending Review',
        'Your profile is currently in the physician review queue. Please allow up to 24 hours or contact your clinic.'
      );
    }
  };

  const handleSimulateDoctorApproval = async () => {
    if (!user) return;
    setIsChecking(true);
    await StorageService.updatePatientApproval(
      user.email,
      'approved',
      'Dr. Robert Henderson, M.D.'
    );
    await refreshUserApproval();
    setIsChecking(false);
    Alert.alert(
      'Clinic Approved!',
      'Dr. Robert Henderson has authorized your clinical profile. Unlocking companion features...'
    );
  };

  return (
    <View style={styles.container}>
      {/* Brand Header */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.brandTitle}>PillGuardian™</Text>
        <Text style={styles.brandSubtitle}>Clinical Remote Patient Monitoring (RPM)</Text>
      </View>

      {/* Status Card */}
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Clock size={36} color="#D97706" />
        </View>

        <Text style={styles.title}>Account Pending Approval</Text>
        <Text style={styles.subtitle}>
          Awaiting Attending Physician Authorization
        </Text>

        <View style={styles.statusBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.statusBadgeText}>PENDING CLINICIAN REVIEW</Text>
        </View>

        {/* Patient Record Details */}
        <View style={styles.detailBox}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Patient Name:</Text>
            <Text style={styles.detailVal}>{user?.fullName || 'Arthur Bennett'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Account Email:</Text>
            <Text style={styles.detailVal}>{user?.email || 'patient@example.com'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Assigned Care Team:</Text>
            <Text style={styles.detailVal}>Dr. Robert Henderson, M.D.</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Hospital / Clinic:</Text>
            <Text style={styles.detailVal}>Metropolitan General RPM</Text>
          </View>
        </View>

        <Text style={styles.noticeText}>
          In accordance with HIPAA clinical protocol and pharmacy regulations, newly registered patient accounts must be authorized by your attending physician before prescription dosing, drug schedules, and vitals sync can be accessed.
        </Text>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={handleCheckStatus}
          disabled={isChecking}
          activeOpacity={0.8}
        >
          {isChecking ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <RefreshCw size={16} color="#FFFFFF" />
              <Text style={styles.refreshBtnText}>Check Approval Status</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Fast-Track Testing Approval */}
        <TouchableOpacity
          style={styles.doctorApproveBtn}
          onPress={handleSimulateDoctorApproval}
          activeOpacity={0.8}
        >
          <Stethoscope size={15} color="#0D9488" />
          <Text style={styles.doctorApproveBtnText}>
            Instant Doctor Approval (Demo Testing)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={signOut}
          activeOpacity={0.7}
        >
          <LogOut size={16} color="#64748B" />
          <Text style={styles.signOutText}>Sign Out & Switch Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0D9488',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 14,
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D97706',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  detailBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  noticeText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 14,
  },
  refreshBtn: {
    width: '100%',
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  refreshBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  doctorApproveBtn: {
    width: '100%',
    backgroundColor: '#F0FDFA',
    borderColor: '#CCFBF1',
    borderWidth: 1.5,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  doctorApproveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D9488',
  },
  footer: {
    alignItems: 'center',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  signOutText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
});
