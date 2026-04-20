# ⚙️ Eye Clinic PWA — Backend Specification (Supabase)

---

## 1. Supabase Project Setup

### 1.1 Initial Configuration

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize project
supabase init

# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Start local development
supabase start
```

### 1.2 Auth Configuration (Supabase Dashboard)

- **Provider**: Email/Password only (no social login)
- **Email confirmation**: Disabled (Admin creates accounts manually)
- **JWT expiry**: 3600 seconds (1 hour), with refresh token rotation enabled
- **Custom claims**: Role stored in `auth.users` metadata AND in `profiles` table

---

## 2. Database Schema (Full SQL)

### 2.1 Extensions

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### 2.2 Profiles Table (extends auth.users)

```sql
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('doctor', 'assistant', 'admin', 'accountant')),
  phone         TEXT,
  avatar_url    TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile when a user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'assistant')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 2.3 Patients Table

```sql
CREATE TABLE public.patients (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_number    TEXT UNIQUE NOT NULL, -- auto-generated: P-00001
  first_name        TEXT NOT NULL,
  last_name         TEXT NOT NULL,
  date_of_birth     DATE,
  gender            TEXT CHECK (gender IN ('male', 'female', 'other')),
  phone             TEXT,
  email             TEXT,
  address           TEXT,
  occupation        TEXT,
  next_of_kin_name  TEXT,
  next_of_kin_phone TEXT,
  blood_group       TEXT,
  allergies         TEXT,
  subscription_type TEXT CHECK (subscription_type IN ('none', 'basic', 'standard', 'premium')),
  subscription_start DATE,
  subscription_end   DATE,
  registered_by     UUID REFERENCES public.profiles(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generate patient number
CREATE SEQUENCE patient_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_patient_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.patient_number = 'P-' || LPAD(nextval('patient_number_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_patient_number
  BEFORE INSERT ON public.patients
  FOR EACH ROW EXECUTE FUNCTION generate_patient_number();
```

### 2.4 Appointments Table

```sql
CREATE TABLE public.appointments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id       UUID NOT NULL REFERENCES public.profiles(id),
  requested_by    UUID REFERENCES public.profiles(id), -- could be assistant or doctor
  scheduled_at    TIMESTAMPTZ NOT NULL,
  appointment_type TEXT DEFAULT 'checkup' CHECK (
    appointment_type IN ('checkup', 'follow_up', 'new_consultation', 'glasses_fitting', 'emergency')
  ),
  status          TEXT DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirmed', 'arrived', 'in_progress', 'completed', 'cancelled', 'no_show')
  ),
  notes           TEXT,
  reminder_sent   BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.5 Case Notes Table

```sql
CREATE TABLE public.case_notes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id       UUID NOT NULL REFERENCES public.profiles(id),
  appointment_id  UUID REFERENCES public.appointments(id),
  chief_complaint TEXT,
  history         TEXT,              -- stored encrypted on client before insert
  examination     TEXT,              -- stored encrypted
  diagnosis       TEXT,              -- stored encrypted
  treatment_plan  TEXT,
  follow_up_date  DATE,
  is_encrypted    BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.6 Prescriptions Table (Glasses)

```sql
CREATE TABLE public.prescriptions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id       UUID NOT NULL REFERENCES public.profiles(id),
  case_note_id    UUID REFERENCES public.case_notes(id),
  -- Right Eye
  re_sphere       NUMERIC(5,2),
  re_cylinder     NUMERIC(5,2),
  re_axis         INTEGER CHECK (re_axis BETWEEN 0 AND 180),
  re_add          NUMERIC(5,2),
  re_va           TEXT,   -- visual acuity
  -- Left Eye
  le_sphere       NUMERIC(5,2),
  le_cylinder     NUMERIC(5,2),
  le_axis         INTEGER CHECK (le_axis BETWEEN 0 AND 180),
  le_add          NUMERIC(5,2),
  le_va           TEXT,
  -- Specs
  pd              NUMERIC(5,1),  -- pupillary distance
  lens_type       TEXT CHECK (lens_type IN ('single_vision', 'bifocal', 'progressive', 'reading')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.7 Drugs Table (Inventory)

```sql
CREATE TABLE public.drugs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  generic_name    TEXT,
  category        TEXT,
  unit            TEXT NOT NULL DEFAULT 'piece',  -- piece, bottle, tube, box
  quantity        INTEGER NOT NULL DEFAULT 0,
  reorder_level   INTEGER DEFAULT 10,
  purchase_price  NUMERIC(12,2),
  selling_price   NUMERIC(12,2) NOT NULL,
  supplier        TEXT,
  expiry_date     DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.8 Drug Dispensing Table

