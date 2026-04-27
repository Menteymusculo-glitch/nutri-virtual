'use client'

import { useEffect, useState } from 'react'

interface Client {
  id: string
  name: string
  profile: Record<string, unknown>
  created_at: string
}

interface CheckIn {
  id: string
  client_name: string
  week: number
  current_weight: number
  energy_level: number
  adherence: number
  digestion: number
  sleep: number
  notes: string
  successes: string
  created_at: string
}

const GOAL_LABELS: Record<string, string> = {
  weight_loss: 'Pérdida de peso',
  muscle_gain: 'Ganancia muscular',
  recomposition: 'Recomposición',
  maintenance: 'Mantenimiento',
}

const HORMONAL_LABELS: Record<string, string> = {
  none: '—',
  obesity: 'Obesidad',
  perimenopause: 'Perimenopausia',
  pcos: 'SOP',
  insulin_resistance: 'Res. Insulina',
  hypothyroidism: 'Hipotiroidismo',
}

export default function Dashboard() {
  const [clients, setClients] = useState<Client[]>([])
  const [checkins, setCheckins] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [tab, setTab] = useState<'clients' | 'checkins'>('clients')

  useEffect(() => {
    fetch('/api/dashboard-data')
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else {
          setClients(data.clients || [])
          setCheckins(data.checkins || [])
        }
      })
      .catch(() => setError('No se pudo conectar con la base de datos'))
      .finally(() => setLoading(false))
  }, [])

  const clientCheckins = (name: string) =>
    checkins.filter(c => c.client_name.toLowerCase() === name.toLowerCase())
      .sort((a, b) => a.week - b.week)

  const lastCheckin = (name: string) => clientCheckins(name)[clientCheckins(name).length - 1]

  const avgAdherence = (name: string) => {
    const cks = clientCheckins(name)
    if (!cks.length) return null
    return Math.round(cks.reduce((s, c) => s + c.adherence, 0) / cks.length)
  }

  const weightDelta = (name: string) => {
    const cks = clientCheckins(name)
    if (cks.length < 2) return null
    return (cks[cks.length - 1].current_weight - cks[0].current_weight).toFixed(1)
  }

  const filteredCheckins = selectedClient
    ? checkins.filter(c => c.client_name.toLowerCase() === selectedClient.toLowerCase())
    : checkins

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#888' }}>
      Cargando dashboard...
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #F5A623, #B8241A)', padding: '1.25rem 2rem', color: 'white' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', opacity: 0.85 }}>MASTER RAY VILORIA</p>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800 }}>NUTRI VIRTUAL · Panel del Coach</h1>
          </div>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem' }}>
            <Stat label="Clientes" value={clients.length} />
            <Stat label="Check-ins" value={checkins.length} />
            <Stat label="Esta semana" value={checkins.filter(c => {
              const d = new Date(c.created_at)
              const now = new Date()
              return now.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000
            }).length} />
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1rem' }}>
        {error && (
          <div style={{ padding: '1rem', background: '#FFF0EE', border: '1px solid #B8241A', borderRadius: 10, color: '#B8241A', marginBottom: '1rem' }}>
            ⚠️ {error} — Verifica que las tablas estén creadas en Supabase.
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {(['clients', 'checkins'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '0.5rem 1.25rem', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: tab === t ? 'linear-gradient(135deg, #F5A623, #B8241A)' : 'white',
              color: tab === t ? 'white' : '#555', fontWeight: tab === t ? 700 : 400,
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}>
              {t === 'clients' ? `👥 Clientes (${clients.length})` : `📊 Check-ins (${checkins.length})`}
            </button>
          ))}
        </div>

        {/* Clients Tab */}
        {tab === 'clients' && (
          <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            {clients.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#AAA' }}>
                Aún no hay clientes registrados. Los planes se guardan aquí automáticamente.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #F0F0F0' }}>
                    {['Cliente', 'Objetivo', 'Dieta', 'Hormonal', 'Peso', '% Grasa', 'Adherencia prom.', 'Δ Peso', 'Último check-in', 'Semana'].map(h => (
                      <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client, i) => {
                    const p = client.profile as Record<string, unknown>
                    const last = lastCheckin(client.name)
                    const adh = avgAdherence(client.name)
                    const delta = weightDelta(client.name)
                    return (
                      <tr key={client.id} style={{ borderBottom: '1px solid #F5F5F5', background: i % 2 === 0 ? 'white' : '#FAFAFA' }}>
                        <td style={{ padding: '0.875rem 1rem', fontWeight: 600 }}>
                          <button onClick={() => { setSelectedClient(client.name === selectedClient ? null : client.name); setTab('checkins') }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B8241A', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'underline' }}>
                            {client.name}
                          </button>
                          <div style={{ fontSize: '0.72rem', color: '#AAA', marginTop: 2 }}>
                            {new Date(client.created_at).toLocaleDateString('es-ES')}
                          </div>
                        </td>
                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.82rem' }}>{GOAL_LABELS[p.goal as string] || '—'}</td>
                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.82rem' }}>{p.dietType as string || '—'}</td>
                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.82rem' }}>{HORMONAL_LABELS[p.hormonal as string] || '—'}</td>
                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.82rem' }}>{p.weight as number}kg</td>
                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.82rem' }}>{p.bodyFat ? `${p.bodyFat}%` : '—'}</td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          {adh ? <AdherenceBadge value={adh} /> : <span style={{ color: '#CCC', fontSize: '0.8rem' }}>Sin datos</span>}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.85rem', fontWeight: 600 }}>
                          {delta ? (
                            <span style={{ color: parseFloat(delta) < 0 ? '#4CAF50' : parseFloat(delta) > 0 ? '#B8241A' : '#888' }}>
                              {parseFloat(delta) > 0 ? '+' : ''}{delta} kg
                            </span>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.82rem', color: '#666' }}>
                          {last ? new Date(last.created_at).toLocaleDateString('es-ES') : '—'}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', fontSize: '0.82rem' }}>
                          {last ? `Sem. ${last.week}` : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Check-ins Tab */}
        {tab === 'checkins' && (
          <div>
            {selectedClient && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.9rem', color: '#555' }}>Filtrando: <strong>{selectedClient}</strong></span>
                <button onClick={() => setSelectedClient(null)} style={{ padding: '0.25rem 0.75rem', borderRadius: 999, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', fontSize: '0.78rem' }}>
                  × Ver todos
                </button>
              </div>
            )}

            {filteredCheckins.length === 0 ? (
              <div style={{ background: 'white', borderRadius: 16, padding: '3rem', textAlign: 'center', color: '#AAA', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
                No hay check-ins aún. Los clientes los registran desde su página del plan.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredCheckins.map(c => (
                  <div key={c.id} style={{ background: 'white', borderRadius: 14, padding: '1.25rem 1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '1rem' }}>{c.client_name}</span>
                        <span style={{ fontSize: '0.78rem', color: '#888', marginLeft: '0.75rem' }}>
                          Semana {c.week} · {new Date(c.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <MetricBadge label="Peso" value={`${c.current_weight} kg`} />
                        <MetricBadge label="Energía" value={`${c.energy_level}/5`} color={c.energy_level >= 4 ? '#4CAF50' : c.energy_level <= 2 ? '#B8241A' : '#F5A623'} />
                        <MetricBadge label="Adherencia" value={`${c.adherence}/5`} color={c.adherence >= 4 ? '#4CAF50' : c.adherence <= 2 ? '#B8241A' : '#F5A623'} />
                        <MetricBadge label="Digestión" value={`${c.digestion}/5`} color={c.digestion >= 4 ? '#4CAF50' : c.digestion <= 2 ? '#B8241A' : '#F5A623'} />
                        <MetricBadge label="Sueño" value={`${c.sleep}/5`} color={c.sleep >= 4 ? '#4CAF50' : c.sleep <= 2 ? '#B8241A' : '#F5A623'} />
                      </div>
                    </div>
                    {c.successes && (
                      <div style={{ marginTop: '0.75rem', padding: '0.625rem 0.875rem', background: '#F0FFF4', borderRadius: 8, fontSize: '0.83rem', color: '#2E7D32' }}>
                        🏆 {c.successes}
                      </div>
                    )}
                    {c.notes && (
                      <div style={{ marginTop: '0.5rem', padding: '0.625rem 0.875rem', background: '#F9FAFB', borderRadius: 8, fontSize: '0.83rem', color: '#555' }}>
                        💬 {c.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '0.5rem 1rem' }}>
      <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>{label}</div>
    </div>
  )
}

function AdherenceBadge({ value }: { value: number }) {
  const color = value >= 4 ? '#4CAF50' : value <= 2 ? '#B8241A' : '#F5A623'
  const labels = ['', 'Muy baja', 'Baja', 'Regular', 'Buena', 'Excelente']
  return (
    <span style={{ padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, background: `${color}18`, color }}>
      {value}/5 — {labels[value]}
    </span>
  )
}

function MetricBadge({ label, value, color = '#555' }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.3rem 0.6rem', borderRadius: 8, background: '#F9FAFB', minWidth: 60 }}>
      <span style={{ fontSize: '0.85rem', fontWeight: 700, color }}>{value}</span>
      <span style={{ fontSize: '0.65rem', color: '#AAA', textTransform: 'uppercase' }}>{label}</span>
    </div>
  )
}
