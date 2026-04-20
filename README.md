# Eye Clinic Management System - Web PWA

A modern, mobile-responsive Progressive Web Application for eye clinic management built with React, TailwindCSS, Node.js/Express, and Supabase.

## Project Structure

```
eye-clinic-web/
├── client/           # React frontend (Vite + PWA)
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/      # Page components
│   │   ├── hooks/     # Custom React hooks
│   │   ├── services/  # API services
│   │   ├── stores/   # Zustand stores
│   │   └── types/    # TypeScript types
│   └── public/      # Static assets
├── server/          # Express backend
│   └── src/
│       ├── routes/   # API routes
│       └── services/ # Services
└── supabase/       # Database schema
```

## Features

- **Authentication**: Supabase Auth with JWT
- **Role-based Access**: Admin, Doctor, Assistant, Accountant
- **Patients Management**: Full CRUD with search/filter
- **Appointments**: Calendar view with booking
- **Prescriptions**: Doctor prescribing, Assistant dispensing
- **Pharmacy**: Drug inventory and dispensations
- **Revenue Tracking**: Financial dashboard
- **Calendar**: Free calendar view (Monthly/Weekly)
- **PWA**: Installable, offline-capable
- **Mobile Responsive**: Works on phones/tablets

## Setup Instructions

### 1. Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Go to SQL Editor and run the contents of `supabase/schema.sql`
3. Get your Supabase URL and anon key

### 2. Configure Environment Variables

**Client** (`client/.env`):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:3001
```

**Server** (`server/.env`):
```env
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
JWT_SECRET=your-secret-key
```

### 3. Install Dependencies

```bash
# Client
cd client
npm install

# Server
cd server
npm install
```

### 4. Run Development

```bash
# Terminal 1 - Start backend
cd server
npm run dev

# Terminal 2 - Start frontend
cd client
npm run dev
```

### 5. Build for Production

```bash
# Build client
cd client
npm run build

# Preview production build
npm run preview
```

## Deployment to Vercel

### Deploy Backend (as Serverless Functions)

1. Create a Vercel project
2. Configure for Node.js
3. Set environment variables
4. Deploy the `server` folder

### Deploy Frontend

1. Create a Vercel project for the frontend
2. Connect to GitHub
3. Set environment variables
4. Deploy

Or use Vercel CLI:
```bash
cd client
vercel deploy --prod
```

## User Roles

| Role | Permissions |
|------|-----------|
| **Admin** | Full access, user management, all features |
| **Doctor** | Patients, prescriptions, case notes, calendar |
| **Assistant** | Pharmacy, prescriptions, registration |
| **Accountant** | Revenue, reports, appointments view |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|------------|
| POST | /api/auth/login | Login |
| POST | /api/auth/register | Register |
| GET | /api/auth/me | Current user |
| GET | /api/patients | List patients |
| POST | /api/patients | Create patient |
| GET | /api/appointments | List appointments |
| POST | /api/appointments | Create appointment |
| GET | /api/prescriptions/pending | Pending prescriptions |
| POST | /api/pharmacy/dispense | Dispense drug |
| GET | /api/dashboard/stats | Dashboard stats |

## Technologies Used

- **Frontend**: React 18, TailwindCSS 3, Vite 6, React Router 7, Zustand
- **Backend**: Node.js, Express, Supabase JS SDK
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth + JWT
- **PWA**: vite-plugin-pwa, Workbox
- **Icons**: Lucide React
- **Calendar**: Custom implementation

## License

MIT - KORENE Eye Clinic