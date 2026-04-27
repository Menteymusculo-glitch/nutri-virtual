import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )

    const [{ data: clients, error: e1 }, { data: checkins, error: e2 }] = await Promise.all([
      supabase.from('clients').select('id, name, profile, created_at').order('created_at', { ascending: false }),
      supabase.from('checkins').select('*').order('created_at', { ascending: false }),
    ])

    if (e1) throw e1
    if (e2) throw e2

    return NextResponse.json({ clients: clients ?? [], checkins: checkins ?? [] })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error cargando datos'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
