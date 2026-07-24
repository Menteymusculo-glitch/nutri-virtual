import { NextRequest, NextResponse } from 'next/server'
import { getServerUser, isAdmin, supabaseAdmin } from '@/lib/auth-server'

export async function PATCH(req: NextRequest) {
  const user = await getServerUser()
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const { userId, email, status } = await req.json()
  if (!userId || !['active', 'inactive'].includes(status)) {
    return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 })
  }

  const { data: existing } = await supabaseAdmin
    .from('access')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (existing) {
    await supabaseAdmin.from('access').update({ status }).eq('user_id', userId)
  } else {
    await supabaseAdmin.from('access').insert({
      user_id: userId,
      email: email ?? '',
      status,
      plan: 'manual',
      source: 'manual',
    })
  }

  return NextResponse.json({ ok: true })
}
