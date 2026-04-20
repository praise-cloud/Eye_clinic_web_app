# ✅ Eye Clinic PWA — Complete Todo List

Track every task from setup to deployment. Work through these in order — each phase builds on the previous.

Legend: 🔴 Critical Path | 🟡 Important | 🟢 Enhancement | 🔵 Optional

---

## PHASE 0 — Planning & Setup

- [ ] 🔴 Create GitHub repository (eyeclinic-pwa)
- [ ] 🔴 Set up Supabase project (production)
- [ ] 🔴 Set up Supabase project (staging / dev)
- [ ] 🔴 Register domain name (if applicable)
- [ ] 🔴 Create Vercel account and link to GitHub repo
- [ ] 🔴 Acquire VAPID key pair for Web Push (use `npx web-push generate-vapid-keys`)
- [ ] 🟡 Set up Resend account and verify sending domain
- [ ] 🟡 Set up Twilio account and acquire SMS phone number
- [ ] 🟡 Design and export clinic logo (PNG, 512×512 minimum)
- [ ] 🟢 Create Figma file for design reference (use design-ui.md as spec)

---

## PHASE 1 — Project Scaffold

- [ ] 🔴 Initialize Vite + React + TypeScript project
- [ ] 🔴 Install all dependencies (see architecture.md §3.1)
- [ ] 🔴 Configure Tailwind CSS with Inter font
- [ ] 🔴 Initialize shadcn/ui (slate base, CSS variables)
- [ ] 🔴 Configure vite-plugin-pwa with manifest and Workbox
- [ ] 🔴 Create .env and .env.example files
- [ ] 🔴 Set up src/ folder structure (all directories)
- [ ] 🔴 Create src/lib/supabase.ts (Supabase client singleton)
- [ ] 🔴 Configure tsconfig.json (strict mode, path aliases)
- [ ] 🔴 Add ESLint + Prettier config
- [ ] 🔴 Create .gitignore (node_modules, .env, dist)
- [ ] 🔴 Push initial commit to GitHub
- [ ] 🟡 Set up Vitest for testing
- [ ] 🟡 Configure path aliases (@/ → src/) in vite.config.ts and tsconfig

---

## PHASE 2 — Database

- [ ] 🔴 Install Supabase CLI locally
- [ ] 🔴 Link CLI to Supabase project
- [ ] 🔴 Enable uuid-ossp and pgcrypto extensions
- [ ] 🔴 Create migration: profiles table + trigger (auto-create on auth.users insert)
- [ ] 🔴 Create migration: patients table + patient_number sequence + trigger
- [ ] 🔴 Create migration: appointments table
- [ ] 🔴 Create migration: case_notes table
- [ ] 🔴 Create migration: prescriptions table
- [ ] 🔴 Create migration: drugs table
- [ ] 🔴 Create migration: drug_dispensing table + stock reduction trigger
- [ ] 🔴 Create migration: glasses_inventory table
- [ ] 🔴 Create migration: glasses_orders table + order_number sequence + trigger
- [ ] 🔴 Create migration: payments table + receipt_number sequence + trigger
- [ ] 🔴 Create migration: messages table + conversation index
- [ ] 🔴 Create migration: outreach_log table
- [ ] 🔴 Create migration: push_subscriptions table
- [ ] 🔴 Create migration: audit_logs table (append-only)
- [ ] 🔴 Create migration: system_settings table (key-value)
- [ ] 🔴 Create VIEW: daily_summary
- [ ] 🔴 Create VIEW: low_stock_drugs
- [ ] 🔴 Create VIEW: low_stock_glasses
- [ ] 🔴 Create VIEW: expiring_subscriptions
- [ ] 🔴 Create and apply audit triggers (patients, payments, drug_dispensing, case_notes, glasses_orders)
- [ ] 🔴 Create helper function: get_user_role()
- [ ] 🔴 Enable RLS on ALL tables (verify in Supabase dashboard)
- [ ] 🔴 Write and apply all RLS policies (see backend.md §4)
- [ ] 🔴 Enable Realtime on: messages, appointments, drug_dispensing, glasses_orders
- [ ] 🔴 Run migrations against dev Supabase project
- [ ] 🔴 Create seed.sql: first admin user + sample drugs + sample frames
- [ ] 🔴 Run seed on dev project and verify data
- [ ] 🟡 Generate TypeScript types from Supabase schema (`supabase gen types typescript`)
- [ ] 🟡 Verify all foreign key relationships are correct
- [ ] 🟡 Test RLS: log in as each role and confirm correct data access

