# 🏥 Eye Clinic PWA — System Architecture

---

## 1. Overview

The Eye Clinic application is a Progressive Web Application (PWA) built for multi-role clinical management. It runs entirely in the browser, installs like a native desktop/mobile app, and is powered by Supabase as the sole backend. All clients — Doctor, Assistant, Admin, Accountant — connect to the same Supabase project (cloud-hosted PostgreSQL), giving them a shared real-time database without managing a local server.

---

## 2. High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (PWA)                           │
│                                                                     │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐  │
│   │   Doctor UI  │  │ Assistant UI │  │ Admin UI │  │Accountant│  │
│   │  Dashboard   │  │  Dashboard  │  │Dashboard │  │Dashboard │  │
│   └──────┬───────┘  └──────┬───────┘  └────┬─────┘  └────┬─────┘  │
│          │                 │               │              │        │
│          └─────────────────┴───────────────┴──────────────┘        │
│                            │                                        │
│                   React + Vite (SPA/PWA)                           │
│           Tailwind CSS + shadcn/ui + Zustand                        │
│                  Service Worker (Workbox)                           │
└─────────────────────────────┬───────────────────────────────────────┘
                              │  HTTPS / WSS
                              │
┌─────────────────────────────▼───────────────────────────────────────┐
│                        SUPABASE PLATFORM                            │
│                                                                     │
│  ┌────────────────┐  ┌──────────────────┐  ┌─────────────────────┐ │
│  │  Supabase Auth │  │  PostgreSQL DB   │  │  Supabase Realtime  │ │
│  │  (JWT + RLS)   │  │  (Tables + RLS)  │  │  (Chat + Presence)  │ │
│  └────────────────┘  └──────────────────┘  └─────────────────────┘ │
│                                                                     │
│  ┌────────────────┐  ┌──────────────────┐  ┌─────────────────────┐ │
│  │Supabase Storage│  │  Edge Functions  │  │   Database Views    │ │
│  │(Files, Reports)│  │(SMS/Email/Push)  │  │ (Daily Summary etc) │ │
│  └────────────────┘  └──────────────────┘  └─────────────────────┘ │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
             ┌────────────────┼────────────────┐
             │                │                │
     ┌───────▼──────┐ ┌───────▼──────┐ ┌──────▼───────┐
     │    Resend    │ │    Twilio    │ │  Web Push    │
     │   (Email)    │ │  (SMS/WA)    │ │  (Notifs)    │
     └──────────────┘ └──────────────┘ └──────────────┘
```

---

## 3. Technology Stack

### 3.1 Frontend

| Technology | Purpose | Why |
|---|---|---|
| React 18 + Vite | Core SPA framework | Fast HMR, best PWA ecosystem |
| TypeScript | Type safety | Prevents bugs, better DX |
| Tailwind CSS | Utility-first styling | Rapid, consistent UI |
| shadcn/ui | Pre-built component library | Professional, accessible components |
| React Router v6 | Client-side routing | Role-based route protection |
| Zustand | Global state management | Lightweight, simple, no boilerplate |
| React Query (TanStack) | Server state & caching | Smart caching of Supabase queries |
| vite-plugin-pwa | PWA generation | Service worker, manifest, install prompt |
| Workbox | Service worker strategies | Offline caching & background sync |
| Recharts | Data visualization | Charts for sales, reports |
| date-fns | Date manipulation | Appointment scheduling, formatting |
| React Hook Form + Zod | Forms & validation | Safe, typed form handling |
| Lucide React | Icons | Consistent icon set |

### 3.2 Backend (Supabase)

| Service | Purpose |
|---|---|
| Supabase Auth | User authentication, JWT tokens, role management |
| PostgreSQL | Primary database for all application data |
| Row Level Security (RLS) | Per-role data access control at DB level |
| Supabase Realtime | Live chat, online presence, appointment notifications |
| Supabase Storage | Case note attachments, prescription scans, reports |
| Edge Functions (Deno) | Email/SMS outreach, push notifications, backup exports |
| Database Functions (PL/pgSQL) | Complex queries, daily summaries, audit logging |
| Database Views | Aggregated data (daily sales, patient counts) |

### 3.3 External Services

| Service | Purpose | Trigger |
|---|---|---|
| Resend | Transactional email | Patient appointment reminders |
| Twilio | SMS / WhatsApp | Patient outreach from Assistant |
| Web Push API | Browser push notifications | Patient arrival → Doctor alert |
| Vercel | Hosting & deployment | CI/CD from GitHub |

---

## 4. Application Roles & Access Matrix

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ROLE ACCESS MATRIX                                 │
├──────────────────────────┬──────────┬──────────┬──────────┬─────────────────┤
│ Feature                  │ Doctor   │ Assistant│ Admin    │ Accountant      │
├──────────────────────────┼──────────┼──────────┼──────────┼─────────────────┤
│ Patient Registration     │ View     │ Full     │ Full     │ View            │
│ Case Notes               │ Full     │ View     │ Full     │ None            │
│ Prescriptions            │ Full     │ View     │ Full     │ None            │
│ Drug Dispensing          │ Prescribe│ Dispense │ Full     │ View            │
│ Drug Inventory           │ View     │ Manage   │ Full     │ View            │
│ Glasses Inventory        │ Prescribe│ Manage   │ Full     │ View            │
│ Glasses Orders           │ Prescribe│ Process  │ Full     │ View            │
│ Payments                 │ None     │ Record   │ Full     │ Full            │
│ Daily Sales Report       │ None     │ None     │ Full     │ Full            │
│ Appointments             │ Full     │ Full     │ Full     │ None            │
│ Patient Outreach         │ Request  │ Execute  │ Full     │ None            │
│ Staff Chat               │ Full     │ Full     │ Full     │ Full            │
│ User Management          │ None     │ None     │ Full     │ None            │
│ Audit Logs               │ None     │ None     │ Full     │ None            │
│ Database Backup          │ None     │ None     │ Full     │ None            │
│ Financial Reports        │ None     │ None     │ Full     │ Full            │
│ Subscription Tracking    │ None     │ View     │ Full     │ Full            │
└──────────────────────────┴──────────┴──────────┴──────────┴─────────────────┘
```

