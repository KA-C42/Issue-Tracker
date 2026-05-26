import { createClient } from '@supabase/supabase-js'

if (!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
  alert('VITE_SUPABASE_PUBLISHABLE_KEY is required')
  throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY is required')
}
if (!import.meta.env.VITE_SUPABASE_URL) {
  alert('VITE_SUPABASE_URL is required')
  throw new Error('VITE_SUPABASE_URL is required')
}

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
)
