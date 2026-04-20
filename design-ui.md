# 🎨 Eye Clinic PWA — Design & UI Specification

---

## 1. Design Philosophy

The interface is built around three core principles:

**Clinical Clarity** — Every screen has one job. Information is never buried. Doctors and assistants work fast under pressure; the UI must match that speed.

**Trustworthy Precision** — Medical software must feel exact and dependable. No playful gradients or trendy micro-animations that erode trust. Clean lines, clear hierarchy, purposeful use of color.

**Calm Professionalism** — The palette is cool and neutral with a primary blue-teal accent — colours associated with health, trust, and expertise. Errors are red but never alarming. Success states are green and affirmative.

---

## 2. Color System

### 2.1 Primary Palette

```
Primary (Brand Blue-Teal)
  ├── 50:  #EFF8FF  → Page backgrounds, subtle fills
  ├── 100: #DBEFFE  → Hover states on light bg
  ├── 200: #BFE4FD  → Active tab backgrounds
  ├── 300: #93CFFC  → Border accents
  ├── 400: #60B3F8  → Disabled primary buttons
  ├── 500: #3B97F3  → Primary button, links
  ├── 600: #1D7FE8  → Primary button hover
  ├── 700: #1563C5  → Headings, active nav items
  ├── 800: #174E9D  → Dark mode primary
  └── 900: #17397B  → Dark headers

Neutral (Slate)
  ├── 50:  #F8FAFC  → Main page background
  ├── 100: #F1F5F9  → Card backgrounds
  ├── 200: #E2E8F0  → Borders, dividers
  ├── 300: #CBD5E1  → Placeholder text, disabled
  ├── 400: #94A3B8  → Secondary text
  ├── 500: #64748B  → Body text
  ├── 700: #334155  → Subheadings
  └── 900: #0F172A  → Primary text, headings
```

### 2.2 Semantic Colors

```
Success   → #10B981 (Emerald 500)  → Dispensed, paid, arrived
Warning   → #F59E0B (Amber 500)   → Pending, low stock, expiring
Error     → #EF4444 (Red 500)     → Failed payments, critical alerts
Info      → #3B82F6 (Blue 500)    → General info, system messages
```

### 2.3 Role Accent Colors (Sidebar & Header)

```
Doctor      → Primary Blue  (#1D7FE8)
Assistant   → Teal          (#0D9488)
Admin       → Indigo        (#4F46E5)
Accountant  → Emerald       (#059669)
```

Each role has a distinct sidebar accent so staff always know at a glance which interface they're using.

---

## 3. Typography

