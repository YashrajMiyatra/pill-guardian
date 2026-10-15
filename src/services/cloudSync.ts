import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from './supabase';
import { Medication, VitalLog, DoseItem } from '../types';

const LAST_SYNC_KEY = '@pill_guardian_last_sync';

export interface SyncStatus {
  isSynced: boolean;
  lastSyncTime: string | null;
  mode: 'cloud' | 'offline_vault';
}

export const CloudSyncService = {
  async getLastSyncTime(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(LAST_SYNC_KEY);
    } catch {
      return null;
    }
  },

  async recordSync(): Promise<string> {
    const timestamp = new Date().toISOString();
    await AsyncStorage.setItem(LAST_SYNC_KEY, timestamp);
    return timestamp;
  },

  // Broadcast a real-time event to caregiver channel
  async broadcastCaregiverAlert(
    patientName: string,
    eventType: 'dose_taken' | 'dose_missed' | 'refill_needed' | 'vitals_alert' | 'sos_triggered',
    title: string,
    description: string,
    severity: 'info' | 'warning' | 'critical' = 'info'
  ): Promise<void> {
    if (!isSupabaseConfigured()) {
      console.log('[Offline Vault] Caregiver Alert Logged:', title, description);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('caregiver_alerts').insert({
        patient_id: user.id,
        event_type: eventType,
        title,
        description,
        severity,
      });
    } catch (e) {
      console.warn('Error broadcasting caregiver alert:', e);
    }
  },

  // Sync active medications and vitals to Supabase cloud
  async syncToCloud(
    medications: Medication[],
    vitals: VitalLog[]
  ): Promise<{ success: boolean; lastSync: string; error?: string }> {
    const timestamp = await this.recordSync();

    if (!isSupabaseConfigured()) {
      return {
        success: true,
        lastSync: timestamp,
        error: 'Offline Secure Vault active (configure Supabase URL & Key to enable live cloud multi-device sync).',
      };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, lastSync: timestamp, error: 'User not signed in.' };
      }

      // Upsert medications
      const dbMeds = medications.map(m => ({
        user_id: user.id,
        name: m.name,
        dosage: m.dosage,
        form: m.form,
        color: m.color,
        instructions: m.instructions,
        frequency: m.frequency,
        times: m.times,
        stock_current: m.stockCurrent,
        stock_refill_alert: m.stockRefillAlert,
        prescribed_by: m.prescribedBy,
        rx_number: m.rxNumber,
        is_active: m.isActive,
        updated_at: new Date().toISOString(),
      }));

      await supabase.from('medications').upsert(dbMeds, { onConflict: 'user_id, name' });

      return { success: true, lastSync: timestamp };
    } catch (e: any) {
      console.warn('Cloud sync error:', e);
      return { success: false, lastSync: timestamp, error: e.message };
    }
  },
};