```sql
CREATE TABLE public.drug_dispensing (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID NOT NULL REFERENCES public.patients(id),
  drug_id         UUID NOT NULL REFERENCES public.drugs(id),
  dispensed_by    UUID NOT NULL REFERENCES public.profiles(id),
  prescription_note TEXT,
  quantity        INTEGER NOT NULL,
  unit_price      NUMERIC(12,2) NOT NULL,  -- price at time of dispensing
  total_price     NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  dispensed_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-reduce drug stock when dispensed
CREATE OR REPLACE FUNCTION reduce_drug_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.drugs
  SET quantity = quantity - NEW.quantity,
      updated_at = NOW()
  WHERE id = NEW.drug_id;
  
  IF (SELECT quantity FROM public.drugs WHERE id = NEW.drug_id) < 0 THEN
    RAISE EXCEPTION 'Insufficient stock for drug %', NEW.drug_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_drug_dispensed
  AFTER INSERT ON public.drug_dispensing
  FOR EACH ROW EXECUTE FUNCTION reduce_drug_stock();
```

### 2.9 Glasses Inventory Table

```sql
CREATE TABLE public.glasses_inventory (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  frame_name      TEXT NOT NULL,
  frame_brand     TEXT,
  frame_code      TEXT UNIQUE,
  color           TEXT,
  material        TEXT,
  gender          TEXT CHECK (gender IN ('male', 'female', 'unisex')),
  quantity        INTEGER NOT NULL DEFAULT 0,
  reorder_level   INTEGER DEFAULT 5,
  purchase_price  NUMERIC(12,2),
  selling_price   NUMERIC(12,2) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.10 Glasses Orders Table

```sql
CREATE TABLE public.glasses_orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number    TEXT UNIQUE NOT NULL,  -- GO-00001
  patient_id      UUID NOT NULL REFERENCES public.patients(id),
  prescription_id UUID REFERENCES public.prescriptions(id),
  frame_id        UUID REFERENCES public.glasses_inventory(id),
  lens_type       TEXT,
  lens_coating    TEXT,  -- anti-reflective, UV, photochromic
  frame_price     NUMERIC(12,2),
  lens_price      NUMERIC(12,2),
  total_price     NUMERIC(12,2),
  status          TEXT DEFAULT 'pending' CHECK (
    status IN ('pending', 'in_lab', 'ready', 'dispensed', 'cancelled')
  ),
  deposit_paid    NUMERIC(12,2) DEFAULT 0,
  created_by      UUID REFERENCES public.profiles(id),
  dispensed_by    UUID REFERENCES public.profiles(id),
  estimated_ready DATE,
  dispensed_at    TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generate order number
