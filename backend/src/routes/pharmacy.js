import express from 'express'
import supabase from '../services/supabase.js'

const router = express.Router()

router.get('/drugs', async (req, res) => {
  try {
    const { data, error } = await supabase.from('pharmacy_drugs').select('*').order('drug_name')
    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/drugs/low-stock', async (req, res) => {
  try {
    const { data, error } = await supabase.from('pharmacy_drugs').select('*').lte('current_quantity', 'minimum_quantity').order('current_quantity')
    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/dispense', async (req, res) => {
  try {
    const { drugId, patientId, quantity, userId, notes } = req.body
    const { data: drug } = await supabase.from('pharmacy_drugs').select('*').eq('id', drugId).single()
    if (!drug) throw new Error('Drug not found')
    
    const total = drug.unit_price * quantity
    const { data, error } = await supabase.from('pharmacy_dispensations').insert({
      drug_id: drugId, patient_id: patientId, quantity, unit_price: drug.unit_price, total_amount: total, user_id: userId, notes
    }).select().single()
    if (error) throw error
    
    await supabase.from('pharmacy_drugs').update({ current_quantity: drug.current_quantity - quantity }).eq('id', drugId)
    await supabase.from('revenue').insert({ source: 'pharmacy', source_id: data.id, amount: total, patient_id: patientId })
    
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router