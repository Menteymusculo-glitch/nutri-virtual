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
        setError(`Error: ${authError.message} (${authError.status ?? authError.code ?? 'sin código'})`)
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

  return (
    <div className="min-h-screen" style={{ background: '#FAFAFA' }}>
      <header className="brand-gradient py-5 px-6 text-white text-center">
        <p style={{ fontSize: '0.7rem', letterSpacing: '0.18em', opacity: 0.85 }}>MASTER RAY VILORIA</p>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '0.04em' }}>NUTRI VIRTUAL</h1>
        <p style={{ fontSize: '0.75rem', opacity: 0.9, letterSpacing: '0.1em', fontWeight: 600 }}>MENTE Y MÚSCULO</p>
      </header>

      <div style={{ maxWidth: 420, margin: '0 auto', padding: '2.5rem 1rem' }}>
        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '2rem' }}>
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

          <p style={{ fontSize: '0.75rem', color: '#BBB', marginTop: '1.5rem', textAlign: 'center' }}>
            ¿No tienes acceso? Contacta a tu coach
          </p>
        </div>
      </div>
    </div>
  )
}
