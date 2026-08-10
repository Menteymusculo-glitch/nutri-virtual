import { NextRequest, NextResponse } from 'next/server'
import { getServerUser, hasToolAccess, logUsage, supabaseAdmin } from '@/lib/auth-server'

// GET — fetch latest diagnostic for the current user
export async function GET() {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const access = await hasToolAccess(user.id)
  if (!access) return NextResponse.json({ error: 'Sin acceso a esta herramienta' }, { status: 403 })

  const { data } = await supabaseAdmin
    .from('identity_diagnostics')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({ ok: true, diagnostic: data ?? null, email: user.email })
}

// POST — save a completed diagnostic
export async function POST(req: NextRequest) {
  const user = await getServerUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const access = await hasToolAccess(user.id)
  if (!access) return NextResponse.json({ error: 'Sin acceso a esta herramienta' }, { status: 403 })

  const body = await req.json()
  const { profile, nowV, wantV, desires, horizons, result } = body

  await supabaseAdmin.from('identity_diagnostics').insert({
    user_id: user.id,
    email: user.email ?? '',
    profile,
    now_values: nowV,
    want_values: wantV,
    desires,
    horizons,
    result,
  })

  // Log usage + notify Ray
  const { data: accessRow } = await supabaseAdmin.from('access').select('plan').eq('user_id', user.id).single()
  logUsage({ userId: user.id, email: user.email ?? '', tool: 'motor_identidad', plan: accessRow?.plan ?? 'unknown' }).catch(() => {})

  return NextResponse.json({ ok: true })
}
