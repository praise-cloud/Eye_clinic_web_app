# Eye Clinic PWA - Developer Reference Guide

> **Critical reference for building and maintaining the Eye Clinic PWA correctly with zero regression.**

---

## Table of Contents
1. [Database Rules](#database-rules)
2. [TypeScript Types](#typescript-types)
3. [Component Patterns](#component-patterns)
4. [Common Errors & Fixes](#common-errors--fixes)
5. [Build & Deploy](#build--deploy)
6. [Key File Locations](#key-file-locations)

---

## Database Rules

### RLS (Row Level Security) Policy Rules
- **INSERT policies MUST use `WITH CHECK`** — never `USING` for INSERT
  ```sql
  -- CORRECT:
  CREATE POLICY "insert_appointments" ON public.appointments
    FOR INSERT TO authenticated WITH CHECK (true);

  -- WRONG (will fail silently):
  CREATE POLICY "insert_appointments" ON public.appointments
    FOR INSERT TO authenticated USING (true);  -- DON'T DO THIS
  ```

- **Policies must be idempotent** — always use `DROP POLICY IF EXISTS` before `CREATE POLICY`
  ```sql
  DROP POLICY IF EXISTS "insert_appointments" ON public.appointments;
  CREATE POLICY "insert_appointments" ON public.appointments
    FOR INSERT TO authenticated WITH CHECK (true);
  ```

- **Dynamic cleanup** — Use DO blocks to drop ALL policies before recreation:
  ```sql
  DO $$
  DECLARE
      pol RECORD;
  BEGIN
      FOR pol IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public'
      LOOP
          EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
      END LOOP;
  END $$;
  ```

### Column Name Rules
| Column | Correct Name | Wrong Name |
|--------|--------------|------------|
| Notification read status | `is_read` | `read` |
| Prescription OD field | `od_sphere` | `final_rx_od` |
| Prescription OS field | `os_sphere` | `final_rx_os` |
| Audit record ID | `record_id` (TEXT) | `record_id` (UUID) |

### Table Schema Rules
- **`audit_logs.record_id` is TEXT** — supports dynamic PKs (UUID, TEXT, etc.)
- **`settings` table uses TEXT primary key** (`key` column)
- **`appointments.requested_by` is nullable** — comment out if causing 403 errors
- **`notifications.is_read` NOT `read`** — this causes 400 errors

### Trigger Function Rules
- **Always use `SECURITY DEFINER`** for triggers that write to other tables
- **Always set `search_path = public`** to avoid permission issues
  ```sql
  CREATE OR REPLACE FUNCTION update_daily_summary_on_appointment()
  RETURNS TRIGGER
  SECURITY DEFINER
  SET search_path = public
  AS $$
  BEGIN
      -- trigger logic here
  END;
  $$ LANGUAGE plpgsql;
  ```

### RLS Policies That Must Exist
| Table | Operation | Policy Name | Check |
|-------|-----------|-------------|-------|
| `daily_summary` | INSERT | `daily_summary_insert` | WITH CHECK (true) |
| `audit_logs` | INSERT | `audit_logs_insert` | WITH CHECK (true) |
| `profiles` | ALL | `profiles_manager_manage` | USING (get_user_role() = 'manager') |
| `patients` | DELETE | `delete_patients` | USING (get_user_role() IN ('admin', 'frontdesk')) |

---

## TypeScript Types

### Key Type Mismatches to Avoid
```typescript
// WRONG - causes "property 'read' does not exist" error:
interface AppNotification {
    read: boolean;  // WRONG
}

// CORRECT:
interface AppNotification {
    is_read: boolean;  // CORRECT
}
```

### Correct Import Paths
```typescript
// WRONG:
import { NotificationBell } from '@/components/NotificationBell'
import { useAuth } from '@/hooks/useAuth'

// CORRECT:
import { NotificationBell } from '@/components/layout/NotificationBell'
import { useAuth } from '@/hooks/useAuth'
```

---

## Component Patterns

### Dashboard Stats Pattern
```typescript
// CORRECT way to fetch multiple stats in one query:
const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
        const today = new Date().toISOString().split('T')[0]
        const todayStart = `${today}T00:00:00`
        const todayEnd = `${today}T23:59:59`

        const [patients, appointments, payments] = await Promise.all([
            supabase.from('patients').select('id', { count: 'exact' }).gte('created_at', todayStart),
            supabase.from('appointments').select('id', { count: 'exact' }).gte('scheduled_at', todayStart).lte('scheduled_at', todayEnd),
            supabase.from('payments').select('amount').gte('paid_at', todayStart).lte('paid_at', todayEnd),
        ])

        const dailyRevenue = (payments.data ?? []).reduce((sum, p) => sum + Number(p.amount ?? 0), 0)

        return {
            newPatients: patients.count ?? 0,
            appointments: appointments.count ?? 0,
            dailyRevenue,
        }
    },
    refetchInterval: 30000,  // Refetch every 30 seconds
})
```

### Low Stock Threshold Pattern
```typescript
// WRONG - hardcoded threshold:
const { count } = await supabase.from('drugs').select('id', { count: 'exact' }).lte('quantity', 10)

// CORRECT - use reorder_level field:
const { data } = await supabase.from('drugs').select('quantity, reorder_level')
const lowStockCount = (data ?? []).filter(d => Number(d.quantity ?? 0) <= Number(d.reorder_level ?? 10)).length
```

### Auth Hook Pattern
```typescript
// CORRECT useAuth.ts pattern:
import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'

export function useAuth() {
    const { signOut } = useAuthStore()
    const navigate = useNavigate()

    const login = useCallback(async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
    }, [])

    const logout = useCallback(async () => {
        try {
            await supabase.auth.signOut()
            signOut()
            navigate('/login', { replace: true })
        } catch (error) {
            signOut()
            navigate('/login', { replace: true })
        }
    }, [signOut, navigate])

    return { login, logout }
}
```

### Notification Pattern
```typescript
// CORRECT - notifications persist until viewed:
import { notify } from '@/store/notificationStore'

// Trigger notification:
notify({
    type: 'appointment',
    title: 'New Appointment',
    message: 'A new appointment has been scheduled.',
    link: '/doctor/appointments',
}, profile.id)  // Pass userId as second argument

// Mark as read:
const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
}
```

---

## Common Errors & Fixes

### Error: `property 'read' does not exist on type 'AppNotification'`
**Cause:** Database column is `is_read`, code uses `read`
**Fix:** Replace all `n.read` with `n.is_read`, `read: true` with `is_read: true`

### Error: `403 (Forbidden)` on appointment booking
**Cause 1:** RLS policy uses `USING` instead of `WITH CHECK`
**Fix:** `CREATE POLICY "insert_appointments" ON public.appointments FOR INSERT TO authenticated WITH CHECK (true);`

**Cause 2:** Trigger function can't write to `daily_summary` or `audit_logs`
**Fix:** Add `SECURITY DEFINER` and RLS policies for these tables

**Cause 3:** `requested_by` column causes issues
**Fix:** Comment out `requested_by: profile?.id` in the insert, or ensure column is nullable

### Error: Login screen hanging indefinitely
**Cause:** `getSession()` promise rejects but no `.catch()` handler
**Fix:** Add error handling:
```typescript
supabase.auth.getSession().then(async ({ data: { session } }) => {
    // ... auth logic
}).catch((err) => {
    console.error('getSession failed:', err)
    setLoading(false)  // CRITICAL: always set loading to false
})
```

### Error: Browser back button shows dashboard when logged out
**Cause:** No auth guard preventing access after logout
**Fix:** Update RoleGuard to redirect:
```typescript
export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
    const { isAuthenticated, isLoading } = useAuthStore()
    const navigate = useNavigate()

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate('/login', { replace: true })
        }
    }, [isAuthenticated, isLoading, navigate])

    // ... rest of component
}
```

### Error: `Cannot find name 'Calendar'` (TypeScript)
**Cause:** Missing import
**Fix:** Add import:
```typescript
import { Calendar, DollarSign, TrendingUp } from 'lucide-react'
```

### Error: Build fails with `TS2304: Cannot find name 'FrontdeskDashboard'`
**Cause:** Component imported with wrong name
**Fix:** Check import statement:
```typescript
// WRONG:
import { AssistantDashboard } from './pages/frontdesk/AssistantDashboard'

// CORRECT:
import { FrontdeskDashboard } from './pages/frontdesk/FrontdeskDashboard'
```

---

## Build & Deploy

### Vite Config (CSP Rules)
- **Use `https://` not `https:`** for scheme-based wildcards in CSP:
  ```typescript
  // CORRECT:
  contentSecurityPolicy: {
      "connect-src": ["'self'", "https://*.supabase.co"]
  }

  // WRONG:
  contentSecurityPolicy: {
      "connect-src": ["'self'", "https:*.supabase.co"]  // Missing /
  }
  ```

### tsconfig.json Rules
- **Exclude `src/test`** to avoid broken test files breaking builds:
  ```json
  {
    "compilerOptions": { ... },
    "exclude": ["node_modules", "src/test"]
  }
  ```

### Vercel Deployment
- **Use simple Vite config** — no `experimentalServices`:
  ```json
  {
    "buildCommand": "npm run build",
    "outputDirectory": "dist",
    "framework": "vite"
  }
  ```

### Supabase Free Tier Warnings
- **Projects pause after 7 days** — Unpause in dashboard to fix "random" breaks
- **`.env` file is gitignored** — Gets lost when switching machines
- **PWA service worker caches API responses** — Unregister in DevTools if stale data persists

---

## Key File Locations

### Pages
| Page | Path |
|------|------|
| Login | `src/pages/auth/LoginPage.tsx` |
| Register | `src/pages/auth/RegisterPage.tsx` |
| Doctor Dashboard | `src/pages/doctor/DoctorDashboard.tsx` |
| Frontdesk Dashboard | `src/pages/frontdesk/FrontdeskDashboard.tsx` |
| Admin Dashboard | `src/pages/admin/AdminDashboard.tsx` |
| Manager Dashboard | `src/pages/manager/ManagerDashboard.tsx` |
| Appointments | `src/pages/appointments/AppointmentsPage.tsx` |
| Calendar | `src/pages/appointments/CalendarPage.tsx` |
| Case Notes | `src/pages/doctor/CaseNotesPage.tsx` |
| Patients | `src/pages/patients/PatientsPage.tsx` |
| Outreach | `src/pages/frontdesk/OutreachPage.tsx` |

### State Management
| Store | Path |
|-------|------|
| Auth Store | `src/store/authStore.ts` |
| Notification Store | `src/store/notificationStore.ts` |
| UI Store | `src/store/uiStore.ts` |

### Supabase
| File | Path |
|------|------|
| Client | `src/lib/supabase.ts` |
| Master SQL | `supabase/00-complete-setup.sql` |
| RLS Policies | `supabase/02-rls-policies.sql` |

### Routing
| File | Path |
|------|------|
| Main Routes | `src/App.tsx` |
| Auth Guard | `src/components/layout/RoleGuard.tsx` |
| Sidebar | `src/components/layout/Sidebar.tsx` |

---

## Quick Checklist Before Committing

- [ ] Run `npm run build` — ensure no TypeScript errors
- [ ] Check browser console — no 403/400 errors
- [ ] Test login flow — no infinite loading
- [ ] Test logout — browser back button doesn't show dashboard
- [ ] Verify RLS policies in Supabase Dashboard
- [ ] Check `is_read` not `read` in notification code
- [ ] Ensure `WITH CHECK` not `USING` for INSERT policies
- [ ] Test appointment booking — no 403 errors
- [ ] Verify dashboard stats show correct metrics

---

**Last Updated:** May 2026
**Maintainer:** KORENE Eye Clinic Dev Team
