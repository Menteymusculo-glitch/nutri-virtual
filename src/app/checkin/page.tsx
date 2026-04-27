'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckInData } from '@/types'

export default function CheckInPage() {
  const router = useRouter()
  const [submitted, setSubmitted] = useState(false)
  const [data, setData] = useState<CheckInData>({
    userName: '',
    week: 1,
    currentWeight: 0,
    energyLevel: 3,
    adherence: 3,
    digestion: 3,
    sleep: 3,
    notes: '',
    successes: '',
  })

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const update = (fields: Partial<CheckInData>) => setData((d) => ({ ...d, ...fields }))

  const handleSubmit = async () => {
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch('/api/save-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: data.userName,
          week: data.week,
          current_weight: data.currentWeight,
          energy_level: data.energyLevel,
          adherence: data.adherence,
          digestion: data.digestion,
          sleep: data.sleep,
          notes: data.notes,
          successes: data.successes,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error guardando')
      setSubmitted(true)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'white', borderRadius: 20, padding: '2.5rem', maxWidth: 440, textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>¡Seguimiento registrado!</h2>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Tu progreso ha sido guardado. ¡Sigue así, cada semana cuenta en tu transformación!
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={() => router.push('/plan')}
              style={{
                padding: '0.875rem',
                background: 'linear-gradient(135deg, #F5A623, #B8241A)',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Ver mi Plan
            </button>
            <button
              onClick={() => router.push('/')}
              style={{
                padding: '0.875rem',
                background: 'white',
                color: '#3D3D3D',
                border: '2px solid #E5E7EB',
                borderRadius: 12,
                fontSize: '0.95rem',
                cursor: 'pointer',
              }}
            >
              Generar Nuevo Plan
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#FAFAFA', minHeight: '100vh' }}>
      <header
        style={{
          background: 'linear-gradient(135deg, #F5A623 0%, #E07B00 40%, #B8241A 100%)',
          padding: '1.25rem 1.5rem',
          color: 'white',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', opacity: 0.85 }}>MASTER RAY VILORIA</p>
        <h1 style={{ fontSize: '1.1rem', fontWeight: 800 }}>NUTRI VIRTUAL · Seguimiento Semanal</h1>
      </header>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>
        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📊</div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Check-in Semanal</h2>
            <p style={{ fontSize: '0.85rem', color: '#888', marginTop: 4 }}>
              Registra tu progreso para ajustar tu plan la próxima semana
            </p>
          </div>

          <Field label="Tu nombre">
            <input
              className="input-field"
              value={data.userName}
              onChange={(e) => update({ userName: e.target.value })}
              placeholder="Tu nombre"
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
            <Field label="Semana #">
              <input
                className="input-field"
                type="number"
                min={1}
                value={data.week}
                onChange={(e) => update({ week: parseInt(e.target.value) || 1 })}
              />
            </Field>
            <Field label="Peso actual (kg)">
              <input
                className="input-field"
                type="number"
                step="0.1"
                value={data.currentWeight || ''}
                onChange={(e) => update({ currentWeight: parseFloat(e.target.value) || 0 })}
                placeholder="ej: 68.5"
              />
            </Field>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <RatingField
              label="⚡ Nivel de Energía"
              value={data.energyLevel}
              onChange={(v) => update({ energyLevel: v })}
              labels={['Muy bajo', 'Bajo', 'Normal', 'Bueno', 'Excelente']}
            />
            <RatingField
              label="✅ Adherencia al Plan"
              value={data.adherence}
              onChange={(v) => update({ adherence: v })}
              labels={['< 40%', '40-59%', '60-74%', '75-89%', '90-100%']}
            />
            <RatingField
              label="🌿 Digestión"
              value={data.digestion}
              onChange={(v) => update({ digestion: v })}
              labels={['Muy mala', 'Mala', 'Regular', 'Buena', 'Muy buena']}
            />
            <RatingField
              label="😴 Calidad del Sueño"
              value={data.sleep}
              onChange={(v) => update({ sleep: v })}
              labels={['Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente']}
            />
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <Field label="🏆 ¿Cuáles fueron tus logros esta semana?">
              <textarea
                className="input-field"
                rows={3}
                value={data.successes}
                onChange={(e) => update({ successes: e.target.value })}
                placeholder="Ej: Cumplí con mis comidas todos los días, bajé 0.5kg, dormí mejor..."
                style={{ resize: 'none' }}
              />
            </Field>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <Field label="💬 Notas adicionales o dificultades">
              <textarea
                className="input-field"
                rows={3}
                value={data.notes}
                onChange={(e) => update({ notes: e.target.value })}
                placeholder="Ej: Tuve antojos, me fue difícil el miércoles, no encontré el salmón..."
                style={{ resize: 'none' }}
              />
            </Field>
          </div>

          {saveError && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#FFF0EE', border: '1px solid #B8241A', borderRadius: 8, color: '#B8241A', fontSize: '0.85rem' }}>
              {saveError}
            </div>
          )}
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={!data.userName || !data.currentWeight || saving}
            style={{ marginTop: '1.5rem' }}
          >
            {saving ? '⏳ Guardando...' : 'Registrar Progreso ✓'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: '0.82rem',
          fontWeight: 600,
          color: '#555',
          marginBottom: '0.5rem',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}

function RatingField({
  label,
  value,
  onChange,
  labels,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  labels: string[]
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#3D3D3D' }}>{label}</span>
        <span style={{ fontSize: '0.78rem', color: '#B8241A', fontWeight: 600 }}>{labels[value - 1]}</span>
      </div>
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            style={{
              flex: 1,
              padding: '0.5rem 0',
              borderRadius: 8,
              border: 'none',
              background:
                n <= value
                  ? `linear-gradient(135deg, #F5A623, #B8241A)`
                  : '#F0F0F0',
              color: n <= value ? 'white' : '#AAA',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.15s',
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}
