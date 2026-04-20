# 🤖 Eye Clinic PWA — AI Build Prompts

Use these prompts in sequence with an AI coding assistant (Claude, Cursor, v0, etc.) to build the full application. Each prompt is self-contained and builds on the previous. Always paste relevant context from earlier prompts when needed.

---

## PROMPT 0 — Project Scaffold

```
Create a new React + Vite + TypeScript project called "eyeclinic-pwa" with the following setup:

1. Initialize with Vite using the react-ts template
2. Install dependencies:
   - @supabase/supabase-js
   - @tanstack/react-query
   - react-router-dom
   - zustand
   - tailwindcss
   - @tailwindcss/forms
   - shadcn/ui (init with default style, slate base color, CSS variables: yes)
   - react-hook-form
   - @hookform/resolvers
   - zod
   - date-fns
   - recharts
   - lucide-react
   - vite-plugin-pwa
   - workbox-window

3. Configure Tailwind with Inter font from Google Fonts
4. Set up the vite.config.ts with vite-plugin-pwa configured for:
   - registerType: 'autoUpdate'
   - includeAssets: favicon, robots.txt, apple-touch-icon
   - manifest with name "Eye Clinic", short_name "EyeClinic", theme_color "#1D7FE8", background_color "#F8FAFC", display: "standalone"
   - workbox: runtimeCaching for Supabase API calls (NetworkFirst strategy)

5. Create a .env.example file with:
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   VITE_APP_ENCRYPTION_SALT=
   VITE_VAPID_PUBLIC_KEY=

6. Set up the base folder structure:
   src/lib/, src/store/, src/hooks/, src/components/ui/, src/components/layout/, src/pages/auth/, src/pages/doctor/, src/pages/assistant/, src/pages/admin/, src/pages/accountant/, src/types/

7. Create src/lib/supabase.ts that initializes and exports the Supabase client with proper TypeScript generic typing.

Show all config files and the project structure when done.
```

---

## PROMPT 1 — Supabase Database Schema

```
I am building an Eye Clinic PWA with Supabase as the backend. 

Create the complete SQL migration file for the following tables. Each table should have Row Level Security enabled. Create all helper functions and triggers as specified.

Tables needed:
1. profiles (extends auth.users — stores role: doctor|assistant|admin|accountant, full_name, phone, avatar_url, is_active)
2. patients (with auto-generated patient_number P-00001, subscription_type, full demographics)
3. appointments (with status: pending|confirmed|arrived|in_progress|completed|cancelled|no_show)
4. case_notes (clinical notes, supports encrypted fields flag)
5. prescriptions (glasses — right/left eye: sphere, cylinder, axis, add, VA; PD; lens_type)
6. drugs (inventory — name, category, quantity, reorder_level, purchase_price, selling_price, expiry_date)
7. drug_dispensing (records each dispense, auto-reduces drug stock via trigger, prevents negative stock)
8. glasses_inventory (frames — name, brand, code, color, material, quantity, prices)
9. glasses_orders (with auto-generated GO-00001, status tracking, deposit tracking)
10. payments (with auto-generated RCP-00001, payment_type: consultation|drug|glasses_deposit|glasses_balance|subscription)
11. messages (for staff chat, with read receipts)
12. outreach_log (records every SMS/email sent to patients)
13. push_subscriptions (stores Web Push subscription JSON per user)
14. audit_logs (append-only, records all INSERT/UPDATE/DELETE across sensitive tables)

Also create:
- A daily_summary VIEW aggregating revenue by type and patient counts per day
- A low_stock_drugs VIEW and low_stock_glasses VIEW
- An expiring_subscriptions VIEW (patients whose subscription ends within 30 days)
- Audit triggers on: patients, payments, drug_dispensing, case_notes, glasses_orders
- A get_user_role() helper function for use in RLS policies

Write all RLS policies for each role (doctor, assistant, admin, accountant) strictly matching the access matrix I will provide.

Access Matrix:
- Patients table: assistant+admin write; all roles read
- Case notes: doctor write+read own; admin read all; others none
- Prescriptions: doctor write+read; assistant+admin read
- Drugs: assistant+admin write; all read
- Drug dispensing: assistant write; doctor+admin+accountant read; assistant read
- Payments: assistant insert; accountant+admin full access; assistant read
- Messages: users read/write own messages only
- Audit logs: admin read only; append-only for all

Output a single clean SQL file with sections clearly commented.
```

---

## PROMPT 2 — Auth System & Role-Based Routing

