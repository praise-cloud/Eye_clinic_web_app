import express from 'express'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../../.env') })

const router = express.Router()

// Admin client — bypasses RLS, creates confirmed users
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// POST /api/auth/register — creates a confirmed user (no email verification needed)
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body

    if (!email || !password || !full_name || !role) {
      return res.status(400).json({ success: false, error: 'All fields are required' })
    }

    const validRoles = ['doctor', 'assistant', 'admin', 'accountant']
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' })
    }

    // Create user with email_confirm: true — skips email confirmation entirely
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role }
    })

    if (error) throw error

    // Upsert profile in case trigger didn't fire
    await supabaseAdmin.from('profiles').upsert({
      id: data.user.id,
      full_name,
      role,
      is_active: true
    })

    res.json({ success: true, message: 'Account created. You can now sign in.' })
  } catch (error) {
    const msg = error.message || 'Registration failed'
    if (msg.includes('already registered') || msg.includes('already been registered')) {
      return res.status(400).json({ success: false, error: 'This email is already registered.' })
    }
    res.status(400).json({ success: false, error: msg })
  }
})

export default router