CREATE SEQUENCE glasses_order_seq START 1;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number = 'GO-' || LPAD(nextval('glasses_order_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON public.glasses_orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();
```

### 2.11 Payments Table

```sql
CREATE TABLE public.payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receipt_number  TEXT UNIQUE NOT NULL,  -- RCP-00001
  patient_id      UUID NOT NULL REFERENCES public.patients(id),
  payment_type    TEXT NOT NULL CHECK (
    payment_type IN ('consultation', 'drug', 'glasses_deposit', 'glasses_balance', 'subscription', 'other')
  ),
  reference_id    UUID,  -- drug_dispensing.id, glasses_orders.id, etc.
  amount          NUMERIC(12,2) NOT NULL,
  payment_method  TEXT CHECK (payment_method IN ('cash', 'transfer', 'pos', 'other')),
  received_by     UUID REFERENCES public.profiles(id),
  notes           TEXT,
  paid_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generate receipt number
CREATE SEQUENCE receipt_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.receipt_number = 'RCP-' || LPAD(nextval('receipt_number_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_receipt_number
  BEFORE INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION generate_receipt_number();
```

### 2.12 Messages Table (Chat)

```sql
CREATE TABLE public.messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id       UUID NOT NULL REFERENCES public.profiles(id),
  receiver_id     UUID NOT NULL REFERENCES public.profiles(id),
  content         TEXT NOT NULL,
  is_read         BOOLEAN DEFAULT FALSE,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast chat queries
CREATE INDEX idx_messages_conversation
  ON public.messages(
    LEAST(sender_id, receiver_id),
    GREATEST(sender_id, receiver_id),
    created_at DESC
  );
```

### 2.13 Outreach Log Table

```sql
CREATE TABLE public.outreach_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID NOT NULL REFERENCES public.patients(id),
  sent_by         UUID NOT NULL REFERENCES public.profiles(id),
  channel         TEXT CHECK (channel IN ('sms', 'email', 'whatsapp')),
  message_template TEXT,
  message_body    TEXT,
  status          TEXT CHECK (status IN ('sent', 'failed', 'delivered')),
  sent_at         TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.14 Audit Logs Table

```sql
CREATE TABLE public.audit_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES public.profiles(id),
  action          TEXT NOT NULL,  -- INSERT, UPDATE, DELETE
  table_name      TEXT NOT NULL,
  record_id       UUID,
  old_data        JSONB,
  new_data        JSONB,
  ip_address      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    CASE TG_OP WHEN 'DELETE' THEN OLD.id ELSE NEW.id END,
    CASE TG_OP WHEN 'INSERT' THEN NULL ELSE row_to_json(OLD) END,
    CASE TG_OP WHEN 'DELETE' THEN NULL ELSE row_to_json(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit trigger to sensitive tables
CREATE TRIGGER audit_patients
  AFTER INSERT OR UPDATE OR DELETE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_payments
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_drug_dispensing
  AFTER INSERT OR UPDATE OR DELETE ON public.drug_dispensing
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

---

## 3. Database Views

### 3.1 Daily Summary View

```sql
CREATE OR REPLACE VIEW public.daily_summary AS
SELECT
  DATE(paid_at) AS summary_date,
  COUNT(DISTINCT p.patient_id) FILTER (
    WHERE NOT EXISTS (
      SELECT 1 FROM public.payments p2
      WHERE p2.patient_id = p.patient_id
        AND DATE(p2.paid_at) < DATE(p.paid_at)
    )
  ) AS new_patients,
  COUNT(DISTINCT p.patient_id) FILTER (
    WHERE EXISTS (
      SELECT 1 FROM public.payments p2
      WHERE p2.patient_id = p.patient_id
        AND DATE(p2.paid_at) < DATE(p.paid_at)
    )
  ) AS returning_patients,
  SUM(amount) FILTER (WHERE payment_type = 'drug') AS drug_revenue,
  SUM(amount) FILTER (WHERE payment_type IN ('glasses_deposit','glasses_balance')) AS glasses_revenue,
  SUM(amount) FILTER (WHERE payment_type = 'consultation') AS consultation_revenue,
  SUM(amount) FILTER (WHERE payment_type = 'subscription') AS subscription_revenue,
  SUM(amount) AS total_revenue
FROM public.payments p
GROUP BY DATE(paid_at)
ORDER BY summary_date DESC;
```

### 3.2 Low Stock View

```sql
CREATE OR REPLACE VIEW public.low_stock_drugs AS
SELECT id, name, quantity, reorder_level, selling_price
FROM public.drugs
WHERE quantity <= reorder_level;

CREATE OR REPLACE VIEW public.low_stock_glasses AS
SELECT id, frame_name, frame_code, quantity, reorder_level, selling_price
FROM public.glasses_inventory
WHERE quantity <= reorder_level;
```

### 3.3 Patient Subscriptions View

```sql
CREATE OR REPLACE VIEW public.expiring_subscriptions AS
SELECT
  p.id,
  p.patient_number,
  p.first_name,
  p.last_name,
  p.phone,
  p.email,
  p.subscription_type,
  p.subscription_end,
  (p.subscription_end - CURRENT_DATE) AS days_remaining
FROM public.patients p
WHERE p.subscription_end IS NOT NULL
  AND p.subscription_end BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
ORDER BY p.subscription_end ASC;
```

---

## 4. Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drug_dispensing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glasses_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glasses_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- ── PROFILES ──────────────────────────────────────────
-- All staff can read all profiles (for chat, appointments)
CREATE POLICY "Staff can read profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (TRUE);

-- Users can update their own profile
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- Admin can manage all profiles
CREATE POLICY "Admin manages profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin');

-- ── PATIENTS ──────────────────────────────────────────
CREATE POLICY "Medical staff can view patients"
  ON public.patients FOR SELECT
  TO authenticated
  USING (get_user_role() IN ('doctor', 'assistant', 'admin', 'accountant'));

CREATE POLICY "Assistant and admin can create patients"
  ON public.patients FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() IN ('assistant', 'admin'));

CREATE POLICY "Assistant and admin can update patients"
  ON public.patients FOR UPDATE
  TO authenticated
  USING (get_user_role() IN ('assistant', 'admin'));

-- ── CASE NOTES ──────────────────────────────────────
CREATE POLICY "Doctors and admin can view case notes"
  ON public.case_notes FOR SELECT
  TO authenticated
  USING (get_user_role() IN ('doctor', 'admin'));

CREATE POLICY "Doctors can create case notes"
  ON public.case_notes FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'doctor' AND doctor_id = auth.uid());

CREATE POLICY "Doctors can update their own case notes"
  ON public.case_notes FOR UPDATE
  TO authenticated
  USING (get_user_role() = 'doctor' AND doctor_id = auth.uid());

-- ── PAYMENTS ──────────────────────────────────────────
CREATE POLICY "Accountant and admin can manage payments"
  ON public.payments FOR ALL
  TO authenticated
  USING (get_user_role() IN ('accountant', 'admin'));

CREATE POLICY "Assistant can record payments"
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'assistant');

CREATE POLICY "Assistant can view payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (get_user_role() IN ('assistant', 'accountant', 'admin'));

-- ── MESSAGES ──────────────────────────────────────────
CREATE POLICY "Users can view their own messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Authenticated users can send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- ── AUDIT LOGS ──────────────────────────────────────
CREATE POLICY "Only admin can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (get_user_role() = 'admin');

-- Audit logs: no delete, no update for anyone
CREATE POLICY "Audit logs are append-only"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);
```

---

## 5. Supabase Realtime Configuration

```sql
-- Enable realtime on required tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.drug_dispensing;
ALTER PUBLICATION supabase_realtime ADD TABLE public.glasses_orders;
```

### 5.1 Presence Channel (Online Status)

Handled client-side via Supabase Realtime Presence:

```typescript
// src/hooks/usePresence.ts
const channel = supabase.channel('clinic_presence')

channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState()
  // state contains all online users with their profile data
})

await channel.track({
  user_id: profile.id,
  full_name: profile.full_name,
  role: profile.role,
  online_at: new Date().toISOString()
})
```

---

## 6. Edge Functions

### 6.1 `send-outreach` Function

```typescript
// supabase/functions/send-outreach/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { patient_id, channel, message, template_name, sent_by } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Get patient contact info
  const { data: patient } = await supabase
    .from('patients')
    .select('first_name, last_name, phone, email')
    .eq('id', patient_id)
    .single()

  let status = 'failed'
  
  if (channel === 'sms') {
    // Twilio SMS
    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER')
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${twilioSid}:${twilioToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: twilioPhone!,
          To: patient.phone,
          Body: message,
        }),
      }
    )
    status = response.ok ? 'sent' : 'failed'
  }

  if (channel === 'email') {
    // Resend email
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'clinic@yourdomain.com',
        to: patient.email,
        subject: 'Message from Eye Clinic',
        text: message,
      }),
    })
    status = response.ok ? 'sent' : 'failed'
  }

  // Log outreach
  await supabase.from('outreach_log').insert({
    patient_id, sent_by, channel,
    message_template: template_name,
    message_body: message,
    status
  })

  return new Response(JSON.stringify({ success: status === 'sent' }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### 6.2 `send-push` Function

```typescript
// supabase/functions/send-push/index.ts
// Sends Web Push notification to a specific user (e.g., doctor when patient arrives)

serve(async (req) => {
  const { user_id, title, body, url } = await req.json()
  
  // Fetch user's push subscription from DB
  const { data: subscription } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', user_id)
    .single()
    
  // Send via Web Push (using VAPID)
  // Implementation uses web-push library via npm CDN
  await webpush.sendNotification(subscription.subscription, JSON.stringify({ title, body, url }))
  
  return new Response(JSON.stringify({ sent: true }))
})
```

### 6.3 `export-backup` Function

```typescript
// supabase/functions/export-backup/index.ts
// Exports encrypted JSON backup of entire database

serve(async (req) => {
  const { password } = await req.json()
  
  // Verify requesting user is admin
  const user = await supabase.auth.getUser(req.headers.get('Authorization')?.split(' ')[1])
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.data.user?.id).single()
  
  if (profile?.role !== 'admin') {
    return new Response('Unauthorized', { status: 403 })
  }
  
  // Collect all data
  const tables = ['patients', 'appointments', 'case_notes', 'prescriptions',
                  'drugs', 'drug_dispensing', 'glasses_inventory', 
                  'glasses_orders', 'payments', 'outreach_log']
  
  const backup: Record<string, unknown[]> = {}
  for (const table of tables) {
    const { data } = await supabase.from(table).select('*')
    backup[table] = data || []
  }
  
  backup['_meta'] = [{
    exported_at: new Date().toISOString(),
    exported_by: user.data.user?.id,
    version: '1.0'
  }]
  
  // Encrypt using AES-GCM with password-derived key
  // Returns encrypted blob as base64 string
  const encrypted = await encryptBackup(JSON.stringify(backup), password)
  
  return new Response(JSON.stringify({ data: encrypted }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

---

## 7. Supabase Storage Configuration

```
Bucket: clinic-files
  ├── case-note-attachments/  [private, authenticated only]
  ├── prescription-scans/     [private, authenticated only]
  ├── patient-photos/         [private, authenticated only]
  └── reports/                [private, admin + accountant only]
```

### Storage Policies

```sql
-- Authenticated users can upload to clinic-files
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES (
  'clinic-files',
  'Authenticated users can upload',
  '(role() = ''authenticated'')'
);

-- Users can only read their uploaded files or admin can read all
```

---

## 8. Client-Side Supabase Setup

### 8.1 Supabase Client

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
)
```

### 8.2 Auth Hook

```typescript
// src/hooks/useAuth.ts
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const { setUser, setProfile, setLoading } = useAuthStore()
  
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        fetchProfile(session.user.id)
      }
      setLoading(false)
    })
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
      }
    )
    
    return () => subscription.unsubscribe()
  }, [])
  
  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
  }
}
```

---

## 9. Application-Layer Encryption

```typescript
// src/lib/crypto.ts
const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256