---

## 5. PWA Architecture

### 5.1 Service Worker Strategy

```
┌─────────────────────────────────────────────────────┐
│                  SERVICE WORKER                     │
│                                                     │
│  ┌────────────────────────────────────────────────┐ │
│  │  Cache Strategy: Network First                 │ │
│  │  → API calls (Supabase REST)                   │ │
│  │  → Falls back to cache if offline              │ │
│  └────────────────────────────────────────────────┘ │
│                                                     │
│  ┌────────────────────────────────────────────────┐ │
│  │  Cache Strategy: Cache First                   │ │
│  │  → Static assets (JS, CSS, fonts, icons)       │ │
│  │  → App shell (index.html)                      │ │
│  └────────────────────────────────────────────────┘ │
│                                                     │
│  ┌────────────────────────────────────────────────┐ │
│  │  Background Sync                               │ │
│  │  → Queue failed form submissions               │ │
│  │  → Retry when connection restores              │ │
│  └────────────────────────────────────────────────┘ │
│                                                     │
│  ┌────────────────────────────────────────────────┐ │
│  │  Push Notifications                            │ │
│  │  → Patient arrived → Doctor                   │ │
│  │  → New appointment → Assistant                │ │
│  │  → Low stock alert → Assistant + Admin        │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 5.2 Install Flow

```
User visits URL → Browser detects PWA manifest
  → Shows "Install App" banner
    → User clicks Install
      → App installs to desktop/home screen
        → Launches in standalone window (no browser chrome)
          → Behaves like a native desktop application
```

---

## 6. Data Flow Architecture

### 6.1 Patient Visit Flow

```
Assistant registers patient
    │
    ▼
Patient record created in DB
    │
    ▼
Doctor opens patient record → writes case note
    │
    ▼
Doctor creates prescription (drugs / glasses)
    │
    ├──► Drug prescription → Assistant dispenses → Drug dispensing record
    │         │
    │         ▼
    │    Payment recorded by Accountant/Assistant
    │         │
    │         ▼
    │    Daily sales summary updates (DB View)
    │
    └──► Glasses prescription → Glasses order created
              │
              ▼
         Order tracked (pending → ready → dispensed)
              │
              ▼
         Payment recorded → Daily summary updates
```

### 6.2 Appointment Flow

```
Doctor requests scheduled checkup (from patient profile)
    │
    ▼
Appointment record created (status: pending)
    │
    ▼
Supabase Realtime → Assistant's dashboard updates live
    │
    ▼
Assistant contacts patient (SMS via Twilio / Email via Resend)
    │
    ▼
Patient confirms → Appointment status: confirmed
    │
    ▼
Patient arrives at clinic → Assistant marks: arrived
    │
    ▼
Web Push Notification → Doctor's browser
    + In-app alert: "Your patient [Name] has arrived"
    │
    ▼
Doctor begins consultation → Case note created
```

### 6.3 Real-time Chat Flow

```
Staff Member A sends message
    │
    ▼
Message inserted into messages table
    │
    ▼
Supabase Realtime broadcasts to subscribed clients
    │
    ▼
Staff Member B's UI receives message → renders immediately
    │
    ▼
Presence channel tracks online/offline status per user
```

---

## 7. Security Architecture

### 7.1 Authentication

- Supabase Auth handles all login/session management
- JWT tokens stored in memory (not localStorage) — refreshed automatically
- Every API call carries the JWT; Supabase validates it before any DB operation
- Sessions expire after configurable inactivity timeout

### 7.2 Authorization (Row Level Security)

- Every table has RLS enabled — no table is publicly accessible
- Policies are defined per role using `auth.jwt() ->> 'role'`
- Even if someone gets a JWT, they can only access rows their role permits
- Admin has a service-role key stored only in Edge Functions (never the client)

### 7.3 Data Encryption

- All data in transit: HTTPS/WSS (enforced by Supabase)
- All data at rest: AES-256 (Supabase managed)
- Sensitive clinical fields (case notes body): encrypted at application layer using Web Crypto API before storage, decrypted client-side after retrieval
- Backup exports: AES-GCM encrypted JSON, password protected

### 7.4 Audit Logging

- A `audit_logs` table records every INSERT/UPDATE/DELETE with: user_id, action, table_name, record_id, old_value, new_value, timestamp
- Implemented via PostgreSQL triggers
- Only Admin can read audit logs
- Logs are append-only (no RLS DELETE policy for any role)

---

## 8. Deployment Architecture

```
GitHub Repository (main branch)
    │
    ▼ Auto-deploy on push
