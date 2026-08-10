import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/auth-server'

// DAX product slug → internal plan name
const DAX_PLAN_MAP: Record<string, string> = {
  training_club: 'training_club',
  premium:       'premium',
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

export async function POST(req: NextRequest) {
  // Verify shared secret
  const secret = req.headers.get('x-dax-webhook-secret')
  if (!secret || secret !== process.env.DAX_WEBHOOK_SECRET) {
    console.warn('[dax-webhook] Unauthorized — bad or missing secret')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { event_id?: string; type?: string; email?: string; product?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { event_id, type, email, product } = body

  if (!event_id || !type || !email || !product) {
    return NextResponse.json({ error: 'Missing required fields: event_id, type, email, product' }, { status: 400 })
  }

  const plan = DAX_PLAN_MAP[product]
  if (!plan) {
    return NextResponse.json({ error: `Unknown product: ${product}. Expected: ${Object.keys(DAX_PLAN_MAP).join(', ')}` }, { status: 400 })
  }

  // Idempotency
  const { data: already } = await supabaseAdmin
    .from('dax_events_processed')
    .select('event_id')
    .eq('event_id', event_id)
    .maybeSingle()

  if (already) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const normalizedEmail = email.toLowerCase().trim()

  try {
    if (type === 'subscription_created') {
      const userId = await findOrCreateUser(normalizedEmail)

      const { data: existing } = await supabaseAdmin
        .from('access')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      const payload = {
        status: 'active',
        plan,
        source: 'dax',
        expires_at: null,       // DAX manages continuity, no fixed expiry
        warning_sent_at: null,
      }

      if (existing) {
        await supabaseAdmin.from('access').update(payload).eq('user_id', userId)
      } else {
        await supabaseAdmin.from('access').insert({
          user_id: userId,
          email: normalizedEmail,
          role: 'member',
          ...payload,
        })
      }

      console.log(`[dax-webhook] subscription_created → ${normalizedEmail} plan=${plan}`)

    } else if (type === 'subscription_cancelled') {
      // Only revoke if the row belongs to this plan + source = dax
      // Prevents touching a Stripe-managed access of a different product
      await supabaseAdmin
        .from('access')
        .update({ status: 'revoked' })
        .eq('email', normalizedEmail)
        .eq('plan', plan)
        .eq('source', 'dax')

      console.log(`[dax-webhook] subscription_cancelled → ${normalizedEmail} plan=${plan} → revoked`)

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
