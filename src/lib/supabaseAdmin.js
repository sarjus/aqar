import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

// Admin client for server-side operations (user creation, deletion)
// ⚠️ WARNING: This uses the Service Role Key which has full database access
// Only use this for admin operations, never expose in client code
export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Check if admin client is available
export const hasAdminAccess = () => {
  if (!supabaseAdmin) {
    console.error('⚠️ Service Role Key not configured. Cannot create users.')
    console.log('To enable user creation:')
    console.log('1. Add VITE_SUPABASE_SERVICE_ROLE_KEY to your .env file')
    console.log('2. Restart the dev server')
    return false
  }
  return true
}

