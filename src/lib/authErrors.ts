// Traduce los errores de Supabase Auth a mensajes claros en español (puro, sin red).
// Se decide por error.code (y error.name cuando auth-js no pone código); nunca se
// muestra error.message, que viene en inglés y puede cambiar entre versiones.

export type AuthErrorLike = {
  code?: string
  name?: string
  status?: number
  reasons?: readonly string[]
} | null | undefined

export const MIN_PASSWORD_LENGTH = 8

export const PASSWORD_MESSAGES = {
  tooShort: `La contraseña necesita al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
  mismatch: 'Las dos contraseñas no coinciden. Revisa que sean iguales.',
  samePassword: 'Esa es tu contraseña actual. Elige una distinta para continuar.',
  weak: 'Esa contraseña es demasiado fácil de adivinar. Prueba con una más larga, mezclando letras, números y algún símbolo.',
  pwned: 'Esa contraseña aparece en filtraciones públicas. Elige otra.',
  linkExpired: 'Tu enlace caducó o ya se usó. Solicita uno nuevo desde el login.',
  rateLimit: 'Hay muchos intentos seguidos. Espera unos minutos y vuelve a probar.',
  generic: 'No pudimos guardar tu contraseña. Inténtalo de nuevo; si sigue igual, escríbenos a soporte@menteymusculo.com.',
} as const

export const LOGIN_MESSAGES = {
  invalidCredentials: 'El correo o la contraseña no coinciden. Revísalos e inténtalo de nuevo.',
  rateLimit: PASSWORD_MESSAGES.rateLimit,
  network: 'No pudimos conectar. Revisa tu conexión a internet e inténtalo de nuevo.',
  generic: 'No pudimos iniciar sesión. Inténtalo de nuevo; si sigue igual, escríbenos a soporte@menteymusculo.com.',
} as const

export const FORGOT_MESSAGES = {
  invalidEmail: 'Revisa que el correo esté bien escrito.',
  rateLimit: 'Ya pediste varios enlaces seguidos. Espera unos minutos antes de pedir otro y revisa también la carpeta de spam.',
  network: LOGIN_MESSAGES.network,
  generic: 'No pudimos enviar el correo. Inténtalo de nuevo; si sigue igual, escríbenos a soporte@menteymusculo.com.',
} as const

// Errores de sesión o de enlace: la sesión de recuperación/invitación ya no vale.
const SESSION_CODES = new Set([
  'session_not_found', 'session_expired', 'otp_expired', 'bad_jwt', 'flow_state_expired',
  'flow_state_not_found', 'refresh_token_not_found', 'refresh_token_already_used',
  'no_authorization', 'reauthentication_needed',
])
const RATE_LIMIT_CODES = new Set(['over_request_rate_limit', 'over_email_send_rate_limit'])
// En el login se responden igual que credenciales incorrectas para no revelar si la cuenta existe.
const LOGIN_HIDDEN_CODES = new Set(['invalid_credentials', 'email_not_confirmed', 'user_not_found', 'user_banned'])

// auth-js marca así los fallos de red (sin código).
function isNetworkError(err: NonNullable<AuthErrorLike>): boolean {
  return err.name === 'AuthRetryableFetchError'
}

// Validación en el cliente antes de llamar a Supabase. null = todo bien.
export function validateNewPassword(password: string, confirm: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return PASSWORD_MESSAGES.tooShort
  if (password !== confirm) return PASSWORD_MESSAGES.mismatch
  return null
}

// updateUser({ password }) en /reset-password y /bienvenida. Sin error (o excepción de red) → genérico.
export function passwordErrorMessage(err: AuthErrorLike): string {
  if (!err) return PASSWORD_MESSAGES.generic
  const code = err.code
  if (code === 'same_password') return PASSWORD_MESSAGES.samePassword
  if (code === 'weak_password') {
    return err.reasons?.includes('pwned') ? PASSWORD_MESSAGES.pwned : PASSWORD_MESSAGES.weak
  }
  if ((code && SESSION_CODES.has(code)) || err.name === 'AuthSessionMissingError') {
    return PASSWORD_MESSAGES.linkExpired
  }
  if (code && RATE_LIMIT_CODES.has(code)) return PASSWORD_MESSAGES.rateLimit
  return PASSWORD_MESSAGES.generic
}

// signInWithPassword. No distingue "correo no existe" de "contraseña mal" ni dice si la
// cuenta está sin confirmar o bloqueada: eso revelaría qué correos están registrados.
export function loginErrorMessage(err: AuthErrorLike): string {
  if (!err) return LOGIN_MESSAGES.generic
  if (err.code && LOGIN_HIDDEN_CODES.has(err.code)) return LOGIN_MESSAGES.invalidCredentials
  if (err.code && RATE_LIMIT_CODES.has(err.code)) return LOGIN_MESSAGES.rateLimit
  if (isNetworkError(err)) return LOGIN_MESSAGES.network
  return LOGIN_MESSAGES.generic
}

// resetPasswordForEmail. Supabase responde igual exista o no el correo; aquí solo se
// explican problemas de formato, de límite o de red, que no dicen nada de la cuenta.
export function forgotErrorMessage(err: AuthErrorLike): string {
  if (!err) return FORGOT_MESSAGES.generic
  if (err.code === 'email_address_invalid' || err.code === 'validation_failed') return FORGOT_MESSAGES.invalidEmail
  if (err.code && RATE_LIMIT_CODES.has(err.code)) return FORGOT_MESSAGES.rateLimit
  if (isNetworkError(err)) return FORGOT_MESSAGES.network
  return FORGOT_MESSAGES.generic
}