---

## PHASE 3 — Authentication

- [ ] 🔴 Configure Supabase Auth (email/password, no social, email confirmation off)
- [ ] 🔴 Create authStore.ts (Zustand: user, profile, isLoading, isAuthenticated)
- [ ] 🔴 Create useAuth.ts hook (session init, onAuthStateChange, profile fetch)
- [ ] 🔴 Create LoginPage.tsx (form, validation, error handling)
- [ ] 🔴 Create RoleGuard.tsx (auth check, role check, redirect logic)
- [ ] 🔴 Create App.tsx with role-based routing and QueryClient provider
- [ ] 🔴 Configure React Router routes for all 4 role areas
- [ ] 🔴 Test login → correct dashboard redirect for each role
- [ ] 🔴 Test unauthenticated redirect to /login
- [ ] 🔴 Test wrong-role redirect to correct dashboard
- [ ] 🟡 Add "Forgot Password" flow (Supabase sends reset email)
- [ ] 🟡 Add session timeout warning modal (at 50 min mark)

---

## PHASE 4 — App Shell & Layout

- [ ] 🔴 Create AppShell.tsx (sidebar + header + content wrapper)
- [ ] 🔴 Create Sidebar.tsx with role-specific accent colors
- [ ] 🔴 Create Header.tsx (page title, search icon, notifications, avatar dropdown)
- [ ] 🔴 Create usePresence.ts (Supabase Realtime Presence)
- [ ] 🔴 Create uiStore.ts (sidebar, notifications)
- [ ] 🔴 Implement online users list in sidebar
- [ ] 🔴 Wire up all 4 role-specific nav item configs
- [ ] 🔴 Mobile responsive: bottom navigation bar on <768px
- [ ] 🔴 Notification bell dropdown (real-time unread count)
- [ ] 🟡 Sidebar collapse/expand on desktop (saves preference)
- [ ] 🟢 Dark mode toggle (shadcn supports this via class strategy)

---

## PHASE 5 — Patient Management

- [ ] 🔴 Create usePatients.ts hook (list, single, create, update)
- [ ] 🔴 Create PatientRegistrationForm.tsx (right-side drawer, all fields, validation)
- [ ] 🔴 Create PatientSearch.tsx (debounced search, results list)
- [ ] 🔴 Create PatientCard.tsx (search result card with subscription badge)
- [ ] 🔴 Create PatientStatusBadge.tsx component
- [ ] 🔴 Create assistant/PatientRegistration.tsx page
- [ ] 🔴 Create doctor/PatientView.tsx (tabbed detail page)
- [ ] 🔴 Create assistant/PatientView.tsx (same but without case note write access)
- [ ] 🔴 Create admin/AllPatients.tsx page
- [ ] 🔴 Implement duplicate patient warning (check phone/name before register)
- [ ] 🟡 Patient photo upload (Supabase Storage)
- [ ] 🟡 Print patient profile card
- [ ] 🟢 Patient import from CSV (admin feature)

---

## PHASE 6 — Case Notes & Prescriptions

