'use client'

import { useState } from 'react'

type Gender = 'female' | 'male'

interface CalcResult {
  bf: number
  fatMass: number
  leanMass: number
  category: { name: string; cls: string }
  outOfRange: boolean
  clampedBf: number
}

function getCategory(bf: number, gender: Gender) {
  if (gender === 'female') {
    if (bf < 14) return { name: 'Esencial', cls: 'essential' }
    if (bf < 21) return { name: 'Atleta', cls: 'athlete' }
    if (bf < 25) return { name: 'Fitness', cls: 'fitness' }
    if (bf < 32) return { name: 'Aceptable', cls: 'acceptable' }
    return { name: 'Alto', cls: 'obesity' }
  } else {
    if (bf < 6) return { name: 'Esencial', cls: 'essential' }
    if (bf < 14) return { name: 'Atleta', cls: 'athlete' }
    if (bf < 18) return { name: 'Fitness', cls: 'fitness' }
    if (bf < 25) return { name: 'Aceptable', cls: 'acceptable' }
    return { name: 'Alto', cls: 'obesity' }
  }
}

const INTERP: Record<Gender, Record<string, string>> = {
  female: {
    essential: 'Tu porcentaje de grasa está en el rango esencial (10-13%). Es el mínimo necesario para el funcionamiento fisiológico básico. En mujeres, mantener niveles tan bajos puede afectar la función hormonal, el ciclo menstrual y la salud ósea. Supervisión profesional recomendada.',
    athlete: 'Rango atlético (14-20%). Composición corporal de alto rendimiento: excelente equilibrio entre masa muscular y grasa. Óptimo para rendimiento deportivo y salud metabólica y hormonal. Mantén nutrición antiinflamatoria y entrenamiento de fuerza.',
    fitness: 'Rango fitness (21-24%). Nivel excelente: buena condición física y salud metabólica. Suficiente grasa para mantener la función hormonal óptima con composición corporal saludable. Rango sostenible asociado con longevidad y bienestar.',
    acceptable: 'Rango aceptable (25-31%). Dentro de parámetros saludables, con margen para mejorar la salud metabólica. Enfócate en entrenamiento de fuerza, nutrición antiinflamatoria rica en proteína y gestión del estrés. Pequeños cambios sostenibles marcan gran diferencia.',
    obesity: 'Tu porcentaje de grasa supera el 32%. Se asocia con mayor riesgo de resistencia a la insulina, inflamación crónica y desequilibrios hormonales. Tu cuerpo tiene un potencial increíble de transformación. Prioriza: proteína en cada comida, entrenamiento de fuerza 3-4x/semana, nutrición antiinflamatoria, gestión del sueño y estrés.',
  },
  male: {
    essential: 'Rango esencial (2-5%). Mínimo biológico para funciones vitales. Puede afectar la producción de testosterona, energía y recuperación. Solo recomendado para competiciones deportivas específicas bajo supervisión profesional.',
    athlete: 'Rango atlético (6-13%). Nivel de atletas de élite. Refleja desarrollo muscular excepcional con grasa baja. Requiere disciplina sostenida en entrenamiento y nutrición.',
    fitness: 'Rango fitness (14-17%). Excelente condición física que equilibra salud, rendimiento y sostenibilidad. Buena producción hormonal con buena definición muscular. Rango asociado con longevidad.',
    acceptable: 'Rango aceptable (18-24%). Dentro de parámetros saludables con margen de mejora. Enfócate en entrenamiento de fuerza, nutrición rica en proteína y reducción de alimentos procesados. El músculo es tu órgano metabólico más importante.',
    obesity: 'Tu porcentaje de grasa supera el 25%. Se asocia con mayor riesgo de síndrome metabólico, resistencia a la insulina y disminución de testosterona. Tu cuerpo tiene capacidad de transformación: prioriza entrenamiento de fuerza, proteína (2g/kg de peso objetivo), elimina azúcares añadidos, duerme 7-8h.',
  },
}

