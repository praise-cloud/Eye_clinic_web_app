import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import appointmentRoutes from './routes/appointments.js'
import patientRoutes from './routes/patients.js'
import prescriptionRoutes from './routes/prescriptions.js'
import dashboardRoutes from './routes/dashboard.js'
import inventoryRoutes from './routes/inventory.js'
import notificationRoutes from './routes/notifications.js'
import pharmacyRoutes from './routes/pharmacy.js'
import revenueRoutes from './routes/revenue.js'
import settingsRoutes from './routes/settings.js'
import userRoutes from './routes/users.js'
import chatRoutes from './routes/chat.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../../.env') })

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/patients', patientRoutes)
app.use('/api/prescriptions', prescriptionRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/pharmacy', pharmacyRoutes)
app.use('/api/revenue', revenueRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/users', userRoutes)
app.use('/api/chat', chatRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
})
