import express from 'express'
import supabase from '../services/supabase.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('inventory').select('*').order('item_name')
    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { item_code, item_name, category, description, current_quantity, minimum_quantity, unit_cost } = req.body
    const { data, error } = await supabase.from('inventory').insert({ item_code, item_name, category, description, current_quantity, minimum_quantity, unit_cost }).select().single()
    if (error) throw error
    res.json({ success: true, data, id: data.id })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { item_name, category, current_quantity, minimum_quantity, status } = req.body
    const { data, error } = await supabase.from('inventory').update({ item_name, category, current_quantity, minimum_quantity, status, updated_at: new Date().toISOString() }).eq('id', req.params.id).select().single()
    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router