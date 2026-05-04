# Eye Clinic Frontend Client

React frontend application for Eye Clinic Management System with modern PWA capabilities.

## Features

- **Authentication**: Secure login with JWT tokens
- **Role-based Dashboard**: Different views for admin, doctor, frontdesk, manager
- **Patient Management**: Complete patient records with search/filter
- **Appointment Scheduling**: Calendar-based appointment system
- **Real-time Updates**: Live notifications and data sync
- **PWA Support**: Installable with offline capabilities
- **Mobile Responsive**: Works on all devices

## Setup

1. **Install Dependencies**
   ```bash
   cd client
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   Frontend will run on `http://localhost:5173`

## API Integration

The frontend is configured to proxy API calls to the backend server:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- API calls to `/api/*` are automatically proxied

## Project Structure

```
client/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components by feature
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility functions and configurations
│   ├── store/         # State management (Zustand)
│   ├── types/         # TypeScript type definitions
│   └── services/      # API service functions
├── public/            # Static assets and PWA files
└── dist/             # Build output (generated)
```

## Key Technologies

- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe development
- **TailwindCSS**: Utility-first styling
- **Vite**: Fast build tool and dev server
- **React Router**: Client-side routing
- **Zustand**: Lightweight state management
- **Supabase**: Backend-as-a-Service
- **Radix UI**: Accessible component library

## Environment Variables

Required variables in `.env`:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anonymous_key
```

## Build & Deploy

1. **Build for Production**
   ```bash
   npm run build
   ```

2. **Preview Production Build**
   ```bash
   npm run preview
   ```

3. **Deploy to Vercel**
   ```bash
   npm install -g vercel
   vercel --prod
   ```

## Development Workflow

1. Start backend server (`cd server && npm run dev`)
2. Start frontend server (`npm run dev`)
3. Frontend automatically proxies API calls to backend
4. Hot reload works for both frontend and backend

## PWA Features

- **Service Worker**: Offline caching and background sync
- **App Manifest**: Installable as native app
- **Push Notifications**: Real-time alerts
- **Offline Support**: Core functionality works offline

## Security Features

- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: Frontend rate limiting protection
- **Input Validation**: Form validation on all inputs
- **XSS Protection**: Sanitized user inputs
- **CSRF Protection**: Token-based request validation
