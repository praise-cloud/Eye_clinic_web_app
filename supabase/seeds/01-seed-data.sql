-- =============================================
-- EYE CLINIC DATABASE - SEED DATA
-- =============================================

-- This file contains initial seed data for development and testing
-- Run this after the schema and RLS policies have been applied

-- =============================================
-- SEED USERS
-- =============================================

-- Create test users (these will be created via auth, but we can prepare the profiles)
-- Note: These users need to be created via Supabase Auth first
-- Then their profiles will be automatically created by the handle_new_user trigger

-- =============================================
-- SEED PATIENTS
-- =============================================

-- Sample patients for testing
INSERT INTO public.patients (
  patient_number,
  first_name,
  last_name,
  date_of_birth,
  gender,
  phone,
  email,
  address,
  occupation,
  next_of_kin_name,
  next_of_kin_phone,
  allergies
) VALUES
('PAT-001', 'John', 'Smith', '1985-03-15', 'male', '+1234567890', 'john.smith@email.com', '123 Main St, City, State', 'Software Engineer', 'Jane Smith', '+1234567891', 'Penicillin'),
('PAT-002', 'Sarah', 'Johnson', '1990-07-22', 'female', '+1234567892', 'sarah.j@email.com', '456 Oak Ave, City, State', 'Teacher', 'Mike Johnson', '+1234567893', 'None'),
('PAT-003', 'Michael', 'Brown', '1978-11-08', 'male', '+1234567894', 'michael.b@email.com', '789 Pine Rd, City, State', 'Accountant', 'Lisa Brown', '+1234567895', 'Latex'),
('PAT-004', 'Emily', 'Davis', '1995-02-14', 'female', '+1234567896', 'emily.d@email.com', '321 Elm St, City, State', 'Nurse', 'Robert Davis', '+1234567897', 'Dust'),
('PAT-005', 'David', 'Wilson', '1982-09-30', 'male', '+1234567898', 'david.w@email.com', '654 Maple Dr, City, State', 'Sales Manager', 'Susan Wilson', '+1234567899', 'None')
ON CONFLICT (patient_number) DO NOTHING;

-- =============================================
-- SEED INVENTORY
-- =============================================

-- Sample drugs
INSERT INTO public.drugs (
  name,
  generic_name,
  category,
  unit,
  quantity,
  reorder_level,
  purchase_price,
  selling_price,
  supplier,
  expiry_date,
  batch_number,
  storage_location
) VALUES
('Tobramycin Eye Drops', 'Tobramycin', 'Antibiotics', 'bottle', 50, 10, 8.50, 15.00, 'PharmaCorp', '2025-12-31', 'B001', 'Refrigerator'),
('Artificial Tears', 'Carboxymethylcellulose', 'Lubricants', 'bottle', 100, 20, 3.25, 8.00, 'EyeCare Inc', '2026-03-15', 'B002', 'Room Temperature'),
('Prednisolone Acetate', 'Prednisolone', 'Steroids', 'bottle', 30, 8, 12.75, 25.00, 'PharmaCorp', '2025-08-20', 'B003', 'Refrigerator'),
('Latanoprost', 'Latanoprost', 'Glaucoma', 'bottle', 25, 5, 45.00, 85.00, 'GlaucomaTech', '2025-11-30', 'B004', 'Refrigerator'),
('Cyclopentolate', 'Cyclopentolate', 'Mydriatics', 'bottle', 40, 10, 15.50, 30.00, 'EyeCare Inc', '2026-01-15', 'B005', 'Room Temperature')
ON CONFLICT DO NOTHING;

-- Sample glasses inventory
INSERT INTO public.glasses_inventory (
  frame_name,
  frame_brand,
  frame_code,
  color,
  material,
  gender,
  frame_type,
  size,
  quantity,
  reorder_level,
  purchase_price,
  selling_price,
  supplier
) VALUES
('Classic Aviator', 'Ray-Ban', 'RB001', 'Gold', 'Metal', 'unisex', 'full', 'Medium', 15, 3, 45.00, 120.00, 'Optical Supplies'),
('Round Vintage', 'Warby Parker', 'WP002', 'Black', 'Acetate', 'unisex', 'full', 'Small', 20, 4, 35.00, 95.00, 'Optical Supplies'),
('Sport Wrap', 'Oakley', 'OK003', 'Red', 'Plastic', 'male', 'full', 'Large', 10, 2, 55.00, 150.00, 'Sport Optics'),
('Cat Eye', 'Gucci', 'GC004', 'Tortoise', 'Acetate', 'female', 'full', 'Medium', 12, 3, 125.00, 280.00, 'Luxury Eyewear'),
('Rectangle Modern', 'Tom Ford', 'TF005', 'Gunmetal', 'Metal', 'unisex', 'full', 'Large', 8, 2, 85.00, 200.00, 'Luxury Eyewear')
ON CONFLICT DO NOTHING;

