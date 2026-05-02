-- =============================================
-- EYE CLINIC DATABASE - INVENTORY SCHEMA
-- =============================================

-- =============================================
-- INVENTORY TABLES
-- =============================================

-- DRUGS (Pharmacy Inventory)
CREATE TABLE IF NOT EXISTS public.drugs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  generic_name TEXT,
  category TEXT,
  unit TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  reorder_level INTEGER DEFAULT 10,
  purchase_price NUMERIC,
  selling_price NUMERIC NOT NULL,
  supplier TEXT,
  expiry_date TEXT,
  batch_number TEXT,
  storage_location TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- GLASSES INVENTORY
CREATE TABLE IF NOT EXISTS public.glasses_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  frame_name TEXT NOT NULL,
  frame_brand TEXT,
  frame_code TEXT,
  color TEXT,
  material TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'unisex')),
  frame_type TEXT CHECK (frame_type IN ('full', 'semi-rimless', 'rimless')),
  size TEXT,
  quantity INTEGER DEFAULT 0,
  reorder_level INTEGER DEFAULT 3,
  purchase_price NUMERIC,
  selling_price NUMERIC NOT NULL,
  supplier TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INVENTORY OTHERS (Non-drug, non-glasses items)
CREATE TABLE IF NOT EXISTS public.inventory_others (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  unit TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  reorder_level INTEGER DEFAULT 5,
  purchase_price NUMERIC,
  selling_price NUMERIC NOT NULL,
  supplier TEXT,
  storage_location TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- DISPENSING TABLES
-- =============================================

-- DRUG DISPENSING
CREATE TABLE IF NOT EXISTS public.drug_dispensing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  drug_id UUID REFERENCES public.drugs(id) NOT NULL,
  dispensed_by UUID REFERENCES auth.users(id) NOT NULL,
  prescription_note TEXT,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  batch_number TEXT,
  expiry_date TEXT,
  dispensed_at TIMESTAMPTZ DEFAULT NOW()
);

-- INVENTORY DISPENSING (Non-drug items)
CREATE TABLE IF NOT EXISTS public.inventory_dispensing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.inventory_others(id) NOT NULL,
  dispensed_by UUID REFERENCES auth.users(id) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  notes TEXT,
  dispensed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- GLASSES ORDERS
-- =============================================

-- GLASSES ORDERS
CREATE TABLE IF NOT EXISTS public.glasses_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  prescription_id UUID REFERENCES public.prescriptions(id),
  frame_id UUID REFERENCES public.glasses_inventory(id) ON DELETE SET NULL,
  lens_type TEXT,
  lens_coating TEXT,
  frame_price NUMERIC,
  lens_price NUMERIC,
  total_price NUMERIC,
  status TEXT DEFAULT 'pending' CHECK (
    status IN (
      'pending',
      'in_lab',
      'ready',
      'dispensed',
      'cancelled'
    )
  ),
  deposit_paid NUMERIC DEFAULT 0,
  balance_paid NUMERIC DEFAULT 0,
  estimated_ready TEXT,
  lab_notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  dispensed_by UUID REFERENCES auth.users(id),
  dispensed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INVENTORY INDEXES
-- =============================================

-- Drugs indexes
CREATE INDEX IF NOT EXISTS idx_drugs_name ON public.drugs(name);
CREATE INDEX IF NOT EXISTS idx_drugs_category ON public.drugs(category);
CREATE INDEX IF NOT EXISTS idx_drugs_quantity ON public.drugs(quantity);
CREATE INDEX IF NOT EXISTS idx_drugs_expiry_date ON public.drugs(expiry_date);
CREATE INDEX IF NOT EXISTS idx_drugs_is_active ON public.drugs(is_active);

