import '../../setup-env.ts'
import { createClient } from '@supabase/supabase-js'

if (!process.env.SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('SUPABASE_PUBLISHABLE_KEY is required')
}
if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL is required')
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY,
)
