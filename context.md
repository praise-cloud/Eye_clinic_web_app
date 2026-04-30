# Eye Clinic Management System — Application Context

## Overview

A Progressive Web Application (PWA) for managing eye clinic operations, built for **KORENE Eye Clinic**. The system handles patient management, appointments, prescriptions, pharmacy inventory, revenue tracking, and provides role-specific dashboards for clinic staff.

---

## Tech Stack

### Frontend (`client/`)
- React 18 + TypeScript
- Vite 6 (build tool + PWA via `vite-plugin-pwa`)
- React Router 7
- TailwindCSS 3
- Zustand 5 (state management)
- Supabase JS SDK (auth + real-time + database)
- Lucide React (icons)
- date-fns
- TanStack Query (React Query)
- react-hook-form + zod (form validation)
- Recharts (charts)

### Backend (`server/`)
- Legacy Express backend (no longer used — architecture is now pure Supabase PWA)

### Database
- Supabase PostgreSQL
- Row Level Security (RLS) policies enabled on all tables
- Supabase Auth (email/password) with auto-profile creation trigger

---

## User Roles

| Role | Access |
|------|--------|
| `admin` | Full system access — patients, appointments, revenue, inventory, pharmacy, settings, user management |
| `doctor` | Patients, case notes, prescriptions, calendar |
| `assistant` | Patient registration, pharmacy dispensing, prescriptions, inventory |
| `accountant` | Revenue tracking, financial reports, appointments (read) |

---

## Database Schema

### Tables
- `profiles` — extends Supabase Auth users; stores role, name, phone, status
- `patients` — patient records with demographics, contact info, client type
- `appointments` — linked to patient + doctor; status: scheduled/completed/cancelled/no_show
- `drugs` — pharmacy drug inventory with stock levels, pricing, expiry
- `glasses_inventory` — frame inventory (frame_name, brand, color, price, quantity)
- `inventory_others` — non-drug inventory items (name, category, unit, price)
- `prescriptions` — glasses prescriptions with OD/OS values; status: pending/dispensed
- `glasses_orders` — glasses orders linked to patients + frames; status: pending/in_lab/ready/dispensed
- `drug_dispensing` — records of drug dispensing events
- `inventory_dispensing` — records of non-drug inventory dispensing to patients
- `payments` — financial transactions by type (consultation, drug, glasses_deposit, glasses_balance)
- `messages` — internal messaging between staff with attachment support
- `notifications` — per-user notification records (DB-backed)
- `case_notes` — doctor clinical notes (AES-GCM encrypted option)
- `daily_summary` — daily reports table (new_patients, revenue by source)
- `outreach_log` — SMS/email/WhatsApp outreach tracking
- `audit_logs` — audit trail for INSERT/UPDATE/DELETE actions
- `settings` — key/value clinic configuration
- `push_subscriptions` — web push notification subscriptions
- `push_subscriptions` — web push notification subscriptions

### Auto-trigger
On new Supabase Auth user signup → `handle_new_user()` trigger creates a `profiles` row using metadata (first_name, last_name, role).

---

## Authentication Flow

1. User signs in via Supabase Auth (`supabase.auth.signInWithPassword`)
2. Access token + refresh token stored in `localStorage`
3. `GET /api/auth/me` fetches full profile from backend
4. User stored in Zustand `authStore` (persisted to localStorage)
5. Axios interceptor attaches `Authorization: Bearer <token>` to all requests
6. On 401 → auto-refresh token; on failure → redirect to `/login`

---

## Project Structure