Vercel (Hosting)
    ├── HTTPS enforced
    ├── CDN edge caching for static assets
    ├── Environment variables (Supabase keys) stored securely
    └── Preview deployments for PRs
    │
    ▼
Supabase Project (Production)
    ├── Database: PostgreSQL
    ├── Auth: Email/Password
    ├── Realtime: Enabled on messages, appointments, profiles
    ├── Storage: clinic-files bucket
    └── Edge Functions: outreach, push-notify, export-backup
```

### 8.1 Environment Configuration

```
# .env.production (stored in Vercel, never committed to Git)

VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
VITE_APP_ENCRYPTION_SALT=clinic_secret_salt_xxx
VITE_VAPID_PUBLIC_KEY=BNxxx...  (for Web Push)

# Edge Functions only (never exposed to client)
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
RESEND_API_KEY=re_xxx...
TWILIO_ACCOUNT_SID=ACxxx...
TWILIO_AUTH_TOKEN=xxx...
TWILIO_PHONE_NUMBER=+1xxx...
```

---

## 9. Folder Structure

```
eyeclinic-pwa/
├── public/
│   ├── icons/                  # PWA icons (192x192, 512x512, maskable)
│   ├── manifest.json           # PWA manifest
│   └── sw.js                   # Service worker entry (generated by Workbox)
│
├── src/
│   ├── main.tsx                # App entry point
│   ├── App.tsx                 # Root router + auth guard
│   │
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client instance
│   │   ├── crypto.ts           # Web Crypto API encryption utils
│   │   ├── push.ts             # Web Push subscription helpers
│   │   └── constants.ts        # App-wide constants
│   │
│   ├── store/
│   │   ├── authStore.ts        # User session, role, profile
│   │   ├── chatStore.ts        # Chat state, unread counts
│   │   ├── notificationStore.ts
│   │   └── uiStore.ts          # Sidebar, modals, theme
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── usePatients.ts
│   │   ├── useAppointments.ts
│   │   ├── useChat.ts
│   │   ├── usePresence.ts
│   │   ├── useInventory.ts
│   │   ├── usePayments.ts
│   │   └── useDailySummary.ts
│   │
│   ├── components/
│   │   ├── ui/                 # shadcn/ui base components
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── RoleGuard.tsx
│   │   │   └── AppShell.tsx
│   │   ├── patients/
│   │   ├── appointments/
│   │   ├── casenotes/
│   │   ├── prescriptions/
│   │   ├── inventory/
│   │   ├── payments/
│   │   ├── chat/
│   │   ├── reports/
│   │   └── outreach/
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   └── LoginPage.tsx
│   │   ├── doctor/
│   │   │   ├── DoctorDashboard.tsx
│   │   │   ├── PatientView.tsx
│   │   │   ├── CaseNotes.tsx
│   │   │   ├── Prescriptions.tsx
│   │   │   └── Appointments.tsx
│   │   ├── assistant/
│   │   │   ├── AssistantDashboard.tsx
│   │   │   ├── PatientRegistration.tsx
│   │   │   ├── AppointmentManager.tsx
│   │   │   ├── Outreach.tsx
│   │   │   └── DrugDispensing.tsx
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── UserManagement.tsx
│   │   │   ├── AuditLogs.tsx
│   │   │   ├── Reports.tsx
│   │   │   └── BackupManager.tsx
│   │   └── accountant/
│   │       ├── AccountantDashboard.tsx
│   │       ├── PaymentManager.tsx
│   │       ├── DailySummary.tsx
│   │       └── FinancialReports.tsx
│   │
│   └── types/
│       ├── database.types.ts   # Auto-generated from Supabase CLI
│       └── app.types.ts        # Custom app types
│
├── supabase/
│   ├── migrations/             # SQL migration files
│   ├── functions/
│   │   ├── send-outreach/      # Email/SMS edge function
│   │   ├── send-push/          # Push notification edge function
│   │   └── export-backup/      # Encrypted backup edge function
│   └── seed.sql                # Initial data (roles, admin user)
│
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 10. Scalability Considerations

- Supabase free tier supports up to 500MB DB, 2GB bandwidth — sufficient for a single clinic
- Upgrade to Pro ($25/month) for point-in-time recovery, daily backups, and more storage
- Realtime connections: Supabase supports 200 concurrent connections on free tier — more than enough for a clinic's staff
- If the clinic expands to multiple branches, each branch gets its own Supabase project, or use a multi-tenant schema with `clinic_id` on every table
