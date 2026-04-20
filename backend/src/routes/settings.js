import express from 'express'
import supabase from '../services/supabase.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('settings').select('*')
    if (error) throw error
    const settings = data.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {})
    res.json({ success: true, data: settings })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.put('/', async (req, res) => {
  try {
    const settings = req.body
    for (const [key, value] of Object.entries(settings)) {
      await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' })
    }
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router