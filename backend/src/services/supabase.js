import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'your-service-key'

export const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase