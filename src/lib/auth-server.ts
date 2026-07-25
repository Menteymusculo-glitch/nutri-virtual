import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Service-role client — for admin DB operations only
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// Read current session user from cookies — use in API route handlers
export async function getServerUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Check if a user has the admin role in the access table
export async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from('access')
    .select('role')
    .eq('user_id', userId)
    .single()
  return data?.role === 'admin'
}

export async function hasAccess(userId: string): Promise<boolean> {
  if (await isAdmin(userId)) return true
  const { data } = await supabaseAdmin
    .from('access')
    .select('status')
    .eq('user_id', userId)
    .single()
  return data?.status === 'active'
}
