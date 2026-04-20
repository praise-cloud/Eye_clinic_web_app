import express from 'express'
import supabase from '../services/supabase.js'

const router = express.Router()

router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase.from('revenue').select('*, patient:patients(*)').gte('timestamp', today).order('timestamp', { ascending: false })
    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/monthly', async (req, res) => {
  try {
    const startOfMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`
    const { data, error } = await supabase.from('revenue').select('*, patient:patients(*)').gte('timestamp', startOfMonth).order('timestamp', { ascending: false })
    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { source, amount, patient_id, description } = req.body
    const { data, error } = await supabase.from('revenue').insert({ source, amount, patient_id, description }).select().single()
    if (error) throw error
    res.json({ success: true, data, id: data.id })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router