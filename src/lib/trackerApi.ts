// Helpers compartidos por las rutas /api/tracker, /api/meals y /api/foods.
import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { getServerUser, hasTrackerAccess, supabaseAdmin } from '@/lib/auth-server'
import { isPlausibleToday } from '@/lib/calorieReport'

export type TrackerAuth = { ok: true; user: User } | { ok: false; response: NextResponse }

const unauthorized = () => NextResponse.json({ error: 'Inicia sesión para continuar.' }, { status: 401 })
const forbidden = () => NextResponse.json({ error: 'Tu plan no incluye el registro diario.' }, { status: 403 })

export async function requireTrackerUser(): Promise<TrackerAuth> {
  const user = await getServerUser()
  if (!user) return { ok: false, response: unauthorized() }
  if (!(await hasTrackerAccess(user.id))) return { ok: false, response: forbidden() }
  return { ok: true, user }
}

export type TrackerAuthWith<T> = { ok: true; user: User; data: T } | { ok: false; response: NextResponse }

// Igual que requireTrackerUser, pero con la sesión ya verificada lanza `read` en
// paralelo con la comprobación del plan para ahorrar un viaje a la base de datos.
// Si el plan no da acceso, el resultado de `read` se descarta y se responde 403.
// `read` debe ser SOLO LECTURA: nada que escriba puede ir aquí.
export async function requireTrackerUserWith<T>(read: (userId: string) => Promise<T>): Promise<TrackerAuthWith<T>> {
  const user = await getServerUser()
  if (!user) return { ok: false, response: unauthorized() }
  const [allowed, data] = await Promise.all([hasTrackerAccess(user.id), read(user.id)])
  if (!allowed) return { ok: false, response: forbidden() }
  return { ok: true, user, data }
}

export function serverError(tag: string, err: { message?: string } | null | undefined) {
  console.error(`[${tag}]`, err?.message ?? err)
  return NextResponse.json({ error: 'Error interno. Inténtalo de nuevo en un momento.' }, { status: 500 })
}

// Fecha de hoy en UTC (fallback si el cliente no envía su fecha local).
export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

export interface TargetRow {
  user_id: string
  goal: 'deficit' | 'maintenance' | 'surplus'
  target_kcal: number
  tdee_kcal: number
  sex: 'female' | 'male' | null
  hide_calories: boolean
  updated_at: string | null
}

export async function loadTarget(userId: string): Promise<{ data: TargetRow | null; error: { message: string } | null }> {
  const { data, error } = await supabaseAdmin
    .from('nutrition_targets')
    .select('user_id, goal, target_kcal, tdee_kcal, sex, hide_calories, updated_at')
    .eq('user_id', userId)
    .maybeSingle()
  return { data: (data as TargetRow | null) ?? null, error }
}

// Fecha local de la usuaria (?today=AAAA-MM-DD). Si falta o no es plausible
// (más de un día de diferencia con la fecha UTC), se usa la fecha UTC.
export function resolveToday(param: string | null): string {
  return param && isPlausibleToday(param) ? param : todayUtc()
}

// Fechas (de la lista) que la usuaria cerró explícitamente.
export async function loadClosedDates(userId: string, dates: string[]): Promise<{ data: string[]; error: { message: string } | null }> {
  if (dates.length === 0) return { data: [], error: null }
  const { data, error } = await supabaseAdmin
    .from('day_closures')
    .select('log_date')
    .eq('user_id', userId)
    .in('log_date', dates)
  return { data: (data ?? []).map((r) => String(r.log_date)), error }
}
