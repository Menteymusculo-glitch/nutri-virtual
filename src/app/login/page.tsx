'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Forgot-password state
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotMsg, setForgotMsg] = useState<{ text: string; ok: boolean } | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return
    setLoading(true)
    setError('')
    try {
      const { error: authError } = await supabaseBrowser.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      if (authError) {
        setError('Correo o contraseña incorrectos.')
        return
      }
      router.push('/')
      router.refresh()
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail.trim()) return
    setForgotLoading(true)
    setForgotMsg(null)
    try {
      const { error: resetError } = await supabaseBrowser.auth.resetPasswordForEmail(
        forgotEmail.trim().toLowerCase(),
        { redirectTo: 'https://nutri-virtual.vercel.app/reset-password' }
      )
      if (resetError) {
        setForgotMsg({ text: 'Error al enviar el correo. Intenta de nuevo.', ok: false })
        return
      }
      setForgotMsg({
        text: 'Si ese correo está registrado, recibirás un link en tu bandeja de entrada.',
        ok: true,
      })
    } catch {
      setForgotMsg({ text: 'Error de conexión. Intenta de nuevo.', ok: false })
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#FAFAFA' }}>
      <header className="brand-gradient py-5 px-6 text-white text-center">
        <p style={{ fontSize: '0.7rem', letterSpacing: '0.18em', opacity: 0.85 }}>MASTER RAY VILORIA</p>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '0.04em' }}>NUTRI VIRTUAL</h1>
        <p style={{ fontSize: '0.75rem', opacity: 0.9, letterSpacing: '0.1em', fontWeight: 600 }}>MENTE Y MÚSCULO</p>
      </header>

      <div style={{ maxWidth: 420, margin: '0 auto', padding: '2.5rem 1rem' }}>
        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '2rem' }}>

          {!showForgot ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔐</div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1A1A1A', marginBottom: '0.4rem' }}>
                  Acceso Exclusivo
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#888', lineHeight: 1.5 }}>
                  Ingresa con las credenciales que te dio tu coach
                </p>
              </div>

              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#555', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Correo electrónico
                  </label>
                  <input
                    className="input-field"
                    type="email"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#555', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Contraseña
                  </label>
                  <input
                    className="input-field"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>

                {error && (
                  <p style={{ color: '#B8241A', fontSize: '0.85rem', textAlign: 'center', background: '#FFF0EE', padding: '0.6rem 1rem', borderRadius: 8 }}>
                    {error}
                  </p>
                )}

                <button
                  className="btn-primary"
                  type="submit"
                  disabled={loading || !email.trim() || !password.trim()}
                  style={{ width: '100%', marginTop: '0.5rem' }}
                >
                  {loading ? 'Ingresando...' : 'Ingresar →'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <button
                  onClick={() => { setShowForgot(true); setForgotEmail(email); setForgotMsg(null) }}
                  style={{ background: 'none', border: 'none', color: '#888', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
                <p style={{ fontSize: '0.75rem', color: '#BBB' }}>
                  ¿No tienes acceso? Contacta a tu coach
                </p>
              </div>
            </>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📧</div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1A1A1A', marginBottom: '0.4rem' }}>
                  Recuperar contraseña
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#888', lineHeight: 1.5 }}>
                  Te enviamos un link para crear una nueva contraseña
                </p>
              </div>

              <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#555', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Correo electrónico
                  </label>
                  <input
                    className="input-field"
                    type="email"
                    placeholder="tu@correo.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                {forgotMsg && (
                  <p style={{
                    color: forgotMsg.ok ? '#16a34a' : '#B8241A',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    background: forgotMsg.ok ? '#F0FDF4' : '#FFF0EE',
                    padding: '0.6rem 1rem',
                    borderRadius: 8,
                    lineHeight: 1.5,
                  }}>
                    {forgotMsg.text}
                  </p>
                )}

                <button
                  className="btn-primary"
                  type="submit"
                  disabled={forgotLoading || !forgotEmail.trim()}
                  style={{ width: '100%' }}
                >
                  {forgotLoading ? 'Enviando...' : 'Enviar link de recuperación'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                <button
                  onClick={() => { setShowForgot(false); setForgotMsg(null) }}
                  style={{ background: 'none', border: 'none', color: '#888', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  ← Volver al login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