-- Sample other inventory items
INSERT INTO public.inventory_others (
  name,
  category,
  description,
  unit,
  quantity,
  reorder_level,
  purchase_price,
  selling_price,
  supplier,
  storage_location
) VALUES
('Contact Lens Solution', 'Contact Care', 'Multipurpose solution for contact lenses', 'bottle', 75, 15, 4.50, 12.00, 'LensCare Inc', 'Room Temperature'),
('Eye Patch', 'Medical Supplies', 'Disposable eye patches', 'pack', 100, 20, 2.00, 5.00, 'Medical Supplies Co', 'Drawer 1'),
('Eye Drops Applicator', 'Accessories', 'Reusable eye drops applicator', 'piece', 50, 10, 1.50, 4.00, 'Medical Supplies Co', 'Drawer 2'),
('Lens Cleaning Cloth', 'Accessories', 'Microfiber lens cleaning cloth', 'piece', 200, 30, 0.50, 2.00, 'Optical Supplies', 'Shelf A'),
('Eye Chart', 'Equipment', 'Standard Snellen eye chart', 'piece', 5, 1, 15.00, 35.00, 'Medical Equipment', 'Wall Mount')
ON CONFLICT DO NOTHING;

-- =============================================
-- SEED APPOINTMENTS
-- =============================================

-- Sample appointments
INSERT INTO public.appointments (
  patient_id,
  doctor_id,
  scheduled_at,
  appointment_type,
  status,
  notes
) VALUES
((SELECT id FROM public.patients WHERE patient_number = 'PAT-001'), 
 (SELECT id FROM public.profiles WHERE role = 'doctor' LIMIT 1), 
 NOW() + INTERVAL '1 hour', 
 'checkup', 
 'confirmed', 
 'Regular checkup appointment'),
((SELECT id FROM public.patients WHERE patient_number = 'PAT-002'), 
 (SELECT id FROM public.profiles WHERE role = 'doctor' LIMIT 1), 
 NOW() + INTERVAL '3 hours', 
 'follow_up', 
 'pending', 
 'Follow-up for glaucoma monitoring'),
((SELECT id FROM public.patients WHERE patient_number = 'PAT-003'), 
 (SELECT id FROM public.profiles WHERE role = 'doctor' LIMIT 1), 
 NOW() + INTERVAL '1 day', 
 'glasses_fitting', 
 'pending', 
 'New glasses fitting appointment'),
((SELECT id FROM public.patients WHERE patient_number = 'PAT-004'), 
 (SELECT id FROM public.profiles WHERE role = 'doctor' LIMIT 1), 
 NOW() - INTERVAL '2 hours', 
 'new_consultation', 
 'completed', 
 'Initial consultation for eye irritation'),
((SELECT id FROM public.patients WHERE patient_number = 'PAT-005'), 
 (SELECT id FROM public.profiles WHERE role = 'doctor' LIMIT 1), 
 NOW() + INTERVAL '2 days', 
 'emergency', 
 'pending', 
 'Emergency eye injury')
ON CONFLICT DO NOTHING;

-- =============================================
-- SEED CASE NOTES
-- =============================================

