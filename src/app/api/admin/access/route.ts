import { NextRequest, NextResponse } from 'next/server'
import { getServerUser, isAdmin, supabaseAdmin } from '@/lib/auth-server'

export async function PATCH(req: NextRequest) {
  const user = await getServerUser()
  if (!user || !await isAdmin(user.id)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const { userId, email, status, role, plan } = await req.json()
  if (!userId) {
    return NextResponse.json({ error: 'userId requerido.' }, { status: 400 })
  }

  // An admin cannot demote themselves — prevents accidental self-lockout
  if (role !== undefined && userId === user.id && role !== 'admin') {
    return NextResponse.json(
      { error: 'No puedes quitarte el rol de administrador a ti mismo.' },
      { status: 403 }
    )
  }

  if (status !== undefined && !['active', 'inactive', 'past_due', 'expired', 'revoked'].includes(status)) {
    return NextResponse.json({ error: 'Estado inválido.' }, { status: 400 })
  }
  if (role !== undefined && !['admin', 'member'].includes(role)) {
    return NextResponse.json({ error: 'Rol inválido.' }, { status: 400 })
  }

  const updates: Record<string, string> = {}
  if (status !== undefined) updates.status = status
  if (role !== undefined) updates.role = role

  const { data: existing } = await supabaseAdmin
    .from('access')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (existing) {
    await supabaseAdmin.from('access').update(updates).eq('user_id', userId)
  } else {
    await supabaseAdmin.from('access').insert({
      user_id: userId,
      email: email ?? '',
      status: status ?? 'active',
      role: role ?? 'member',
      plan: plan ?? 'manual',
      source: 'manual',
    })
  }

  return NextResponse.json({ ok: true })
}
