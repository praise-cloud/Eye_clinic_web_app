-- Fix RLS policy for deleting appointments
-- Run this in Supabase SQL Editor if appointment deletion is blocked

-- Drop existing delete policy if it exists
DROP POLICY IF EXISTS "appointments_delete_own_or_admin" ON appointments;

-- Create policy allowing doctors to delete their own appointments, and admin/frontdesk to delete any
CREATE POLICY "appointments_delete_own_or_admin" ON appointments
    FOR DELETE
    TO authenticated
    USING (
        doctor_id = (SELECT id FROM profiles WHERE id = auth.uid())
        OR 
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'frontdesk')
    );

-- Verify the policy was created
SELECT * FROM pg_policies WHERE tablename = 'appointments' AND cmd = 'DELETE';