-- Glasses inventory indexes
CREATE INDEX IF NOT EXISTS idx_glasses_inventory_frame_name ON public.glasses_inventory(frame_name);
CREATE INDEX IF NOT EXISTS idx_glasses_inventory_brand ON public.glasses_inventory(frame_brand);
CREATE INDEX IF NOT EXISTS idx_glasses_inventory_gender ON public.glasses_inventory(gender);
CREATE INDEX IF NOT EXISTS idx_glasses_inventory_quantity ON public.glasses_inventory(quantity);
CREATE INDEX IF NOT EXISTS idx_glasses_inventory_is_active ON public.glasses_inventory(is_active);

-- Inventory others indexes
CREATE INDEX IF NOT EXISTS idx_inventory_others_name ON public.inventory_others(name);
CREATE INDEX IF NOT EXISTS idx_inventory_others_category ON public.inventory_others(category);
CREATE INDEX IF NOT EXISTS idx_inventory_others_quantity ON public.inventory_others(quantity);
CREATE INDEX IF NOT EXISTS idx_inventory_others_is_active ON public.inventory_others(is_active);

-- Dispensing indexes
CREATE INDEX IF NOT EXISTS idx_drug_dispensing_patient_id ON public.drug_dispensing(patient_id);
CREATE INDEX IF NOT EXISTS idx_drug_dispensing_drug_id ON public.drug_dispensing(drug_id);
CREATE INDEX IF NOT EXISTS idx_drug_dispensing_dispensed_at ON public.drug_dispensing(dispensed_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_dispensing_patient_id ON public.inventory_dispensing(patient_id);
CREATE INDEX IF NOT EXISTS idx_inventory_dispensing_item_id ON public.inventory_dispensing(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_dispensing_dispensed_at ON public.inventory_dispensing(dispensed_at DESC);

-- Glasses orders indexes
CREATE INDEX IF NOT EXISTS idx_glasses_orders_order_number ON public.glasses_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_glasses_orders_patient_id ON public.glasses_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_glasses_orders_status ON public.glasses_orders(status);
CREATE INDEX IF NOT EXISTS idx_glasses_orders_created_at ON public.glasses_orders(created_at DESC);

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.drugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glasses_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_others ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drug_dispensing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_dispensing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glasses_orders ENABLE ROW LEVEL SECURITY;

-- =============================================
-- INVENTORY TRIGGERS
-- =============================================

-- Update inventory quantity on dispensing
CREATE OR REPLACE FUNCTION update_drug_quantity_on_dispensing()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.drugs 
    SET quantity = quantity - NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.drug_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_inventory_others_quantity_on_dispensing()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.inventory_others 
    SET quantity = quantity - NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.item_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply dispensing triggers
CREATE TRIGGER drug_dispensing_update_quantity 
    AFTER INSERT ON public.drug_dispensing 
    FOR EACH ROW EXECUTE FUNCTION update_drug_quantity_on_dispensing();

CREATE TRIGGER inventory_dispensing_update_quantity 
    AFTER INSERT ON public.inventory_dispensing 
    FOR EACH ROW EXECUTE FUNCTION update_inventory_others_quantity_on_dispensing();

-- Update glasses inventory quantity on order
CREATE OR REPLACE FUNCTION update_glasses_quantity_on_order()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.frame_id IS NOT NULL THEN
        UPDATE public.glasses_inventory 
        SET quantity = quantity - 1,
            updated_at = NOW()
        WHERE id = NEW.frame_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER glasses_orders_update_quantity 
    AFTER UPDATE ON public.glasses_orders 
    FOR EACH ROW EXECUTE FUNCTION update_glasses_quantity_on_order();

-- Apply timestamp triggers
CREATE TRIGGER update_drugs_updated_at BEFORE UPDATE ON public.drugs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_glasses_inventory_updated_at BEFORE UPDATE ON public.glasses_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_others_updated_at BEFORE UPDATE ON public.inventory_others
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_glasses_orders_updated_at BEFORE UPDATE ON public.glasses_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- REALTIME PUBLICATION
-- =============================================

DO $$
BEGIN
    -- Add inventory tables to realtime publication
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.drugs; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.glasses_inventory; EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.glasses_orders; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

SELECT 'Inventory schema created successfully' as status;
