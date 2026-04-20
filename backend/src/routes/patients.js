import express from 'express'
import supabase from '../services/supabase.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const { search, client_type, limit = 50 } = req.query
    let query = supabase.from('patients').select('*').order('created_at', { ascending: false })
    
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,patient_id.ilike.%${search}%`)
    }
    if (client_type && client_type !== 'all') {
      query = query.eq('client_type', client_type)
    }
    
    const { data, error } = await query.limit(parseInt(limit))
    if (error) throw error
    
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
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
    const { patient_id, first_name, last_name, dob, gender, contact, email, address, reason_for_visit, client_type, marital_status, intake_date } = req.body
    
    const { data, error } = await supabase
      .from('patients')
      .insert({
        patient_id: patient_id || `PT-${Date.now()}`,
        first_name,
        last_name,
        dob,
        gender,
        contact,
        email,
        address,
        reason_for_visit,
        client_type,
        marital_status,
        intake_date
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
    const { first_name, last_name, dob, gender, contact, email, address, reason_for_visit, client_type, marital_status, intake_date } = req.body
    
    const { data, error } = await supabase
      .from('patients')
      .update({
        first_name,
        last_name,
        dob,
        gender,
        contact,
        email,
        address,
        reason_for_visit,
        client_type,
        marital_status,
        intake_date,
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
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', req.params.id)
    
    if (error) throw error
    
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router