```
Build the complete authentication system and role-based routing for the Eye Clinic PWA.

Stack: React, TypeScript, React Router v6, Zustand, Supabase Auth.

Create the following:

1. src/store/authStore.ts
   - Zustand store with: user, profile (with role), isLoading, isAuthenticated
   - Actions: setUser, setProfile, setLoading, signOut

2. src/hooks/useAuth.ts
   - On mount: get current session from Supabase
   - Listen to onAuthStateChange
   - Fetch profile from profiles table after login
   - Handle signOut (clears store + Supabase session)

3. src/pages/auth/LoginPage.tsx
   - Clean centered card layout
   - Email + password fields using react-hook-form + zod validation
   - Show/hide password toggle
   - Error toast on failed login
   - On success: redirect to the correct dashboard based on role
   - No role selector visible to user

4. src/components/layout/RoleGuard.tsx
   - Wrapper component that checks auth state
   - If not authenticated: redirect to /login
   - If authenticated but wrong role for route: redirect to their correct dashboard
   - Shows loading skeleton while auth state resolves

5. src/App.tsx
   - Top-level router with routes:
     /login → LoginPage (public)
     /doctor/* → DoctorRoutes (role: doctor only)
     /assistant/* → AssistantRoutes (role: assistant only)
     /admin/* → AdminRoutes (role: admin only)
     /accountant/* → AccountantRoutes (role: accountant only)
     / → Redirect to correct dashboard based on role, or /login
   - Wrap all protected routes in RoleGuard
   - Initialize React Query QueryClient at root

Design: Clean minimal login page. Slate background (F8FAFC), centered white card with subtle shadow, Inter font, primary blue button (#1D7FE8).
```

---

## PROMPT 3 — App Shell & Shared Layout

```
Build the shared app shell layout for the Eye Clinic PWA. This layout is used by all four role dashboards.

Stack: React, TypeScript, Tailwind CSS, shadcn/ui, Zustand, Lucide React.

Create:

1. src/components/layout/AppShell.tsx
   - Fixed sidebar (240px) + main content area
   - Fixed top header (56px)
   - Main scrollable content area fills remaining space
   - Accepts: navItems array, role, children

2. src/components/layout/Sidebar.tsx
   Props: navItems (icon, label, href, badge?), role, onSignOut
   - Role-specific accent color for active nav items:
     doctor → blue (#1D7FE8)
     assistant → teal (#0D9488)
     admin → indigo (#4F46E5)
     accountant → emerald (#059669)
   - Active item: accent background at 10% opacity + accent text + left border
   - Hover: slate-100 background
   - Bottom section: Online users list (show avatar, name, green/grey dot)
   - Very bottom: Settings + Sign Out

3. src/components/layout/Header.tsx
   Props: pageTitle, role
   - Left: Page title (24px, slate-900, 600 weight)
   - Right: Global search icon, Notification bell with badge, User avatar + name dropdown (Profile, Sign out)
   - Notification dropdown: shows recent unread messages and patient-arrived alerts

4. src/hooks/usePresence.ts
   - Subscribe to Supabase Realtime Presence channel "clinic_presence"
   - Track current user as online (with profile data)
   - Return: onlineUsers array, track, untrack functions
   - Untrack on unmount

5. src/store/uiStore.ts
   - sidebarOpen (boolean), activePage, notifications array
   - Actions: toggleSidebar, addNotification, markNotificationRead

6. Mobile responsive behavior:
   - Below 768px: sidebar becomes bottom navigation bar (5 main items, icons only, labels below)
   - Header on mobile: logo left, notification + avatar right (no page title)

Use Tailwind throughout. No inline styles. Export clean, well-typed components.
```

---

## PROMPT 4 — Patient Management Module

