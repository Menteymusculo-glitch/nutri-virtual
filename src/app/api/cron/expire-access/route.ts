import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/auth-server'

// TODO: replace with real email provider (Resend / SendGrid) when decided
async function sendExpirationWarning(user: { email: string; plan: string; expiresAt: Date }) {
  console.log(`[stub] Expiration warning pending for ${user.email} (plan=${user.plan}, expires=${user.expiresAt.toISOString()})`)
}

export async function GET(req: NextRequest) {
  // Vercel Cron automatically sends Authorization: Bearer CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const warningCutoff = new Date(now.getTime() + 7 * 86_400_000).toISOString()

  const { data: rows, error } = await supabaseAdmin
    .from('access')
    .select('user_id, email, plan, expires_at, warning_sent_at')
    .eq('status', 'active')
    .not('expires_at', 'is', null)

  if (error) {
    console.error('[cron/expire-access] DB error:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  let expired = 0
  let warned = 0

  for (const row of (rows ?? [])) {
    const expiresAt = new Date(row.expires_at)

    if (expiresAt <= now) {
      await supabaseAdmin.from('access').update({ status: 'expired' }).eq('user_id', row.user_id)
      console.log(`[cron/expire-access] expired: ${row.email}`)
      expired++
    } else if (row.expires_at <= warningCutoff && !row.warning_sent_at) {
      await sendExpirationWarning({ email: row.email, plan: row.plan, expiresAt })
      await supabaseAdmin
        .from('access')
        .update({ warning_sent_at: now.toISOString() })
        .eq('user_id', row.user_id)
      warned++
    }
  }

  console.log(`[cron/expire-access] done — expired=${expired} warned=${warned}`)
  return NextResponse.json({ ok: true, expired, warned, processed: (rows ?? []).length })
}
