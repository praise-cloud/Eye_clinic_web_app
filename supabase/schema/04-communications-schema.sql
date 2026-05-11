-- =============================================
-- EYE CLINIC DATABASE - COMMUNICATIONS SCHEMA
-- =============================================

-- =============================================
-- CLEAN SLATE (Drop existing objects)
-- =============================================

-- Drop triggers
DROP TRIGGER IF EXISTS audit_messages ON public.messages;
DROP TRIGGER IF EXISTS audit_notifications ON public.notifications;
DROP TRIGGER IF EXISTS audit_settings ON public.settings;
DROP TRIGGER IF EXISTS message_mark_read ON public.messages;
DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
DROP TRIGGER IF EXISTS update_push_subscriptions_updated_at ON public.push_subscriptions;

-- Drop functions
DROP FUNCTION IF EXISTS public.audit_trigger_function();
DROP FUNCTION IF EXISTS mark_message_read();

-- Drop tables (CASCADE handles FK constraints)
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.push_subscriptions CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;

-- =============================================
-- MESSAGES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  attachment_type TEXT CHECK (attachment_type IN ('image', 'document')),
  attachment_url TEXT,
  attachment_name TEXT,
  message_type TEXT DEFAULT 'text' CHECK (
    message_type IN ('text', 'system', 'notification')
  ),
  priority TEXT DEFAULT 'normal' CHECK (
    priority IN ('low', 'normal', 'high', 'urgent')
  ),
  reply_to_id UUID REFERENCES public.messages(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (
    type IN (
      'appointment',
      'prescription',
      'low_stock',
      'payment',
      'patient',
      'dispensing',
      'glasses',
      'system',
      'message'
    )
  ),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  metadata JSONB, -- Additional notification data
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SYSTEM SETTINGS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  description TEXT,
  category TEXT DEFAULT 'general' CHECK (
    category IN ('general', 'notifications', 'messaging', 'appointments', 'inventory', 'payments')
  ),
  is_public BOOLEAN DEFAULT FALSE, -- Whether setting is visible to all users
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PUSH SUBSCRIPTIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription JSONB NOT NULL,
  endpoint TEXT,
  p256dh TEXT,
  auth TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- AUDIT LOGS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (
    action IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW')
  ),
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- COMMUNICATION INDEXES
-- =============================================

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id ON public.messages(reply_to_id);
CREATE INDEX IF NOT EXISTS idx_messages_priority ON public.messages(priority);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON public.notifications(expires_at);

-- Settings indexes
CREATE INDEX IF NOT EXISTS idx_settings_category ON public.settings(category);
CREATE INDEX IF NOT EXISTS idx_settings_is_public ON public.settings(is_public);
CREATE INDEX IF NOT EXISTS idx_settings_updated_at ON public.settings(updated_at DESC);

-- Push subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_is_active ON public.push_subscriptions(is_active);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- COMMUNICATION TRIGGERS
-- =============================================

-- Audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_function() RETURNS TRIGGER AS $$
DECLARE
  target_id TEXT;
  old_data JSONB;
  new_data JSONB;
BEGIN
  target_id := COALESCE(NEW.id::TEXT, OLD.id::TEXT, 'unknown');
  
  -- Convert records to JSON for audit
  old_data := to_jsonb(OLD);
  new_data := to_jsonb(NEW);
  
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values, new_values)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    target_id,
    CASE WHEN TG_OP = 'DELETE' THEN old_data ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN new_data ELSE NULL END
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to communication tables
CREATE TRIGGER audit_messages
    AFTER INSERT OR UPDATE OR DELETE ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_notifications
    AFTER INSERT OR UPDATE OR DELETE ON public.notifications
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_settings
    AFTER INSERT OR UPDATE OR DELETE ON public.settings
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Auto-mark messages as read trigger
CREATE OR REPLACE FUNCTION mark_message_read()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_read = TRUE AND OLD.is_read = FALSE THEN
        NEW.read_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER message_mark_read
    BEFORE UPDATE ON public.messages
    FOR EACH ROW EXECUTE FUNCTION mark_message_read();

-- Apply timestamp triggers
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON public.push_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- REALTIME PUBLICATION
-- =============================================

DO $$
BEGIN
    -- Add communication tables to realtime publication
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.messages; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- =============================================
-- DEFAULT SETTINGS
-- =============================================

INSERT INTO public.settings (key, value, description, category, is_public) VALUES
('clinic_name', 'Eye Clinic', 'Name of the eye clinic', 'general', true),
('clinic_phone', '+1234567890', 'Main clinic phone number', 'general', true),
('clinic_email', 'info@eyeclinic.com', 'Main clinic email', 'general', true),
('clinic_address', '123 Clinic Street, City, Country', 'Clinic physical address', 'general', true),
('appointment_reminder_hours', '24', 'Hours before appointment to send reminder', 'appointments', false),
('low_stock_threshold', '10', 'Threshold for low stock alerts', 'inventory', false),
('enable_sms_notifications', 'true', 'Enable SMS notifications', 'notifications', false),
('enable_email_notifications', 'true', 'Enable email notifications', 'notifications', false),
('message_retention_days', '365', 'Days to retain messages', 'messaging', false),
('max_file_upload_size', '10', 'Maximum file upload size in MB', 'messaging', false)
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

SELECT 'Communications schema created successfully' as message;