```
Build the complete Patient Management module for the Eye Clinic PWA.

Stack: React, TypeScript, Supabase, React Query, react-hook-form, zod, Tailwind, shadcn/ui.

Create:

1. src/hooks/usePatients.ts
   - usePatients(searchQuery?): paginated patient list from Supabase, real-time search
   - usePatient(id): single patient with full details
   - useCreatePatient(): mutation to insert new patient
   - useUpdatePatient(): mutation to update patient
   All queries use React Query with appropriate staleTime.

2. src/components/patients/PatientRegistrationForm.tsx
   Right-side drawer (600px) form with sections:
   - Personal Info: First name, Last name, DOB, Gender, Phone, Email
   - Address & Occupation
   - Next of Kin: Name, Phone
   - Medical: Blood group, Allergies (multi-line)
   - Subscription: Type dropdown (none/basic/standard/premium), Start date
   
   Validation with zod. Required fields starred. Submit creates patient in Supabase.
   On success: toast "Patient P-00XXX registered successfully", close drawer, refresh list.

3. src/components/patients/PatientSearch.tsx
   - Search input with debounce (300ms)
   - Searches: first_name, last_name, patient_number, phone
   - Results: patient cards showing name, number, gender/age, subscription badge, last visit
   - Click → navigate to /[role]/patients/[id]

4. src/pages/assistant/PatientRegistration.tsx
   Full page with:
   - Top: Search existing patients (prevent duplicates)
   - "Register New Patient" button → opens PatientRegistrationForm drawer
   - List of today's registered patients

5. src/pages/doctor/PatientView.tsx (and assistant version)
   Patient detail page with tab navigation:
   - Overview: demographics, subscription status, contact info
   - Case Notes: list of all notes, "New Note" button (doctor only)
   - Prescriptions: glasses prescriptions history
   - Payments: payment history for this patient
   - Appointments: appointment history

6. PatientStatusBadge component: shows subscription type with color coding

Make tables responsive, use skeleton loading states, empty states with illustration placeholder and call-to-action button.
```

---

## PROMPT 5 — Case Notes & Prescriptions

```
Build the Case Notes and Prescriptions system for the Eye Clinic PWA.

Stack: React, TypeScript, Supabase, React Query, react-hook-form, zod, Tailwind, shadcn/ui.
Encryption: Use the Web Crypto API (AES-GCM) to encrypt case note content fields before saving to Supabase, and decrypt on retrieval.

Create:

1. src/lib/crypto.ts
   - encryptText(plaintext: string): Promise<string> — AES-GCM, returns base64
   - decryptText(ciphertext: string): Promise<string>
   - Key derived from VITE_APP_ENCRYPTION_SALT via PBKDF2

2. src/hooks/useCaseNotes.ts
   - useCaseNotes(patientId): fetch case notes, decrypt content on retrieval
   - useCreateCaseNote(): encrypt fields then insert
   - useUpdateCaseNote(): re-encrypt + update

3. src/components/casenotes/CaseNoteForm.tsx
   Right-drawer form (doctor only):
   - Chief Complaint (required, text area)
   - History (text area)
   - Examination Findings (text area)
   - Diagnosis (required, text area)
   - Treatment Plan (text area)
   - Follow-up Date (date picker)
   All sensitive fields are encrypted before submission.
   
4. src/components/casenotes/CaseNoteCard.tsx
   Displays decrypted note content in a clean card:
   - Date, Doctor name, linked appointment
   - Sections with labels
   - Print button (prints formatted prescription page)
   - Edit button (doctor only, only for today's notes)

5. src/components/prescriptions/GlassesPrescriptionForm.tsx
   Right-drawer form with:
   - Grid: Right Eye and Left Eye columns
   - Fields per eye: Sphere, Cylinder, Axis, ADD, VA
   - PD field
   - Lens Type select (Single Vision / Bifocal / Progressive / Reading)
   - Frame selection from glasses_inventory (searchable dropdown)
   - Notes field
   - Auto-calculates total order cost when frame selected
   - On submit: creates prescription + glasses_order record simultaneously

6. src/components/prescriptions/PrescriptionPrintView.tsx
   Printable prescription card:
   - Clinic header (name, address, logo)
   - Patient details
   - Prescription table (R/L eye, all values)
   - Doctor signature line
   - Date
   Triggered via window.print() with print-only CSS

Make all forms accessible (label associations, error messages via aria-describedby, focus management).
```

---

## PROMPT 6 — Inventory Management

