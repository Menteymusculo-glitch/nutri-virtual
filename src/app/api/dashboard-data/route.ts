import { NextResponse } from 'next/server'
import { getServerUser, isAdmin, supabaseAdmin } from '@/lib/auth-server'

// Panel del coach: devuelve TODOS los clients y checkins (datos de salud).
// Solo administradores: 401 sin sesión, 403 si la sesión no es admin.
export async function GET() {
  const user = await getServerUser()
  if (!user) {
    return NextResponse.json({ error: 'Inicia sesión para ver el panel.' }, { status: 401 })
  }
  if (!(await isAdmin(user.id))) {
    return NextResponse.json({ error: 'Este panel es solo para administradores.' }, { status: 403 })
  }

  try {
    const [{ data: clients, error: e1 }, { data: checkins, error: e2 }] = await Promise.all([
      supabaseAdmin.from('clients').select('id, name, profile, created_at').order('created_at', { ascending: false }),
      supabaseAdmin.from('checkins').select('*').order('created_at', { ascending: false }),
    ])

    if (e1) throw e1
    if (e2) throw e2

    return NextResponse.json({ clients: clients ?? [], checkins: checkins ?? [] })
  } catch (err) {
    console.error('[dashboard-data]', err)
    return NextResponse.json({ error: 'Error cargando datos' }, { status: 500 })
  }
}