async function getEncryptionKey(): Promise<CryptoKey> {
  const rawKey = import.meta.env.VITE_APP_ENCRYPTION_SALT
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(rawKey),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: new TextEncoder().encode('eyeclinic-v1'), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptText(plaintext: string): Promise<string> {
  const key = await getEncryptionKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    new TextEncoder().encode(plaintext)
  )
  const combined = new Uint8Array([...iv, ...new Uint8Array(encrypted)])
  return btoa(String.fromCharCode(...combined))
}

export async function decryptText(ciphertext: string): Promise<string> {
  const key = await getEncryptionKey()
  const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0))
  const iv = combined.slice(0, 12)
  const data = combined.slice(12)
  const decrypted = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, data)
  return new TextDecoder().decode(decrypted)
}
```

---

## 10. Push Notification Setup

### 10.1 Push Subscriptions Table

```sql
CREATE TABLE public.push_subscriptions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription    JSONB NOT NULL,  -- PushSubscription JSON
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)  -- one subscription per user (latest device wins)
);
```

### 10.2 Client Registration

```typescript
// src/lib/push.ts
export async function registerPushNotifications(userId: string) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
  
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
  })
  
  // Store subscription in Supabase
  await supabase.from('push_subscriptions').upsert({
    user_id: userId,
    subscription: subscription.toJSON()
  })
}
```

---

## 11. Seed Data

```sql
-- Create default admin user (run after creating user in Supabase Auth dashboard)
-- Replace USER_UUID with the UUID from Supabase Auth > Users

UPDATE public.profiles
SET role = 'admin', full_name = 'System Administrator'
WHERE id = 'USER_UUID';

-- Default subscription types (for reference)
-- basic: monthly checkup only
-- standard: checkup + drug discounts
-- premium: all services included
```
