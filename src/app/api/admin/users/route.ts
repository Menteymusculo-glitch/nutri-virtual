import { NextRequest, NextResponse } from 'next/server'
import { getServerUser, isAdmin, supabaseAdmin } from '@/lib/auth-server'

export async function GET() {
  const user = await getServerUser()
  if (!user || !await isAdmin(user.id)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  if (error) return NextResponse.json({ error: 'Error al obtener usuarios.' }, { status: 500 })

  const { data: accessRows } = await supabaseAdmin.from('access').select('user_id, status, plan, source, role, expires_at')
  const accessMap = new Map(accessRows?.map((r) => [r.user_id, r]) ?? [])

  const result = users
    .filter((u) => u.id !== user.id)
    .map((u) => {
      const access = accessMap.get(u.id)
      return {
        id: u.id,
        email: u.email ?? '',
        name: (u.user_metadata as Record<string, string>)?.name ?? '',
        accessStatus: access?.status ?? 'sin_acceso',
        role: access?.role ?? 'member',
        plan: access?.plan ?? '—',
        source: access?.source ?? '—',
        expiresAt: access?.expires_at ?? null,
        createdAt: u.created_at,
      }
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const user = await getServerUser()
  if (!user || !await isAdmin(user.id)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const { email, password, name, plan } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: 'Correo y contraseña son requeridos.' }, { status: 400 })
  }

  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    user_metadata: { name: name?.trim() ?? '' },
    email_confirm: true,
  })

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 400 })
  }

  const VALID_PLANS = ['training_club', 'premium', 'gym_virtual_core', 'legacy', 'plan_equipo', 'manual']
  const resolvedPlan = plan && VALID_PLANS.includes(plan) ? plan : 'training_club'

  await supabaseAdmin.from('access').insert({
    user_id: newUser.user.id,
    email: email.trim().toLowerCase(),
    status: 'active',
    plan: resolvedPlan,
    source: 'manual',
  })

  return NextResponse.json({ ok: true, userId: newUser.user.id })
}

export async function DELETE(req: NextRequest) {
  const user = await getServerUser()
  if (!user || !await isAdmin(user.id)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  }

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId requerido.' }, { status: 400 })

  await supabaseAdmin.from('access').delete().eq('user_id', userId)
  await supabaseAdmin.auth.admin.deleteUser(userId)

  return NextResponse.json({ ok: true })
}
