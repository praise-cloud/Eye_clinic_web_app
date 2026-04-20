import express from 'express'
import supabase from '../services/supabase.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('chat').select('*, sender:profiles(*), receiver:profiles(*)').order('timestamp', { ascending: false }).limit(50)
    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { sender_id, receiver_id, message_text } = req.body
    const { data, error } = await supabase.from('chat').insert({ sender_id, receiver_id, message_text }).select().single()
    if (error) throw error
    res.json({ success: true, data, id: data.id })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.put('/:id/read', async (req, res) => {
  try {
    const { data, error } = await supabase.from('chat').update({ status: 'read' }).eq('id', req.params.id).select().single()
    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router