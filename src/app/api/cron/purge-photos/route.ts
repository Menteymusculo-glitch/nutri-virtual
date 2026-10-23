import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/auth-server'
import { removePhotos } from '@/lib/mealPhotos'
import { PHOTO_RETENTION_DAYS } from '@/lib/nutritionConstants'

export const maxDuration = 60

const BATCH = 500
const MAX_BATCHES = 20

// Cron diario: borra del Storage las fotos con más de 30 días (también las que se
// analizaron y nunca se guardaron) y pone photo_path a NULL en sus comidas.
// Solo registra recuentos, nunca rutas ni datos de la usuaria.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cutoff = new Date(Date.now() - PHOTO_RETENTION_DAYS * 86_400_000).toISOString()
  let deleted = 0
  for (let batch = 0; batch < MAX_BATCHES; batch++) {
    const { data, error } = await supabaseAdmin.rpc('old_meal_photos', { cutoff, max_rows: BATCH })
    if (error) {
      console.error('[cron/purge-photos] listado:', error.message)
      return NextResponse.json({ error: 'DB error', deleted }, { status: 500 })
    }
    const paths = ((data ?? []) as { name: string }[]).map((r) => r.name)
    if (paths.length === 0) break
    const removeError = await removePhotos(paths)
    if (removeError) {
      console.error('[cron/purge-photos] storage:', removeError.message)
      return NextResponse.json({ error: 'Storage error', deleted }, { status: 500 })
    }
    const { error: updateError } = await supabaseAdmin.from('meal_logs').update({ photo_path: null }).in('photo_path', paths)
    if (updateError) {
      console.error('[cron/purge-photos] meal_logs:', updateError.message)
      return NextResponse.json({ error: 'DB error', deleted }, { status: 500 })
    }
    deleted += paths.length
    if (paths.length < BATCH) break
  }

  // Comidas antiguas que aún apuntan a una foto que ya no existe.
  const { count: cleared, error: clearError } = await supabaseAdmin
    .from('meal_logs')
    .update({ photo_path: null }, { count: 'exact' })
    .not('photo_path', 'is', null)
    .lt('created_at', cutoff)
  if (clearError) {
    console.error('[cron/purge-photos] referencias:', clearError.message)
    return NextResponse.json({ error: 'DB error', deleted }, { status: 500 })
  }

  console.log(`[cron/purge-photos] fotos borradas=${deleted} referencias limpiadas=${cleared ?? 0}`)
  return NextResponse.json({ ok: true, deleted, cleared: cleared ?? 0 })
}
