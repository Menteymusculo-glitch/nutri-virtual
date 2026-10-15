import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/auth-server'
import { computeEffectivePlan, determineAccessAction, PLAN_RANK } from '@/lib/dax-logic'

// DAX product slug → internal plan name (add new products here only)
const DAX_PLAN_MAP: Record<string, string> = {
  training_club:    'training_club',
  premium:          'premium',
  gym_virtual_core: 'gym_virtual_core',
}

async function findOrCreateUser(email: string): Promise<string> {
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  const existing = users.find((u) => u.email?.toLowerCase() === email)
  if (existing) return existing.id

  const redirectTo = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/nutrivirtual`
    : 'https://herramientas.menteymusculo.com/nutrivirtual'

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, { redirectTo })
  if (error || !data.user) throw new Error(`inviteUserByEmail failed: ${error?.message}`)
  return data.user.id
}

async function getActiveDaxPlans(userId: string): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from('dax_subscriptions')
    .select('plan')
    .eq('user_id', userId)
    .eq('status', 'active')
  return (data ?? []).map((r) => r.plan).filter((p) => p in PLAN_RANK)
}

async function applyEffectivePlan(userId: string, email: string): Promise<void> {
  const activePlans = await getActiveDaxPlans(userId)
  const effectivePlan = computeEffectivePlan(activePlans)

  const { data: existing } = await supabaseAdmin
    .from('access')
    .select('id, source')
    .eq('user_id', userId)
    .maybeSingle()

  const action = determineAccessAction(existing?.source, effectivePlan, !!existing)

  if (action === 'update' && effectivePlan) {
    await supabaseAdmin.from('access').update({
      status: 'active', plan: effectivePlan, source: 'dax',
      expires_at: null, warning_sent_at: null,
    }).eq('user_id', userId)
  } else if (action === 'insert' && effectivePlan) {
    await supabaseAdmin.from('access').insert({
      user_id: userId, email, role: 'member',
      status: 'active', plan: effectivePlan, source: 'dax',
      expires_at: null, warning_sent_at: null,
    })
  } else if (action === 'revoke') {
    await supabaseAdmin.from('access').update({ status: 'revoked' }).eq('user_id', userId)
  }
  // 'skip' → source != 'dax' (e.g. Stripe) — never touch that row
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-dax-webhook-secret')
  if (!secret || secret !== process.env.DAX_WEBHOOK_SECRET) {
    console.warn('[dax-webhook] Unauthorized — bad or missing secret')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // DAX may send custom fields at the root OR nested inside customData.
  // Root takes precedence; customData is the fallback.
  const cd = (body.customData && typeof body.customData === 'object')
    ? body.customData as Record<string, unknown>
    : {}

  const event_id = (body.event_id ?? cd.event_id) as string | undefined
  const type     = (body.type     ?? cd.type)     as string | undefined
  const email    = (body.email    ?? cd.email)     as string | undefined
  const product  = (body.product  ?? cd.product)   as string | undefined

  if (!event_id || !type || !email || !product) {
    console.error(
      '[dax-webhook] 400 — campos recibidos en root:',   Object.keys(body),
      '| en customData:', Object.keys(cd),
    )
    return NextResponse.json({ error: 'Missing required fields: event_id, type, email, product' }, { status: 400 })
  }

  const plan = DAX_PLAN_MAP[product]
  if (!plan) {
    return NextResponse.json({
      error: `Unknown product: ${product}. Expected: ${Object.keys(DAX_PLAN_MAP).join(', ')}`,
    }, { status: 400 })
  }

  // Idempotency — skip if already processed
  const { data: already } = await supabaseAdmin
    .from('dax_events_processed')
    .select('event_id')
    .eq('event_id', event_id)
    .maybeSingle()
  if (already) return NextResponse.json({ ok: true, skipped: true })

  const normalizedEmail = email.toLowerCase().trim()

  try {
    if (type === 'subscription_created') {
      const userId = await findOrCreateUser(normalizedEmail)

      // Upsert in dax_subscriptions — email is already lowercased, so (email,plan)
      // uniqueness is guaranteed even when user_id is NULL (ON DELETE SET NULL).
      await supabaseAdmin.from('dax_subscriptions').upsert(
        { user_id: userId, email: normalizedEmail, plan, status: 'active', updated_at: new Date().toISOString() },
        { onConflict: 'email,plan' }
      )

      await applyEffectivePlan(userId, normalizedEmail)
      console.log(`[dax-webhook] subscription_created → ${normalizedEmail} plan=${plan}`)

    } else if (type === 'subscription_cancelled') {
      // Mark this specific product as revoked in dax_subscriptions
      await supabaseAdmin
        .from('dax_subscriptions')
        .update({ status: 'revoked', updated_at: new Date().toISOString() })
        .eq('email', normalizedEmail)
        .eq('plan', plan)

      // Re-compute effective plan from remaining active products
      // Need userId to query dax_subscriptions by user_id
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
      const user = users.find((u) => u.email?.toLowerCase() === normalizedEmail)
      if (user) {
        await applyEffectivePlan(user.id, normalizedEmail)
      }

      console.log(`[dax-webhook] subscription_cancelled → ${normalizedEmail} plan=${plan}`)

    } else {
      console.warn(`[dax-webhook] Unknown event type: ${type} — skipping`)
    }

    await supabaseAdmin.from('dax_events_processed').insert({ event_id })
    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('[dax-webhook] Processing error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