- [ ] 🔴 Create crypto.ts (encryptText, decryptText — AES-GCM)
- [ ] 🔴 Create useCaseNotes.ts hook (fetch+decrypt, create+encrypt, update)
- [ ] 🔴 Create CaseNoteForm.tsx (drawer form, all clinical fields, encryption)
- [ ] 🔴 Create CaseNoteCard.tsx (display decrypted note, print button)
- [ ] 🔴 Create usePrescriptions.ts hook
- [ ] 🔴 Create GlassesPrescriptionForm.tsx (drawer with R/L eye grid, frame selector)
- [ ] 🔴 Create PrescriptionPrintView.tsx (printable with clinic letterhead)
- [ ] 🔴 Create doctor/CaseNotes.tsx page
- [ ] 🔴 Create doctor/Prescriptions.tsx page
- [ ] 🔴 Wire case notes to appointment context
- [ ] 🟡 Prescription PDF export (using browser print API with print CSS)
- [ ] 🟡 Case note templates (pre-fill common findings)
- [ ] 🟢 Voice-to-text for case note input (Web Speech API)

---

## PHASE 7 — Inventory Management

- [ ] 🔴 Create useInventory.ts hook (drugs, glasses, create, update, low stock)
- [ ] 🔴 Create DrugInventoryTable.tsx (sortable, low-stock warning, actions)
- [ ] 🔴 Create DrugForm.tsx (drawer form for add/edit drug)
- [ ] 🔴 Create RestockForm.tsx (quick modal to add stock quantity)
- [ ] 🔴 Create DrugDispensingForm.tsx (patient search + drug + quantity + auto-price)
- [ ] 🔴 Create GlassesInventoryTable.tsx
- [ ] 🔴 Create GlassesOrderTracker.tsx (status kanban/table with advance buttons)
- [ ] 🔴 Create assistant/DrugDispensing.tsx page
- [ ] 🔴 Create assistant/GlassesOrders.tsx page
- [ ] 🔴 Create admin/InventoryManagement.tsx page (both drugs + glasses)
- [ ] 🔴 Wire low-stock alert count to sidebar badge (assistant + admin)
- [ ] 🔴 Wire low-stock to admin dashboard card
- [ ] 🟡 Expiry date alerts for drugs (warn 30 days before)
- [ ] 🟡 Export inventory list to CSV/PDF
- [ ] 🟢 Supplier management module
- [ ] 🟢 Purchase order tracking

---

## PHASE 8 — Appointments & Scheduling

- [ ] 🔴 Create useAppointments.ts hook (list, create, update status, realtime)
- [ ] 🔴 Create AppointmentBookingForm.tsx (drawer: patient, doctor, datetime, type, notes)
- [ ] 🔴 Create AppointmentTable.tsx (with status badges and role-appropriate actions)
- [ ] 🔴 Create useArrivalAlerts.ts (doctor hook: listens for patient_arrived status change)
- [ ] 🔴 Create assistant/AppointmentManager.tsx page
- [ ] 🔴 Create doctor/Appointments.tsx page
- [ ] 🔴 Implement "Mark Arrived" → calls send-push Edge Function
- [ ] 🔴 Implement arrival toast notification on doctor's dashboard
- [ ] 🔴 Implement doctor "Request Checkup Appointment" button on patient profile
- [ ] 🔴 Show appointment request on assistant's notification bell
- [ ] 🟡 Weekly calendar view of appointments
- [ ] 🟡 Appointment conflict detection (same doctor + overlapping time)
- [ ] 🟡 Recurring appointment scheduling
- [ ] 🟢 Patient self-booking link (public page, assistant confirms)

---

## PHASE 9 — Payments & Finance

