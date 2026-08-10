import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Service-role client — for admin DB operations only
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// Plans that unlock the nutrition tools (Nutri Virtual + Motor de Identidad)
export const TOOL_PLANS = ['training_club', 'premium'] as const

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

// Gate for Nutri Virtual + Motor de Identidad — requires training_club or premium
export async function hasToolAccess(userId: string): Promise<boolean> {
  if (await isAdmin(userId)) return true
  const { data } = await supabaseAdmin
    .from('access')
    .select('status, plan')
    .eq('user_id', userId)
    .single()
  return data?.status === 'active' && TOOL_PLANS.includes(data?.plan as typeof TOOL_PLANS[number])
}

// Log a tool usage event — writes to usage_log + stub console notification
export async function logUsage(params: {
  userId: string
  email: string
  tool: 'nutri_virtual' | 'motor_identidad'
  plan: string
}) {
  const { userId, email, tool, plan } = params
  try {
    await supabaseAdmin.from('usage_log').insert({ user_id: userId, email, tool, plan })
  } catch (err) {
    console.warn('[logUsage] DB insert failed:', err)
  }
  // TODO: send real email to Ray when email provider is decided (Resend/SendGrid)
  console.log(`[stub] notifyRay → ${email} (${plan}) usó ${tool} — ${new Date().toISOString()}`)
}
