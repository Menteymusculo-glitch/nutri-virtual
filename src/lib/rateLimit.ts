// Limitador simple de intentos fallidos sobre la tabla rate_limits (sql/phase-rate-limits.sql).
import { createHash, timingSafeEqual } from 'node:crypto'
import { supabaseAdmin } from '@/lib/auth-server'

export const VERIFY_CODE_MAX_FAILURES = 5
export const VERIFY_CODE_WINDOW_MS = 15 * 60 * 1000

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')

// IP del cliente según las cabeceras de Vercel. Nunca se guarda en claro.
export function clientIp(headers: Headers): string {
  const fwd = headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim() || 'unknown'
  return headers.get('x-real-ip')?.trim() || 'unknown'
}

// Clave del limitador: hash de (sal + IP) y hash del email normalizado.
// RATE_LIMIT_SALT es opcional pero recomendable: impide revertir el hash de IPs.
export function rateLimitKey(ip: string, email: string | null | undefined, salt = process.env.RATE_LIMIT_SALT ?? ''): string {
  const e = (email ?? '').trim().toLowerCase()
  return `${sha256(`${salt}:ip:${ip}`)}:${sha256(`${salt}:email:${e}`)}`
}

// Comparación en tiempo constante (también si las longitudes difieren).
export function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest())
}

type DbError = { message: string } | null

export async function countRecentFailures(scope: string, key: string, windowMs: number, now = Date.now()): Promise<{ count: number; error: DbError }> {
  const since = new Date(now - windowMs).toISOString()
  const { count, error } = await supabaseAdmin
    .from('rate_limits')
    .select('id', { count: 'exact', head: true })
    .eq('scope', scope)
    .eq('key_hash', key)
    .gte('created_at', since)
  return { count: count ?? 0, error }
}

export async function recordFailure(scope: string, key: string, windowMs: number, now = Date.now()): Promise<DbError> {
  const { error } = await supabaseAdmin.from('rate_limits').insert({ scope, key_hash: key })
  if (error) return error
  // Limpieza de intentos fuera de la ventana para esta clave.
  const { error: cleanError } = await supabaseAdmin
    .from('rate_limits')
    .delete()
    .eq('scope', scope)
    .eq('key_hash', key)
    .lt('created_at', new Date(now - windowMs).toISOString())
  return cleanError
}

export async function clearFailures(scope: string, key: string): Promise<DbError> {
  const { error } = await supabaseAdmin.from('rate_limits').delete().eq('scope', scope).eq('key_hash', key)
  return error
}