```
eye-clinic-web/
├── client/
│   └── src/
│       ├── App.tsx                  # Routes + ProtectedRoute + RoleDashboard
│       ├── components/
│       │   ├── layout/
│       │   │   ├── AppShell.tsx
│       │   │   ├── Sidebar.tsx      # Role-based nav items
│       │   │   ├── Header.tsx      # Search, notifications, user menu
│       │   │   └── ToastContainer.tsx # Toast notifications
│       │   └── ui/                  # Avatar, Badge, Button, Card, Input, Modal, Select, etc.
│       ├── hooks/
│       │   ├── useAuth.ts           # login, register, logout
│       │   ├── useRealtimeNotifications.ts
│       │   └── useClinicSettings.ts
│       ├── pages/
│       │   ├── admin/
│       │   │   ├── AdminDashboard.tsx
│       │   │   ├── AuditPage.tsx
│       │   │   ├── InventoryPage.tsx
│       │   │   ├── PaymentsPage.tsx
│       │   │   ├── ReportsPage.tsx
│       │   │   ├── UsersPage.tsx
│       │   │   └── ...
│       │   ├── frontdesk/
│       │   │   ├── FrontdeskDashboard.tsx
│       │   │   ├── GlassesOrdersPage.tsx
│       │   │   ├── ItemOrdersPage.tsx   # NEW: Inventory item dispensing
│       │   │   ├── DispensingPage.tsx
│       │   │   ├── OutreachPage.tsx
│       │   │   └── ...
│       │   ├── doctor/
│       │   ├── manager/
│       │   ├── auth/
│       │   ├── patients/
│       │   ├── appointments/
│       │   ├── calendar/
│       │   ├── notifications/
│       │   ├── chat/
│       │   └── settings/
│       ├── services/
│       │   ├── api.ts               # Axios instance (legacy)
│       │   └── supabase.ts          # Supabase client
│       ├── stores/
│       │   ├── authStore.ts         # Zustand auth store
│       │   ├── notificationStore.ts  # DB-backed notifications
│       │   └── uiStore.ts
│       └── types/                  # NEW: Reusable type system
│           ├── index.ts             # Barrel file exporting all types
│           ├── profile.ts           # UserRole, Profile
│           ├── patient.ts           # Patient
│           ├── appointment.ts       # Appointment
│           ├── prescription.ts      # Prescription (OD/OS)
│           ├── case-note.ts         # CaseNote (clinical notes)
│           ├── inventory.ts         # Drug, GlassesInventory, InventoryOthers
│           ├── glasses-order.ts     # GlassesOrder
│           ├── payment.ts            # Payment
│           ├── message.ts           # Message (chat)
│           ├── notification.ts      # AppNotification
│           └── models.ts            # Shared models (DailySummary, DrugDispensing, etc.)
├── server/                      # Legacy Express backend (not used)
└── supabase/
    ├── schema.sql              # Full DB schema (tables, RLS, triggers)
    └── schema-fixed.sql         # Daily summary fix
```

---

## Pages & Features

### Dashboards (role-specific, rendered via `RoleDashboard` component)

**Admin Dashboard**
- Stats cards: total patients, today's revenue, monthly revenue, pending prescriptions, low stock items, today's appointments
- Recent patients list
- Quick action links: Add Patient, Book Appointment, Check Inventory, View Revenue

**Doctor Dashboard**
- Stats: today's appointments count, pending case notes count, pending prescriptions count
- Today's appointments list (links to patient detail)
- Quick action links: Patients, Case Notes, Prescriptions, Calendar

**Frontdesk Dashboard**
- Stats: new patients today, appointments today, low stock alerts
- Today's appointments list with patient + doctor info
- Low stock drug alerts list

**Accountant Dashboard**
- Stats: today's revenue total, monthly revenue total, today's appointments count
- Today's transactions list
- Monthly revenue breakdown by source (pharmacy, consultation, tests, glasses)

### Core Pages

**Patients (`/patients`)**
- Grid of patient cards with avatar initials, contact info, client type badge
- Search by name, filter by client type (new/returning/referral)
- Export to CSV
- Link to add new patient (`/patients/new` — form not yet implemented)

**Patient Detail (`/patients/:id`)**
- Patient info sidebar (name, gender, DOB, contact, email, address)
- Tabbed content: Overview, Visits, Prescriptions, Tests
- Edit button links to `/patients/:id/edit` (not yet implemented)

**Appointments (`/appointments`)**
- List view with search and status filter
- Status badges: scheduled (info), completed (success), cancelled (danger), no_show (warning)
- Link to create new appointment (`/appointments/new` — not yet implemented)

**Calendar (`/calendar`)**
- Monthly calendar grid with appointment dots per day
- Color-coded by status
- Navigate prev/next month
- Shows up to 3 appointments per day cell, "+N more" overflow
- Legend for status colors

**Settings (`/settings`)**
- Profile tab: edit first name, last name, email, phone
- Notifications tab: toggles for email, SMS, appointment reminders, prescription alerts, low stock alerts
- Clinic Settings tab: clinic name, email, phone, address (admin-relevant)

---

## API Endpoints

The app now uses **Supabase directly** — no Express backend. All data operations go through Supabase JS SDK.

| Method | Supabase Query | Description |
|--------|---------------|-------------|
| SELECT | `supabase.from('patients').select()` | List patients (search, filter) |
| INSERT | `supabase.from('patients').insert()` | Create patient |
| UPDATE | `supabase.from('patients').update()` | Update patient |
| DELETE | `supabase.from('patients').delete()` | Delete patient |
| SELECT | `supabase.from('appointments').select()` | List appointments |
| SELECT | `supabase.from('prescriptions').select()` | List prescriptions |
| SELECT | `supabase.from('drugs').select()` | List drugs |
| SELECT | `supabase.from('glasses_orders').select()` | List glasses orders |
| INSERT | `supabase.from('inventory_dispensing').insert()` | Dispense inventory item |
| SELECT | `supabase.from('notifications').select()` | User notifications |
| INSERT | `supabase.from('messages').insert()` | Send message |

