'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserProfile } from '@/types'

const TOTAL_STEPS = 6

const defaultProfile: UserProfile = {
  name: '',
  age: 0,
  sex: 'female',
  weight: 0,
  height: 0,
  bodyFat: 0,
  goal: 'weight_loss',
  dietType: 'antiinflammatory',
  ketosis: false,
  activityLevel: 'moderate',
  trainingType: 'rays_program',
  trainingDays: 5,
  trainingTime: 'afternoon',
  hormonal: 'none',
  allergies: [],
  intolerances: [],
  mealsPerDay: 3,
  preferences: '',
}

const COMMON_ALLERGIES = ['Gluten', 'Lactosa', 'Mariscos', 'Frutos secos', 'Huevo', 'Soya', 'Maní']
const COMMON_INTOLERANCES = ['Fructosa', 'FODMAP', 'Histamina', 'Nightshades (solanáceas)']

export default function IntakeForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = (fields: Partial<UserProfile>) =>
    setProfile((p) => ({ ...p, ...fields }))

  const toggleAllergy = (item: string) => {
    const current = profile.allergies
    update({
      allergies: current.includes(item) ? current.filter((a) => a !== item) : [...current, item],
    })
  }

  const toggleIntolerance = (item: string) => {
    const current = profile.intolerances
    update({
      intolerances: current.includes(item)
        ? current.filter((a) => a !== item)
        : [...current, item],
    })
  }

  const canNext = () => {
    if (step === 1) return profile.name.trim().length > 1 && profile.age > 0 && profile.weight > 0 && profile.height > 0
    if (step === 2) return !!profile.goal
    if (step === 3) return !!profile.dietType
    if (step === 4) return !!profile.activityLevel && (profile.trainingType === 'none' || profile.trainingDays === 0 || !!profile.trainingTime)
    if (step === 5) return !!profile.hormonal
    return true
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al generar el plan')
      }
      const plan = await res.json()
      sessionStorage.setItem('mealPlan', JSON.stringify(plan))
      sessionStorage.setItem('userProfile', JSON.stringify(profile))
      router.push('/plan')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const progress = (step / TOTAL_STEPS) * 100

  return (
    <div className="min-h-screen" style={{ background: '#FAFAFA' }}>
      {/* Header */}
      <header className="brand-gradient py-5 px-6 text-white text-center">
        <p style={{ fontSize: '0.7rem', letterSpacing: '0.18em', opacity: 0.85 }}>MASTER RAY VILORIA</p>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '0.04em' }}>NUTRI VIRTUAL</h1>
        <p style={{ fontSize: '0.75rem', opacity: 0.9, letterSpacing: '0.1em', fontWeight: 600 }}>MENTE Y MÚSCULO</p>
      </header>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>
        {/* Progress */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.8rem', color: '#888' }}>
            <span>Paso {step} de {TOTAL_STEPS}</span>
            <span>{Math.round(progress)}% completado</span>
          </div>
          <div style={{ height: 5, background: '#E5E7EB', borderRadius: 999 }}>
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #F5A623, #B8241A)',
                borderRadius: 999,
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* Card */}
        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '2rem' }}>
          {step === 1 && <Step1 profile={profile} update={update} />}
          {step === 2 && <Step2 profile={profile} update={update} />}
          {step === 3 && <Step3 profile={profile} update={update} />}
          {step === 4 && <Step4 profile={profile} update={update} />}
          {step === 5 && (
            <Step5
              profile={profile}
              update={update}
              toggleAllergy={toggleAllergy}
              toggleIntolerance={toggleIntolerance}
            />
          )}
          {step === 6 && <Step6 profile={profile} update={update} />}

          {error && (
            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                background: '#FFF0EE',
                border: '1px solid #B8241A',
                borderRadius: 8,
                color: '#B8241A',
                fontSize: '0.9rem',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            {step > 1 && (
              <button className="btn-secondary" onClick={() => setStep((s) => s - 1)} style={{ width: '40%' }}>
                ← Atrás
              </button>
            )}
            {step < TOTAL_STEPS ? (
              <button
                className="btn-primary"
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext()}
                style={{ flex: 1 }}
              >
                Continuar →
              </button>
            ) : (
              <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading ? '⏳ Generando tu plan...' : '🔥 Generar Mi Plan'}
              </button>
            )}
          </div>
        </div>

        <p
          style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            fontSize: '0.78rem',
            color: '#AAA',
          }}
        >
          Nutri Virtual · Mente y Músculo · Master Ray Viloria
        </p>
      </div>
    </div>
  )
}

