import express from 'express'
import supabase from '../services/supabase.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const { patientId } = req.query
    let query = supabase.from('prescriptions').select('*, patient:patients(*), drug:pharmacy_drugs(*), doctor:profiles(*)').order('created_at', { ascending: false })
    if (patientId) query = query.eq('patient_id', patientId)
    const { data, error } = await query
    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/pending', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('prescriptions')
      .select('*, patient:patients(*), drug:pharmacy_drugs(*), doctor:profiles(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { patient_id, doctor_id, drug_id, quantity, instructions, glasses_details } = req.body
    const { data, error } = await supabase.from('prescriptions').insert({ patient_id, doctor_id, drug_id, quantity, instructions, glasses_details }).select().single()
    if (error) throw error
    res.json({ success: true, data, id: data.id })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    const { data, error } = await supabase.from('prescriptions').update({ status, updated_at: new Date().toISOString() }).eq('id', req.params.id).select().single()
    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router