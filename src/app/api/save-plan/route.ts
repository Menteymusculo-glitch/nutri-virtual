import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )
    const { profile, plan } = await req.json()
    const { error } = await supabase.from('clients').insert([{
      name: profile.name,
      profile,
      plan,
    }])
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error guardando plan'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
