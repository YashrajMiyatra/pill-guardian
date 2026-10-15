-- ==============================================================================
-- PillGuardian Production PostgreSQL Database Schema (for Supabase)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  blood_type TEXT DEFAULT 'Unknown',
  allergies TEXT[] DEFAULT '{}',
  chronic_conditions TEXT[] DEFAULT '{}',
  emergency_notes TEXT,
  caregiver_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and edit their own profile"
  ON public.profiles FOR ALL
  USING (auth.uid() = id);

-- 3. Medications Table
CREATE TABLE IF NOT EXISTS public.medications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  form TEXT NOT NULL DEFAULT 'tablet',
  color TEXT NOT NULL DEFAULT '#0284C7',
  instructions TEXT,
  frequency TEXT NOT NULL DEFAULT 'daily',
  times TEXT[] NOT NULL DEFAULT '{"08:00"}',
  stock_current INTEGER NOT NULL DEFAULT 30,
  stock_refill_alert INTEGER NOT NULL DEFAULT 7,
  prescribed_by TEXT,
  rx_number TEXT,
  pharmacy_name TEXT,
  pharmacy_phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own medications"
  ON public.medications FOR ALL
  USING (auth.uid() = user_id);

-- 4. Dose Logs Table (Recorded dose actions)
CREATE TABLE IF NOT EXISTS public.dose_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  medication_id UUID REFERENCES public.medications(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  scheduled_time TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'taken', 'skipped')),
  action_timestamp TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.dose_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own dose logs"
  ON public.dose_logs FOR ALL
  USING (auth.uid() = user_id);

-- 5. Biomarkers & Vitals Table
CREATE TABLE IF NOT EXISTS public.vitals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  vital_type TEXT NOT NULL CHECK (vital_type IN ('blood_pressure', 'blood_glucose', 'heart_rate', 'weight')),
  systolic_val NUMERIC,
  diastolic_val NUMERIC,
  numeric_val NUMERIC,
  unit TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'normal' CHECK (severity IN ('normal', 'warning', 'alert')),
  context_tag TEXT,
  notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own vitals"
  ON public.vitals FOR ALL
  USING (auth.uid() = user_id);

-- 6. Live Caregiver Alerts Feed (Realtime notification table)
CREATE TABLE IF NOT EXISTS public.caregiver_alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  caregiver_email TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('dose_taken', 'dose_missed', 'refill_needed', 'vitals_alert', 'sos_triggered')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.caregiver_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients and assigned caregivers can view alerts"
  ON public.caregiver_alerts FOR ALL
  USING (auth.uid() = patient_id);

-- 7. Turn on Realtime for live caregiver sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.medications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.dose_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.caregiver_alerts;