const RANGES: Record<Gender, { label: string; value: string; color: string }[]> = {
  female: [
    { label: 'Esencial', value: '10-13%', color: '#48bb78' },
    { label: 'Atleta', value: '14-20%', color: '#4299e1' },
    { label: 'Fitness', value: '21-24%', color: '#ed8936' },
    { label: 'Aceptable', value: '25-31%', color: '#ecc94b' },
    { label: 'Alto', value: '32%+', color: '#f56565' },
  ],
  male: [
    { label: 'Esencial', value: '2-5%', color: '#48bb78' },
    { label: 'Atleta', value: '6-13%', color: '#4299e1' },
    { label: 'Fitness', value: '14-17%', color: '#ed8936' },
    { label: 'Aceptable', value: '18-24%', color: '#ecc94b' },
    { label: 'Alto', value: '25%+', color: '#f56565' },
  ],
}

const CAT_COLORS: Record<string, string> = {
  essential: '#48bb78',
  athlete: '#4299e1',
  fitness: '#ed8936',
  acceptable: '#ecc94b',
  obesity: '#f56565',
}

export default function CalculadoraGrasa() {
  const [gender, setGender] = useState<Gender | ''>('')
  const [age, setAge] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [neck, setNeck] = useState('')
  const [waist, setWaist] = useState('')
  const [hip, setHip] = useState('')

  // Email gate
  const [email, setEmail] = useState('')
  const [emailSubmitting, setEmailSubmitting] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [showEmailGate, setShowEmailGate] = useState(false)

  const [result, setResult] = useState<CalcResult | null>(null)
  const [formError, setFormError] = useState('')

  const calculate = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!gender) { setFormError('Selecciona tu género.'); return }

    const g = gender as Gender
    const a = parseFloat(age), w = parseFloat(weight)
    const h = parseFloat(height), n = parseFloat(neck), wa = parseFloat(waist)
    const hi = g === 'female' ? parseFloat(hip) : 0

    if ([a, w, h, n, wa].some(isNaN) || (g === 'female' && isNaN(hi))) {
      setFormError('Completa todos los campos con valores válidos.')
      return
    }

    let rawBf: number
    if (g === 'female') {
      const logVal = wa + hi - n
      if (logVal <= 0) { setFormError('Cintura + cadera debe ser mayor que el cuello.'); return }
      rawBf = 495 / (1.29579 - 0.35004 * Math.log10(logVal) + 0.22100 * Math.log10(h)) - 450
    } else {
      const logVal = wa - n
      if (logVal <= 0) { setFormError('La cintura debe ser mayor que el cuello.'); return }
      rawBf = 495 / (1.0324 - 0.19077 * Math.log10(logVal) + 0.15456 * Math.log10(h)) - 450
    }

    if (!isFinite(rawBf)) { setFormError('Error en el cálculo. Verifica que las medidas sean correctas.'); return }

    const outOfRange = rawBf < 3 || rawBf > 60
    const clampedBf = Math.min(60, Math.max(3, rawBf))
    const bf = outOfRange ? clampedBf : rawBf

    const fatMass = w * (bf / 100)
    const leanMass = w - fatMass
    const category = getCategory(bf, g)

    setResult({ bf, fatMass, leanMass, category, outOfRange, clampedBf })
    setShowEmailGate(true)
    setTimeout(() => document.getElementById('email-gate')?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!result) return
    setEmailError('')
    setEmailSubmitting(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          tipo: 'calculadora_grasa',
          datos: {
            gender,
            age: parseFloat(age),
            weight: parseFloat(weight),
            height: parseFloat(height),
            neck: parseFloat(neck),
            waist: parseFloat(waist),
            hip: gender === 'female' ? parseFloat(hip) : undefined,
            bf: result.bf,
            fatMass: result.fatMass,
            leanMass: result.leanMass,
            category: result.category.name,
            outOfRange: result.outOfRange,
          },
        }),
      })
      if (!res.ok) throw new Error()
      setShowEmailGate(false)
    } catch {
      setEmailError('Error al guardar. Intenta de nuevo.')
    } finally {
      setEmailSubmitting(false)
    }
  }

  const showResult = result && !showEmailGate

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Brand bar */}
      <div style={{ background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)', padding: '12px 30px', borderRadius: 10, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 15, maxWidth: 650, width: '100%', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
        <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 2, color: 'white', textTransform: 'uppercase' }}>MENTE Y MÚSCULO</span>
        <span style={{ color: '#666', fontWeight: 300 }}>|</span>
        <span style={{ fontSize: 16, fontWeight: 600, background: 'linear-gradient(135deg,#FFD700,#FFA500,#FF6347,#DC143C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Ray Viloria · Coach de Transformación</span>
      </div>

      <div style={{ background: 'white', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', maxWidth: 650, width: '100%', padding: 40, border: '3px solid transparent', borderImage: 'linear-gradient(135deg,#FFD700,#FFA500,#FF6347,#DC143C) 1' }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <h1 style={{ color: '#2d3748', marginBottom: 5, fontSize: 26, fontWeight: 700 }}>Calculadora de Grasa Corporal</h1>
          <p style={{ color: '#718096', fontSize: 14 }}>Análisis completo de tu composición corporal</p>
        </div>

        <div style={{ background: 'linear-gradient(135deg,#fff5e6,#ffe8d1)', padding: 15, borderRadius: 10, marginBottom: 25, borderLeft: '4px solid #FF6347' }}>
          <h4 style={{ color: '#DC143C', fontSize: 14, marginBottom: 8, fontWeight: 700 }}>📏 Método de Medición Científico</h4>
          <p style={{ color: '#2d3748', fontSize: 13, lineHeight: 1.5 }}>Esta calculadora usa el método de circunferencias de la Marina de EE.UU., validado científicamente con un margen de error del ±3-4%. Solo necesitas una cinta métrica.</p>
        </div>

        <form onSubmit={calculate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Género">
            <select value={gender} onChange={e => setGender(e.target.value as Gender)} required style={inputStyle}>
              <option value="">Selecciona...</option>
              <option value="female">Mujer</option>
              <option value="male">Hombre</option>
            </select>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Edad (años)"><input style={inputStyle} type="number" min={18} max={100} value={age} onChange={e => setAge(e.target.value)} required /></Field>
            <Field label="Peso (kg)"><input style={inputStyle} type="number" step="0.1" min={30} max={300} value={weight} onChange={e => setWeight(e.target.value)} required /></Field>
          </div>
          <Field label="Altura (cm)"><input style={inputStyle} type="number" min={100} max={250} value={height} onChange={e => setHeight(e.target.value)} required /></Field>
          <Field label="Circunferencia del cuello (cm)" hint="Justo debajo de la nuez de Adán, cinta horizontal">
            <input style={inputStyle} type="number" step="0.1" min={20} max={70} value={neck} onChange={e => setNeck(e.target.value)} required />
          </Field>
          <Field label="Circunferencia de la cintura (cm)" hint="A la altura del ombligo, sin comprimir el abdomen">
            <input style={inputStyle} type="number" step="0.1" min={40} max={200} value={waist} onChange={e => setWaist(e.target.value)} required />
          </Field>
          {gender === 'female' && (
            <Field label="Circunferencia de la cadera (cm)" hint="En la parte más ancha de las caderas">
              <input style={inputStyle} type="number" step="0.1" min={60} max={200} value={hip} onChange={e => setHip(e.target.value)} required />
            </Field>
          )}

          {formError && <p style={{ color: '#DC143C', fontSize: 13, background: '#fff5f5', padding: '8px 12px', borderRadius: 8 }}>{formError}</p>}

          <button type="submit" style={btnStyle}>Calcular Mi Composición Corporal</button>
        </form>

        {/* Email gate */}
        {showEmailGate && result && (
          <div id="email-gate" style={{ marginTop: 30, padding: 28, background: 'linear-gradient(135deg,#fff5e6,#ffe8d1)', borderRadius: 15, border: '2px solid #FFD700' }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📊</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#2d3748', marginBottom: 6 }}>Tu resultado está listo</h3>
              <p style={{ fontSize: 14, color: '#4a5568' }}>Ingresa tu email para ver tu análisis completo y recibir consejos personalizados de Ray.</p>
            </div>
            <form onSubmit={submitEmail} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                style={inputStyle}
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              {emailError && <p style={{ color: '#DC143C', fontSize: 13 }}>{emailError}</p>}
              <button type="submit" disabled={emailSubmitting} style={btnStyle}>
                {emailSubmitting ? 'Guardando...' : 'Ver mi resultado →'}
              </button>
            </form>
          </div>
        )}

        {/* Result */}
        {showResult && result && gender && (
          <div style={{ marginTop: 30, padding: 30, background: 'linear-gradient(135deg,#f7fafc,#edf2f7)', borderRadius: 15, border: '2px solid #FFD700' }}>
            <div style={{ textAlign: 'center', marginBottom: 25 }}>
              <div style={{ fontSize: 48, fontWeight: 700, background: 'linear-gradient(135deg,#FFD700,#FF6347,#DC143C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {result.bf.toFixed(1)}%
              </div>
              <span style={{ fontSize: 18, fontWeight: 600, padding: '8px 20px', borderRadius: 20, display: 'inline-block', marginBottom: 20, background: CAT_COLORS[result.category.cls], color: 'white' }}>
                {result.category.name}
              </span>

              {result.outOfRange && (
                <div style={{ background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#92400e', textAlign: 'left' }}>
                  <strong>⚠️ Nota sobre la precisión:</strong> Con tus medidas, el método de circunferencias de la Marina de EE.UU. pierde precisión. Mostramos el valor límite más cercano ({result.clampedBf.toFixed(1)}%). Para un dato más exacto, te recomendamos bioimpedancia o DEXA.
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 25 }}>
              {[['Masa Grasa', result.fatMass.toFixed(1) + ' kg'], ['Masa Magra', result.leanMass.toFixed(1) + ' kg']].map(([label, val]) => (
                <div key={label} style={{ background: 'white', padding: 15, borderRadius: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#718096', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>{label}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#2d3748' }}>{val}</div>
                </div>
              ))}
            </div>

            <div style={{ background: 'white', padding: 20, borderRadius: 10, marginBottom: 20, borderLeft: '4px solid #FF6347' }}>
              <h3 style={{ color: '#2d3748', fontSize: 16, marginBottom: 10, fontWeight: 700 }}>Tu Interpretación Personalizada</h3>
              <p style={{ color: '#4a5568', lineHeight: 1.6, fontSize: 14 }}>{INTERP[gender as Gender][result.category.cls]}</p>
            </div>

            <div style={{ background: 'linear-gradient(135deg,#FFD700,#FFA500,#FF6347,#DC143C)', padding: 25, borderRadius: 15, textAlign: 'center', marginBottom: 20, color: 'white' }}>
              <h3 style={{ fontSize: 20, marginBottom: 10, fontWeight: 700 }}>¿Lista/o para tu transformación?</h3>
              <p style={{ fontSize: 14, marginBottom: 20, opacity: 0.95 }}>Basándome en tus resultados, puedo diseñar un plan personalizado que se adapte a tu cuerpo, tus horarios y tus objetivos reales.</p>
              <a href="https://forms.gle/9kQ6ApSQ2X6qSEbCA" target="_blank" rel="noopener noreferrer" style={{ background: 'white', color: '#DC143C', padding: '15px 40px', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 16, display: 'inline-block', textTransform: 'uppercase', letterSpacing: 1 }}>
                Solicita una Valoración Gratuita
              </a>
            </div>

            <div style={{ background: 'white', padding: 20, borderRadius: 10 }}>
              <h3 style={{ color: '#2d3748', fontSize: 16, marginBottom: 15, fontWeight: 700 }}>Rangos de Referencia</h3>
              {RANGES[gender as Gender].map(r => (
                <div key={r.label} style={{ display: 'flex', alignItems: 'center', marginBottom: 10, fontSize: 13 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, marginRight: 10, background: r.color, flexShrink: 0 }} />
                  <span style={{ fontWeight: 600, marginRight: 8, minWidth: 80 }}>{r.label}</span>
                  <span style={{ color: '#718096' }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', color: '#4a5568', fontWeight: 600, marginBottom: 8, fontSize: 14 }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: 12, color: '#a0aec0', marginTop: 4 }}>{hint}</p>}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: 10,
  fontSize: 16, background: '#f7fafc', fontFamily: 'inherit', color: '#2d3748',
}

const btnStyle: React.CSSProperties = {
  width: '100%', padding: 16, background: 'linear-gradient(135deg,#FFD700,#FFA500,#FF6347,#DC143C)',
  color: 'white', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700,
  cursor: 'pointer', marginTop: 10, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'inherit',
}
