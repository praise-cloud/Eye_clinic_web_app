import express from 'express'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env') })

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

// Admin client — bypasses RLS, creates confirmed users
let supabaseAdmin = null

function getSupabaseAdmin() {
  if (supabaseAdmin) return supabaseAdmin
  
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('[auth] Missing environment variables:', { 
      hasUrl: !!supabaseUrl, 
      hasKey: !!supabaseKey 
    })
    throw new Error('Missing Supabase environment variables')
  }
  
  console.log('[auth] Creating Supabase admin client...')
  supabaseAdmin = createClient(
    supabaseUrl,
    supabaseKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  
  return supabaseAdmin
}

// POST /api/auth/register — creates a confirmed user (no email verification needed)
router.post('/register', async (req, res) => {
  try {
    console.log('[auth/register] Request body:', req.body)
    const { email, password, full_name, role, phone } = req.body

    if (!email || !password || !full_name || !role) {
      return res.status(400).json({ success: false, error: 'All fields are required' })
    }

    const normalizedRole = normalizeRole(role)

    if (!VALID_ROLES.includes(normalizedRole)) {
      return res.status(400).json({ success: false, error: 'Invalid role' })
    }

    console.log('[auth/register] Creating user with email:', email)
    // Step 1: Create user with admin API
    const { data, error } = await getSupabaseAdmin().auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: normalizedRole, phone: phone || null }
    })
    console.log('[auth/register] CreateUser result:', { hasData: !!data, hasError: !!error, errorMessage: error?.message })

    if (error) {
      console.error('[auth/register] Supabase error:', {
        message: error.message,
        status: error.status
      })
      throw new Error(`Auth user creation failed: ${error.message}`)
    }

    // Step 2: Create profile (don't rely on trigger)
    const { error: profileError } = await getSupabaseAdmin()
      .from('profiles')
      .upsert({
        id: data.user.id,
        full_name,
        role: normalizedRole,
        phone: phone || null,
        is_active: true,
        email: email  // Add email field
      }, { onConflict: 'id' })

    if (profileError) {
      console.error('[auth/register] Profile creation failed:', {
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
        code: profileError.code,
        user_id: data.user.id
      })
      // Rollback: delete the auth user since profile creation failed
      try {
        await getSupabaseAdmin().auth.admin.deleteUser(data.user.id)
      } catch (deleteError) {
        console.error('[auth/register] Failed to rollback user creation:', deleteError)
      }
      throw new Error(`Profile creation failed: ${profileError.message}`)
    }

    res.json({
      success: true,
      message: 'Account created. You can now sign in.',
      data: {
        id: data.user.id,
        email,
        full_name,
        role: normalizedRole,
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
