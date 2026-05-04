# Eye Clinic Backend Server

Express.js server that provides REST API endpoints for the Eye Clinic Management System with complete middleware and service layer architecture.

## 🏗️ Architecture

```
server/
├── src/
│   ├── middleware/          # Authentication and authorization
│   │   └── auth.js         # JWT middleware and role-based access
│   ├── services/           # Business logic layer
│   │   ├── userService.js  # User management logic
│   │   ├── patientService.js # Patient management logic
│   │   └── appointmentService.js # Appointment logic
│   ├── routes/            # API route handlers
│   │   ├── auth.js         # Authentication endpoints
│   │   ├── users.js        # User management endpoints
│   │   ├── patients.js     # Patient endpoints
│   │   ├── appointments.js # Appointment endpoints
│   │   ├── prescriptions.js # Prescription endpoints
│   │   ├── payments.js     # Payment endpoints
│   │   └── inventory.js    # Inventory management endpoints
│   ├── lib/               # Utilities and configurations
│   │   └── supabase.js    # Supabase client and helpers
│   └── index.js           # Server entry point
└── package.json
```

## Features

- **Authentication**: JWT-based auth with Supabase integration
- **Middleware**: Role-based access control and authentication
- **Services**: Clean business logic separation
- **User Management**: CRUD operations for staff accounts
- **Patient Management**: Complete patient record management
- **Appointment Scheduling**: Full appointment system
- **Prescriptions**: Optical prescription management
- **Payments**: Payment processing and receipt generation
- **Inventory**: Drug, glasses, and other inventory management
- **Security**: Rate limiting, CORS, helmet security
- **Error Handling**: Comprehensive error responses

## Setup

1. **Install Dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your Supabase credentials:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
   - `JWT_SECRET`: Secret key for JWT tokens

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   Server will run on `http://localhost:3001`

## API Endpoints

### Authentication (No auth required)
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify` - Token verification
- `POST /api/auth/logout` - User logout

### Users (Requires authentication + role permissions)
- `GET /api/users` - Get all users (admin/manager)
- `POST /api/users` - Create user (admin/manager)
- `PUT /api/users/:id` - Update user (admin/manager)
- `DELETE /api/users/:id` - Delete user (admin only)
- `PATCH /api/users/:id/toggle-active` - Toggle user status (admin/manager)

### Patients (Requires authentication)
- `GET /api/patients` - Get all patients with pagination
- `GET /api/patients/:id` - Get single patient
- `POST /api/patients` - Create patient (auto-numbered)
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient (admin/frontdesk)

### Appointments (Requires authentication)
- `GET /api/appointments` - Get all appointments with filters
- `GET /api/appointments/:id` - Get single appointment
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment
- `PATCH /api/appointments/:id/status` - Update appointment status

### Prescriptions (Requires authentication)
- `GET /api/prescriptions` - Get all prescriptions with filters
- `GET /api/prescriptions/:id` - Get single prescription
- `POST /api/prescriptions` - Create prescription (doctor)
- `PUT /api/prescriptions/:id` - Update prescription
- `DELETE /api/prescriptions/:id` - Delete prescription
- `PATCH /api/prescriptions/:id/status` - Update prescription status

### Payments (Requires authentication)
- `GET /api/payments` - Get all payments with filters
- `GET /api/payments/:id` - Get single payment
- `POST /api/payments` - Create payment (auto-receipt)
- `PUT /api/payments/:id` - Update payment
- `DELETE /api/payments/:id` - Delete payment
- `GET /api/payments/stats/summary` - Get payment statistics

### Inventory (Requires authentication)
- `GET /api/inventory/drugs` - Get all drugs
- `GET /api/inventory/glasses` - Get all glasses frames
- `GET /api/inventory/others` - Get other inventory items
- `GET /api/inventory/low-stock` - Get low stock items
- `POST /api/inventory/drugs` - Add new drug
- `POST /api/inventory/glasses` - Add new glasses frame
- `POST /api/inventory/others` - Add other inventory item
- `PUT /api/inventory/drugs/:id` - Update drug
- `PUT /api/inventory/glasses/:id` - Update glasses frame
- `PUT /api/inventory/others/:id` - Update other inventory item

## Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configured for frontend origin
- **Helmet**: Security headers
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Request validation on all endpoints

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Health Check

- `GET /health` - Server health status

## Development

The server is configured to work with the frontend running on `http://localhost:5173` (Vite default).

## Production

For production deployment:
1. Set `NODE_ENV=production`
2. Use environment variables for all configuration
3. Ensure HTTPS is configured
4. Use a proper reverse proxy (nginx/Apache)
