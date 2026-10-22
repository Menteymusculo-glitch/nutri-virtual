import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { getServerUser, isAdmin } from '@/lib/auth-server'

// 401 solo cuando no hay sesión; 403 cuando hay sesión pero el rol no es admin.
export type AdminAuth = { ok: true; user: User } | { ok: false; response: NextResponse }

export async function requireAdmin(): Promise<AdminAuth> {
  const user = await getServerUser()
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: 'Inicia sesión.' }, { status: 401 }) }
  }
  if (!(await isAdmin(user.id))) {
    return { ok: false, response: NextResponse.json({ error: 'Solo administradores.' }, { status: 403 }) }
  }
  return { ok: true, user }
}