/* ─── Step 1: Datos Personales ─── */
function Step1({ profile, update }: { profile: UserProfile; update: (f: Partial<UserProfile>) => void }) {
  return (
    <div>
      <StepTitle emoji="👤" title="Datos Personales" subtitle="Cuéntame un poco sobre ti" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <LabeledInput label="Tu nombre" placeholder="Escribe tu nombre">
          <input
            className="input-field"
            value={profile.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="Ej: María González"
          />
        </LabeledInput>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <LabeledInput label="Edad">
            <input
              className="input-field"
              type="number"
              min={16}
              max={80}
              value={profile.age || ''}
              onChange={(e) => update({ age: parseInt(e.target.value) || 0 })}
              placeholder="años"
            />
          </LabeledInput>
          <LabeledInput label="Sexo">
            <select
              className="input-field"
              value={profile.sex}
              onChange={(e) => update({ sex: e.target.value as 'male' | 'female' })}
            >
              <option value="female">Femenino</option>
              <option value="male">Masculino</option>
            </select>
          </LabeledInput>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <LabeledInput label="Peso (kg)">
            <input
              className="input-field"
              type="number"
              min={30}
              max={250}
              value={profile.weight || ''}
              onChange={(e) => update({ weight: parseFloat(e.target.value) || 0 })}
              placeholder="ej: 70"
            />
          </LabeledInput>
          <LabeledInput label="Altura (cm)">
            <input
              className="input-field"
              type="number"
              min={140}
              max={220}
              value={profile.height || ''}
              onChange={(e) => update({ height: parseFloat(e.target.value) || 0 })}
              placeholder="ej: 165"
            />
          </LabeledInput>
        </div>

        <LabeledInput label="% Grasa Corporal (opcional)">
          <input
            className="input-field"
            type="number"
            min={5}
            max={60}
            step={0.1}
            value={profile.bodyFat || ''}
            onChange={(e) => update({ bodyFat: parseFloat(e.target.value) || 0 })}
            placeholder="ej: 28  (si no lo sabes, déjalo en blanco)"
          />
        </LabeledInput>

        {profile.bodyFat > 0 && profile.weight > 0 && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: '#FFF8EC',
              borderRadius: 10,
              fontSize: '0.85rem',
              color: '#7A5000',
            }}
          >
            💪 Masa muscular estimada:{' '}
            <strong>{(profile.weight * (1 - profile.bodyFat / 100)).toFixed(1)} kg</strong>
            {' · '}Grasa:{' '}
            <strong>{(profile.weight * (profile.bodyFat / 100)).toFixed(1)} kg</strong>
            {' — '}
            {(() => {
              const bf = profile.bodyFat
              const isFemale = profile.sex === 'female'
              if (isFemale) {
                if (bf < 14) return 'Atleta'
                if (bf < 21) return 'Fitness'
                if (bf < 25) return 'Saludable'
                if (bf < 32) return 'Sobrepeso'
                return 'Obesidad'
              } else {
                if (bf < 6) return 'Atleta'
                if (bf < 14) return 'Fitness'
                if (bf < 18) return 'Saludable'
                if (bf < 25) return 'Sobrepeso'
                return 'Obesidad'
              }
            })()}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Step 2: Objetivo ─── */
function Step2({ profile, update }: { profile: UserProfile; update: (f: Partial<UserProfile>) => void }) {
  const options = [
    { value: 'weight_loss', emoji: '🔥', label: 'Pérdida de Peso', desc: 'Reducir grasa corporal y mejorar composición' },
    { value: 'muscle_gain', emoji: '💪', label: 'Ganancia Muscular', desc: 'Aumentar masa muscular magra' },
    { value: 'recomposition', emoji: '⚡', label: 'Recomposición Corporal', desc: 'Perder grasa y ganar músculo simultáneamente' },
    { value: 'maintenance', emoji: '⚖️', label: 'Mantenimiento', desc: 'Mantener peso y optimizar salud' },
  ]

  return (
    <div>
      <StepTitle emoji="🎯" title="¿Cuál es tu objetivo?" subtitle="Elige el que mejor describe lo que buscas lograr" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {options.map((o) => (
          <button
            key={o.value}
            className={`option-btn ${profile.goal === o.value ? 'selected' : ''}`}
            onClick={() => update({ goal: o.value as UserProfile['goal'] })}
          >
            <span style={{ fontSize: '1.4rem' }}>{o.emoji}</span>
            <div>
              <div style={{ fontWeight: 600 }}>{o.label}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: 2 }}>{o.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ─── Step 3: Tipo de Dieta ─── */
function Step3({ profile, update }: { profile: UserProfile; update: (f: Partial<UserProfile>) => void }) {
  const options = [
    { value: 'antiinflammatory', emoji: '🌿', label: 'Antiinflamatoria', desc: 'Protocolo Ray Viloria — tu base ideal' },
    { value: 'omnivore', emoji: '🍗', label: 'Omnívora', desc: 'Incluye carnes, pescado, huevos y vegetales' },
    { value: 'vegetarian', emoji: '🥦', label: 'Vegetariana', desc: 'Sin carnes, con huevos y lácteos limitados' },
    { value: 'vegan', emoji: '🌱', label: 'Vegana', desc: 'Solo alimentos de origen vegetal' },
  ]

  return (
    <div>
      <StepTitle emoji="🥗" title="Tipo de Alimentación" subtitle="¿Cómo es tu relación con los alimentos?" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {options.map((o) => (
          <button
            key={o.value}
            className={`option-btn ${profile.dietType === o.value ? 'selected' : ''}`}
            onClick={() => update({ dietType: o.value as UserProfile['dietType'] })}
          >
            <span style={{ fontSize: '1.4rem' }}>{o.emoji}</span>
            <div>
              <div style={{ fontWeight: 600 }}>{o.label}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: 2 }}>{o.desc}</div>
            </div>
          </button>
        ))}
      </div>

      <div
        style={{
          padding: '1rem',
          background: profile.ketosis ? '#FFF0EE' : '#F9FAFB',
          border: `2px solid ${profile.ketosis ? '#B8241A' : '#E5E7EB'}`,
          borderRadius: 12,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onClick={() => update({ ketosis: !profile.ketosis })}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              border: `2px solid ${profile.ketosis ? '#B8241A' : '#D1D5DB'}`,
              background: profile.ketosis ? '#B8241A' : 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {profile.ketosis && <span style={{ color: 'white', fontSize: '0.8rem' }}>✓</span>}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
              🔥 Activar Protocolo Cetosis
            </div>
            <div style={{ fontSize: '0.78rem', color: '#666', marginTop: 2 }}>
              Recomendado para obesidad y perimenopausia — &lt;50g carbohidratos/día
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Step 4: Actividad y Entrenamiento ─── */
function Step4({ profile, update }: { profile: UserProfile; update: (f: Partial<UserProfile>) => void }) {
  const activityOptions = [
    { value: 'sedentary', emoji: '🪑', label: 'Sedentario', desc: 'Trabajo de escritorio, sin ejercicio' },
    { value: 'light', emoji: '🚶', label: 'Ligero', desc: '1-2 días de ejercicio por semana' },
    { value: 'moderate', emoji: '🏃', label: 'Moderado', desc: '3-5 días de ejercicio por semana' },
    { value: 'active', emoji: '💪', label: 'Activo', desc: '6-7 días de ejercicio intenso' },
    { value: 'very_active', emoji: '🏆', label: 'Atleta', desc: 'Dobles sesiones, alta intensidad' },
  ]

  const trainingOptions = [
    { value: 'rays_program', emoji: '⚡', label: 'Programa Ray Viloria', desc: 'Fuerza + cardio 5 días/semana' },
    { value: 'strength', emoji: '🏋️', label: 'Fuerza / Pesas', desc: 'Entrenamiento de resistencia' },
    { value: 'cardio', emoji: '🏃', label: 'Cardio predominante', desc: 'Correr, ciclismo, natación' },
    { value: 'mixed', emoji: '🔄', label: 'Mixto', desc: 'Combinación de fuerza y cardio' },
    { value: 'yoga_pilates', emoji: '🧘', label: 'Yoga / Pilates', desc: 'Flexibilidad y mente-cuerpo' },
    { value: 'none', emoji: '🚫', label: 'Sin entrenamiento', desc: 'Solo ajuste nutricional' },
  ]

  return (
    <div>
      <StepTitle emoji="🏋️" title="Actividad y Entrenamiento" subtitle="Tu nivel de movimiento diario y tipo de ejercicio" />

      <div style={{ marginBottom: '1.25rem' }}>
        <Label>Nivel de actividad diaria</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {activityOptions.map((o) => (
            <button
              key={o.value}
              className={`option-btn ${profile.activityLevel === o.value ? 'selected' : ''}`}
              style={{ padding: '0.65rem 1rem' }}
              onClick={() => update({ activityLevel: o.value as UserProfile['activityLevel'] })}
            >
              <span style={{ fontSize: '1.2rem' }}>{o.emoji}</span>
              <div>
                <span style={{ fontWeight: 600 }}>{o.label}</span>
                <span style={{ fontSize: '0.78rem', opacity: 0.65, marginLeft: '0.5rem' }}>{o.desc}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Tipo de entrenamiento</Label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          {trainingOptions.map((o) => (
            <button
              key={o.value}
              className={`option-btn ${profile.trainingType === o.value ? 'selected' : ''}`}
              style={{ padding: '0.65rem 0.875rem', fontSize: '0.85rem' }}
              onClick={() => update({ trainingType: o.value as UserProfile['trainingType'], ...(o.value === 'none' ? { trainingTime: 'none', trainingDays: 0 } : {}) })}
            >
              <span>{o.emoji}</span>
              <span style={{ fontWeight: 600 }}>{o.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <Label>Días de entrenamiento por semana</Label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((d) => (
            <button
              key={d}
              onClick={() => update({ trainingDays: d })}
              style={{
                flex: 1,
                padding: '0.5rem 0',
                borderRadius: 8,
                border: `2px solid ${profile.trainingDays === d ? '#B8241A' : '#E5E7EB'}`,
                background: profile.trainingDays === d ? '#B8241A' : 'white',
                color: profile.trainingDays === d ? 'white' : '#3D3D3D',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {profile.trainingType !== 'none' && profile.trainingDays > 0 && (
        <div style={{ marginTop: '1.25rem' }}>
          <Label>¿A qué hora entrenas? (para el batido post-entreno)</Label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {([
              { value: 'morning', emoji: '🌅', label: 'Mañana', sub: '6–10 AM' },
              { value: 'afternoon', emoji: '☀️', label: 'Tarde', sub: '11 AM–4 PM' },
              { value: 'evening', emoji: '🌙', label: 'Noche', sub: '5–9 PM' },
            ] as const).map((t) => (
              <button
                key={t.value}
                onClick={() => update({ trainingTime: t.value })}
                style={{
                  flex: 1,
                  padding: '0.65rem 0.5rem',
                  borderRadius: 10,
                  border: `2px solid ${profile.trainingTime === t.value ? '#B8241A' : '#E5E7EB'}`,
                  background: profile.trainingTime === t.value ? '#B8241A' : 'white',
                  color: profile.trainingTime === t.value ? 'white' : '#3D3D3D',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '1.2rem' }}>{t.emoji}</div>
                <div>{t.label}</div>
                <div style={{ fontSize: '0.68rem', opacity: 0.75 }}>{t.sub}</div>
              </button>
            ))}
          </div>
          <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.4rem' }}>
            El batido de proteína se colocará justo después de esta hora en tu plan
          </p>
        </div>
      )}
    </div>
  )
}

/* ─── Step 5: Salud Hormonal + Restricciones ─── */
function Step5({
  profile,
  update,
  toggleAllergy,
  toggleIntolerance,
}: {
  profile: UserProfile
  update: (f: Partial<UserProfile>) => void
  toggleAllergy: (item: string) => void
  toggleIntolerance: (item: string) => void
}) {
  const hormonalOptions = [
    { value: 'none', emoji: '✅', label: 'Sin condición específica' },
    { value: 'obesity', emoji: '⚖️', label: 'Obesidad' },
    { value: 'perimenopause', emoji: '🌸', label: 'Perimenopausia' },
    { value: 'pcos', emoji: '🔄', label: 'SOP (Ovario Poliquístico)' },
    { value: 'insulin_resistance', emoji: '🍭', label: 'Resistencia a la Insulina' },
    { value: 'hypothyroidism', emoji: '🦋', label: 'Hipotiroidismo' },
  ]

  return (
    <div>
      <StepTitle emoji="🌸" title="Salud Hormonal" subtitle="Esta información personaliza completamente tu plan" />

      <div style={{ marginBottom: '1.25rem' }}>
        <Label>Situación hormonal actual</Label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          {hormonalOptions.map((o) => (
            <button
              key={o.value}
              className={`option-btn ${profile.hormonal === o.value ? 'selected' : ''}`}
              style={{ padding: '0.65rem 0.875rem', fontSize: '0.85rem' }}
              onClick={() => update({ hormonal: o.value as UserProfile['hormonal'] })}
            >
              <span>{o.emoji}</span>
              <span style={{ fontWeight: 600 }}>{o.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <Label>Alergias alimentarias</Label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {COMMON_ALLERGIES.map((item) => (
            <Chip
              key={item}
              label={item}
              selected={profile.allergies.includes(item)}
              onClick={() => toggleAllergy(item)}
            />
          ))}
        </div>
      </div>

      <div>
        <Label>Intolerancias</Label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {COMMON_INTOLERANCES.map((item) => (
            <Chip
              key={item}
              label={item}
              selected={profile.intolerances.includes(item)}
              onClick={() => toggleIntolerance(item)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Step 6: Preferencias Finales ─── */
function Step6({ profile, update }: { profile: UserProfile; update: (f: Partial<UserProfile>) => void }) {
  return (
    <div>
      <StepTitle emoji="✨" title="Últimos Detalles" subtitle="Personaliza aún más tu experiencia" />

      <div style={{ marginBottom: '1.25rem' }}>
        <Label>¿Cuántas comidas prefieres al día?</Label>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              onClick={() => update({ mealsPerDay: n })}
              style={{
                flex: 1,
                padding: '0.875rem 0',
                borderRadius: 10,
                border: `2px solid ${profile.mealsPerDay === n ? '#B8241A' : '#E5E7EB'}`,
                background: profile.mealsPerDay === n ? '#B8241A' : 'white',
                color: profile.mealsPerDay === n ? 'white' : '#3D3D3D',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '1rem',
              }}
            >
              {n}
            </button>
          ))}
        </div>
        <p style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.4rem' }}>
          Incluye desayuno, snacks y cena
        </p>
      </div>

      <div>
        <Label>¿Algo más que deba saber? (opcional)</Label>
        <textarea
          className="input-field"
          rows={4}
          value={profile.preferences}
          onChange={(e) => update({ preferences: e.target.value })}
          placeholder="Ej: no me gusta el brócoli, prefiero recetas rápidas, tengo poco tiempo para cocinar, no como cerdo..."
          style={{ resize: 'none' }}
        />
      </div>

      <div
        style={{
          marginTop: '1.25rem',
          padding: '1rem',
          background: 'linear-gradient(135deg, #FFF8EC, #FFF0EE)',
          borderRadius: 12,
          border: '1px solid #F5A623',
        }}
      >
        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#7A3000', marginBottom: '0.5rem' }}>
          🎯 Resumen de tu perfil
        </p>
        <p style={{ fontSize: '0.8rem', color: '#5A3000', lineHeight: 1.6 }}>
          <strong>{profile.name}</strong>, {profile.age} años · {profile.weight}kg · {profile.height}cm
          {profile.bodyFat > 0 && ` · ${profile.bodyFat}% grasa`}
          <br />
          Objetivo: <strong>{goalLabel(profile.goal)}</strong>
          {profile.ketosis && ' 🔥 + Cetosis'}
          <br />
          Dieta: {dietLabel(profile.dietType)} · {profile.mealsPerDay} comidas/día
        </p>
      </div>
    </div>
  )
}

/* ─── UI Helpers ─── */
function StepTitle({ emoji, title, subtitle }: { emoji: string; title: string; subtitle: string }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{emoji}</div>
      <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#1A1A1A' }}>{title}</h2>
      <p style={{ fontSize: '0.875rem', color: '#888', marginTop: '0.25rem' }}>{subtitle}</p>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        display: 'block',
        fontSize: '0.85rem',
        fontWeight: 600,
        color: '#555',
        marginBottom: '0.5rem',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}
    >
      {children}
    </label>
  )
}

function LabeledInput({ label, children }: { label: string; placeholder?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.375rem 0.875rem',
        borderRadius: 999,
        border: `2px solid ${selected ? '#B8241A' : '#E5E7EB'}`,
        background: selected ? '#B8241A' : 'white',
        color: selected ? 'white' : '#555',
        fontSize: '0.82rem',
        fontWeight: selected ? 600 : 400,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {selected ? '✓ ' : ''}{label}
    </button>
  )
}

function goalLabel(g: string) {
  const m: Record<string, string> = {
    weight_loss: 'Pérdida de Peso',
    muscle_gain: 'Ganancia Muscular',
    recomposition: 'Recomposición Corporal',
    maintenance: 'Mantenimiento',
  }
  return m[g] || g
}

function dietLabel(d: string) {
  const m: Record<string, string> = {
    omnivore: 'Omnívora',
    vegetarian: 'Vegetariana',
    vegan: 'Vegana',
    antiinflammatory: 'Antiinflamatoria',
  }
  return m[d] || d
}
