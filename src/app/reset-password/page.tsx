'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [ready, setReady] = useState(false)
  const [invalidLink, setInvalidLink] = useState(false)

  useEffect(() => {
    // Supabase processes the recovery token from the URL hash and fires
    // PASSWORD_RECOVERY — we must wait for it before showing the form.
    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })

    // If no token fires within 4 seconds, the link is invalid or expired
    const timer = setTimeout(() => {
      setReady((r) => { if (!r) setInvalidLink(true); return r })
    }, 4000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { error: updateError } = await supabaseBrowser.auth.updateUser({ password })
      if (updateError) {
        setError('No se pudo actualizar la contraseña. El link puede haber expirado.')
        return
      }
      await supabaseBrowser.auth.signOut()
      setSuccess(true)
      setTimeout(() => router.push('/login'), 3000)
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

          {success ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1A1A1A', marginBottom: '0.5rem' }}>
                ¡Contraseña actualizada!
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#888' }}>
                Redirigiendo al login en unos segundos...
              </p>
            </div>
          ) : invalidLink ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1A1A1A', marginBottom: '0.5rem' }}>
                Link inválido o expirado
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#888', marginBottom: '1.5rem' }}>
                Los links de recuperación expiran después de unos minutos. Solicita uno nuevo desde el login.
              </p>
              <button
                className="btn-primary"
                onClick={() => router.push('/login')}
                style={{ width: '100%' }}
              >
                Volver al login
              </button>
            </div>
          ) : !ready ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⏳</div>
              <p style={{ color: '#888', fontSize: '0.9rem' }}>Verificando link de recuperación...</p>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔑</div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1A1A1A', marginBottom: '0.4rem' }}>
                  Nueva contraseña
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#888', lineHeight: 1.5 }}>
                  Elige una contraseña segura de al menos 8 caracteres
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#555', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Nueva contraseña
                  </label>
                  <input
                    className="input-field"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={8}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#555', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Confirmar contraseña
                  </label>
                  <input
                    className="input-field"
                    type="password"
                    placeholder="Repite la contraseña"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={8}
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
                  disabled={loading || !password || !confirm}
                  style={{ width: '100%', marginTop: '0.5rem' }}
                >
                  {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
