import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/auth-server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const PRICE_PLAN_MAP: Record<string, { plan: string; durationDays: number | null; recurring: boolean }> = {
  'price_1TxcaVBb2DLBnuHzDvSeJPlX': { plan: 'gym_virtual_core', durationDays: 90,  recurring: false },
  'price_1TxcbEBb2DLBnuHzRVw9O9tJ': { plan: 'training_club',    durationDays: null, recurring: true  },
  'price_1TxcyrBb2DLBnuHzycjGB5TR': { plan: 'legacy',           durationDays: 180, recurring: false },
  'price_1Txd6tBb2DLBnuHzPXCHdHEh': { plan: 'plan_equipo',      durationDays: 180, recurring: false },
  'price_1TxcdtBb2DLBnuHzw90Kg2Vp': { plan: 'premium',         durationDays: 180, recurring: false },
}

async function findOrCreateUser(email: string): Promise<string> {
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
  const existing = users.find((u) => u.email?.toLowerCase() === email)
  if (existing) return existing.id

  // User doesn't exist yet — invite them (creates auth account + sends magic link)
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: 'https://nutri-virtual.vercel.app/login',
  })
  if (error || !data.user) throw new Error(`inviteUserByEmail failed: ${error?.message}`)
  return data.user.id
}

async function upsertAccess(params: {
  userId: string
  email: string
  plan: string
  stripeCustomerId: string
  stripePriceId: string
  durationDays: number | null
}) {
  const { userId, email, plan, stripeCustomerId, stripePriceId, durationDays } = params
  const now = new Date()
  const expiresAt = durationDays
    ? new Date(now.getTime() + durationDays * 86_400_000).toISOString()
    : null

  const { data: existing } = await supabaseAdmin
    .from('access')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  const payload = {
    status: 'active',
    plan,
    source: 'stripe',
    stripe_customer_id: stripeCustomerId,
    stripe_price_id: stripePriceId,
    expires_at: expiresAt,
    warning_sent_at: null,
  }

  if (existing) {
    await supabaseAdmin.from('access').update(payload).eq('user_id', userId)
  } else {
    await supabaseAdmin.from('access').insert({ user_id: userId, email, role: 'member', ...payload })
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[stripe-webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Idempotency — Stripe can retry the same event
  const { data: already } = await supabaseAdmin
    .from('stripe_events_processed')
    .select('event_id')
    .eq('event_id', event.id)
    .maybeSingle()

  if (already) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const email = (session.customer_details?.email ?? session.customer_email ?? '').toLowerCase()
        if (!email) { console.warn('[stripe-webhook] No email in session', session.id); break }

        const customerId = session.customer as string
        let priceId: string | undefined

        try {
          if (session.mode === 'payment') {
            const full = await stripe.checkout.sessions.retrieve(session.id, {
              expand: ['line_items'],
            })
            priceId = full.line_items?.data[0]?.price?.id
          } else if (session.mode === 'subscription') {
            const sub = await stripe.subscriptions.retrieve(session.subscription as string)
            priceId = sub.items.data[0]?.price?.id
          }
        } catch (stripeErr: unknown) {
          // Session/subscription not found — usually a test event sent against a live key (or vice versa)
          const msg = stripeErr instanceof Error ? stripeErr.message : String(stripeErr)
          console.warn(`[stripe-webhook] Could not retrieve Stripe object: ${msg} — skipping`)
          break
        }

        if (!priceId || !PRICE_PLAN_MAP[priceId]) {
          console.warn(`[stripe-webhook] Unknown price_id: ${priceId} — skipping`)
          break
        }

        const { plan, durationDays } = PRICE_PLAN_MAP[priceId]
        const userId = await findOrCreateUser(email)
        await upsertAccess({ userId, email, plan, stripeCustomerId: customerId, stripePriceId: priceId, durationDays })
        console.log(`[stripe-webhook] checkout.session.completed → ${email} plan=${plan}`)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        await supabaseAdmin.from('access').update({ status: 'active' }).eq('stripe_customer_id', customerId)
        console.log(`[stripe-webhook] invoice.payment_succeeded → customer=${customerId}`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        await supabaseAdmin.from('access').update({ status: 'past_due' }).eq('stripe_customer_id', customerId)
        console.log(`[stripe-webhook] invoice.payment_failed → customer=${customerId} → past_due`)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        await supabaseAdmin.from('access').update({ status: 'revoked' }).eq('stripe_customer_id', customerId)
        console.log(`[stripe-webhook] subscription.deleted → customer=${customerId} → revoked`)
        break
      }

      default:
        // Unhandled event type — acknowledge without processing
        break
    }

    await supabaseAdmin.from('stripe_events_processed').insert({ event_id: event.id })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[stripe-webhook] Processing error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
