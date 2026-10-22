'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { parseEmailLink } from '@/lib/authRedirect'

// Destino del correo de invitación (Stripe y DAX). La plantilla "Invite user" de
// Supabase enlaza aquí con ?token_hash=…&type=invite; se verifica con verifyOtp,
// así funciona en cualquier navegador o dispositivo y deja la sesión iniciada.
export default function BienvenidaPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'checking' | 'ready' | 'invalid'>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const link = parseEmailLink('invite', window.location.search, window.location.hash)
    if (link.kind !== 'token_hash') {
      Promise.resolve().then(() => setStatus('invalid'))
      return
    }
    // El token es de un solo uso: lo quitamos de la URL para que no quede en el historial.
    window.history.replaceState(null, '', window.location.pathname)
    supabaseBrowser.auth.verifyOtp({ token_hash: link.tokenHash, type: 'invite' }).then(({ error: otpError }) => {
      setStatus(otpError ? 'invalid' : 'ready')
    })
  }, [])

  const goHome = () => {
    router.push('/')
    router.refresh()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    setLoading(true)
    setError('')
    try {
      const { error: updateError } = await supabaseBrowser.auth.updateUser({ password })
      if (updateError) {
        setError('No se pudo guardar la contraseña. Inténtalo de nuevo.')
        return
      }
      goHome()
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
          {status === 'checking' ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⏳</div>
              <p style={{ color: '#888', fontSize: '0.9rem' }}>Verificando tu invitación...</p>
            </div>
          ) : status === 'invalid' ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1A1A1A', marginBottom: '0.5rem' }}>
                Invitación inválida o ya usada
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#888', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                El enlace de invitación solo sirve una vez y caduca pasado un tiempo. Puedes entrar desde
                el login con «¿Olvidaste tu contraseña?» usando el mismo correo.
              </p>
              <button className="btn-primary" onClick={() => router.push('/login')} style={{ width: '100%' }}>
                Ir al login
              </button>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👋</div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1A1A1A', marginBottom: '0.4rem' }}>
                  ¡Bienvenida!
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#888', lineHeight: 1.5 }}>
                  Ya tienes la sesión iniciada. Te invito a crear una contraseña para entrar desde cualquier dispositivo.
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Contraseña</label>
                  <input className="input-field" type="password" placeholder="Mínimo 8 caracteres" value={password}
                    onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required minLength={8} />
                </div>
                <div>
                  <label style={labelStyle}>Confirmar contraseña</label>
                  <input className="input-field" type="password" placeholder="Repite la contraseña" value={confirm}
                    onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required minLength={8} />
                </div>

                {error && (
                  <p style={{ color: '#B8241A', fontSize: '0.85rem', textAlign: 'center', background: '#FFF0EE', padding: '0.6rem 1rem', borderRadius: 8 }}>
                    {error}
                  </p>
                )}

                <button className="btn-primary" type="submit" disabled={loading || !password || !confirm} style={{ width: '100%', marginTop: '0.5rem' }}>
                  {loading ? 'Guardando...' : 'Crear contraseña y entrar'}
                </button>
                <button type="button" onClick={goHome}
                  style={{ background: 'none', border: 'none', color: '#888', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}>
                  Ahora no, entrar ya
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#555', marginBottom: '0.4rem',
  textTransform: 'uppercase', letterSpacing: '0.04em',
}
