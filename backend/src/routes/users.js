import express from 'express'
import supabase from '../services/supabase.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('profiles').select('*').order('first_name')
    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.put('/profile', async (req, res) => {
  try {
    const { first_name, last_name, phone_number } = req.body
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) throw new Error('No token')
    
    const jwt = await import('jsonwebtoken')
    const decoded = jwt.default.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    
    const { data, error } = await supabase.from('profiles').update({ first_name, last_name, phone_number, updated_at: new Date().toISOString() }).eq('id', decoded.userId).select().single()
    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router