- [ ] 🔴 Create usePayments.ts hook (list, create, daily summary, monthly revenue)
- [ ] 🔴 Create PaymentForm.tsx (modal: type, amount, method, notes)
- [ ] 🔴 Create ReceiptView.tsx (printable receipt with clinic header)
- [ ] 🔴 Create accountant/DailySummary.tsx page (breakdown table + export)
- [ ] 🔴 Create accountant/PaymentManager.tsx page (full history, filters)
- [ ] 🔴 Create accountant/AccountantDashboard.tsx (cards + bar chart + recent payments)
- [ ] 🔴 Create admin/Reports.tsx (date range reports, charts, export)
- [ ] 🔴 Wire PaymentForm into DrugDispensingForm flow (prompt after dispense)
- [ ] 🔴 Wire PaymentForm into GlassesOrderTracker (prompt at collection)
- [ ] 🔴 Format all amounts as ₦ with toLocaleString('en-NG')
- [ ] 🔴 Implement Export to CSV (client-side, using papaparse or manual CSV generation)
- [ ] 🟡 Implement Export to PDF (using browser print with print CSS)
- [ ] 🟡 Monthly financial report generation
- [ ] 🟡 Payment method breakdown chart (pie chart)
- [ ] 🟢 Invoice generation (send PDF to patient email)

---

## PHASE 10 — Real-Time Chat

- [ ] 🔴 Create useChat.ts hook (conversation fetch, send, realtime subscribe, mark read)
- [ ] 🔴 Create chatStore.ts (Zustand: active conversation, messages, unread counts)
- [ ] 🔴 Create ChatSidebar.tsx (staff contact list with presence indicators)
- [ ] 🔴 Create ChatWindow.tsx (message bubbles, timestamps, read receipts, input)
- [ ] 🔴 Create ChatWidget.tsx (floating button + expandable overlay)
- [ ] 🔴 Mount ChatWidget at AppShell level (persists across navigation)
- [ ] 🔴 Wire unread count badge to Chat nav item (all roles)
- [ ] 🔴 Implement auto-scroll to latest message
- [ ] 🔴 Implement date separators in message thread
- [ ] 🟡 Message delivery status indicators (sent ✓ / read ✓✓)
- [ ] 🟡 Typing indicator ("Doctor Babs is typing...")
- [ ] 🟡 File/image sharing in chat (Supabase Storage)
- [ ] 🟢 Group chat / broadcast channel (e.g., "All Staff" group)

---

## PHASE 11 — Patient Outreach

- [ ] 🔴 Deploy send-outreach Edge Function to Supabase
- [ ] 🔴 Set RESEND_API_KEY, TWILIO_* secrets in Supabase
- [ ] 🔴 Create useOutreach.ts hook (expiring subs, send, log history)
- [ ] 🔴 Create message template system (hardcoded templates with variable substitution)
- [ ] 🔴 Create OutreachPanel.tsx (patient search + channel + template + send)
- [ ] 🔴 Create OutreachHistory.tsx (log table with filters)
- [ ] 🔴 Create assistant/Outreach.tsx page
- [ ] 🔴 Implement bulk outreach (multi-select from expiring subscriptions list)
- [ ] 🔴 Wire doctor "Request Checkup" to create appointment + outreach action item
- [ ] 🟡 Outreach scheduling (send at a specific time, not immediately)
- [ ] 🟡 WhatsApp channel via Twilio WhatsApp API
- [ ] 🟢 Admin-editable message templates
- [ ] 🟢 Patient opt-out management

---

## PHASE 12 — Admin & User Management

- [ ] 🔴 Create useAdminData.ts hook (staff list, create user, deactivate, audit logs)
- [ ] 🔴 Create Edge Function: create-staff-user (server-side Supabase Admin API call)
- [ ] 🔴 Create admin/AdminDashboard.tsx (overview cards + audit preview + activity feed)
- [ ] 🔴 Create admin/UserManagement.tsx (staff table with status + actions)
- [ ] 🔴 Create UserForm.tsx drawer (create + edit staff)
- [ ] 🔴 Create admin/AuditLogs.tsx (filterable table + diff modal)
- [ ] 🔴 Create admin/BackupManager.tsx (password-encrypted export)
- [ ] 🔴 Deploy export-backup Edge Function
- [ ] 🔴 Create SystemSettings.tsx panel (clinic info, logo, thresholds)
- [ ] 🟡 Backup restoration UI (decrypt + import from file)
- [ ] 🟡 Admin activity log (track admin actions separately)
- [ ] 🟢 Two-factor authentication for Admin role