```
Build the Inventory Management module (Drugs + Glasses) for the Eye Clinic PWA.

Stack: React, TypeScript, Supabase, React Query, react-hook-form, zod, Tailwind, shadcn/ui.

Create:

1. src/hooks/useInventory.ts
   - useDrugs(search?): paginated drug list, filter by low stock
   - useGlassesInventory(search?): paginated frames list
   - useCreateDrug / useUpdateDrug / useDeleteDrug
   - useCreateFrame / useUpdateFrame
   - useLowStockAlerts(): combines both low stock views

2. src/components/inventory/DrugInventoryTable.tsx
   Sortable table:
   - Columns: Name, Generic Name, Category, In Stock, Unit, Selling Price, Expiry, Actions
   - Low stock rows: amber warning icon + amber text for quantity
   - Expired rows: red badge
   - Actions: Edit (drawer), Restock (quick modal: enter quantity added)
   - "Add Drug" button → DrugForm drawer
   - Search input above table

3. src/components/inventory/DrugForm.tsx
   Drawer form: Name, Generic Name, Category, Unit, Initial Quantity, Reorder Level, Purchase Price, Selling Price, Supplier, Expiry Date

4. src/components/inventory/DrugDispensingForm.tsx
   Used by assistant to dispense drugs to a patient:
   - Patient search (autocomplete)
   - Drug search + quantity input
   - Auto-shows current stock, warns if quantity > stock
   - Auto-calculates total: unit_price × quantity
   - On submit: inserts drug_dispensing record (trigger handles stock reduction)
   - Immediately prompts to record payment

5. src/components/inventory/GlassesInventoryTable.tsx
   Similar to drug table but for frames:
   - Frame Name, Brand, Code, Color, Material, Qty, Price, Actions
   - Low stock warning same as drugs

6. src/components/inventory/GlassesOrderTracker.tsx
   Kanban-style status tracker:
   - Columns: Pending | In Lab | Ready | Dispensed
   - Each order shown as card: order number, patient name, frame, estimated ready date
   - Drag or click to advance status
   - "Mark Dispensed" → prompts to record balance payment

7. src/pages/assistant/DrugDispensing.tsx
   Full page combining DrugDispensingForm + recent dispense history table for today.

Show low stock alert counts in sidebar badge for assistant and admin.
```

---

## PROMPT 7 — Appointments & Scheduling

```
Build the Appointments & Scheduling module for the Eye Clinic PWA.

Stack: React, TypeScript, Supabase, React Query, Supabase Realtime, react-hook-form, zod, date-fns, Tailwind, shadcn/ui.

Create:

1. src/hooks/useAppointments.ts
   - useAppointments(date?, doctorId?): fetch appointments with patient + doctor info joined
   - useCreateAppointment(): create appointment record
   - useUpdateAppointmentStatus(id, status): update status field
   - useRealtimeAppointments(): subscribe to Supabase realtime on appointments table, invalidate query on any change

2. src/components/appointments/AppointmentBookingForm.tsx
   Drawer form:
   - Patient search (autocomplete from patients table)
   - Doctor select (from profiles where role=doctor)
   - Date + Time picker
   - Appointment type select (checkup / follow-up / new_consultation / glasses_fitting / emergency)
   - Notes (optional)
   - Submit creates appointment with status: pending

3. src/components/appointments/AppointmentTable.tsx
   For a given date (default today):
   - Columns: Time, Patient (name + number), Doctor, Type, Status, Actions
   - Status shown as colored badge
   - Actions per status:
     pending → [Contact Patient] [Confirm] [Cancel]
     confirmed → [Mark Arrived] [Cancel]
     arrived → [Notify Doctor] ← sends push notification + in-app alert
     in_progress → [Complete]
   - Real-time updates: new appointments appear without refresh

4. src/pages/assistant/AppointmentManager.tsx
   Full page:
   - Date navigation (← Today → with calendar picker)
   - Today's appointment count cards (pending, confirmed, arrived, completed)
   - AppointmentTable
   - "Book Appointment" button

5. src/pages/doctor/Appointments.tsx
   Doctor's view:
   - Shows only their appointments
   - Today's waiting patients highlighted
   - "Request Checkup Appointment" button → opens booking form pre-filled with their ID as doctor

6. Patient Arrival Alert System:
   When assistant clicks "Mark Arrived":
   - Update appointment status to 'arrived'
   - Call Supabase Edge Function 'send-push' to send Web Push to the assigned doctor
   - Show persistent in-app toast to doctor: "[Patient Name] has arrived for their [type] appointment"
   - Doctor's sidebar "Appointments" badge increments

7. src/hooks/useArrivalAlerts.ts
   Doctor-side hook:
   - Subscribes to Supabase Realtime on appointments filtered by doctor_id and status='arrived'
   - Triggers toast notification and plays a soft notification sound when status changes to arrived

Make the table live-update smoothly — new rows or status changes should animate in.
```

---

## PROMPT 8 — Payments & Financial Management

