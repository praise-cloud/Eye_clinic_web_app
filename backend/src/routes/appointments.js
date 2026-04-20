import express from 'express'
import supabase from '../services/supabase.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const { start, end, status } = req.query
    let query = supabase.from('appointments').select('*, patient:patients(*), doctor:profiles(*)').order('appointment_date', { ascending: true })
    
    if (start) query = query.gte('appointment_date', start)
    if (end) query = query.lte('appointment_date', end)
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
    const { data, error } = await supabase
      .from('appointments')
      .select('*, patient:patients(*), doctor:profiles(*)')
      .eq('appointment_date', today)
      .order('appointment_time')
    
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
      .select('*, patient:patients(*), doctor:profiles(*)')
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
    const { patient_id, doctor_id, appointment_date, appointment_time, appointment_type, reason, status } = req.body
    
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        patient_id,
        doctor_id,
        appointment_date,
        appointment_time,
        appointment_type,
        reason,
        status: status || 'scheduled'
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
    const { appointment_date, appointment_time, appointment_type, reason, status, notes } = req.body
    
    const { data, error } = await supabase
      .from('appointments')
      .update({
        appointment_date,
        appointment_time,
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