import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Medication,
  DoseItem,
  VitalLog,
  UserProfile,
  CaregiverContact,
  DoseStatus,
  PatientAccount,
  PatientApprovalStatus,
  PatientBehaviorRating,
  DoseReminder,
} from '../types';
import {
  SEED_MEDICATIONS,
  SEED_VITALS,
  SEED_USER_PROFILE,
  SEED_CAREGIVER,
  SEED_PATIENTS,
} from '../data/seedData';
import { NotificationService } from './notifications';

const KEYS = {
  MEDICATIONS: '@pill_guardian_medications',
  DOSE_LOGS_PREFIX: '@pill_guardian_doses_',
  VITALS: '@pill_guardian_vitals',
  PROFILE: '@pill_guardian_profile',
  CAREGIVER: '@pill_guardian_caregiver',
  PATIENTS: '@pill_guardian_patients',
  REMINDERS: '@pill_guardian_reminders',
  FRESH_RESET: '@pill_guardian_fresh_reset',
  INITIALIZED: '@pill_guardian_initialized_v4',
};

// Helper: Determine time category from "HH:MM"
export function getTimeCategory(timeStr: string): 'Morning' | 'Afternoon' | 'Evening' | 'Night' {
  const hour = parseInt(timeStr.split(':')[0], 10);
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 21) return 'Evening';
  return 'Night';
}

