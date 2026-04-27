import express from 'express'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../../.env') })

const router = express.Router()

const VALID_ROLES = ['doctor', 'frontdesk', 'admin', 'manager']
const LEGACY_ROLE_MAP = {
  assistant: 'frontdesk',
  accountant: 'admin',
}

function normalizeRole(role) {
  if (!role) return 'frontdesk'

  const normalizedRole = LEGACY_ROLE_MAP[role] || role
  return VALID_ROLES.includes(normalizedRole) ? normalizedRole : 'frontdesk'
}

async function syncProfile(userId, { full_name, role, phone }) {
  const profilePayloads = [
    { id: userId, full_name, role, phone: phone || null, is_active: true },
    { id: userId, full_name, role, is_active: true },
    { id: userId, full_name, role, phone: phone || null },
    { id: userId, full_name, role },
  ]

  let lastError = null

  for (const payload of profilePayloads) {
    const { error } = await supabaseAdmin.from('profiles').upsert(payload)
    if (!error) return
    lastError = error
  }

  throw lastError || new Error('Failed to sync profile record')
}

// Admin client — bypasses RLS, creates confirmed users
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// POST /api/auth/register — creates a confirmed user (no email verification needed)
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, role, phone } = req.body

    if (!email || !password || !full_name || !role) {
      return res.status(400).json({ success: false, error: 'All fields are required' })
    }

    const normalizedRole = normalizeRole(role)
    const mappedRole = normalizedRole

    if (!VALID_ROLES.includes(mappedRole)) {
      return res.status(400).json({ success: false, error: 'Invalid role' })
    }

    // Create user with email_confirm: true — skips email confirmation entirely
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: mappedRole, phone: phone || null }
    })

    if (error) {
      throw new Error(`Auth user creation failed: ${error.message}`)
    }

    try {
      await syncProfile(data.user.id, {
        full_name,
        role: mappedRole,
        phone,
      })
    } catch (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(data.user.id)
      throw new Error(`Profile sync failed: ${profileError.message}`)
    }

    res.json({
      success: true,
      message: 'Account created. You can now sign in.',
      data: {
        id: data.user.id,
        email,
        full_name,
        role: mappedRole,
      },
    })
  } catch (error) {
    console.error('[auth/register] failed:', error)
    const msg = error.message || 'Registration failed'
    if (msg.includes('already registered') || msg.includes('already been registered')) {
      return res.status(400).json({ success: false, error: 'This email is already registered.' })
    }
    res.status(400).json({ success: false, error: msg })
  }
})

export default router
