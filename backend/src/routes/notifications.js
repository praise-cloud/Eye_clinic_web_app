import express from 'express'
import supabase from '../services/supabase.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20)
    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.put('/:id/read', async (req, res) => {
  try {
    const { data, error } = await supabase.from('notifications').update({ status: 'read' }).eq('id', req.params.id).select().single()
    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router