RLS policies control access — all tables have Row Level Security enabled.

---

## State Management

**`authStore` (Zustand + persist middleware)**
- `user: User | null`
- `isAuthenticated: boolean`
- `isLoading: boolean`
- Actions: `login()`, `logout()`, `setUser()`, `setLoading()`, `updateUser()`
- Persisted to `localStorage` key `auth-storage`

**Helper:** `hasRole(user, roles[])` — checks if user has one of the given roles

---

## TypeScript Types (key interfaces)

- `User` — id, email, first_name, last_name, role, gender, phone_number, status
- `Patient` — id, patient_id, demographics, contact, client_type, intake_date
- `Appointment` — id, patient_id, doctor_id, date, time, type, status, notes
- `Prescription` — id, patient_id, doctor_id, drug_id, quantity, instructions, status
- `PharmacyDrug` — id, drug_code, drug_name, form, strength, pack_size, unit_price, stock levels
- `PharmacyDispensation` — dispensing record with pricing
- `Visit` — patient visit with payment status
- `Test` — eye test with machine type, raw data, report status
- `CaseNote` — clinical note with visual acuity (OD/OS), IOP, CVF, diagnosis, recommendation, sign-off
- `Revenue` — financial transaction by source
- `InventoryItem` — non-drug inventory with full tracking fields
- `ChatMessage` — internal staff messaging
- `Notification` — per-user notification
- `ActivityLog` — audit trail
- `DashboardStats` — aggregated stats object
- `ApiResponse<T>` — standard API response wrapper

---

## Implementation Status

### Fully Implemented
- Multi-role authentication (login, register, logout, session persistence)
- Role-based routing and sidebar navigation
- Patients list page with search, filter, CSV export
- Patient detail page with tabbed view (visits, prescriptions, tests)
- Appointments list page with search and status filter + delete functionality
- Calendar page (monthly view with appointment visualization)
- Settings page (profile, notifications, clinic settings)
- All four role dashboards with live data fetching
- Admin dashboard with mini calendar component
- Toast notification system with auto-dismiss (DB-backed notifications)
- User management page (add, edit, enable/disable, delete staff)
- Activity Log / Audit Trail page (`/admin/audit`)
- Inventory management (drugs, glasses, others) with create/edit/delete + error handling
- Glasses Orders (frontdesk) with edit/delete/status advancement + inventory deduction
- Glasses Prescriptions (frontdesk) with edit/delete/dispense + error handling
- Item Dispensing page (`/frontdesk/item-orders`) for non-drug inventory items
- Vercel Analytics integration
- Chat system with photo/document attachments + edit/delete own messages
- Reusable type system (`src/types/` with separate files per domain)
- Code cleanup: removed duplicate `assistant/` folder, removed console statements
- Schema fixes: `ON DELETE SET NULL` for glasses orders, RLS `WITH CHECK` clauses, `BOOLEAN` typos fixed

### Pages & Features

**Frontdesk Dashboard**
- Stats: new patients today, appointments today, low stock alerts
- Today's appointments list with patient + doctor info
- Low stock drug alerts list

**Glasses Orders (`/frontdesk/glasses-orders`)**
- Create new glasses orders (select patient, frame, lens type, deposit)
- Edit existing orders (all fields)
- Advance status: pending → in_lab → ready → dispensed
- On dispense: reduces frame inventory, creates payment record
- Delete orders (except dispensed)

**Item Dispensing (`/frontdesk/item-orders`)**
- Dispense non-drug inventory items to patients
- Select patient + item + quantity
- Auto-calculates total, reduces inventory on dispense
- Delete dispensing records

**Inventory (`/admin/inventory`)**
- Three tabs: Drugs, Glasses, Items (others)
- Add/edit/delete for all inventory types
- Error handling with toast notifications
- Glasses: frame_name, brand, color, material, price
- Others: name, category, unit, price

### Not Yet Implemented
- `Add Patient` form (`/patients/new`)
- `Edit Patient` form (`/patients/:id/edit`)
- `New Appointment` form (`/appointments/new`)
- `Appointment Detail` page (`/appointments/:id`)
- `New Case Note` form (`/case-notes/new`)
- Revenue page (`/admin/reports` exists but may need enhancement)
- PWA icons (missing from `client/public/`)
- Prescription management page for doctors (`/doctor/prescriptions`)
- Prescription management page for doctors (`/doctor/prescriptions`)

