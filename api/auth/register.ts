import { createClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { email, password, full_name, role, phone } = req.body

    if (!email || !password || !full_name || !role) {
        return res.status(400).json({ error: 'Missing required fields' })
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        return res.status(500).json({ error: 'Server configuration error' })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    })

    try {
        const nameParts = full_name.split(' ')
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                first_name: nameParts[0] || full_name,
                last_name: nameParts.slice(1).join(' ') || '',
                role: role
            }
        })

        if (error) {
            return res.status(400).json({ error: error.message })
        }

        if (phone && data.user) {
            await supabase.from('profiles').update({ phone }).eq('id', data.user.id)
        }

        return res.status(200).json({ success: true, user: data.user })
    } catch (err: any) {
        return res.status(500).json({ error: err.message || 'Failed to create account' })
    }
}
