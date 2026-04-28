import express from 'express'
import supabase from '../services/supabase.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const { start, end, status } = req.query
    let query = supabase.from('appointments').select('*, patient:patients(*), doctor:profiles!doctor_id(*)').order('scheduled_at', { ascending: true })

    if (start) query = query.gte('scheduled_at', start)
    if (end) query = query.lte('scheduled_at', end)
    if (status && status !== 'all') query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw error

    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const startOfDay = `${today}T00:00:00`
    const endOfDay = `${today}T23:59:59`
    const { data, error } = await supabase
      .from('appointments')
      .select('*, patient:patients(*), doctor:profiles!doctor_id(*)')
      .gte('scheduled_at', startOfDay)
      .lte('scheduled_at', endOfDay)
      .order('scheduled_at')

    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, patient:patients(*), doctor:profiles!doctor_id(*)')
      .eq('id', req.params.id)
      .single()

    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { patient_id, doctor_id, scheduled_at, appointment_type, reason, status, notes } = req.body

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        patient_id,
        doctor_id,
        scheduled_at,
        appointment_type,
        reason,
        notes,
        status: status || 'pending'
      })
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, data, id: data.id })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { scheduled_at, appointment_type, reason, status, notes } = req.body

    const { data, error } = await supabase
      .from('appointments')
      .update({
        scheduled_at,
        appointment_type,
        reason,
        status,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('appointments').delete().eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router