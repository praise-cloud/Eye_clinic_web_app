import express from 'express'
import supabase from '../services/supabase.js'

const router = express.Router()

router.get('/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const startOfMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`
    
    const [patients, tests, revenueToday, revenueMonth, pendingRx, newToday, lowStock, todayApts] = await Promise.all([
      supabase.from('patients').select('id', { count: true }),
      supabase.from('tests').select('id', { count: true }),
      supabase.from('revenue').select('amount').gte('timestamp', today),
      supabase.from('revenue').select('amount').gte('timestamp', startOfMonth),
      supabase.from('prescriptions').select('id', { count: true }).eq('status', 'pending'),
      supabase.from('patients').select('id', { count: true }).gte('created_at', today),
      supabase.from('pharmacy_drugs').select('id', { count: true }).lte('current_quantity', 'minimum_quantity'),
      supabase.from('appointments').select('id', { count: true }).eq('appointment_date', today)
    ])
    
    const totalPatients = patients.count || 0
    const totalTests = tests.count || 0
    const todayRevenue = revenueToday.data?.reduce((sum, r) => sum + r.amount, 0) || 0
    const monthlyRevenue = revenueMonth.data?.reduce((sum, r) => sum + r.amount, 0) || 0
    const pendingPrescriptions = pendingRx.count || 0
    const newClientsToday = newToday.count || 0
    const lowStockItems = lowStock.count || 0
    const totalAppointmentsToday = todayApts.count || 0
    
    res.json({
      success: true,
      stats: { totalPatients, totalTests, todayRevenue, monthlyRevenue, pendingPrescriptions, newClientsToday, lowStockItems, totalAppointmentsToday }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router