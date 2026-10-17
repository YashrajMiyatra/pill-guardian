export type MedicationForm = 'pill' | 'capsule' | 'liquid' | 'injection' | 'inhaler' | 'drops' | 'tablet';

export type MedicationFrequency = 'daily' | 'twice_daily' | 'three_times' | 'as_needed' | 'weekly';

export interface Medication {
  id: string;
  name: string;
  dosage: string; // e.g. "20 mg", "500 mg"
  form: MedicationForm;
  color: string; // Hex color for pill visual
  instructions: string; // e.g. "Take with food", "Before bedtime"
  frequency: MedicationFrequency;
  times: string[]; // e.g. ["08:00", "20:00"]
  stockCurrent: number; // Remaining pills
  stockRefillAlert: number; // Alert threshold e.g. 5
  prescribedBy?: string; // e.g. "Dr. Sarah Mitchell (Cardiology)"
  rxNumber?: string;
  pharmacyName?: string;
  pharmacyPhone?: string;
  isActive: boolean;
  createdAt: string;
}

export type DoseStatus = 'pending' | 'taken' | 'skipped';

export interface DoseItem {
  id: string; // Unique id for the dose slot
  medicationId: string;
  medicationName: string;
  dosage: string;
  form: MedicationForm;
  color: string;
  instructions: string;
  scheduledTime: string; // "08:00"
  timeCategory: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
  status: DoseStatus;
  actionTimestamp?: string; // ISO string when taken/skipped
  notes?: string;
}

export type VitalType = 'blood_pressure' | 'blood_glucose' | 'heart_rate' | 'weight';

export interface VitalLog {
  id: string;
  type: VitalType;
  value: {
    systolic?: number;
    diastolic?: number;
    numeric?: number;
  };
  unit: string; // "mmHg", "mg/dL", "bpm", "kg"
  timestamp: string; // ISO string
  notes?: string;
  tag?: string; // "Fasting", "Post-meal", "Resting", etc.
  severity: 'normal' | 'warning' | 'alert';
}

export interface CaregiverContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isEmergency: boolean;
}

export interface UserProfile {
  fullName: string;
  dateOfBirth: string;
  bloodType: string;
  allergies: string[];
  chronicConditions: string[];
  emergencyNotes: string;
  primaryDoctor: {
    name: string;
    specialty: string;
    phone: string;
    hospital: string;
  };
}

export type ActiveTab = 'today' | 'cabinet' | 'vitals' | 'caregiver';

export type PatientApprovalStatus = 'approved' | 'pending' | 'rejected';

export interface PatientAccount {
  id: string;
  name: string;
  email: string;
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
  approvalStatus: PatientApprovalStatus;
  approvedAt?: string;
  approvedBy?: string;
  registeredAt: string;
  notes?: string;
}
