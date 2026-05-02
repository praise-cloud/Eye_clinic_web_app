-- =============================================
-- EYE CLINIC DATABASE - PAYMENTS SCHEMA
-- =============================================

-- =============================================
-- PAYMENTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_number TEXT UNIQUE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  payment_type TEXT NOT NULL CHECK (
    payment_type IN (
      'consultation',
      'drug',
      'glasses_deposit',
      'glasses_balance',
      'subscription',
      'other'
    )
  ),
  reference_id TEXT, -- Reference to appointment, order, etc.
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_method TEXT CHECK (
    payment_method IN ('cash', 'transfer', 'pos', 'other')
  ),
  received_by UUID REFERENCES auth.users(id),
  notes TEXT,
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SUBSCRIPTIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  subscription_type TEXT NOT NULL CHECK (
    subscription_type IN ('basic', 'standard', 'premium')
  ),
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_method TEXT CHECK (
    payment_method IN ('cash', 'transfer', 'pos', 'other')
  ),
  is_active BOOLEAN DEFAULT TRUE,
  auto_renew BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- BILLING & INVOICING
-- =============================================

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  items JSONB NOT NULL, -- Array of invoice items with details
  subtotal NUMERIC NOT NULL CHECK (subtotal >= 0),
  tax_amount NUMERIC DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount NUMERIC NOT NULL CHECK (total_amount > 0),
  status TEXT DEFAULT 'pending' CHECK (
    status IN ('pending', 'paid', 'partial', 'cancelled')
  ),
  paid_amount NUMERIC DEFAULT 0 CHECK (paid_amount >= 0),
  due_date TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- DAILY SUMMARY TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.daily_summary (
  summary_date DATE PRIMARY KEY,
  new_patients INTEGER DEFAULT 0,
  returning_patients INTEGER DEFAULT 0,
  drug_revenue NUMERIC DEFAULT 0 CHECK (drug_revenue >= 0),
  glasses_revenue NUMERIC DEFAULT 0 CHECK (glasses_revenue >= 0),
  consultation_revenue NUMERIC DEFAULT 0 CHECK (consultation_revenue >= 0),
  subscription_revenue NUMERIC DEFAULT 0 CHECK (subscription_revenue >= 0),
  other_revenue NUMERIC DEFAULT 0 CHECK (other_revenue >= 0),
  total_revenue NUMERIC DEFAULT 0 CHECK (total_revenue >= 0),
  total_appointments INTEGER DEFAULT 0,
  completed_appointments INTEGER DEFAULT 0,
  cancelled_appointments INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- PAYMENT INDEXES
-- =============================================

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_receipt_number ON public.payments(receipt_number);
CREATE INDEX IF NOT EXISTS idx_payments_patient_id ON public.payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON public.payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON public.payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON public.payments(paid_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_received_by ON public.payments(received_by);

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_patient_id ON public.subscriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_subscription_type ON public.subscriptions(subscription_type);
CREATE INDEX IF NOT EXISTS idx_subscriptions_is_active ON public.subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON public.subscriptions(end_date);

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_patient_id ON public.invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices(created_at DESC);

-- Daily summary indexes
CREATE INDEX IF NOT EXISTS idx_daily_summary_summary_date ON public.daily_summary(summary_date);
CREATE INDEX IF NOT EXISTS idx_daily_summary_created_at ON public.daily_summary(created_at DESC);

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_summary ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PAYMENT TRIGGERS
-- =============================================

-- Update daily summary when payment is made
CREATE OR REPLACE FUNCTION update_daily_summary_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.daily_summary (summary_date)
    VALUES (DATE(NEW.paid_at))
    ON CONFLICT (summary_date) 
    DO UPDATE SET
        total_revenue = daily_summary.total_revenue + NEW.amount,
        updated_at = NOW()
    WHERE daily_summary.summary_date = DATE(NEW.paid_at);

    -- Update specific revenue columns based on payment type
    IF NEW.payment_type = 'consultation' THEN
        UPDATE public.daily_summary 
        SET consultation_revenue = consultation_revenue + NEW.amount
        WHERE summary_date = DATE(NEW.paid_at);
    ELSIF NEW.payment_type = 'drug' THEN
        UPDATE public.daily_summary 
        SET drug_revenue = drug_revenue + NEW.amount
        WHERE summary_date = DATE(NEW.paid_at);
    ELSIF NEW.payment_type = 'glasses_deposit' OR NEW.payment_type = 'glasses_balance' THEN
        UPDATE public.daily_summary 
        SET glasses_revenue = glasses_revenue + NEW.amount
        WHERE summary_date = DATE(NEW.paid_at);
    ELSIF NEW.payment_type = 'subscription' THEN
        UPDATE public.daily_summary 
        SET subscription_revenue = subscription_revenue + NEW.amount
        WHERE summary_date = DATE(NEW.paid_at);
    ELSE
        UPDATE public.daily_summary 
        SET other_revenue = other_revenue + NEW.amount
        WHERE summary_date = DATE(NEW.paid_at);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update daily summary when appointment status changes
CREATE OR REPLACE FUNCTION update_daily_summary_on_appointment()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.daily_summary (summary_date)
    VALUES (DATE(NEW.created_at))
    ON CONFLICT (summary_date) 
    DO UPDATE SET
        updated_at = NOW()
    WHERE daily_summary.summary_date = DATE(NEW.created_at);

    -- Update appointment counts
    IF NEW.status = 'completed' THEN
        UPDATE public.daily_summary 
        SET completed_appointments = completed_appointments + 1
        WHERE summary_date = DATE(NEW.created_at);
    ELSIF NEW.status = 'cancelled' THEN
        UPDATE public.daily_summary 
        SET cancelled_appointments = cancelled_appointments + 1
        WHERE summary_date = DATE(NEW.created_at);
    END IF;

    -- Update total appointments
    UPDATE public.daily_summary 
    SET total_appointments = total_appointments + 1
    WHERE summary_date = DATE(NEW.created_at);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply payment triggers
CREATE TRIGGER payment_update_daily_summary 
    AFTER INSERT ON public.payments 
    FOR EACH ROW EXECUTE FUNCTION update_daily_summary_on_payment();

CREATE TRIGGER appointment_update_daily_summary 
    AFTER INSERT OR UPDATE ON public.appointments 
    FOR EACH ROW EXECUTE FUNCTION update_daily_summary_on_appointment();

-- Apply timestamp triggers
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_summary_updated_at BEFORE UPDATE ON public.daily_summary
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- REALTIME PUBLICATION
-- =============================================

DO $$
BEGIN
    -- Add payment tables to realtime publication
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.payments; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

SELECT 'Payments schema created successfully' as status;