-- Sample case notes
INSERT INTO public.case_notes (
  patient_id,
  doctor_id,
  appointment_id,
  chief_complaint,
  history,
  examination,
  diagnosis,
  treatment_plan,
  follow_up_date,
  visiting_date,
  ophthalmoscopy_notes,
  unaided_dist_re,
  unaided_dist_le,
  unaided_near_re,
  unaided_near_le,
  aided_dist_re,
  aided_dist_le,
  aided_near_re,
  aided_near_le,
  final_rx_od,
  final_rx_os,
  lens_type,
  next_visiting_date
) VALUES
((SELECT id FROM public.patients WHERE patient_number = 'PAT-001'), 
 (SELECT id FROM public.profiles WHERE role = 'doctor' LIMIT 1), 
 (SELECT id FROM public.appointments WHERE patient_id = (SELECT id FROM public.patients WHERE patient_number = 'PAT-001') LIMIT 1), 
 'Blurred vision', 
 'Patient reports gradual blurring of vision over past 6 months', 
 'External examination normal. Fundus shows mild cataract changes', 
 'Age-related cataract', 
 'Surgical evaluation for cataract removal', 
 '2024-02-15', 
 '2024-01-15', 
 'Normal optic disc, mild lens opacity', 
 '6/12', '6/18', 'N8', 'N8', '6/9', '6/9', 'N6', 'N6', '+1.00', '+1.25', 'single_vision', '2024-02-15'),
((SELECT id FROM public.patients WHERE patient_number = 'PAT-002'), 
 (SELECT id FROM public.profiles WHERE role = 'doctor' LIMIT 1), 
 (SELECT id FROM public.appointments WHERE patient_id = (SELECT id FROM public.patients WHERE patient_number = 'PAT-002') LIMIT 1), 
 'Eye pressure monitoring', 
 'History of glaucoma, on latanoprost', 
 'IOP 18mmHg right, 20mmHg left. Optic nerve healthy', 
 'Stable glaucoma', 
 'Continue current medication, monitor IOP', 
 '2024-02-20', 
 '2024-01-18', 
 'Healthy optic disc, no progression', 
 '6/6', '6/6', 'N6', 'N6', '6/6', '6/6', 'N6', 'N6', 'plano', 'plano', 'single_vision', '2024-02-20')
ON CONFLICT DO NOTHING;

-- =============================================
-- SEED PRESCRIPTIONS
-- =============================================

-- Sample prescriptions
INSERT INTO public.prescriptions (
  patient_id,
  doctor_id,
  case_note_id,
  status,
  re_sphere,
  re_cylinder,
  re_axis,
  re_add,
  re_va,
  le_sphere,
  le_cylinder,
  le_axis,
  le_add,
  le_va,
  pd,
  lens_type,
  notes
) VALUES
((SELECT id FROM public.patients WHERE patient_number = 'PAT-001'), 
 (SELECT id FROM public.profiles WHERE role = 'doctor' LIMIT 1), 
 (SELECT id FROM public.case_notes WHERE patient_id = (SELECT id FROM public.patients WHERE patient_number = 'PAT-001') LIMIT 1), 
 'pending', 
 1.00, 0.00, 0, 0.00, '6/9', 
 1.25, 0.00, 0, 0.00, '6/9', 
 64, 'single_vision', 
 'Distance single vision prescription'),
((SELECT id FROM public.patients WHERE patient_number = 'PAT-002'), 
 (SELECT id FROM public.profiles WHERE role = 'doctor' LIMIT 1), 
 (SELECT id FROM public.case_notes WHERE patient_id = (SELECT id FROM public.patients WHERE patient_number = 'PAT-002') LIMIT 1), 
 'pending', 
 0.00, 0.00, 0, 0.00, '6/6', 
 0.00, 0.00, 0, 0.00, '6/6', 
 62, 'single_vision', 
 'Plano prescription for glaucoma monitoring')
ON CONFLICT DO NOTHING;

-- =============================================
-- SEED PAYMENTS
-- =============================================

-- Sample payments
INSERT INTO public.payments (
  receipt_number,
  patient_id,
  payment_type,
  amount,
  payment_method,
  received_by,
  notes
) VALUES
('REC-001', 
 (SELECT id FROM public.patients WHERE patient_number = 'PAT-001'), 
 'consultation', 
 50.00, 
 'cash', 
 (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1), 
 'Consultation fee'),
('REC-002', 
 (SELECT id FROM public.patients WHERE patient_number = 'PAT-002'), 
 'drug', 
 15.00, 
 'transfer', 
 (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1), 
 'Tobramycin eye drops'),
('REC-003', 
 (SELECT id FROM public.patients WHERE patient_number = 'PAT-003'), 
 'glasses_deposit', 
 120.00, 
 'pos', 
 (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1), 
 'Deposit for new glasses'),