### Known Issues / Fixes Applied
- **Glasses deletion failing**: Fixed in schema.sql — `glasses_orders.frame_id` now has `ON DELETE SET NULL`
- **Inventory "others" creation failing**: Fixed — RLS policies now have `WITH CHECK` clause
- **daily_summary RLS error**: Fixed — schema safely drops/recreates as table (not view)
- **Mutations silent failures**: Fixed — all mutations now check for Supabase errors and show toast notifications
- **BOOLEAN typos in schema.sql**: Fixed — all occurrences changed to BOOLEAN
- **Duplicate `assistant/` folder**: Deleted — all files now in `frontdesk/` only
- **Console statements**: Removed from App.tsx, LoginPage, RegisterPage, CaseNotesPage, useAuth
- **Reusable types**: Refactored into `src/types/` with separate files (profile.ts, patient.ts, appointment.ts, etc.)

---

## Environment Variables

**Client (`client/.env`)**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:3001
```

**Server (`server/.env`)**
```
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
JWT_SECRET=your-secret-key
```

---

## Running the App

```bash
# Backend
cd server && npm run dev

# Frontend
cd client && npm run dev
```

---

## Known Issues / TODOs

- `vite-plugin-pwa` version updated to `^1.2.0` to resolve npm ERESOLVE conflict
- PWA icons missing from `client/public/`
- Several sidebar nav items route to placeholder dashboards instead of dedicated pages
- `alert()` used for save confirmations in Settings — should be replaced with toast notifications
- Revenue currency hardcoded as `$` in Accountant Dashboard but DB default is `NGN`
- No form validation library in use — forms use raw HTML inputs

---

## Changelog / Updates

### April 20, 2026 — Full Rebuild (Phase 1 Complete)
- Removed Express backend entirely — architecture is now pure Supabase PWA
- Replaced all custom UI components with shadcn/ui base components
- Added React Query (TanStack), react-hook-form, zod, Recharts to stack
- Rewrote auth system — pure Supabase `onAuthStateChange`, no Express JWT
- New complete database schema (14 tables + triggers + views + RLS)
- Role-specific sidebar accent colors (doctor=blue, assistant=teal, admin=indigo, accountant=emerald)
- Right-side Drawer component for all forms
- AES-GCM encryption utility for case notes
- All 4 role dashboards live with real Supabase data queries
- Single `npm run dev` starts the app on http://localhost:3000
- Backend folder retained but not used — can be removed

### April 27, 2026 — Admin Dashboard & User Management Updates
- Admin dashboard now displays mini calendar below stat cards
- Calendar removed from admin sidebar navigation
- Toast notifications auto-dismiss after 5 seconds and close on click
- Staff delete now properly deletes from profiles table before auth cleanup
- Edit staff action added to admin UsersPage (edit name, role, phone)
- Vercel Analytics integrated for application analytics tracking

### May 1, 2026 — Chat System Enhancements
- Chat now supports photo and document attachments
- Images can be viewed in full-screen preview within chat
- Documents show download option in preview
- Message bubble options: reply, edit (own messages), delete (own messages)
- Updated messages table schema with attachment fields and updated_at
- Added storage bucket 'files' for chat attachments
- Added RLS policies for message edit/delete and file uploads


### May 2, 2026 � Comprehensive Bug Fixes & Features`n- **Glasses deletion fixed**: glasses_orders.frame_id now has ON DELETE SET NULL`n- **Inventory "others" creation fixed**: RLS policies now have WITH CHECK clause`n- **daily_summary RLS error fixed**: Schema safely drops/recreates as table (not view)`n- **BOOLEAN typos fixed**: All occurrences changed to BOOLEAN in schema.sql`n- **Duplicate assistant/ folder deleted**: All files now only in frontdesk/`n- **Glasses Prescription page removed**: Removed from sidebar, routes, and deleted file`n- **Edit/Delete added to Glasses Orders**: Frontdesk can now edit and delete glasses orders`n- **Edit/Delete added to Prescriptions**: Frontdesk can now edit and delete prescriptions`n- **Item Dispensing page created**: New /frontdesk/item-orders for non-drug inventory items`n- **Reusable types system**: Refactored into src/types/ with separate files per domain`n- **Console statements removed**: Cleaned from App.tsx, LoginPage, RegisterPage, CaseNotesPage, useAuth`n- **Error handling added**: All mutations now check for Supabase errors and show toast notifications`n- **Build passes cleanly**: No TypeScript errors`n`n### Current Application State (May 2, 2026)`n- **Architecture**: Pure Supabase PWA (no Express backend)`n- **Database**: 16 tables + RLS policies + triggers + audit logs`n- **Frontend**: React 18 + TypeScript + Vite 6 + TanStack Query`n- **UI**: TailwindCSS 3 + shadcn/ui components + Lucide React icons`n- **State**: Zustand stores (auth, notifications, UI)`n- **Forms**: react-hook-form + zod validation`n- **Charts**: Recharts for admin reports`n- **PWA**: vite-plugin-pwa for offline support`n- **Analytics**: Vercel Analytics integration`n