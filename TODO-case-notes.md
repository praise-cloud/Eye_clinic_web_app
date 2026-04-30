# TODO: Comprehensive Case Note Form + Manager Fix

## Task A: Case Note Form (Ophthalmology Fields)

- [x] 1. Update `supabase/schema.sql` — Add new columns to case_notes table

- [x] 2. Update `src/types/index.ts` — Update CaseNote interface with new fields

- [ ] 3. Update `src/pages/doctor/CaseNotesPage.tsx` — Rebuild form with all sections
- [ ] 4. Update `src/pages/patients/PatientDetailPage.tsx` — Update DecryptedNote display

## Task B: Manager Account Management Fix

- [x] 5. Update `supabase/schema.sql` — Add manager profile management RLS policy


## Follow-up

- [ ] 6. Verify all files compile correctly