```
Build the Payments and Financial Management module for the Eye Clinic PWA.

Stack: React, TypeScript, Supabase, React Query, date-fns, Recharts, Tailwind, shadcn/ui.

Create:

1. src/hooks/usePayments.ts
   - usePayments(filters?): paginated payments with patient name joined
   - useCreatePayment(): insert payment record
   - useDailySummary(date?): query the daily_summary VIEW
   - useMonthlyRevenue(): aggregated revenue per day for the current month (for chart)

2. src/components/payments/PaymentForm.tsx
   Modal form (triggered after drug dispense, glasses order, or standalone):
   - Patient (pre-filled if from dispense/order flow)
   - Payment Type select
   - Reference (auto-filled if from flow, else optional)
   - Amount (pre-filled if from dispense/order, editable for partial payments)
   - Payment Method: Cash | Bank Transfer | POS | Other
   - Notes
   On submit: inserts payment, shows receipt number in success toast

3. src/components/payments/ReceiptView.tsx
   Printable receipt:
   - Clinic header
   - Receipt number, date, time
   - Patient name + number
   - Payment details (type, amount, method)
   - Cashier name
   - "Thank you" footer
   Triggered via print button

4. src/pages/accountant/DailySummary.tsx
   Full daily summary page:
   - Date picker (default today)
   - Revenue breakdown table: Drug Sales | Glasses Sales | Consultation | Subscriptions | TOTAL
   - Patient stats: New Patients | Returning | Total Visits
   - Export buttons: [Print] [Export PDF] [Export CSV]
   - Recent payments table with receipt numbers

5. src/pages/accountant/PaymentManager.tsx
   Full payments history page:
   - Filter by: date range, payment type, payment method
   - Search by patient name or receipt number
   - Table: Receipt#, Patient, Type, Amount, Method, Cashier, Date
   - Click row → view receipt

6. src/pages/accountant/AccountantDashboard.tsx
   Dashboard cards:
   - Today's Total Revenue (₦ value, large)
   - Transactions Today (count)
   - Drug Revenue Today
   - Glasses Revenue Today
   - Pending Glasses Orders (count)
   - Expiring Subscriptions (count, links to list)
   
   Bar chart (Recharts): revenue by day for current month
   Recent transactions table (last 10)

7. src/pages/admin/Reports.tsx
   Admin reports page with:
   - Date range selector
   - Revenue report (same as accountant daily summary but for ranges)
   - Patient growth chart (new patients per day)
   - Top drugs dispensed (bar chart)
   All with Export to PDF / CSV

Format all currency values as: ₦ 1,234.00 (Nigerian Naira, formatted with toLocaleString).
```

---

## PROMPT 9 — Real-Time Staff Chat

```
Build the real-time staff chat system for the Eye Clinic PWA.

Stack: React, TypeScript, Supabase Realtime, Zustand, Tailwind, shadcn/ui, Lucide React.

Create:

1. src/hooks/useChat.ts
   - useConversation(otherUserId): fetch messages between current user and other user, ordered ASC by created_at
   - useSendMessage(): insert message into messages table
   - useRealtimeMessages(otherUserId): subscribe to Supabase Realtime on messages table, filter by conversation participants; append new messages to local state instantly
   - useMarkAsRead(messageId): update is_read + read_at
   - useUnreadCounts(): for each staff member, count unread messages where receiver_id = current user

2. src/store/chatStore.ts
   Zustand store:
   - activeConversationUserId
   - conversations: Record<userId, Message[]>
   - unreadCounts: Record<userId, number>
   - Actions: setActiveConversation, appendMessage, markRead, setUnreadCount

3. src/components/chat/ChatSidebar.tsx
   Contact list panel (240px):
   - Title "Staff Chat" + minimize button
   - Search staff by name
   - List of all staff profiles with:
     - Avatar (initials fallback)
     - Full name + role
     - Green dot (online via presence) / grey dot (offline)
     - Unread count badge (if any)
   - Click → opens conversation

4. src/components/chat/ChatWindow.tsx
   Conversation panel:
   - Header: staff member name, role, online status
   - Messages area (scrollable):
     - Own messages: right-aligned, blue bubble
     - Other's messages: left-aligned, white bubble with border
     - Timestamps shown below message (hover reveals full time)
     - Date separators ("Today", "Yesterday", "Apr 18")
     - Double tick indicator: ✓ sent, ✓✓ read (turns blue when read)
   - Message input:
     - Text input, Enter to send, Shift+Enter for newline
     - Send button
     - Character limit: 2000
   - Auto-scroll to bottom on new message

5. src/components/chat/ChatWidget.tsx
   Floating chat widget that can be opened from any page:
   - Floating button (bottom-right): chat icon with unread badge
   - Expands to show ChatSidebar + ChatWindow side by side (640px × 480px)
   - Can be minimized, dragged (optional)
   - Persists across page navigation (rendered at AppShell level)

6. Integrate unread count badge on the "Chat" sidebar nav item for all roles.

Real-time requirement: Messages must appear instantly for both sender and receiver without any polling or page refresh. Use Supabase Realtime channel subscription.

Style: WhatsApp-inspired bubble layout. Clean, no avatars inside bubble area. Time stamps in caption size. Blue (#1D7FE8) for own messages.
```