('REC-004', 
 (SELECT id FROM public.patients WHERE patient_number = 'PAT-004'), 
 'consultation', 
 50.00, 
 'cash', 
 (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1), 
 'Emergency consultation fee'),
('REC-005', 
 (SELECT id FROM public.patients WHERE patient_number = 'PAT-005'), 
 'subscription', 
 200.00, 
 'transfer', 
 (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1), 
 'Annual subscription payment')
ON CONFLICT (receipt_number) DO NOTHING;

-- =============================================
-- SEED SUBSCRIPTIONS
-- =============================================

-- Sample subscriptions
INSERT INTO public.subscriptions (
  patient_id,
  subscription_type,
  start_date,
  end_date,
  amount,
  payment_method,
  is_active,
  auto_renew,
  created_by
) VALUES
((SELECT id FROM public.patients WHERE patient_number = 'PAT-001'), 
 'standard', 
 '2024-01-01', 
 '2024-12-31', 
 200.00, 
 'transfer', 
 true, 
 true, 
 (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)),
((SELECT id FROM public.patients WHERE patient_number = 'PAT-002'), 
 'premium', 
 '2024-01-15', 
 '2024-12-31', 
 350.00, 
 'cash', 
 true, 
 false, 
 (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)),
((SELECT id FROM public.patients WHERE patient_number = 'PAT-003'), 
 'basic', 
 '2024-02-01', 
 '2024-12-31', 
 150.00, 
 'transfer', 
 true, 
 true, 
 (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1))
ON CONFLICT DO NOTHING;

-- =============================================
-- SEED NOTIFICATIONS
-- =============================================

-- Sample notifications
INSERT INTO public.notifications (
  user_id,
  type,
  title,
  message,
  link,
  metadata
) VALUES
((SELECT id FROM public.profiles WHERE role = 'doctor' LIMIT 1), 
 'appointment', 
 'New Appointment', 
 'You have a new appointment scheduled', 
 '/doctor/appointments', 
 '{"appointment_id": "apt-001"}'),
((SELECT id FROM public.profiles WHERE role = 'frontdesk' LIMIT 1), 
 'patient', 
 'New Patient', 
 'A new patient has been registered', 
 '/frontdesk/patients', 
 '{"patient_id": "pat-001"}'),
((SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1), 
 'payment', 
 'Payment Received', 
 'A payment has been recorded', 
 '/admin/payments', 
 '{"payment_id": "pay-001"}'),
((SELECT id FROM public.profiles WHERE role = 'manager' LIMIT 1), 
 'system', 
 'System Update', 
 'Database backup completed successfully', 
 '/manager/reports', 
 '{"backup_time": "2024-01-15T10:00:00Z"}')
ON CONFLICT DO NOTHING;

-- =============================================
-- SEED SETTINGS (additional defaults)
-- =============================================

INSERT INTO public.settings (key, value, description, category, is_public) VALUES
('appointment_duration_minutes', '30', 'Default appointment duration in minutes', 'appointments', false),
('appointment_buffer_minutes', '15', 'Buffer time between appointments', 'appointments', false),
('low_stock_alert_enabled', 'true', 'Enable low stock alerts', 'inventory', false),
('payment_receipt_prefix', 'REC-', 'Prefix for payment receipt numbers', 'payments', false),
('patient_number_prefix', 'PAT-', 'Prefix for patient numbers', 'general', false),
('backup_retention_days', '30', 'Days to retain backup files', 'general', false),
('notification_sound_enabled', 'true', 'Enable notification sounds', 'notifications', false),
('auto_logout_minutes', '60', 'Auto logout after inactivity', 'general', false),
('max_appointments_per_day', '20', 'Maximum appointments per day per doctor', 'appointments', false),
('enable_sms_reminders', 'true', 'Enable SMS appointment reminders', 'notifications', false)
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

SELECT 'Seed data loaded successfully' as status,
       (SELECT COUNT(*) FROM public.patients) as patients_count,
       (SELECT COUNT(*) FROM public.drugs) as drugs_count,
       (SELECT COUNT(*) FROM public.glasses_inventory) as glasses_count,
       (SELECT COUNT(*) FROM public.appointments) as appointments_count,
       (SELECT COUNT(*) FROM public.payments) as payments_count;
