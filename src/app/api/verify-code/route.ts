import { NextRequest, NextResponse } from 'next/server'
import { readJsonLimited } from '@/lib/requestBody'
import {
  VERIFY_CODE_MAX_FAILURES, VERIFY_CODE_WINDOW_MS,
  clearFailures, clientIp, countRecentFailures, rateLimitKey, recordFailure, safeEqual,
} from '@/lib/rateLimit'

const SCOPE = 'verify_code'

// Verifica el código de acceso. Máximo 5 intentos fallidos cada 15 minutos por IP+email.
// Si el limitador no responde (p. ej. falta la tabla), falla cerrado con 503.
export async function POST(req: NextRequest) {
  const body = await readJsonLimited(req, 2048)
  if (!body.ok) return NextResponse.json({ error: body.error }, { status: body.status })
  const { code, email } = (body.value ?? {}) as { code?: unknown; email?: unknown }

  const valid = process.env.ACCESS_CODE
  if (!valid) {
    console.error('[verify-code] ACCESS_CODE no configurado')
    return NextResponse.json({ error: 'Código incorrecto' }, { status: 401 })
  }

  const key = rateLimitKey(clientIp(req.headers), typeof email === 'string' ? email : null)
  const { count, error: countError } = await countRecentFailures(SCOPE, key, VERIFY_CODE_WINDOW_MS)
  if (countError) {
    console.error('[verify-code] rate limit', countError.message)
    return NextResponse.json({ error: 'Servicio no disponible. Inténtalo en unos minutos.' }, { status: 503 })
  }
  if (count >= VERIFY_CODE_MAX_FAILURES) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera 15 minutos antes de volver a intentarlo.' },
      { status: 429, headers: { 'Retry-After': String(VERIFY_CODE_WINDOW_MS / 1000) } },
    )
  }

  const submitted = typeof code === 'string' ? code.trim().toUpperCase() : ''
  if (!submitted || !safeEqual(submitted, valid.trim().toUpperCase())) {
    const recordError = await recordFailure(SCOPE, key, VERIFY_CODE_WINDOW_MS)
    if (recordError) console.error('[verify-code] record failure', recordError.message)
    return NextResponse.json({ error: 'Código incorrecto' }, { status: 401 })
  }

  const clearError = await clearFailures(SCOPE, key)
  if (clearError) console.error('[verify-code] clear', clearError.message)
  return NextResponse.json({ ok: true })
}
