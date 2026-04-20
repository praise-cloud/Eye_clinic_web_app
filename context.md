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
- Axios (HTTP client)
- Supabase JS SDK (auth + real-time)
- Lucide React (icons)
- date-fns

### Backend (`server/`)
- Node.js + Express 4
- Supabase JS SDK (database queries)
- JSON Web Tokens (`jsonwebtoken`)
- CORS, dotenv

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
- `pharmacy_drugs` — drug inventory with stock levels, pricing, expiry
- `prescriptions` — doctor-issued prescriptions; status: pending/dispensed/cancelled
- `pharmacy_dispensations` — records of drug dispensing events
- `inventory` — non-drug clinic inventory items
- `revenue` — financial transactions by source (pharmacy, consultation, tests, glasses)
- `chat` — internal messaging between staff
- `notifications` — per-user notification records
- `case_notes` — doctor clinical notes with visual acuity, IOP, CVF, diagnosis, recommendation
- `tests` — eye test records (machine type, raw data, report status)
- `settings` — key/value clinic configuration

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
│       │   │   ├── Layout.tsx
│       │   │   ├── Sidebar.tsx      # Role-based nav items
│       │   │   └── Header.tsx       # Search, notifications, user menu
│       │   └── ui/                  # Avatar, Badge, Button, Card, Input, Modal
│       ├── hooks/
│       │   └── useAuth.ts           # login, register, logout, checkAuth
│       ├── pages/
│       │   ├── admin/Dashboard.tsx
│       │   ├── doctor/Dashboard.tsx
│       │   ├── assistant/Dashboard.tsx
│       │   ├── accountant/Dashboard.tsx
│       │   ├── auth/LoginPage.tsx
│       │   ├── auth/RegisterPage.tsx
│       │   ├── patients/PatientsPage.tsx
│       │   ├── patients/PatientDetailPage.tsx
│       │   ├── appointments/AppointmentsPage.tsx
│       │   ├── calendar/CalendarPage.tsx
│       │   └── settings/SettingsPage.tsx
│       ├── services/
│       │   ├── api.ts               # Axios instance with auth interceptors
│       │   └── supabase.ts          # Supabase client
│       ├── stores/
│       │   └── authStore.ts         # Zustand auth store
│       └── types/index.ts           # All TypeScript interfaces
├── server/
│   └── src/
│       ├── index.js                 # Express app entry point
│       ├── routes/
│       │   ├── auth.js
│       │   ├── patients.js
│       │   ├── appointments.js
│       │   ├── prescriptions.js
│       │   ├── pharmacy.js
│       │   ├── dashboard.js
│       │   ├── inventory.js
│       │   ├── revenue.js
│       │   ├── chat.js
│       │   ├── notifications.js
│       │   ├── settings.js
│       │   └── users.js
│       └── services/
│           └── supabase.js
└── supabase/
    └── schema.sql
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

**Assistant Dashboard**
- Stats: pending prescriptions count, low stock drugs count
- Pending prescriptions list with inline "Dispense" button
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

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Register |
| GET | `/api/auth/me` | Current user profile |
| POST | `/api/auth/refresh` | Refresh JWT |
| GET | `/api/patients` | List patients (search, filter, limit) |
| GET | `/api/patients/:id` | Patient detail |
| POST | `/api/patients` | Create patient |
| PUT | `/api/patients/:id` | Update patient |
| DELETE | `/api/patients/:id` | Delete patient |
| GET | `/api/appointments` | List appointments (date range, status filter) |
| GET | `/api/appointments/today` | Today's appointments |
| GET | `/api/appointments/:id` | Appointment detail |
| POST | `/api/appointments` | Create appointment |
| PUT | `/api/appointments/:id` | Update appointment |
| GET | `/api/prescriptions` | List prescriptions |
| GET | `/api/prescriptions/pending` | Pending prescriptions |
| POST | `/api/prescriptions` | Create prescription |
| PUT | `/api/prescriptions/:id/status` | Update prescription status |
| GET | `/api/pharmacy/drugs` | List drugs |
| GET | `/api/pharmacy/drugs/low-stock` | Low stock drugs |
| POST | `/api/pharmacy/dispense` | Dispense drug |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/revenue/today` | Today's revenue |
| GET | `/api/revenue/monthly` | Monthly revenue |
| GET | `/api/inventory` | Inventory items |
| GET | `/api/notifications` | User notifications |
| GET/PUT | `/api/settings` | Clinic settings |
| GET/PUT | `/api/users/profile` | User profile |
| GET | `/api/health` | Health check |

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
- Appointments list page with search and status filter
- Calendar page (monthly view with appointment visualization)
- Settings page (profile, notifications, clinic settings)
- All four role dashboards with live data fetching
- All backend route files registered and structured

### Partially Implemented / Placeholder Routes
These routes exist in `App.tsx` and the sidebar but render `<RoleDashboard />` as a placeholder:
- `/case-studies` — Doctor case studies (admin view)
- `/revenue` — Revenue page (accountant/admin)
- `/inventory` — Inventory management page
- `/pharmacy` — Pharmacy management page
- `/prescriptions` — Prescriptions management page
- `/case-notes` — Case notes page (doctor)
- `/messages` — Internal chat/messaging

### Not Yet Implemented
- `Add Patient` form (`/patients/new`)
- `Edit Patient` form (`/patients/:id/edit`)
- `New Appointment` form (`/appointments/new`)
- `Appointment Detail` page (`/appointments/:id`)
- `New Case Note` form (`/case-notes/new`)
- Notification system (bell icon shows static "No new notifications")
- Chat/messaging system
- Activity log / audit trail
- PWA icons (missing from `client/public/`)
- User management page (admin)

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
