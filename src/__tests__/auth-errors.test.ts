import { describe, it, expect } from 'vitest'
import {
  passwordErrorMessage, loginErrorMessage, forgotErrorMessage, validateNewPassword,
  PASSWORD_MESSAGES, LOGIN_MESSAGES, FORGOT_MESSAGES,
} from '@/lib/authErrors'

describe('validateNewPassword', () => {
  it('acepta 8 caracteres o más que coinciden', () => {
    expect(validateNewPassword('abcdefgh', 'abcdefgh')).toBeNull()
  })
  it('rechaza menos de 8 caracteres antes de mirar la confirmación', () => {
    expect(validateNewPassword('abc', 'xyz')).toBe(PASSWORD_MESSAGES.tooShort)
    expect(validateNewPassword('', '')).toBe(PASSWORD_MESSAGES.tooShort)
  })
  it('rechaza si la confirmación no coincide', () => {
    expect(validateNewPassword('abcdefgh', 'abcdefgH')).toBe(PASSWORD_MESSAGES.mismatch)
  })
  it('no exige reglas de complejidad propias', () => {
    expect(validateNewPassword('aaaaaaaa', 'aaaaaaaa')).toBeNull()
  })
})

describe('passwordErrorMessage', () => {
  it('same_password', () => {
    expect(passwordErrorMessage({ code: 'same_password', status: 422 })).toBe(PASSWORD_MESSAGES.samePassword)
  })
  it('weak_password sin filtración', () => {
    expect(passwordErrorMessage({ code: 'weak_password', reasons: ['length', 'characters'] })).toBe(PASSWORD_MESSAGES.weak)
    expect(passwordErrorMessage({ code: 'weak_password' })).toBe(PASSWORD_MESSAGES.weak)
  })
  it('weak_password con pwned', () => {
    expect(passwordErrorMessage({ code: 'weak_password', reasons: ['characters', 'pwned'] })).toBe(PASSWORD_MESSAGES.pwned)
  })
  it.each(['session_not_found', 'session_expired', 'otp_expired', 'bad_jwt', 'flow_state_expired',
    'refresh_token_not_found', 'no_authorization', 'reauthentication_needed'])('%s → enlace caducado', (code) => {
    expect(passwordErrorMessage({ code })).toBe(PASSWORD_MESSAGES.linkExpired)
  })
  it('AuthSessionMissingError (sin código) → enlace caducado', () => {
    expect(passwordErrorMessage({ name: 'AuthSessionMissingError', status: 400 })).toBe(PASSWORD_MESSAGES.linkExpired)
  })
  it('over_request_rate_limit', () => {
    expect(passwordErrorMessage({ code: 'over_request_rate_limit', status: 429 })).toBe(PASSWORD_MESSAGES.rateLimit)
  })
  it('código desconocido → genérico con soporte', () => {
    expect(passwordErrorMessage({ code: 'algo_nuevo', status: 500 })).toBe(PASSWORD_MESSAGES.generic)
  })
  it('error sin código → genérico', () => {
    expect(passwordErrorMessage({ status: 500 })).toBe(PASSWORD_MESSAGES.generic)
  })
  it('fallo de red o sin error → genérico', () => {
    expect(passwordErrorMessage({ name: 'AuthRetryableFetchError', status: 0 })).toBe(PASSWORD_MESSAGES.generic)
    expect(passwordErrorMessage(null)).toBe(PASSWORD_MESSAGES.generic)
    expect(passwordErrorMessage(undefined)).toBe(PASSWORD_MESSAGES.generic)
  })
  it('el genérico menciona el correo de soporte', () => {
    expect(PASSWORD_MESSAGES.generic).toContain('soporte@menteymusculo.com')
  })
})

describe('loginErrorMessage', () => {
  it.each(['invalid_credentials', 'email_not_confirmed', 'user_not_found', 'user_banned'])(
    '%s → mismo mensaje, sin revelar si la cuenta existe', (code) => {
      expect(loginErrorMessage({ code })).toBe(LOGIN_MESSAGES.invalidCredentials)
    })
  it('límite de intentos', () => {
    expect(loginErrorMessage({ code: 'over_request_rate_limit' })).toBe(LOGIN_MESSAGES.rateLimit)
  })
  it('fallo de red', () => {
    expect(loginErrorMessage({ name: 'AuthRetryableFetchError', status: 0 })).toBe(LOGIN_MESSAGES.network)
  })
  it('código desconocido, sin código o null → genérico', () => {
    expect(loginErrorMessage({ code: 'unexpected_failure', status: 500 })).toBe(LOGIN_MESSAGES.generic)
    expect(loginErrorMessage({ status: 500 })).toBe(LOGIN_MESSAGES.generic)
    expect(loginErrorMessage(null)).toBe(LOGIN_MESSAGES.generic)
  })
})

describe('forgotErrorMessage', () => {
  it('correo mal escrito', () => {
    expect(forgotErrorMessage({ code: 'email_address_invalid' })).toBe(FORGOT_MESSAGES.invalidEmail)
    expect(forgotErrorMessage({ code: 'validation_failed' })).toBe(FORGOT_MESSAGES.invalidEmail)
  })
  it('límite de envíos', () => {
    expect(forgotErrorMessage({ code: 'over_email_send_rate_limit' })).toBe(FORGOT_MESSAGES.rateLimit)
    expect(forgotErrorMessage({ code: 'over_request_rate_limit' })).toBe(FORGOT_MESSAGES.rateLimit)
  })
  it('fallo de red', () => {
    expect(forgotErrorMessage({ name: 'AuthRetryableFetchError' })).toBe(FORGOT_MESSAGES.network)
  })
  it('user_not_found no se revela: genérico', () => {
    expect(forgotErrorMessage({ code: 'user_not_found' })).toBe(FORGOT_MESSAGES.generic)
  })
  it('código desconocido, sin código o null → genérico', () => {
    expect(forgotErrorMessage({ code: 'x' })).toBe(FORGOT_MESSAGES.generic)
    expect(forgotErrorMessage({})).toBe(FORGOT_MESSAGES.generic)
    expect(forgotErrorMessage(null)).toBe(FORGOT_MESSAGES.generic)
  })
})

describe('ningún mensaje dice si un correo existe', () => {
  const all = [...Object.values(PASSWORD_MESSAGES), ...Object.values(LOGIN_MESSAGES), ...Object.values(FORGOT_MESSAGES)]
  it.each(all)('%s', (msg) => {
    expect(msg).not.toMatch(/no existe|no está registrad|no encontr/i)
  })
})