---

## PROMPT 10 — Patient Outreach & Reminders (Assistant)

```
Build the Patient Outreach & Reminders module for the Assistant dashboard.

Stack: React, TypeScript, Supabase, React Query, react-hook-form, zod, Tailwind, shadcn/ui.
External: Supabase Edge Function "send-outreach" (calls Twilio for SMS, Resend for email).

Create:

1. src/hooks/useOutreach.ts
   - useExpiringSubscriptions(): query expiring_subscriptions VIEW (within 30 days)
   - useSendOutreach(): calls Supabase Edge Function 'send-outreach' with patient_id, channel, message
   - useOutreachHistory(patientId?): query outreach_log table

2. Message Templates (hardcoded initially, admin-configurable later):
   - appointment_reminder: "Dear {name}, this is a reminder of your appointment at Eye Clinic on {date} at {time}. Please arrive 10 minutes early. Call us at {clinic_phone} for any changes."
   - subscription_expiry: "Dear {name}, your Eye Clinic subscription expires on {date}. Contact us to renew and enjoy uninterrupted access to our services."
   - checkup_due: "Dear {name}, Dr. {doctor_name} recommends a follow-up checkup. Please call {clinic_phone} or reply to book an appointment."
   - glasses_ready: "Dear {name}, your glasses are ready for collection at Eye Clinic. Our hours are Mon-Fri 8AM-6PM."
   - custom: free-form message

3. src/components/outreach/OutreachPanel.tsx
   Main outreach interface:
   
   Section A — Send to Individual Patient:
   - Patient search autocomplete
   - Once selected: shows name, phone, email
   - Channel buttons: [📱 SMS] [📧 Email]
   - Template dropdown
   - Message preview (template variables auto-filled with patient data)
   - Editable message area
   - [Send Message] button
   - Recent history for this patient below

   Section B — Bulk Reminders:
   - Tab: "Expiring Subscriptions" → shows list from VIEW
   - Tab: "Follow-up Due" → patients with follow_up_date reached
   - For each patient: name, phone, subscription_end, [Send SMS] [Send Email] buttons
   - Can select multiple → "Send to Selected (N)" with confirmation

4. src/components/outreach/OutreachHistory.tsx
   Table of outreach_log:
   - Patient, Channel, Template, Status, Sent By, Date
   - Filter by channel, status, date range

5. src/pages/assistant/Outreach.tsx
   Full page with:
   - Top: 3 alert cards: Expiring Subscriptions (count), Follow-ups Due (count), Appointments This Week (count)
   - OutreachPanel below
   - OutreachHistory table at bottom (last 20 entries)

6. Notification integration:
   When a doctor clicks "Request Checkup Appointment" on a patient:
   - Creates appointment (status: pending)
   - Also creates an outreach_reminder record
   - Assistant sees it in their Outreach panel as an action item
   - "Doctor [name] has requested a checkup for [patient]" appears in assistant's notification bell

Make all outreach actions show a loading state and confirmation toast. Failed sends show error with retry button.
```

---

## PROMPT 11 — Admin Dashboard & User Management

