# TODO: Fix CRUD Issues - Implementation Plan

## Summary of Issues
The application has multiple CRUD (Create, Read, Update, Delete) operation failures across different roles:
- **Frontdesk**: Patients not deleting, editing, or creating
- **Admin**: Frames can't be added/deleted from inventory, items can't be added, payment records can't be deleted
- **Doctor**: Case notes can't be created, appointments can't be created
- **Manager**: Can't create new accounts or edit account details

## Root Cause Analysis

After analyzing the codebase, the issues are a combination of:
1. **Missing error handling** in some mutations (not checking for Supabase errors)
2. **Missing RLS (Row Level Security) policies** for some tables
3. **Missing or incorrect permissions** in existing RLS policies

## Implementations Completed

### 1. Admin UsersPage.tsx (src/pages/admin/UsersPage.tsx)
- ✅ Fixed `toggleActive` mutation - added error handling
- ✅ Fixed `updateMutation` mutation - added error handling
- Status: COMPLETE

### 2. Manager UsersPage.tsx (src/pages/manager/UsersPage.tsx)
- ✅ Fixed `createMutation` - added password validation check
- ✅ Fixed `updateMutation` - added error handling
- ✅ Fixed `toggleActive` - added error handling
- Status: COMPLETE

### 3. Frontend Code Analysis
All other CRUD operations already have proper error handling:
- ✅ PatientsPage.tsx - has error handling
- ✅ InventoryPage.tsx - has error handling
- ✅ PaymentsPage.tsx - has error handling
- ✅ AppointmentsPage.tsx - has error handling
- ✅ CaseNotesPage.tsx - has error handling

## Next Steps (Database Fixes Required)

### 4. Run RLS Policy Fix Script
Run the following SQL in your Supabase SQL Editor:

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and run the contents of: `supabase/fix-all-rls-policies.sql`

### 5. Verify Fixes
After running the SQL script, test each operation:

**Frontdesk Role:**
- [ ] Create a new patient
- [ ] Edit an existing patient
- [ ] Delete a patient

**Admin Role:**
- [ ] Add a new frame to inventory
- [ ] Delete a frame from inventory
- [ ] Add a new item to inventory others
- [ ] Add a new drug
- [ ] Delete a payment record

**Doctor Role:**
- [ ] Create a new case note
- [ ] Create a new appointment

**Manager Role:**
- [ ] Create a new staff account
- [ ] Edit an existing staff account
- [ ] Toggle staff account active/inactive

## Testing Checklist

If operations still fail after running the SQL:
1. Check browser console for error messages
2. Check Supabase dashboard for RLS policy errors
3. Verify user has correct role assigned in profiles table

## Additional Resources
- `supabase/fixes.sql` - Quick fixes for specific issues
- `supabase/schema.sql` - Full database schema
- `supabase/schema-fixed.sql` - Additional schema fixes
