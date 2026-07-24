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
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

export function isAdmin(email: string | null | undefined) {
  return !!email && email === process.env.ADMIN_EMAIL
}

export async function hasAccess(userId: string, email: string) {
  if (isAdmin(email)) return true
  const { data } = await supabaseAdmin
    .from('access')
    .select('status')
    .eq('user_id', userId)
    .single()
  return data?.status === 'active'
}
