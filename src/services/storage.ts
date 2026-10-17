import AsyncStorage from '@react-native-async-storage/async-storage';
import { Medication, DoseItem, VitalLog, UserProfile, CaregiverContact, DoseStatus, PatientAccount, PatientApprovalStatus } from '../types';
import { SEED_MEDICATIONS, SEED_VITALS, SEED_USER_PROFILE, SEED_CAREGIVER, SEED_PATIENTS } from '../data/seedData';

const KEYS = {
  MEDICATIONS: '@pill_guardian_medications',
  DOSE_LOGS_PREFIX: '@pill_guardian_doses_',
  VITALS: '@pill_guardian_vitals',
  PROFILE: '@pill_guardian_profile',
  CAREGIVER: '@pill_guardian_caregiver',
  PATIENTS: '@pill_guardian_patients',
  INITIALIZED: '@pill_guardian_initialized_v2',
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
  // Initialize default data if not already done
  async initDefaults(): Promise<void> {
    try {
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

  // Medications CRUD
  async getMedications(): Promise<Medication[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.MEDICATIONS);
      return data ? JSON.parse(data) : SEED_MEDICATIONS;
    } catch (e) {
      console.error('Error fetching medications:', e);
      return SEED_MEDICATIONS;
    }
  },

  async saveMedication(med: Medication): Promise<Medication[]> {
    try {
      const current = await this.getMedications();
      const existingIdx = current.findIndex(m => m.id === med.id);
      let updated: Medication[];
      if (existingIdx >= 0) {
        updated = [...current];
        updated[existingIdx] = med;
      } else {
        updated = [med, ...current];
      }
      await AsyncStorage.setItem(KEYS.MEDICATIONS, JSON.stringify(updated));
      return updated;
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
        await this.regenerateDailyDoses(todayStr);
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
        await this.regenerateDailyDoses(todayStr);
      }
      return current;
    } catch (e) {
      console.error('Error discontinuing medication:', e);
      throw e;
    }
  },

  async regenerateDailyDoses(dateString: string): Promise<DoseItem[]> {
    const key = `${KEYS.DOSE_LOGS_PREFIX}${dateString}`;
    try {
      const meds = await this.getMedications();
      const generatedDoses: DoseItem[] = [];

      meds.filter(m => m.isActive).forEach(med => {
        med.times.forEach(time => {
          generatedDoses.push({
            id: `${med.id}_${time}_${dateString}`,
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
  async getDailyDoses(dateString: string): Promise<DoseItem[]> {
    const key = `${KEYS.DOSE_LOGS_PREFIX}${dateString}`;
    try {
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }

      // Generate doses for this date from active medications
      const meds = await this.getMedications();
      const generatedDoses: DoseItem[] = [];

      meds.filter(m => m.isActive).forEach(med => {
        med.times.forEach((time, idx) => {
          generatedDoses.push({
            id: `${med.id}_${time}_${dateString}`,
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

      // Sort by scheduled time
      generatedDoses.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

      await AsyncStorage.setItem(key, JSON.stringify(generatedDoses));
      return generatedDoses;
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
      }
      await AsyncStorage.setItem(key, JSON.stringify(current));
      return current;
    } catch (e) {
      console.error('Error updating dose status:', e);
      throw e;
    }
  },

  // Vitals CRUD
  async getVitals(): Promise<VitalLog[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.VITALS);
      return data ? JSON.parse(data) : SEED_VITALS;
    } catch (e) {
      console.error('Error fetching vitals:', e);
      return SEED_VITALS;
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
      const data = await AsyncStorage.getItem(KEYS.PROFILE);
      return data ? JSON.parse(data) : SEED_USER_PROFILE;
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
      const data = await AsyncStorage.getItem(KEYS.CAREGIVER);
      return data ? JSON.parse(data) : SEED_CAREGIVER;
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
      const data = await AsyncStorage.getItem(KEYS.PATIENTS);
      if (data) {
        return JSON.parse(data);
      }
      // If not stored yet, initialize with SEED_PATIENTS
      await AsyncStorage.setItem(KEYS.PATIENTS, JSON.stringify(SEED_PATIENTS));
      return SEED_PATIENTS;
    } catch (e) {
      console.error('Error fetching patients:', e);
      return SEED_PATIENTS;
    }
  },

  async savePatient(patient: PatientAccount): Promise<PatientAccount[]> {
    try {
      const current = await this.getPatients();
      const existingIdx = current.findIndex(p => p.id === patient.id || (p.email && p.email.toLowerCase() === patient.email.toLowerCase()));
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
        // Unknown account - register as pending by default
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
};
