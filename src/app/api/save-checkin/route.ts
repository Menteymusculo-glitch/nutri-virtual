import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )
    const data = await req.json()
    const { error } = await supabase.from('checkins').insert([data])
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error guardando check-in'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