```
Build the Admin Dashboard and User Management module for the Eye Clinic PWA.

Stack: React, TypeScript, Supabase, React Query, react-hook-form, zod, Tailwind, shadcn/ui.

Create:

1. src/hooks/useAdminData.ts
   - useAllStaff(): fetch all profiles with is_active filter
   - useCreateStaffUser(): use Supabase Admin API via Edge Function (not client-side) to create auth user + profile
   - useDeactivateUser(id): set is_active=false on profile (does not delete auth user)
   - useAuditLogs(filters?): paginated audit_logs with user name joined
   - useSystemStats(): patients total, appointments today, revenue today, online users

2. src/pages/admin/AdminDashboard.tsx
   Cards (top row):
   - Total Patients
   - Staff Online (live via presence)
   - Today's Revenue (₦)
   - Appointments Today
   - Pending Glasses Orders
   - Low Stock Alerts (count with ⚠ icon, click links to inventory)
   
   Below cards:
   - Split: Recent Audit Log (left) + Today's Activity Feed (right)
   - Activity Feed: real-time list of recent actions (new patient, payment, dispense, appointment)

3. src/pages/admin/UserManagement.tsx
   Staff management page:
   - Table: Full Name, Role (badge), Email, Status (Active/Inactive), Last Sign In, Actions
   - Actions: [Edit] [Deactivate/Reactivate] (no delete)
   - "Add Staff Member" button → opens UserForm drawer

4. src/components/admin/UserForm.tsx
   Drawer form for creating/editing staff:
   - Full Name (required)
   - Email (required, must be unique)
   - Role select (doctor / assistant / accountant — admin cannot create another admin this way)
   - Phone (optional)
   - Temporary Password (required for create, optional for edit — triggers password reset email)
   - On create: calls Edge Function to create Supabase Auth user + insert profile

5. src/pages/admin/AuditLogs.tsx
   Full-page audit log viewer:
   - Filters: User select, Table name select, Action type (INSERT/UPDATE/DELETE), Date range
   - Table: Timestamp, User, Action, Table, Record ID, [View Changes] button
   - "View Changes" → diff modal showing old_data vs new_data side by side (JSON diff viewer)

6. src/pages/admin/BackupManager.tsx
   Database backup page:
   - Shows last backup date (stored in a system_settings table)
   - "Create Backup" button → opens modal:
     - Enter encryption password (required, min 8 chars)
     - Confirm password
     - [Generate Backup] button
   - Calls Edge Function 'export-backup'
   - Downloads encrypted .eyeclinic.bak file
   - Shows file size and checksum

7. src/components/admin/SystemSettings.tsx
   Settings panel (admin only):
   - Clinic name, phone, address, logo upload
   - Default currency symbol
   - Low stock threshold override
   - Message templates editor (for outreach)
   - Stored in a system_settings table (key-value pairs)

All admin actions that are destructive require a confirmation dialog. Deactivating a user shows: "This will prevent [name] from logging in. They can be reactivated later."
```

---

## PROMPT 12 — PWA Features & Push Notifications

```
Finalize the PWA features for the Eye Clinic application.

Stack: Vite PWA Plugin, Workbox, Web Push API, Supabase, TypeScript.

Create:

1. PWA Manifest (public/manifest.json):
   - name: "Eye Clinic Management"
   - short_name: "EyeClinic"
   - theme_color: "#1D7FE8"
   - background_color: "#F8FAFC"
   - display: "standalone"
   - orientation: "any"
   - icons: 72, 96, 128, 144, 152, 192, 384, 512 (maskable + regular)
   - screenshots: (placeholder paths)
   - start_url: "/"

2. src/components/InstallPrompt.tsx
   Custom install banner (shown when browser fires 'beforeinstallprompt'):
   - Bottom banner: clinic icon, "Install Eye Clinic App", "Add to your device for the best experience", [Not Now] [Install →]
   - Stores dismissed state in localStorage for 7 days
   - Also detects iOS (Safari) and shows manual instruction: "Tap Share → Add to Home Screen"

3. src/lib/push.ts
   - requestPushPermission(): asks for notification permission
   - subscribeToPush(userId): creates PushManager subscription using VAPID public key, stores in Supabase push_subscriptions table
   - unsubscribeFromPush(userId): removes subscription
   - On login: auto-call subscribeToPush for doctor and assistant roles

4. public/sw-custom.js (merged into service worker via Workbox):
   Handles 'push' event:
   - Parse notification payload (title, body, url, type)
   - Show notification with clinic icon
   - For type='patient_arrived': use urgency: 'high', vibration pattern, badge
   - Handle notificationclick: focus existing window or open new at payload.url

5. vite.config.ts PWA configuration:
   - Workbox runtimeCaching:
     - Supabase REST API: NetworkFirst, 30s timeout, cacheName 'api-cache'
     - Supabase Auth: NetworkFirst
     - Google Fonts: CacheFirst
     - Static assets: CacheFirst, maxAgeSeconds: 7 days
   - registerType: 'autoUpdate'
   - devOptions: enabled: true (for testing)

6. src/hooks/usePWAInstall.ts
   - Listen for beforeinstallprompt, store event
   - installApp(): calls prompt() on stored event
   - isInstallable: boolean
   - isInstalled: detect if running in standalone mode

7. Offline fallback page:
   - src/pages/OfflinePage.tsx
   - Simple page shown when network is unavailable
   - Shows clinic name, "You're offline" message, last sync time, "Retry" button
   - Configured in Workbox as offlineFallback

8. Add "Update Available" banner:
   - When Workbox detects new service worker waiting
   - Show non-intrusive banner: "A new version is available" [Update Now]
   - Clicking posts 'SKIP_WAITING' message to SW then reloads

Test all PWA features in Chrome DevTools Application panel. Confirm Lighthouse PWA score ≥ 90.
```

