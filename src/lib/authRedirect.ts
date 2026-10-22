// URLs de redirección de Supabase Auth y lectura del enlace de recuperación (puro, sin red).

// Dominio público de la app. Se usa en el servidor (webhooks), donde no hay window.location.
export const DEFAULT_APP_URL = 'https://herramientas.menteymusculo.com'

export function appUrl(path: string, envUrl = process.env.NEXT_PUBLIC_APP_URL): string {
  const base = (envUrl?.trim() || DEFAULT_APP_URL).replace(/\/+$/, '')
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

// En el navegador: el enlace de recuperación vuelve al mismo origen desde el que se pidió
// (herramientas.menteymusculo.com, una preview de Vercel, localhost…).
export function recoveryRedirect(origin: string): string {
  return `${origin.replace(/\/+$/, '')}/reset-password`
}

// Página que recibe el enlace de invitación (Stripe y DAX, inviteUserByEmail).
export const INVITE_PATH = '/bienvenida'

export type EmailLinkType = 'recovery' | 'invite'

export type EmailLink =
  | { kind: 'token_hash'; tokenHash: string }  // plantilla de correo con {{ .TokenHash }}: funciona en cualquier navegador
  | { kind: 'code' }                           // PKCE: solo funciona en el navegador que pidió el enlace
  | { kind: 'error'; code: string }            // Supabase devolvió un error (p. ej. otp_expired)
  | { kind: 'none' }
export type RecoveryLink = EmailLink

// Lee ?token_hash=…&type=…, ?code=… o un error (en la query o en el hash).
// Solo acepta el tipo esperado: un token de otro tipo no debe abrir esa página.
export function parseEmailLink(expected: EmailLinkType, search: string, hash = ''): EmailLink {
  const q = new URLSearchParams(search.replace(/^\?/, ''))
  const h = new URLSearchParams(hash.replace(/^#/, ''))
  const error = q.get('error_code') ?? h.get('error_code') ?? q.get('error') ?? h.get('error')
  if (error) return { kind: 'error', code: error }

  const tokenHash = q.get('token_hash')
  if (tokenHash) {
    if (q.get('type') !== expected) return { kind: 'error', code: 'wrong_type' }
    if (!/^[A-Za-z0-9_-]{10,200}$/.test(tokenHash)) return { kind: 'error', code: 'malformed' }
    return { kind: 'token_hash', tokenHash }
  }
  if (q.get('code')) return { kind: 'code' }
  return { kind: 'none' }
}

export function parseRecoveryLink(search: string, hash = ''): EmailLink {
  return parseEmailLink('recovery', search, hash)
}
