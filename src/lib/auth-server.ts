import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Service-role client — for admin DB operations only
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// Re-export from dax-logic so auth-server is the single import for callers
export { NUTRI_PLANS, IDENTITY_PLANS } from '@/lib/dax-logic'
import { NUTRI_PLANS, IDENTITY_PLANS } from '@/lib/dax-logic'
// Backward-compat alias — same as NUTRI_PLANS
export const TOOL_PLANS = NUTRI_PLANS

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

// Una sola lectura de access (role, status, plan) para cada comprobación: antes se
// hacían dos consultas seguidas (isAdmin y luego el plan). Misma regla: admin pasa
// siempre; si no, el acceso debe estar activo y, si se indica, con un plan permitido.
async function loadAccessRow(userId: string): Promise<{ role: string | null; status: string | null; plan: string | null } | null> {
  const { data } = await supabaseAdmin
    .from('access')
    .select('role, status, plan')
    .eq('user_id', userId)
    .single()
  return data ?? null
}

async function checkAccess(userId: string, plans?: readonly string[]): Promise<boolean> {
  const row = await loadAccessRow(userId)
  if (row?.role === 'admin') return true
  if (row?.status !== 'active') return false
  return !plans || plans.includes(row.plan as string)
}

export async function hasAccess(userId: string): Promise<boolean> {
  return checkAccess(userId)
}

// Gate for Nutri Virtual — training_club, premium, or gym_virtual_core
export async function hasNutriAccess(userId: string): Promise<boolean> {
  return checkAccess(userId, NUTRI_PLANS)
}

// Gate for the calorie tracker — same plans as Nutri Virtual today (NUTRI_PLANS).
// Kept separate so the tracker can diverge later without touching every route.
export async function hasTrackerAccess(userId: string): Promise<boolean> {
  return hasNutriAccess(userId)
}

// Gate for Motor de Identidad — training_club or premium only (not gym_virtual_core)
export async function hasIdentityAccess(userId: string): Promise<boolean> {
  return checkAccess(userId, IDENTITY_PLANS)
}

// Backward-compat alias — same as hasNutriAccess
export async function hasToolAccess(userId: string): Promise<boolean> {
  return hasNutriAccess(userId)
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