---

## PROMPT 13 — Final Polish, Error Handling & Testing

```
Perform final polish, error handling, and testing setup for the Eye Clinic PWA.

1. Global Error Boundary (src/components/ErrorBoundary.tsx):
   - Catches React rendering errors
   - Shows: "Something went wrong" card with error details (dev only), Reload button, Go Home button

2. Global Error Handling:
   - React Query onError global handler: shows toast for any failed query or mutation
   - Supabase auth error codes mapped to human-readable messages
   - Network error detection: show "Connection lost — retrying" banner when Supabase is unreachable

3. Loading States — everywhere:
   - Tables: show shadcn Skeleton rows (5 rows) while loading
   - Cards: skeleton rectangle of same dimensions
   - Buttons: spinner icon replaces text during mutation (disable button during pending)
   - Page transitions: subtle fade-in (150ms)

4. Form UX polish:
   - All required fields marked with red asterisk
   - Error messages appear below fields (not as alerts)
   - Autofocus first field when drawer/modal opens
   - Tab order is logical
   - Confirm before closing drawer if form is dirty (unsaved changes dialog)

5. Notification system consolidation:
   - All toasts via a single useToast() hook (shadcn toast)
   - Success: green, 3 seconds
   - Error: red, persistent until dismissed
   - Warning: amber, 5 seconds
   - Info: blue, 3 seconds

6. Security hardening:
   - Remove all console.log statements (replace with a dev-only logger utility)
   - Sanitize all user input before displaying (prevent XSS)
   - Rate limit form submissions (disable submit button for 2s after click)
   - Session timeout warning: show modal at 50 minutes ("Your session expires in 10 minutes. Stay signed in?")

7. Performance:
   - Lazy load all page components (React.lazy + Suspense)
   - Memoize expensive list renders (React.memo on patient cards, table rows)
   - Virtualize long tables with react-virtual if rows > 100

8. Accessibility audit:
   - All images have alt text
   - All icon-only buttons have aria-label
   - Color is never the sole indicator of state (always pair with icon or text)
   - Test with keyboard navigation: Tab, Enter, Escape all work correctly for modals/drawers

9. Set up basic testing:
   - Vitest + @testing-library/react
   - Write tests for: useAuth hook, PaymentForm validation, encryptText/decryptText round-trip, patient number generation (mock)

10. README.md:
    - Project overview
    - Local setup instructions
    - Supabase setup steps
    - Environment variables guide
    - Deployment to Vercel guide
    - Role descriptions and default login instructions
```

---

## PROMPT 14 — Deployment

```
Set up the deployment pipeline for the Eye Clinic PWA.

1. Vercel Configuration (vercel.json):
   - Build command: npm run build
   - Output directory: dist
   - Framework: vite
   - Rewrites: all routes → /index.html (for SPA routing)
   - Headers: security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
   - Cache-Control: long cache for /assets/* (immutable)

2. GitHub Actions CI (.github/workflows/deploy.yml):
   - Trigger: push to main
   - Steps: checkout, setup node 20, npm ci, npm run build, run tests (vitest), deploy to Vercel
   - Environment secrets: VERCEL_TOKEN, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_APP_ENCRYPTION_SALT, VITE_VAPID_PUBLIC_KEY

3. Supabase Edge Functions deployment:
   supabase functions deploy send-outreach
   supabase functions deploy send-push
   supabase functions deploy export-backup
   
   Set secrets:
   supabase secrets set RESEND_API_KEY=xxx
   supabase secrets set TWILIO_ACCOUNT_SID=xxx
   supabase secrets set TWILIO_AUTH_TOKEN=xxx
   supabase secrets set TWILIO_PHONE_NUMBER=xxx
   supabase secrets set VAPID_PRIVATE_KEY=xxx

4. Production checklist:
   - [ ] Supabase RLS enabled on ALL tables (verify in dashboard)
   - [ ] Service role key NEVER in client code
   - [ ] HTTPS enforced (Vercel handles this automatically)
   - [ ] Environment variables set in Vercel project settings
   - [ ] Custom domain configured (if applicable)
   - [ ] Supabase project set to Pro for daily backups (recommended)
   - [ ] Test PWA install flow on Chrome and Safari iOS
   - [ ] Verify push notifications work end-to-end

5. Create a production-ready seed script:
   - Creates the first Admin user (email + temp password)
   - Seeds sample drugs (5 common eye drops)
   - Seeds sample glasses frames (3 frames)
   - Prints login credentials to console

Show all configuration files with complete content.
```
