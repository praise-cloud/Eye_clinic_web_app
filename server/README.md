# Eye Clinic Backend Server

Express.js server that provides REST API endpoints for the Eye Clinic Management System.

## Features

- **Authentication**: JWT-based auth with Supabase integration
- **User Management**: CRUD operations for staff accounts
- **Patient Management**: Complete patient record management
- **Appointment Scheduling**: Full appointment system
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

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify` - Token verification
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users` - Get all users (admin/manager)
- `POST /api/users` - Create user (admin/manager)
- `PUT /api/users/:id` - Update user (admin/manager)
- `DELETE /api/users/:id` - Delete user (admin only)
- `PATCH /api/users/:id/toggle-active` - Toggle user status

### Patients
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get single patient
- `POST /api/patients` - Create patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Appointments
- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/:id` - Get single appointment
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment
- `PATCH /api/appointments/:id/status` - Update appointment status

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