---

## PHASE 13 — PWA & Push Notifications

- [ ] 🔴 Create public/manifest.json (all fields, all icon sizes)
- [ ] 🔴 Generate PWA icons (all required sizes from clinic logo)
- [ ] 🔴 Create InstallPrompt.tsx (custom install banner)
- [ ] 🔴 Create usePWAInstall.ts hook (beforeinstallprompt, standalone detection)
- [ ] 🔴 Create src/lib/push.ts (requestPermission, subscribe, unsubscribe)
- [ ] 🔴 Add push_subscriptions table migration to Supabase
- [ ] 🔴 Deploy send-push Edge Function
- [ ] 🔴 Set VAPID_PRIVATE_KEY secret in Supabase
- [ ] 🔴 Create service worker push handler (sw-custom.js)
- [ ] 🔴 Configure Workbox runtime caching strategy for Supabase API calls
- [ ] 🔴 Create OfflinePage.tsx (fallback when network is unavailable)
- [ ] 🔴 Create "Update Available" banner component
- [ ] 🔴 Test PWA install on Chrome desktop (Windows + Mac)
- [ ] 🔴 Test PWA install on Android Chrome
- [ ] 🟡 Test PWA on iOS Safari (manual Add to Home Screen)
- [ ] 🟡 Test offline behavior (critical pages load from cache)
- [ ] 🟡 Lighthouse audit — target PWA score ≥ 90

---

## PHASE 14 — Polish & Error Handling

- [ ] 🔴 Create ErrorBoundary.tsx (catch rendering errors, show fallback)
- [ ] 🔴 Global React Query onError handler (toast on all query/mutation failures)
- [ ] 🔴 Implement skeleton loading for all tables and cards
- [ ] 🔴 Implement empty states for all list views (with icon, message, CTA button)
- [ ] 🔴 Add loading spinner/disable to all form submit buttons during mutation
- [ ] 🔴 "Unsaved changes" confirm dialog when closing dirty forms
- [ ] 🔴 Session timeout warning modal (at 50 min inactivity)
- [ ] 🔴 Remove all console.log statements (replace with dev-only logger)
- [ ] 🔴 Sanitize all rendered user input (prevent XSS)
- [ ] 🔴 Rate limit form submissions (2s debounce on submit button)
- [ ] 🔴 Add network status banner ("You are offline — some features unavailable")
- [ ] 🟡 Add keyboard shortcuts (N = new patient, Esc = close drawer/modal)
- [ ] 🟡 Lazy load all page components (React.lazy + Suspense)
- [ ] 🟡 Memoize expensive renders (React.memo on list items)
- [ ] 🟢 Table virtualization for large datasets (>100 rows)

---

## PHASE 15 — Accessibility

- [ ] 🔴 All images have descriptive alt text
- [ ] 🔴 All icon-only buttons have aria-label
- [ ] 🔴 All form inputs have associated <label> elements
- [ ] 🔴 Error messages linked to inputs via aria-describedby
- [ ] 🔴 All color indicators paired with icon or text (not color-only)
- [ ] 🔴 All modals and drawers trap focus correctly
- [ ] 🔴 Escape key closes all modals and drawers
- [ ] 🔴 Focus returns to trigger element when modal/drawer closes
- [ ] 🔴 Tab order is logical throughout all pages
- [ ] 🔴 Custom focus ring visible on all interactive elements
- [ ] 🔴 WCAG AA contrast ratio met on all text (verify with dev tools)
- [ ] 🟡 Run axe accessibility audit (browser extension) on all pages
- [ ] 🟡 Test keyboard-only navigation through all core workflows

---

## PHASE 16 — Testing