export const StorageService = {
  // Initialize default data if not already done and not in clean reset state
  async initDefaults(): Promise<void> {
    try {
      const isFresh = await AsyncStorage.getItem(KEYS.FRESH_RESET);
      if (isFresh === 'true') {
        // User explicitly wants clean state (no dummy data)
        return;
      }

      const initialized = await AsyncStorage.getItem(KEYS.INITIALIZED);
      if (!initialized) {
        await AsyncStorage.setItem(KEYS.MEDICATIONS, JSON.stringify(SEED_MEDICATIONS));
        await AsyncStorage.setItem(KEYS.VITALS, JSON.stringify(SEED_VITALS));
        await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(SEED_USER_PROFILE));
        await AsyncStorage.setItem(KEYS.CAREGIVER, JSON.stringify(SEED_CAREGIVER));
        await AsyncStorage.setItem(KEYS.PATIENTS, JSON.stringify(SEED_PATIENTS));
        await AsyncStorage.setItem(KEYS.INITIALIZED, 'true');
      }
    } catch (e) {
      console.error('Error initializing default storage data:', e);
    }
  },

  // Medications CRUD with Patient Association
  async getMedications(patientId?: string): Promise<Medication[]> {
    try {
      const isFresh = await AsyncStorage.getItem(KEYS.FRESH_RESET);
      const data = await AsyncStorage.getItem(KEYS.MEDICATIONS);
      let list: Medication[] = [];

      if (data) {
        list = JSON.parse(data);
      } else if (isFresh !== 'true') {
        list = SEED_MEDICATIONS;
      }

      if (!patientId || patientId === 'all') {
        return list;
      }
      return list.filter(
        m => m.patientId === patientId || (!m.patientId && (patientId === 'pat-1' || patientId === 'default'))
      );
    } catch (e) {
      console.error('Error fetching medications:', e);
      return [];
    }
  },

  async saveMedication(med: Medication, patientId?: string): Promise<Medication[]> {
    try {
      if (patientId && !med.patientId) {
        med.patientId = patientId;
      }
      const allMeds = await this.getMedications();
      const existingIdx = allMeds.findIndex(m => m.id === med.id);
      let updated: Medication[];
      if (existingIdx >= 0) {
        updated = [...allMeds];
        updated[existingIdx] = med;
      } else {
        updated = [med, ...allMeds];
      }
      await AsyncStorage.setItem(KEYS.MEDICATIONS, JSON.stringify(updated));

      // Regenerate doses for today
      const todayStr = new Date().toISOString().split('T')[0];
      await this.regenerateDailyDoses(todayStr, patientId);

      // Auto-schedule daily dose reminder notifications on device
      if (med.times && med.times.length > 0) {
        med.times.forEach(time => {
          const parts = time.split(':');
          const hr = parseInt(parts[0], 10) || 8;
          const min = parseInt(parts[1], 10) || 0;
          NotificationService.scheduleDoseReminder(
            med.name,
            med.dosage,
            med.instructions,
            hr,
            min
          ).catch(() => {});
        });
      }

      return updated.filter(
        m => !patientId || m.patientId === patientId || (!m.patientId && patientId === 'pat-1')
      );
    } catch (e) {
      console.error('Error saving medication:', e);
      throw e;
    }
  },

  async deleteMedication(id: string): Promise<Medication[]> {
    try {
      const current = await this.getMedications();
      const updated = current.filter(m => m.id !== id);
      await AsyncStorage.setItem(KEYS.MEDICATIONS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Error deleting medication:', e);
      throw e;
    }
  },

  async updateMedicationStock(medId: string, delta: number): Promise<Medication | null> {
    try {
      const current = await this.getMedications();
      const med = current.find(m => m.id === medId);
      if (!med) return null;
      med.stockCurrent = Math.max(0, med.stockCurrent + delta);
      await AsyncStorage.setItem(KEYS.MEDICATIONS, JSON.stringify(current));
      return med;
    } catch (e) {
      console.error('Error updating medication stock:', e);
      return null;
    }
  },

  async updatePrescription(medId: string, updates: Partial<Medication>): Promise<Medication[]> {
    try {
      const current = await this.getMedications();
      const idx = current.findIndex(m => m.id === medId);
      if (idx >= 0) {
        current[idx] = { ...current[idx], ...updates };
        await AsyncStorage.setItem(KEYS.MEDICATIONS, JSON.stringify(current));
        const todayStr = new Date().toISOString().split('T')[0];
        await this.regenerateDailyDoses(todayStr, current[idx].patientId);
      }
      return current;
    } catch (e) {
      console.error('Error updating prescription:', e);
      throw e;
    }
  },

  async discontinueMedication(medId: string): Promise<Medication[]> {
    try {
      const current = await this.getMedications();
      const idx = current.findIndex(m => m.id === medId);
      if (idx >= 0) {
        current[idx].isActive = false;
        await AsyncStorage.setItem(KEYS.MEDICATIONS, JSON.stringify(current));
        const todayStr = new Date().toISOString().split('T')[0];
        await this.regenerateDailyDoses(todayStr, current[idx].patientId);
      }
      return current;
    } catch (e) {
      console.error('Error discontinuing medication:', e);
      throw e;
    }
  },

  async regenerateDailyDoses(dateString: string, patientId?: string): Promise<DoseItem[]> {
    const key = `${KEYS.DOSE_LOGS_PREFIX}${dateString}`;
    try {
      const meds = await this.getMedications(patientId);
      const generatedDoses: DoseItem[] = [];

      meds.filter(m => m.isActive).forEach(med => {
        med.times.forEach(time => {
          generatedDoses.push({
            id: `${med.id}_${time}_${dateString}`,
            patientId: med.patientId || patientId,
            medicationId: med.id,
            medicationName: med.name,
            dosage: med.dosage,
            form: med.form,
            color: med.color,
            instructions: med.instructions,
            scheduledTime: time,
            timeCategory: getTimeCategory(time),
            status: 'pending',
          });
        });
      });

      generatedDoses.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
      await AsyncStorage.setItem(key, JSON.stringify(generatedDoses));
      return generatedDoses;
    } catch (e) {
      console.error('Error regenerating daily doses:', e);
      return [];
    }
  },

  // Daily Doses logic
  async getDailyDoses(dateString: string, patientId?: string): Promise<DoseItem[]> {
    const key = `${KEYS.DOSE_LOGS_PREFIX}${dateString}`;
    try {
      const stored = await AsyncStorage.getItem(key);
      let doses: DoseItem[] = stored ? JSON.parse(stored) : [];

      if (!stored || doses.length === 0) {
        doses = await this.regenerateDailyDoses(dateString, patientId);
      }

      if (patientId && patientId !== 'all') {
        return doses.filter(
          d => d.patientId === patientId || (!d.patientId && (patientId === 'pat-1' || patientId === 'default'))
        );
      }
      return doses;
    } catch (e) {
      console.error('Error getting daily doses:', e);
      return [];
    }
  },

  async updateDoseStatus(
    dateString: string,
    doseId: string,
    status: DoseStatus,
    notes?: string
  ): Promise<DoseItem[]> {
    const key = `${KEYS.DOSE_LOGS_PREFIX}${dateString}`;
    try {
      const current = await this.getDailyDoses(dateString);
      const dose = current.find(d => d.id === doseId);
      if (dose) {
        const wasTaken = dose.status === 'taken';
        dose.status = status;
        dose.actionTimestamp = new Date().toISOString();
        if (notes) dose.notes = notes;

        // If newly marked taken, reduce pill count by 1
        if (status === 'taken' && !wasTaken) {
          await this.updateMedicationStock(dose.medicationId, -1);
        } else if (wasTaken && status !== 'taken') {
          // If reverted from taken to pending/skipped, restore 1 pill
          await this.updateMedicationStock(dose.medicationId, 1);
        }

        // Track behavior for this patient!
        const patId = dose.patientId || 'pat-1';
        await this.recordDoseBehavior(patId, status);
      }
      await AsyncStorage.setItem(key, JSON.stringify(current));
      return current;
    } catch (e) {
      console.error('Error updating dose status:', e);
      throw e;
    }
  },

  // Patient Behavior & Adherence Tracker ("watch which one is behaving good")
  async recordDoseBehavior(patientId: string, status: DoseStatus): Promise<void> {
    try {
      const patients = await this.getPatients();
      const p = patients.find(
        item => item.id === patientId || (item.email && item.email.toLowerCase() === patientId.toLowerCase())
      );
      if (!p) return;

      if (status === 'taken') {
        p.dosesTakenCount = (p.dosesTakenCount || 0) + 1;
        p.lastDoseTime = `Taken at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      } else if (status === 'skipped') {
        p.dosesMissedCount = (p.dosesMissedCount || 0) + 1;
        p.lastDoseTime = `Skipped at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }

      const total = (p.dosesTakenCount || 0) + (p.dosesMissedCount || 0);
      if (total > 0) {
        p.adherenceRate = Math.round(((p.dosesTakenCount || 0) / total) * 100);
      }
      p.behaviorRating = p.adherenceRate >= 85 ? 'good' : p.adherenceRate >= 60 ? 'fair' : 'poor';

      await AsyncStorage.setItem(KEYS.PATIENTS, JSON.stringify(patients));
    } catch (e) {
      console.warn('Error recording dose behavior:', e);
    }
  },

  // Reminders System (Send reminder to patient phone)
  async sendDoseReminder(reminder: {
    patientId: string;
    patientName: string;
    medicationName: string;
    dosage: string;
    scheduledTime?: string;
    customMessage?: string;
  }): Promise<DoseReminder> {
    const newReminder: DoseReminder = {
      id: `rem-${Date.now()}`,
      patientId: reminder.patientId,
      patientName: reminder.patientName,
      medicationName: reminder.medicationName,
      dosage: reminder.dosage,
      scheduledTime: reminder.scheduledTime || 'Immediate',
      sentAt: new Date().toISOString(),
      message:
        reminder.customMessage ||
        `Doctor Reminder: Time to take your ${reminder.medicationName} (${reminder.dosage}). Maintain your healthy streak!`,
      acknowledged: false,
    };

    try {
      const stored = await AsyncStorage.getItem(KEYS.REMINDERS);
      const list: DoseReminder[] = stored ? JSON.parse(stored) : [];
      list.unshift(newReminder);
      await AsyncStorage.setItem(KEYS.REMINDERS, JSON.stringify(list));

      // Trigger actual mobile phone alert
      await NotificationService.triggerTestReminder(
        `💊 Dose Reminder for ${reminder.patientName}`,
        newReminder.message
      );

      // Record on patient profile
      const patients = await this.getPatients();
      const pat = patients.find(p => p.id === reminder.patientId);
      if (pat) {
        pat.lastReminderSent = new Date().toISOString();
        await AsyncStorage.setItem(KEYS.PATIENTS, JSON.stringify(patients));
      }

      return newReminder;
    } catch (e) {
      console.error('Error sending dose reminder:', e);
      return newReminder;
    }
  },

  async getDoseReminders(patientId?: string): Promise<DoseReminder[]> {
    try {
      const stored = await AsyncStorage.getItem(KEYS.REMINDERS);
      const list: DoseReminder[] = stored ? JSON.parse(stored) : [];
      if (!patientId || patientId === 'all') return list;
      return list.filter(r => r.patientId === patientId || r.patientId === 'pat-1');
    } catch {
      return [];
    }
  },

  // Vitals CRUD
  async getVitals(): Promise<VitalLog[]> {
    try {
      const isFresh = await AsyncStorage.getItem(KEYS.FRESH_RESET);
      const data = await AsyncStorage.getItem(KEYS.VITALS);
      if (data) return JSON.parse(data);
      if (isFresh === 'true') return [];
      return SEED_VITALS;
    } catch (e) {
      console.error('Error fetching vitals:', e);
      return [];
    }
  },

  async addVital(vital: VitalLog): Promise<VitalLog[]> {
    try {
      const current = await this.getVitals();
      const updated = [vital, ...current];
      await AsyncStorage.setItem(KEYS.VITALS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Error adding vital:', e);
      throw e;
    }
  },

  // Profile & Caregiver
  async getProfile(): Promise<UserProfile> {
    try {
      const isFresh = await AsyncStorage.getItem(KEYS.FRESH_RESET);
      const data = await AsyncStorage.getItem(KEYS.PROFILE);
      if (data) return JSON.parse(data);
      if (isFresh === 'true') {
        return {
          fullName: 'New Patient',
          dateOfBirth: '1980-01-01',
          bloodType: 'O+',
          allergies: [],
          chronicConditions: [],
          emergencyNotes: '',
          primaryDoctor: {
            name: 'Dr. Robert Henderson, M.D.',
            specialty: 'Cardiology',
            phone: '+1 (555) 721-0044',
            hospital: 'Metropolitan General Hospital',
          },
        };
      }
      return SEED_USER_PROFILE;
    } catch (e) {
      console.error('Error fetching profile:', e);
      return SEED_USER_PROFILE;
    }
  },

  async saveProfile(profile: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Error saving profile:', e);
    }
  },

  async getCaregiver(): Promise<CaregiverContact> {
    try {
      const isFresh = await AsyncStorage.getItem(KEYS.FRESH_RESET);
      const data = await AsyncStorage.getItem(KEYS.CAREGIVER);
      if (data) return JSON.parse(data);
      if (isFresh === 'true') {
        return {
          id: 'care-none',
          name: 'Not Assigned',
          relationship: 'Primary Caregiver',
          phone: '',
          isEmergency: false,
        };
      }
      return SEED_CAREGIVER;
    } catch (e) {
      console.error('Error fetching caregiver:', e);
      return SEED_CAREGIVER;
    }
  },

  async saveCaregiver(caregiver: CaregiverContact): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.CAREGIVER, JSON.stringify(caregiver));
    } catch (e) {
      console.error('Error saving caregiver:', e);
    }
  },

  // Patient Cohort & Approval System
  async getPatients(): Promise<PatientAccount[]> {
    try {
      const isFresh = await AsyncStorage.getItem(KEYS.FRESH_RESET);
      const data = await AsyncStorage.getItem(KEYS.PATIENTS);
      if (data) {
        return JSON.parse(data);
      }
      if (isFresh === 'true') {
        return [];
      }
      await AsyncStorage.setItem(KEYS.PATIENTS, JSON.stringify(SEED_PATIENTS));
      return SEED_PATIENTS;
    } catch (e) {
      console.error('Error fetching patients:', e);
      return [];
    }
  },

  async savePatient(patient: PatientAccount): Promise<PatientAccount[]> {
    try {
      const current = await this.getPatients();
      const existingIdx = current.findIndex(
        p => p.id === patient.id || (p.email && p.email.toLowerCase() === patient.email.toLowerCase())
      );
      let updated: PatientAccount[];
      if (existingIdx >= 0) {
        updated = [...current];
        updated[existingIdx] = { ...updated[existingIdx], ...patient };
      } else {
        updated = [patient, ...current];
      }
      await AsyncStorage.setItem(KEYS.PATIENTS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Error saving patient:', e);
      throw e;
    }
  },

  async updatePatientApproval(
    patientId: string,
    status: PatientApprovalStatus,
    approvedBy: string = 'Dr. Robert Henderson, M.D.'
  ): Promise<PatientAccount[]> {
    try {
      const current = await this.getPatients();
      const updated = current.map(p => {
        if (p.id === patientId || (p.email && p.email.toLowerCase() === patientId.toLowerCase())) {
          return {
            ...p,
            approvalStatus: status,
            approvedAt: status === 'approved' ? new Date().toISOString() : undefined,
            approvedBy: status === 'approved' ? approvedBy : undefined,
          };
        }
        return p;
      });
      await AsyncStorage.setItem(KEYS.PATIENTS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Error updating patient approval status:', e);
      throw e;
    }
  },

  async checkPatientApproval(emailOrId: string): Promise<{
    approved: boolean;
    status: PatientApprovalStatus;
    patient?: PatientAccount;
  }> {
    try {
      const current = await this.getPatients();
      const match = current.find(
        p => p.id === emailOrId || (p.email && p.email.toLowerCase() === emailOrId.toLowerCase())
      );
      if (!match) {
        return { approved: false, status: 'pending' };
      }
      return {
        approved: match.approvalStatus === 'approved',
        status: match.approvalStatus,
        patient: match,
      };
    } catch (e) {
      console.error('Error checking patient approval:', e);
      return { approved: false, status: 'pending' };
    }
  },

  async registerPendingPatient(
    data: Partial<PatientAccount> & { email: string; name: string }
  ): Promise<PatientAccount> {
    try {
      const current = await this.getPatients();
      const existing = current.find(p => p.email.toLowerCase() === data.email.toLowerCase());
      if (existing) {
        return existing;
      }
      const newPatient: PatientAccount = {
        id: `pat-${Date.now()}`,
        name: data.name,
        email: data.email,
        age: data.age || 45,
        dob: data.dob || '1981-05-15',
        gender: data.gender || 'Unspecified',
        bloodType: data.bloodType || 'O+',
        weight: data.weight || '70 kg',
        height: data.height || '170 cm',
        bmi: data.bmi || '24.2 (Normal)',
        conditions: data.conditions || ['Hypertension'],
        allergies: data.allergies || ['NKDA'],
        riskLevel: data.riskLevel || 'medium',
        adherenceRate: 100,
        behaviorRating: 'good',
        dosesTakenCount: 0,
        dosesMissedCount: 0,
        latestBP: '120/80',
        latestGlucose: '95 mg/dL',
        phone: data.phone || '+1 (555) 000-0000',
        caregiverName: data.caregiverName || 'Primary Caregiver',
        caregiverPhone: data.caregiverPhone || '+1 (555) 000-0001',
        approvalStatus: 'pending',
        registeredAt: new Date().toISOString(),
        notes: data.notes || 'Registered through PillGuardian patient portal. Awaiting clinician authorization.',
      };
      const updated = [newPatient, ...current];
      await AsyncStorage.setItem(KEYS.PATIENTS, JSON.stringify(updated));
      return newPatient;
    } catch (e) {
      console.error('Error registering pending patient:', e);
      throw e;
    }
  },

  // Clean Slate & Sample Data controls
  async resetToCleanSlate(): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.FRESH_RESET, 'true');
      await AsyncStorage.setItem(KEYS.PATIENTS, JSON.stringify([]));
      await AsyncStorage.setItem(KEYS.MEDICATIONS, JSON.stringify([]));
      await AsyncStorage.setItem(KEYS.VITALS, JSON.stringify([]));
      await AsyncStorage.setItem(KEYS.REMINDERS, JSON.stringify([]));
    } catch (e) {
      console.error('Error resetting to clean slate:', e);
    }
  },

  async restoreSampleCohort(): Promise<PatientAccount[]> {
    try {
      await AsyncStorage.removeItem(KEYS.FRESH_RESET);
      await AsyncStorage.setItem(KEYS.PATIENTS, JSON.stringify(SEED_PATIENTS));
      await AsyncStorage.setItem(KEYS.MEDICATIONS, JSON.stringify(SEED_MEDICATIONS));
      await AsyncStorage.setItem(KEYS.VITALS, JSON.stringify(SEED_VITALS));
      return SEED_PATIENTS;
    } catch (e) {
      console.error('Error restoring sample cohort:', e);
      return SEED_PATIENTS;
    }
  },
};
