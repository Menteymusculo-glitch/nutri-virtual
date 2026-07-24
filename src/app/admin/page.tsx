'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'

interface AppUser {
  id: string
  email: string
  name: string
  accessStatus: 'active' | 'inactive' | 'sin_acceso'
  plan: string
  source: string
  createdAt: string
}

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Create user form
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newName, setNewName] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [createMsg, setCreateMsg] = useState<{ text: string; ok: boolean } | null>(null)

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users')
    if (res.status === 401) { router.push('/'); return }
    if (!res.ok) { setError('Error al cargar alumnos.'); return }
    setUsers(await res.json())
  }

  useEffect(() => {
    fetchUsers().finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const changeAccess = async (userId: string, email: string, newStatus: 'active' | 'inactive') => {
    setActionLoading(userId)
    try {
      const res = await fetch('/api/admin/access', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email, status: newStatus }),
      })
      if (!res.ok) throw new Error()
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, accessStatus: newStatus } : u))
    } catch {
      alert('Error al cambiar el acceso.')
    } finally {
      setActionLoading(null)
    }
  }

  const deleteUser = async (userId: string, email: string) => {
    if (!confirm(`¿Eliminar a ${email}? Esta acción no se puede deshacer.`)) return
    setActionLoading(userId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (!res.ok) throw new Error()
      setUsers((prev) => prev.filter((u) => u.id !== userId))
    } catch {
      alert('Error al eliminar usuario.')
    } finally {
      setActionLoading(null)
    }
  }

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)
    setCreateMsg(null)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, password: newPassword, name: newName }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCreateMsg({ text: data.error || 'Error al crear la cuenta.', ok: false })
        return
      }
      setCreateMsg({ text: `✓ Cuenta creada para ${newEmail}`, ok: true })
      setNewEmail('')
      setNewPassword('')
      setNewName('')
      setShowCreateForm(false)
      await fetchUsers()
    } catch {
      setCreateMsg({ text: 'Error de conexión.', ok: false })
    } finally {
      setCreateLoading(false)
    }
  }

  const logout = async () => {
    await supabaseBrowser.auth.signOut()
    router.push('/login')
  }

  const activeCount = users.filter((u) => u.accessStatus === 'active').length
  const inactiveCount = users.filter((u) => u.accessStatus !== 'active').length

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#888' }}>Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#FAFAFA' }}>
      <header
        className="brand-gradient py-4 px-5 text-white"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <div>
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.18em', opacity: 0.8 }}>MASTER RAY VILORIA</p>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Panel Admin · Nutri Virtual</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <a href="/" style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>
            ← App
          </a>
          <button
            onClick={logout}
            style={{ fontSize: '0.82rem', background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: 8, padding: '0.35rem 0.875rem', cursor: 'pointer' }}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>
        {error && (
          <p style={{ color: '#B8241A', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total alumnos', value: users.length, color: '#1A1A1A' },
            { label: 'Con acceso activo', value: activeCount, color: '#16a34a' },
            { label: 'Sin acceso / Suspendidos', value: inactiveCount, color: '#B8241A' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{ background: 'white', borderRadius: 12, padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}
            >
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.25rem' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Create User */}
        <div
          style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '1.5rem', marginBottom: '1.5rem' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showCreateForm ? '1.25rem' : 0 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1A1A1A' }}>➕ Agregar nueva alumna</h2>
            <button
              onClick={() => { setShowCreateForm(!showCreateForm); setCreateMsg(null) }}
              className={showCreateForm ? 'btn-secondary' : 'btn-primary'}
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            >
              {showCreateForm ? 'Cancelar' : 'Nueva alumna'}
            </button>
          </div>

          {showCreateForm && (
            <form onSubmit={createUser}>
              <div
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}
              >
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#555', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                    Nombre
                  </label>
                  <input
                    className="input-field"
                    placeholder="Ana García"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#555', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                    Correo electrónico
                  </label>
                  <input
                    className="input-field"
                    type="email"
                    placeholder="ana@correo.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#555', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                    Contraseña temporal
                  </label>
                  <input
                    className="input-field"
                    placeholder="MenteyMusculo2026"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
              </div>

              {createMsg && (
                <p style={{ color: createMsg.ok ? '#16a34a' : '#B8241A', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  {createMsg.text}
                </p>
              )}

              <button className="btn-primary" type="submit" disabled={createLoading} style={{ fontSize: '0.9rem' }}>
                {createLoading ? 'Creando cuenta...' : 'Crear y dar acceso'}
              </button>
            </form>
          )}

          {!showCreateForm && createMsg?.ok && (
            <p style={{ color: '#16a34a', fontSize: '0.85rem', marginTop: '0.75rem' }}>{createMsg.text}</p>
          )}
        </div>

        {/* Users Table */}
        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #F0F0F0' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1A1A1A' }}>
              👥 Alumnos registrados ({users.length})
            </h2>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  {['Nombre', 'Correo', 'Estado', 'Plan', 'Fuente', 'Registro', 'Acciones'].map((h) => (
                    <th
                      key={h}
                      style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id} style={{ borderTop: i > 0 ? '1px solid #F0F0F0' : undefined }}>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 600, color: '#1A1A1A', fontSize: '0.88rem' }}>
                      {u.name || '—'}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#555', fontSize: '0.83rem' }}>
                      {u.email}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span
                        style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: 999,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: u.accessStatus === 'active' ? '#dcfce7' : '#fee2e2',
                          color: u.accessStatus === 'active' ? '#16a34a' : '#B8241A',
                        }}
                      >
                        {u.accessStatus === 'active' ? '✓ Activo' : '✗ Inactivo'}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#666', fontSize: '0.83rem', textTransform: 'capitalize' }}>
                      {u.plan}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#666', fontSize: '0.83rem', textTransform: 'capitalize' }}>
                      {u.source}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#AAA', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      {new Date(u.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {u.accessStatus !== 'active' ? (
                          <button
                            onClick={() => changeAccess(u.id, u.email, 'active')}
                            disabled={actionLoading === u.id}
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', borderRadius: 8, border: 'none', background: '#16a34a', color: 'white', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}
                          >
                            {actionLoading === u.id ? '...' : 'Dar acceso'}
                          </button>
                        ) : (
                          <button
                            onClick={() => changeAccess(u.id, u.email, 'inactive')}
                            disabled={actionLoading === u.id}
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', borderRadius: 8, border: 'none', background: '#F5A623', color: 'white', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}
                          >
                            {actionLoading === u.id ? '...' : 'Suspender'}
                          </button>
                        )}
                        <button
                          onClick={() => deleteUser(u.id, u.email)}
                          disabled={actionLoading === u.id}
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.625rem', borderRadius: 8, border: '1px solid #E5E7EB', background: 'white', color: '#999', cursor: 'pointer' }}
                        >
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <p style={{ textAlign: 'center', padding: '2.5rem', color: '#AAA', fontSize: '0.9rem' }}>
                No hay alumnos registrados aún. Crea la primera cuenta arriba.
              </p>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.72rem', color: '#CCC' }}>
          Panel Admin · Nutri Virtual · Solo para Master Ray Viloria
        </p>
      </div>
    </div>
  )
}