- [ ] 🔴 Write unit test: encryptText / decryptText round-trip
- [ ] 🔴 Write unit test: PaymentForm zod schema validation
- [ ] 🔴 Write unit test: patient number format (P-00001)
- [ ] 🔴 Write unit test: useAuth hook (mock Supabase)
- [ ] 🔴 Write unit test: role-based route protection (RoleGuard)
- [ ] 🟡 Write integration test: patient registration form submit → Supabase insert (mock)
- [ ] 🟡 Write integration test: drug dispense → stock reduction verification
- [ ] 🟡 Write integration test: payment creation → receipt number generated
- [ ] 🟡 Manual end-to-end test: full patient journey (register → appointment → consultation → dispense → payment)
- [ ] 🟡 Manual end-to-end test: glasses order journey (prescription → order → payment → dispensed)
- [ ] 🟡 Test each role dashboard with correct user credentials
- [ ] 🟢 Set up Playwright for E2E browser testing

---

## PHASE 17 — Deployment

- [ ] 🔴 Run all Supabase migrations against production project
- [ ] 🔴 Run seed script on production (creates first admin)
- [ ] 🔴 Deploy all 3 Edge Functions to production Supabase
- [ ] 🔴 Set all Edge Function secrets in production
- [ ] 🔴 Set all environment variables in Vercel project settings
- [ ] 🔴 Push to main branch → verify Vercel auto-deploys
- [ ] 🔴 Verify HTTPS is active on production URL
- [ ] 🔴 Verify PWA install works on production URL
- [ ] 🔴 Verify Supabase Realtime works on production (chat + appointments)
- [ ] 🔴 Verify push notifications work end-to-end in production
- [ ] 🔴 Verify SMS/email outreach works (send test message)
- [ ] 🔴 Test backup export and encrypted file download
- [ ] 🔴 Create first Admin account and log in via production URL
- [ ] 🔴 Create all staff accounts (doctor, assistant, accountant) via Admin panel
- [ ] 🔴 Verify RLS is active on ALL production tables (Supabase dashboard check)
- [ ] 🟡 Set up custom domain and SSL (if applicable)
- [ ] 🟡 Enable Supabase Pro (point-in-time recovery, daily backups)
- [ ] 🟡 Set up uptime monitoring (e.g., UptimeRobot — free tier)
- [ ] 🟡 Write user documentation / training guide for clinic staff

---

## PHASE 18 — Post-Launch

- [ ] 🟡 Gather staff feedback after first week
- [ ] 🟡 Monitor Supabase usage (storage, bandwidth, connections)
- [ ] 🟡 Review audit logs for unexpected activity
- [ ] 🟡 Implement admin-editable message templates (outreach)
- [ ] 🟢 Add appointment email confirmation to patients (auto-send on booking)
- [ ] 🟢 Build patient portal (separate URL where patients can view their own records)
- [ ] 🟢 Add multi-branch support (clinic_id on all tables)
- [ ] 🟢 Add WhatsApp Business API integration
- [ ] 🟢 Build native mobile app (Capacitor wrapping the PWA)

---

## Quick Reference — Critical Path Summary

The absolute minimum to have a working application:

1. Scaffold + Supabase schema + Auth *(Phases 0-3)*
2. App shell + Patient management *(Phases 4-5)*
3. Case notes + Inventory + Payments *(Phases 6-9)*
4. Chat *(Phase 10)*
5. Appointments *(Phase 8)*
6. PWA setup + Deploy *(Phases 13, 17)*

Everything else is important but can follow in iteration after the core is live.

---

## Estimated Timeline

| Phase | Description | Estimated Time |
|---|---|---|
| 0-1 | Planning + Scaffold | 1 day |
| 2 | Database + RLS | 2 days |
| 3-4 | Auth + Shell | 1 day |
| 5-6 | Patients + Clinical | 3 days |
| 7-8 | Inventory + Appointments | 3 days |
| 9 | Payments + Finance | 2 days |
| 10-11 | Chat + Outreach | 2 days |
| 12 | Admin + User Mgmt | 2 days |
| 13-15 | PWA + Polish + A11y | 2 days |
| 16-17 | Testing + Deploy | 1 day |
| **Total** | | **~19 working days** |
