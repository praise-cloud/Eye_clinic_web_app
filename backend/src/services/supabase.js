import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export const supabase = (() => {
  // Force reload environment variables from backend .env file
  const result = dotenv.config({ path: resolve(__dirname, '../.env'), override: true })
  if (result.error) {
    console.error('Error loading .env file in services:', result.error)
  }
  
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables in services:', { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey })
    throw new Error('Missing Supabase environment variables in services')
  }
  
  return createClient(supabaseUrl, supabaseKey)
})()

export default supabase