### 3.1 Font Stack

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace; /* for IDs, codes */
```

**Inter** is the standard for SaaS/clinical applications. It is highly legible at small sizes and renders cleanly on all operating systems.

### 3.2 Type Scale

```
Display:    36px / 700 weight → Dashboard page titles
H1:         28px / 700 weight → Section headings
H2:         22px / 600 weight → Card headings, modal titles
H3:         18px / 600 weight → Sub-section titles
Body Large: 16px / 400 weight → Primary body copy
Body:       14px / 400 weight → Standard UI text (most common)
Body Small: 13px / 400 weight → Table cells, metadata
Caption:    12px / 400 weight → Timestamps, helper text
Label:      12px / 500 weight → Form labels, table headers (uppercase, tracked)
```

---

## 4. Layout System

### 4.1 App Shell

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER (56px height)                                       │
│  [Logo] [Page Title]              [Search] [Notif] [Avatar] │
├──────────────┬──────────────────────────────────────────────┤
│  SIDEBAR     │  MAIN CONTENT AREA                           │
│  (240px)     │                                              │
│              │  ┌──────────────────────────────────────┐    │
│  Nav items   │  │  STAT CARDS ROW                      │    │
│  with icons  │  └──────────────────────────────────────┘    │
│              │                                              │
│  ──────────  │  ┌─────────────────┐  ┌──────────────────┐  │
│              │  │  PRIMARY PANEL  │  │  SECONDARY PANEL │  │
│  Online      │  │                 │  │                  │  │
│  Users       │  │                 │  │                  │  │
│              │  └─────────────────┘  └──────────────────┘  │
│  ──────────  │                                              │
│  Settings    │                                              │
│  Logout      │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

### 4.2 Spacing Scale

All spacing uses a base-4 system (4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px).

### 4.3 Grid

- Content area uses a 12-column grid
- Cards: 4 col (3 per row) for stat cards, 6 col (2 per row) for panels
- On mobile (PWA): single column, sidebar becomes bottom navigation

---

## 5. Component Library

All base components come from **shadcn/ui** with custom theming applied.

### 5.1 Stat Card

```
┌─────────────────────────────────┐
│  [Icon]   Total Patients Today  │
│                                 │
│       24                        │
│  ↑ 8 new  ·  16 returning       │
└─────────────────────────────────┘
```

- White background, 1px slate-200 border, 8px radius
- Icon in a tinted circle (role accent colour at 10% opacity)
- Large number: 36px bold, slate-900
- Trend: green/red with arrow icon

### 5.2 Data Table

- Sticky header, 14px body text
- Zebra striping: slate-50 on alternate rows
- Hover: blue-50 row highlight
- Sortable columns show sort icon on hover
- Inline action buttons (View, Edit, Dispense) — appear on row hover
- Pagination: Previous / Page N of M / Next

### 5.3 Patient Card (Search Result / List Item)

```
┌────────────────────────────────────────────────────────┐
│  [Avatar]  John Adeyemi          [SUBSCRIPTION BADGE]  │
│            P-00124  ·  Male, 42                        │
│            Last visit: 14 Apr 2026    [View] [Note]    │
└────────────────────────────────────────────────────────┘
```

### 5.4 Modal / Drawer Pattern

- Complex forms (new patient, case note, prescription) open in a **right-side drawer** (600px wide) rather than a modal — keeps context visible
- Confirmations (delete, dispense, payment) use a centered modal with clear destructive/confirm button labelling
- All forms have a sticky footer with Cancel and Submit buttons

### 5.5 Status Badges

```
[● Active]      → Green filled pill
[● Pending]     → Amber filled pill
[● Dispensed]   → Blue filled pill
[● Cancelled]   → Red outlined pill
[● Completed]   → Slate filled pill
```

### 5.6 Notification Toast

Appears top-right, auto-dismisses in 4s:
- Success: green left border + check icon
- Error: red left border + X icon
- Info: blue left border + info icon
- "Patient arrived" toasts are persistent (require manual dismiss)

---

## 6. Page-by-Page UI Specification

---

### 6.1 Login Page

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│         [Clinic Logo]                                   │
│         Eye Clinic Management System                    │
│                                                         │
│    ┌──────────────────────────────────────────────┐     │
│    │  Email Address                               │     │
│    │  [─────────────────────────────────────────] │     │
│    │                                              │     │
│    │  Password                          [👁 show] │     │
│    │  [─────────────────────────────────────────] │     │
│    │                                              │     │
│    │  [        Sign In        ]                   │     │
│    │                                              │     │
│    │  Forgot password?                            │     │
│    └──────────────────────────────────────────────┘     │
│                                                         │
│    Role is assigned by your administrator.              │
│    Contact Admin if you cannot access your account.     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

- Clean, centered card on a subtle blue-tinted background
- Clinic logo at top (configurable by Admin)
- No role selector — role is pulled from the user's profile after login

---

### 6.2 Doctor Dashboard

**Sidebar Navigation:**
- Dashboard (Home)
- My Patients
- Appointments
- Case Notes
- Prescriptions
- Chat
- Settings

**Dashboard Cards (Top Row):**
- My Patients Today
- Pending Appointments
- Patients Awaiting (arrived, not yet seen)
- Notes Written Today

**Main Panel — Today's Queue:**
```
┌──────────────────────────────────────────────────┐
│  PATIENTS AWAITING (2)                    [Refresh]│
├──────────────────────────────────────────────────┤
│  ● Chisom Okafor    10:30 AM    Routine Checkup  │
│    [Begin Consultation]                           │
├──────────────────────────────────────────────────┤
│  ● Tunde Fashola   11:00 AM    Follow-up         │
│    [Begin Consultation]                           │
└──────────────────────────────────────────────────┘
```

**Patient Detail View:**
```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back    CHISOM OKAFOR   P-00231   F, 29   [Subscription ✓]  │
├───────────────────────────┬─────────────────────────────────────┤
│  TABS: Overview | Notes   │  QUICK ACTIONS                      │
│        Prescriptions |    │  [+ New Case Note]                  │
│        Payments | History │  [+ Prescribe Drugs]                │
│                           │  [+ Glasses Prescription]           │
│  [Tab content here]       │  [Request Checkup Appointment]      │
└───────────────────────────┴─────────────────────────────────────┘
```

---

### 6.3 Assistant Dashboard

**Sidebar Navigation:**
- Dashboard
- Patients (Register / Search)
- Appointments
- Outreach & Reminders
- Drug Dispensing
- Glasses Orders
- Chat
- Settings

**Dashboard Cards:**
- New Patients Today
- Returning Patients Today
- Appointments Today
- Pending Dispenses
- Pending Glasses Orders

**Appointment Manager Panel:**
```
┌───────────────────────────────────────────────────────────────┐
│  APPOINTMENTS — Monday, 20 Apr 2026        [+ Book New]       │
├────────────┬─────────────────┬──────────┬──────────┬──────────┤
│  Time      │ Patient         │ Doctor   │ Status   │ Actions  │
├────────────┼─────────────────┼──────────┼──────────┼──────────┤
│  09:00 AM  │ Emeka Eze       │ Dr. Babs │ Confirmed│ [Arrived]│
│  10:30 AM  │ Chisom Okafor   │ Dr. Babs │ Arrived  │ [Notify] │
│  11:00 AM  │ Tunde Fashola   │ Dr. Babs │ Pending  │ [Reached]│
└────────────┴─────────────────┴──────────┴──────────┴──────────┘
```

**Outreach Panel:**
```
┌──────────────────────────────────────────────────────────────┐
│  PATIENT OUTREACH                                            │
├──────────────────────────────────────────────────────────────┤
│  Search patient...  [🔍]                                     │
│                                                              │
│  Chisom Okafor · +234 801 xxx xxxx                          │
│  [📧 Send Email]  [📱 Send SMS]  [📋 View History]          │
│                                                              │
│  Message Template:  [Appointment Reminder ▼]                 │
│  [─────────────────────────────────────────────────────────] │
│  [         Send Message         ]                            │
└──────────────────────────────────────────────────────────────┘
```

---

### 6.4 Admin Dashboard

**Sidebar Navigation:**
- Dashboard (Overview)
- User Management
- All Patients
- Inventory Management
- Financial Reports
- Audit Logs
- Backup & Export
- Settings
- Chat

**Dashboard Cards:**
- Total Staff Online
- Patients Seen Today
- Revenue Today (₦)
- Low Stock Alerts

**User Management Panel:**
```
┌──────────────────────────────────────────────────────────┐
│  STAFF USERS                               [+ Add User]  │
├────────────────┬──────────────┬──────────┬───────────────┤
│  Name          │ Role         │ Status   │ Actions       │
├────────────────┼──────────────┼──────────┼───────────────┤
│  Dr. Babatunde │ Doctor       │ ● Online │ [Edit][Deact] │
│  Ngozi Eze     │ Assistant    │ ○ Offline│ [Edit][Deact] │
│  Seun Adeyemi  │ Accountant   │ ○ Offline│ [Edit][Deact] │
│  Admin User    │ Admin        │ ● Online │ [Edit]        │
└────────────────┴──────────────┴──────────┴───────────────┘
```

---

### 6.5 Accountant Dashboard

**Sidebar Navigation:**
- Dashboard
- Payments
- Daily Summary
- Subscriptions
- Financial Reports
- Chat
- Settings

**Daily Summary View:**
```
┌────────────────────────────────────────────────────────┐
│  DAILY SUMMARY — 20 April 2026                         │
├───────────────────────┬────────────────────────────────┤
│  Drug Sales           │  ₦ 45,200                      │
│  Glasses Sales        │  ₦ 120,000                     │
│  Consultation Fees    │  ₦ 30,000                      │
│  Subscriptions        │  ₦ 60,000                      │
├───────────────────────┼────────────────────────────────┤
│  TOTAL REVENUE        │  ₦ 255,200                     │
├───────────────────────┼────────────────────────────────┤
│  New Patients         │  8                             │
│  Returning Patients   │  16                            │
│  Total Visits         │  24                            │
└───────────────────────┴────────────────────────────────┘
│  [Export to PDF]  [Export to CSV]                      │
└────────────────────────────────────────────────────────┘
```

---

### 6.6 Chat Interface

Persistent panel accessible from all dashboards. Can be opened as a side drawer or a floating widget.

```
┌───────────────────────────────────────────────────────┐
│  STAFF CHAT                                    [×]    │
├──────────────┬────────────────────────────────────────┤
│  CONTACTS    │  Dr. Babatunde                          │
│              │  ─────────────────────────────────     │
│  ● Dr. Babs  │                                        │
│  ○ Ngozi     │         [Good morning, the             │
│  ○ Seun      │          patient in room 2              │
│  ● Admin     │          is ready for you]              │
│              │                                        │
│              │  Understood, coming now ✓✓             │
│              │  [                          ]          │
│              │  ─────────────────────────────────     │
│              │  [Type a message...         ] [Send]   │
└──────────────┴────────────────────────────────────────┘
```

- Green dot = online, grey = offline
- Double ticks for read receipts
- Unread count badge on Chat nav item
- Message timestamps on hover

---

## 7. Inventory & Dispensing UI

### 7.1 Drug Inventory Table

```
┌─────────────────────────────────────────────────────────────────┐
│  DRUG INVENTORY                         [+ Add Drug]  [Search] │
├────────────────────┬──────────┬──────────┬──────────┬──────────┤
│  Drug Name         │ In Stock │ Unit     │ Price(₦) │ Actions  │
├────────────────────┼──────────┼──────────┼──────────┼──────────┤
│  Timolol 0.5%      │ 24 units │ Bottle   │ 3,500    │ [Edit]   │
│  Chloramphenicol   │ ⚠ 3 left│ Tube     │ 1,200    │ [Edit]   │  ← low stock warning
│  Fluorometholone   │ 18 units │ Bottle   │ 4,100    │ [Edit]   │
└────────────────────┴──────────┴──────────┴──────────┴──────────┘
```

### 7.2 Glasses Prescription Form

```
┌──────────────────────────────────────────────────────┐
│  GLASSES PRESCRIPTION                                │
├──────────────────────────────────────────────────────┤
│  Patient: Chisom Okafor                              │
│                                                      │
│         Sphere   Cylinder   Axis   Add               │
│  Right: [    ]   [      ]   [  ]   [  ]              │
│  Left:  [    ]   [      ]   [  ]   [  ]              │
│                                                      │
│  PD: [    ] mm                                       │
│                                                      │
│  Frame Selected:  [Choose from inventory ▼]          │
│  Lens Type:       [Single Vision ▼]                  │
│                                                      │
│  Notes: [────────────────────────────────────]       │
│                                                      │
│  [  Cancel  ]          [  Save Prescription  ]       │
└──────────────────────────────────────────────────────┘
```

---

## 8. Responsive & PWA Design

### 8.1 Breakpoints

```
Mobile (installed PWA): 375px – 768px → Bottom nav, single column, drawer menus
Tablet:                 768px – 1024px → Collapsible sidebar, 2 column
Desktop (primary):      1024px+        → Full sidebar, multi-column layout
```

### 8.2 Mobile (PWA Installed) Layout

- Sidebar becomes a **bottom navigation bar** (5 core items + More)
- Tables become **card lists** with swipe actions
- Drawers open full-screen
- Header collapses to just logo + notification bell + avatar

### 8.3 Install Prompt UI

```
┌─────────────────────────────────────────────────────┐
│  [Clinic Icon]  Install Eye Clinic App              │
│  Add to your desktop for the best experience        │
│                [Not Now]   [Install App →]          │
└─────────────────────────────────────────────────────┘
```

Appears as a non-intrusive banner at the bottom of the screen on first visit.

---

## 9. Microinteractions & Animations

- **Sidebar nav items**: 150ms ease background transition on hover/active
- **Buttons**: 100ms scale(0.97) on press
- **Cards**: subtle box-shadow lift on hover (transform translateY(-2px))
- **Toasts**: slide-in from right (200ms), slide-out (150ms)
- **Page transitions**: 150ms fade-in opacity
- **Loading states**: skeleton screens (not spinners) for table data
- **Real-time updates**: new chat messages and appointment status changes animate in with a 200ms slide-down

**Rule**: No animation exceeds 300ms. Nothing bounces. Nothing loops. Medical software is serious.

---

## 10. Accessibility

- All interactive elements meet WCAG AA contrast ratio (4.5:1 minimum)
- Full keyboard navigation support
- All form inputs have visible labels (never placeholder-only)
- Error messages are associated with their input via `aria-describedby`
- Focus rings are visible and styled (blue ring, not browser default)
- Loading states announced via `aria-live` regions
- Modals trap focus correctly and restore on close

---

## 11. Empty States

Every list/table has a designed empty state:

```
┌──────────────────────────────────────────┐
│                                          │
│          [Illustrated Icon]              │
│                                          │
│      No appointments for today           │
│   Book the first one to get started.     │
│                                          │
│       [+ Book Appointment]               │
│                                          │
└──────────────────────────────────────────┘
```

---

## 12. Print & PDF Styles

The following pages have print-optimized stylesheets:
- Patient prescription (glasses + drugs)
- Case note summary
- Daily financial summary
- Patient receipt/invoice

Print styles: white background, black text, no sidebar/nav, clinic letterhead injected at top.
