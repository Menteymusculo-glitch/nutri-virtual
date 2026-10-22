import { describe, it, expect } from 'vitest'
import { appUrl, recoveryRedirect, parseRecoveryLink, parseEmailLink, INVITE_PATH, DEFAULT_APP_URL } from '@/lib/authRedirect'

describe('appUrl', () => {
  it('usa NEXT_PUBLIC_APP_URL sin barra final', () => {
    expect(appUrl('/login', 'https://preview.example.com/')).toBe('https://preview.example.com/login')
    expect(appUrl('nutrivirtual', 'https://x.com')).toBe('https://x.com/nutrivirtual')
  })
  it('sin variable, el dominio público (nunca nutri-virtual.vercel.app)', () => {
    expect(appUrl('/login', undefined)).toBe(`${DEFAULT_APP_URL}/login`)
    expect(appUrl('/login', '  ')).toBe(`${DEFAULT_APP_URL}/login`)
    expect(appUrl('/login', undefined)).not.toContain('vercel.app')
  })
})

describe('recoveryRedirect', () => {
  it('vuelve al mismo origen desde el que se pidió', () => {
    expect(recoveryRedirect('https://herramientas.menteymusculo.com')).toBe('https://herramientas.menteymusculo.com/reset-password')
    expect(recoveryRedirect('http://localhost:3000/')).toBe('http://localhost:3000/reset-password')
  })
})

describe('parseRecoveryLink', () => {
  const HASH = 'pkce_0123456789abcdef0123456789abcdef0123456789abcdef01234567'
  it('token_hash de recuperación', () => {
    expect(parseRecoveryLink(`?token_hash=${HASH}&type=recovery`)).toEqual({ kind: 'token_hash', tokenHash: HASH })
  })
  it('rechaza token_hash de otro tipo o con formato raro', () => {
    expect(parseRecoveryLink(`?token_hash=${HASH}&type=signup`)).toEqual({ kind: 'error', code: 'wrong_type' })
    expect(parseRecoveryLink(`?token_hash=${HASH}`)).toEqual({ kind: 'error', code: 'wrong_type' })
    expect(parseRecoveryLink('?token_hash=<script>&type=recovery')).toEqual({ kind: 'error', code: 'malformed' })
  })
  it('code de PKCE (enlace antiguo)', () => {
    expect(parseRecoveryLink('?code=abc')).toEqual({ kind: 'code' })
  })
  it('errores de Supabase en la query o en el hash', () => {
    expect(parseRecoveryLink('', '#error=access_denied&error_code=otp_expired')).toEqual({ kind: 'error', code: 'otp_expired' })
    expect(parseRecoveryLink('?error=access_denied')).toEqual({ kind: 'error', code: 'access_denied' })
  })
  it('sin parámetros', () => {
    expect(parseRecoveryLink('', '')).toEqual({ kind: 'none' })
  })
})

describe('parseEmailLink — invitación', () => {
  const HASH = '0123456789abcdef0123456789abcdef0123456789abcdef01234567'
  it('acepta solo type=invite en la página de invitación', () => {
    expect(parseEmailLink('invite', `?token_hash=${HASH}&type=invite`)).toEqual({ kind: 'token_hash', tokenHash: HASH })
    expect(parseEmailLink('invite', `?token_hash=${HASH}&type=recovery`)).toEqual({ kind: 'error', code: 'wrong_type' })
    expect(parseEmailLink('invite', `?token_hash=${HASH}&type=magiclink`)).toEqual({ kind: 'error', code: 'wrong_type' })
  })
  it('y la de recuperación no acepta invitaciones', () => {
    expect(parseRecoveryLink(`?token_hash=${HASH}&type=invite`)).toEqual({ kind: 'error', code: 'wrong_type' })
  })
  it('un enlace antiguo con el token en el hash se trata como inválido', () => {
    expect(parseEmailLink('invite', '', '#access_token=abc&type=invite')).toEqual({ kind: 'none' })
  })
  it('INVITE_PATH es /bienvenida', () => {
    expect(INVITE_PATH).toBe('/bienvenida')
  })
})
