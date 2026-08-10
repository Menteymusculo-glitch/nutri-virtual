'use client'

import { useState, useEffect, useRef } from 'react'

type Sex = 'mujer' | 'hombre'

const DOMAINS = ['Salud','Pareja','Familia','Relaciones','Ocio','Educación','Finanzas','Rol','Evolución','Espiritualidad']
const DOMAIN_KEYS = ['Salud','Pareja','Familia','Relaciones','Ocio','Educacion','Finanzas','Rol','Evolucion','Espiritualidad']
const CHIPS = ['Libre','Fuerte','Sereno/a','Auténtico/a','Poderoso/a','Seguro/a','Luminoso/a','Enraizado/a','Elegante','Natural','Constante','Valiente','Enfocado/a','En paz']

const CASCADE: Record<string, string> = {
  Salud: 'La energía física es el combustible de todos los demás dominios. Sin ella, todo lo demás cuesta el doble.',
  Pareja: 'La armonía emocional en pareja libera energía que ahora se gasta en conflicto interno.',
  Familia: 'Los vínculos familiares regulan el sistema nervioso. En paz con ellos, en paz contigo.',
  Relaciones: 'El entorno social moldea la identidad. Las personas correctas aceleran el cambio.',
  Ocio: 'El descanso real es donde el cuerpo y la mente consolidan los cambios.',
  Educacion: 'El aprendizaje activa la dopamina y refuerza la autoestima.',
  Finanzas: 'La estabilidad económica elimina el cortisol crónico que sabotea el cuerpo y las relaciones.',
  Rol: 'Cuando tu rol tiene sentido, tienes propósito. Y el propósito sostiene la constancia.',
  Evolucion: 'El crecimiento personal impacta en cómo te relacionas, trabajas y cuidas tu cuerpo.',
  Espiritualidad: 'La conexión con algo más grande aporta calma, perspectiva y resiliencia.',
}

const ACCIONES: Record<string, string[]> = {
  Salud: ['Establece tu práctica mínima de movimiento: 25-40 minutos diarios — sin negociar.','Incorpora el orden correcto al comer: fibra → proteína → carbohidrato.','Añade 10 minutos de caminata post-comida para regular glucosa.','Cada mañana recuérdate: soy alguien que se mueve todos los días.'],
  Pareja: ['Una conversación honesta esta semana sobre cómo estás realmente.','Define qué necesitas de esta relación — primero para ti.','Introduce un ritual de conexión semanal de 20 minutos sin teléfonos.','Trabaja tu diálogo interno antes de exigir cambios externos.'],
  Familia: ['Un momento de presencia real con tu familia esta semana — sin agenda.','Identifica el vínculo familiar que más energía te consume.','Establece un límite claro en una situación familiar que te agota.','Celebra en voz alta un logro de alguien de tu familia.'],
  Relaciones: ['Contacta hoy a una persona que nutre tu vida.','Identifica las relaciones que drenan tu energía y decide cómo gestionarlas.','Busca una comunidad alineada con la persona que estás construyendo.','Practica ver en alguien cercano lo que ellos no ven en sí mismos.'],
  Ocio: ['Reserva 30 minutos solo para ti en los próximos 3 días — en agenda.','Identifica qué actividad te recarga de verdad y hazla esta semana.','Practica decir no a una demanda externa para proteger tu descanso.','Introduce yoga, meditación o caminata como hábito semanal.'],
  Educacion: ['Dedica 20 minutos diarios a aprender algo que te mueve.','Termina un libro, curso o recurso postergado — esta semana uno.','Comparte lo que aprendes con alguien — enseñar consolida el aprendizaje.','Identifica la habilidad de mayor impacto y diseña un plan de 30 días.'],
  Finanzas: ['Haz una auditoría de ingresos y gastos del último mes esta semana.','Identifica una fuente de ingreso que puedas iniciar o expandir en 30 días.','Establece una regla de ahorro mínimo mensual — pequeña pero constante.','Revisa tu relación emocional con el dinero: ¿dónde está el bloqueo real?'],
  Rol: ['Define en una frase qué significa cumplir bien tu rol esta semana.','Identifica qué parte de tu rol actual te da más energía y poténciala.','Habla con alguien sobre lo que quieres construir — dilo en voz alta.','Haz una acción concreta hacia tu rol deseado esta semana.'],
  Evolucion: ['Lee o escucha algo que expanda tu perspectiva hoy — 20 minutos.','Completa el decágrama mensualmente para medir tu progreso real.','Ponle nombre a un patrón que quieres romper — lo que nombras pierde poder.','Busca un mentor, coach o comunidad que vea tu mejor versión antes que tú.'],
  Espiritualidad: ['10 minutos de silencio o meditación cada mañana antes del teléfono.','Escribe una página de diario esta noche — sin filtros.','Identifica qué le da sentido profundo a tu vida más allá de los logros.','Conecta con la naturaleza esta semana — caminata, sol, silencio.'],
}

interface Profile { nombre: string; apellido: string; edad: string; pais: string; sexo: Sex | ''; reto: string; tiempo: string }
interface Horizons { h1donde: string; h1logro: string; h1feel: string; h5donde: string; h5logro: string; h5feel: string; h10donde: string; h10logro: string; declaracion: string }
interface Desires { peso: string; grasa: string; energia: string; cuerpo: string; trabajo: string; ingresos: string; relaciones: string; palabras: string; chips: string[] }

function drawRadar(canvasId: string, nowV: number[], wantV: number[]) {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null
  if (!canvas) return
  const ctx = canvas.getContext('2d')!
  const CX = 150, CY = 150, R = 108, N = 10
  ctx.clearRect(0, 0, 300, 300)
  for (let r = 1; r <= 5; r++) {
    ctx.beginPath()
    for (let i = 0; i < N; i++) {
      const a = Math.PI * 2 * i / N - Math.PI / 2, rr = r / 5 * R
      if (i === 0) ctx.moveTo(CX + rr * Math.cos(a), CY + rr * Math.sin(a))
      else ctx.lineTo(CX + rr * Math.cos(a), CY + rr * Math.sin(a))
    }
    ctx.closePath()
    ctx.strokeStyle = r === 5 ? 'rgba(201,168,76,.2)' : 'rgba(255,255,255,.06)'
    ctx.lineWidth = r === 5 ? 1 : 0.5
    ctx.stroke()
  }
  for (let i = 0; i < N; i++) {
    const a = Math.PI * 2 * i / N - Math.PI / 2
    ctx.beginPath(); ctx.moveTo(CX, CY); ctx.lineTo(CX + (R + 4) * Math.cos(a), CY + (R + 4) * Math.sin(a))
    ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 0.5; ctx.stroke()
    ctx.font = '10px sans-serif'; ctx.fillStyle = 'rgba(240,236,227,.4)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(DOMAINS[i], CX + (R + 22) * Math.cos(a), CY + (R + 22) * Math.sin(a))
  }
  const polys: [number[], string, string][] = [
    [wantV, 'rgba(201,168,76,.1)', 'rgba(201,168,76,.6)'],
    [nowV, 'rgba(255,255,255,.05)', 'rgba(255,255,255,.28)'],
  ]
  polys.forEach(([vals, fill, stroke]) => {
    ctx.beginPath()
    for (let i = 0; i < N; i++) {
      const a = Math.PI * 2 * i / N - Math.PI / 2, rr = vals[i] / 10 * R
      if (i === 0) ctx.moveTo(CX + rr * Math.cos(a), CY + rr * Math.sin(a))
      else ctx.lineTo(CX + rr * Math.cos(a), CY + rr * Math.sin(a))
    }
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke()
  })
  for (let i = 0; i < N; i++) {
    const a = Math.PI * 2 * i / N - Math.PI / 2;
    [[nowV[i], 'rgba(255,255,255,.45)'], [wantV[i], '#c9a84c']].forEach(([v, c]) => {
      const rr = (v as number) / 10 * R
      ctx.beginPath(); ctx.arc(CX + rr * Math.cos(a), CY + rr * Math.sin(a), 3, 0, Math.PI * 2)
      ctx.fillStyle = c as string; ctx.fill()
    })
  }
}

export default function MotorDeIdentidad() {
  const [loading, setLoading] = useState(true)
  const [noAccess, setNoAccess] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  const [profile, setProfile] = useState<Profile>({ nombre: '', apellido: '', edad: '', pais: '', sexo: '', reto: '', tiempo: '' })
  const [nowV, setNowV] = useState<number[]>(Array(10).fill(5))
  const [wantV, setWantV] = useState<number[]>(Array(10).fill(7))
  const [desires, setDesires] = useState<Desires>({ peso: '', grasa: '', energia: '', cuerpo: '', trabajo: '', ingresos: '', relaciones: '', palabras: '', chips: [] })
  const [horizons, setHorizons] = useState<Horizons>({ h1donde: '', h1logro: '', h1feel: '', h5donde: '', h5logro: '', h5feel: '', h10donde: '', h10logro: '', declaracion: '' })
  const [result, setResult] = useState<null | { diag: string; pri: string; roadmap: string; timeline: string; bloqueos: string; identity: string; gaps: { d: string; ds: string; n: number; w: number; g: number }[] }>(null)

  const canvas1Ref = useRef<HTMLCanvasElement>(null)
  const canvas2Ref = useRef<HTMLCanvasElement>(null)

  // Check tool access on mount
  useEffect(() => {
    fetch('/api/identity-diagnostics')
      .then(async (res) => {
        if (res.status === 403) { setNoAccess(true); return }
        if (!res.ok) { setNoAccess(true); return }
        const data = await res.json()
        setUserEmail(data.email ?? '')
      })
      .catch(() => setNoAccess(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (step === 2 || step === 4) setTimeout(() => drawRadar('mdi-rc1', nowV, wantV), 50)
  }, [step, nowV, wantV])

  useEffect(() => {
    if (result) setTimeout(() => drawRadar('mdi-rc2', nowV, wantV), 100)
  }, [result, nowV, wantV])

  const sex = profile.sexo as Sex | ''
  const genderWord = (fem: string, masc: string, neutral?: string) =>
    sex === 'mujer' ? fem : sex === 'hombre' ? masc : (neutral ?? masc)
  const iAmPhrase = sex === 'mujer' ? 'Soy una mujer que' : sex === 'hombre' ? 'Soy un hombre que' : 'Soy alguien que'

  const toggleChip = (w: string) =>
    setDesires(d => ({ ...d, chips: d.chips.includes(w) ? d.chips.filter(c => c !== w) : [...d.chips, w] }))

  const buildResult = () => {
    const gaps = DOMAIN_KEYS.map((d, i) => ({ d, ds: DOMAINS[i], n: nowV[i], w: wantV[i], g: wantV[i] - nowV[i] })).sort((a, b) => b.g - a.g)
    const top3 = gaps.filter(g => g.g > 0).slice(0, 3)
    if (top3.length === 0) top3.push(gaps[0])
    const [p1, p2, p3] = [top3[0], top3[1] || top3[0], top3[2] || top3[1] || top3[0]]
    const avgN = Math.round(nowV.reduce((a, b) => a + b, 0) / 10 * 10) / 10
    const avgW = Math.round(wantV.reduce((a, b) => a + b, 0) / 10 * 10) / 10
    const proName = profile.nombre || 'tú'
    const palabras = [desires.chips.join(', '), desires.palabras].filter(Boolean).join(', ') || 'fuerte y libre'

    const diag = [`${proName}, tu decágrama muestra un promedio actual de ${avgN}/10 con un objetivo de ${avgW}/10 en los próximos 12 meses.`,
      p1.g >= 4 ? `El dominio que más te está pesando es ${p1.ds} — con una brecha de ${p1.g} puntos. ${CASCADE[p1.d]}` : '',
      profile.reto ? `Lo que describes como tu mayor reto — "${profile.reto}" — está directamente conectado con tu mapa.` : '',
      nowV[0] <= 5 ? `Tu puntuación en Salud (${nowV[0]}/10) indica que el cuerpo está cargando más de lo que debería.` : '',
      profile.tiempo ? `Llevas ${profile.tiempo.toLowerCase()} intentando cambiar esto. Eso no es fracaso — es evidencia de que el sistema no tenía la estructura correcta hasta ahora.` : '',
    ].filter(Boolean).join('\n\n')

    const pri = `Las 3 prioridades para ${proName} en orden de impacto cascada:\n\n` + top3.map((g, i) =>
      `${i + 1}. ${g.ds.toUpperCase()} (${g.n} → ${g.w})\n${CASCADE[g.d]}`).join('\n\n')

    const a1 = ACCIONES[p1.d] || ACCIONES['Salud']
    const a2 = ACCIONES[p2.d] || ACCIONES['Finanzas']
    const a3 = ACCIONES[p3.d] || ACCIONES['Evolucion']
    const roadmap = `SEMANAS 1-2 — ${p1.ds}\n${a1[0]}\n${a1[1]}\n\nSEMANAS 3-4 — ${p2.ds}\n${a2[0]}\n${a2[1]}\n\nMES 2 — ${p3.ds}\n${a3[0]}\n${a3[1]}\n\nMES 3 — Revisión\nCompleta de nuevo el decágrama. Diseña el siguiente ciclo de 90 días.`

    const h10 = horizons.h10logro || `eres ${genderWord('la mujer', 'el hombre', 'la persona')} que declaraste ser: ${palabras}`
    const timeline = `HOY\nPunto de partida: ${avgN}/10.\n\n4 SEMANAS\nPrimer hábito en ${p1.ds} instalado.\n\nFINAL DE AÑO\n${horizons.h1feel || `${p1.ds} llega a ${Math.min(10, p1.n + 2)}/10`}.\n\nEN 5 AÑOS\n${horizons.h5feel || 'Los 3 dominios prioritarios superan el 7/10'}.\n\nEN 10 AÑOS\n${h10}.`

    const bloqueos = `Patrones que probablemente van a frenar a ${proName}:\n\n1. EL REGRESO AL ESTADO CONOCIDO\nSeñal: "estaba yendo bien pero..."\nIntervención: Protocolo 90 segundos — nombra el disparador, respiración 4-7-8.\n\n2. LA PERFECCIÓN COMO EXCUSA\nSeñal: "ya lo arruiné, mañana empiezo."\nIntervención: el estándar no es la perfección — es la constancia.\n\n3. HACER EL CAMINO ${genderWord('SOLA', 'SOLO')}\nSeñal: "no quiero molestar a nadie."\nIntervención: el progreso sin testigo se vuelve invisible.`

    const decl = horizons.declaracion
    const identity = decl ? `"${iAmPhrase} ${decl}"` : `"${iAmPhrase} elige el bienestar aunque no lo sienta todavía, que construye su nueva identidad un día a la vez."`

    return { diag, pri, roadmap, timeline, bloqueos, identity, gaps }
  }

  const finalize = async () => {
    setSaving(true)
    const res = buildResult()
    setResult(res)
    try {
      await fetch('/api/identity-diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, nowV, wantV, desires, horizons, result: res }),
      })
    } catch { /* non-blocking */ }
    setSaving(false)
  }

  const goStep = (n: number) => { setStep(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const pct = [20, 40, 60, 80, 100][step - 1]
  const stepLabels = ['Perfil', 'Decágrama', 'Identidad', 'Horizontes', 'Resultado']

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#080d1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f0ece3' }}>
      <p style={{ opacity: 0.5 }}>Verificando acceso...</p>
    </div>
  )

  if (noAccess) return (
    <div style={{ minHeight: '100vh', background: '#080d1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
        <h2 style={{ color: '#c9a84c', fontFamily: '"Cormorant Garamond", serif', fontSize: '1.5rem', marginBottom: '0.75rem' }}>Acceso exclusivo</h2>
        <p style={{ color: 'rgba(240,236,227,.6)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
          El Motor de Identidad es exclusivo para alumnas de M&M Training Club y Plan Premium M&M.
        </p>
        <a href="/" style={{ color: '#c9a84c', fontSize: '0.85rem' }}>← Volver al inicio</a>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#080d1a', color: '#f0ece3', fontFamily: '"DM Sans", sans-serif' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(201,168,76,.07) 0%, transparent 60%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 20px 80px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', padding: '44px 24px 32px' }}>
          <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 26, fontWeight: 400, letterSpacing: 3, textTransform: 'uppercase', color: '#f0ece3', marginBottom: 6 }}>Ray Viloria</div>
          <div style={{ fontSize: 11, letterSpacing: 2.5, textTransform: 'uppercase', color: '#c9a84c', marginBottom: 12, opacity: 0.8 }}>Motor de Identidad</div>
          <p style={{ fontSize: 13, color: 'rgba(240,236,227,.45)', lineHeight: 1.75 }}>Diagnóstico Ontológico · Decágrama del Ser · Roadmap personalizado</p>
          {userEmail && <p style={{ fontSize: 11, color: 'rgba(240,236,227,.25)', marginTop: 8 }}>{userEmail}</p>}
        </div>

        {/* Progress */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            {stepLabels.map((l, i) => (
              <span key={l} style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: i + 1 < step ? 'rgba(201,168,76,.45)' : i + 1 === step ? '#c9a84c' : 'rgba(240,236,227,.2)' }}>{l}</span>
            ))}
          </div>
          <div style={{ height: 2, background: 'rgba(255,255,255,.06)', borderRadius: 1, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: '#c9a84c', borderRadius: 1, transition: 'width .5s ease' }} />
          </div>
        </div>

        {/* STEP 1 — Perfil */}
        {step === 1 && (
          <div>
            <StepHeader num="1" title="Cuéntame quién eres" sub="Esta información personaliza tu diagnóstico y Roadmap." />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <QField label="Nombre"><QInput value={profile.nombre} onChange={v => setProfile(p => ({ ...p, nombre: v }))} placeholder="Tu nombre" /></QField>
              <QField label="Apellido"><QInput value={profile.apellido} onChange={v => setProfile(p => ({ ...p, apellido: v }))} placeholder="Tu apellido" /></QField>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
              <QField label="Edad"><QInput type="number" value={profile.edad} onChange={v => setProfile(p => ({ ...p, edad: v }))} placeholder="años" /></QField>
              <QField label="País"><QInput value={profile.pais} onChange={v => setProfile(p => ({ ...p, pais: v }))} placeholder="¿Dónde vives?" /></QField>
              <QField label="Sexo">
                <select value={profile.sexo} onChange={e => setProfile(p => ({ ...p, sexo: e.target.value as Sex }))} style={selStyle}>
                  <option value="">Selecciona...</option>
                  <option value="mujer">Mujer</option>
                  <option value="hombre">Hombre</option>
                </select>
              </QField>
            </div>
            <QField label="¿Cuál es tu mayor reto ahora mismo?">
              <textarea value={profile.reto} onChange={e => setProfile(p => ({ ...p, reto: e.target.value }))} placeholder="¿Qué te trajo aquí? ¿Qué quieres cambiar?" style={{ ...selStyle, resize: 'vertical', minHeight: 72, lineHeight: 1.6 }} />
            </QField>
            <QField label="¿Cuánto tiempo llevas intentando cambiar esto?">
              <select value={profile.tiempo} onChange={e => setProfile(p => ({ ...p, tiempo: e.target.value }))} style={selStyle}>
                <option value="">Selecciona...</option>
                <option>Menos de 6 meses</option>
                <option>Entre 6 meses y 1 año</option>
                <option>Entre 1 y 3 años</option>
                <option>Más de 3 años</option>
              </select>
            </QField>
          </div>
        )}

        {/* STEP 2 — Decágrama */}
        {step === 2 && (
          <div>
            <StepHeader num="2" title="Tu mapa actual y tu mapa deseado" sub="Primer slider = dónde estás HOY · Segundo = dónde quieres estar en 12 meses." />
            <div style={{ display: 'flex', gap: 16, marginBottom: 14, fontSize: 11, color: 'rgba(240,236,227,.4)' }}>
              <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,.4)', marginRight: 4 }} />Hoy</span>
              <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#c9a84c', marginRight: 4 }} />12 meses</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: '1rem' }}>
              {DOMAIN_KEYS.map((d, i) => (
                <div key={d} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(240,236,227,.65)', marginBottom: 5 }}>{DOMAINS[i]}</div>
                  <SliderRow label="Hoy" color="rgba(255,255,255,.3)" value={nowV[i]} onChange={v => setNowV(arr => { const n = [...arr]; n[i] = v; return n })} />
                  <SliderRow label="12m" color="#c9a84c" value={wantV[i]} onChange={v => setWantV(arr => { const n = [...arr]; n[i] = v; return n })} gold />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
              <canvas ref={canvas1Ref} id="mdi-rc1" width={300} height={300} />
            </div>
          </div>
        )}

        {/* STEP 3 — Identidad */}
        {step === 3 && (
          <div>
            <StepHeader num="3" title="El cuerpo y la vida que quieres" sub="Cuanto más específic@ seas, más preciso será tu roadmap." />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
              {[['Peso Ideal', 'peso', '__ kg'], ['% Grasa Ideal', 'grasa', '__%'], ['Energía /10', 'energia', '__/10']].map(([lbl, key, ph]) => (
                <div key={key} style={{ background: 'rgba(240,236,227,.04)', border: '.5px solid rgba(201,168,76,.12)', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(201,168,76,.5)', marginBottom: 4 }}>{lbl}</div>
                  <input value={(desires as unknown as Record<string, string>)[key]} onChange={e => setDesires(d => ({ ...d, [key]: e.target.value }))} placeholder={ph} style={{ background: 'transparent', border: 'none', borderBottom: '.5px solid rgba(201,168,76,.15)', color: '#f0ece3', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, width: '100%', padding: '2px 0' }} />
                </div>
              ))}
            </div>
            <QField label="¿Cómo se siente ese cuerpo por dentro?">
              <textarea value={desires.cuerpo} onChange={e => setDesires(d => ({ ...d, cuerpo: e.target.value }))} placeholder="Fuerte, ágil, sin inflamación..." style={{ ...selStyle, resize: 'vertical', minHeight: 72 }} />
            </QField>
            <Hr />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <QField label="Trabajo o actividad"><QInput value={desires.trabajo} onChange={v => setDesires(d => ({ ...d, trabajo: v }))} placeholder="¿Qué hace?" /></QField>
              <QField label="Ingresos mensuales"><QInput value={desires.ingresos} onChange={v => setDesires(d => ({ ...d, ingresos: v }))} placeholder="€ o $ ___/mes" /></QField>
            </div>
            <QField label="¿Cómo son sus relaciones y entorno?">
              <textarea value={desires.relaciones} onChange={e => setDesires(d => ({ ...d, relaciones: e.target.value }))} placeholder="Pareja, familia, amistades..." style={{ ...selStyle, resize: 'vertical', minHeight: 64 }} />
            </QField>
            <Hr />
            <div style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(201,168,76,.65)', marginBottom: 8 }}>Palabras que te describen</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {CHIPS.map(w => (
                <button key={w} onClick={() => toggleChip(w)} style={{ background: desires.chips.includes(w) ? 'rgba(201,168,76,.12)' : 'rgba(240,236,227,.04)', border: `.5px solid ${desires.chips.includes(w) ? 'rgba(201,168,76,.4)' : 'rgba(201,168,76,.12)'}`, borderRadius: 20, padding: '5px 12px', fontSize: 11, color: desires.chips.includes(w) ? '#c9a84c' : 'rgba(240,236,227,.5)', cursor: 'pointer', fontFamily: 'inherit' }}>{w}</button>
              ))}
            </div>
            <QField label="O escribe las tuyas"><QInput value={desires.palabras} onChange={v => setDesires(d => ({ ...d, palabras: v }))} placeholder="Ej: auténtic@, libre..." /></QField>
          </div>
        )}

        {/* STEP 4 — Horizontes */}
        {step === 4 && (
          <div>
            <StepHeader num="4" title="Tus horizontes de vida" sub="El cerebro necesita imágenes vívidas del futuro para moverse hacia él." />
            {([['A final de este año', 'h1donde', 'h1logro', 'h1feel'], ['En 5 años', 'h5donde', 'h5logro', 'h5feel'], ['En 10 años', 'h10donde', 'h10logro', null]] as const).map(([title, f1, f2, f3]) => (
              <div key={title} style={{ background: 'rgba(240,236,227,.03)', border: '.5px solid rgba(201,168,76,.1)', borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
                <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#c9a84c', marginBottom: 10, opacity: 0.7 }}>{title}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: f3 ? 8 : 0 }}>
                  <QField label="¿Dónde está?"><QInput value={horizons[f1]} onChange={v => setHorizons(h => ({ ...h, [f1]: v }))} placeholder="Ciudad, situación..." /></QField>
                  <QField label={f2 === 'h10logro' ? '¿Cuál es su legado?' : f2 === 'h5logro' ? '¿Qué construyó?' : '¿Qué logró?'}><QInput value={horizons[f2]} onChange={v => setHorizons(h => ({ ...h, [f2]: v }))} placeholder="Un logro concreto..." /></QField>
                </div>
                {f3 && (
                  <QField label={f3 === 'h1feel' ? '¿Cómo se siente?' : '¿Quién es?'}>
                    <textarea value={horizons[f3]} onChange={e => setHorizons(h => ({ ...h, [f3!]: e.target.value }))} style={{ ...selStyle, resize: 'vertical', minHeight: 56 }} />
                  </QField>
                )}
              </div>
            ))}
            <Hr />
            <QField label={`"${iAmPhrase}..."`}>
              <textarea value={horizons.declaracion} onChange={e => setHorizons(h => ({ ...h, declaracion: e.target.value }))} placeholder="Lo que ya estás eligiendo ser..." style={{ ...selStyle, resize: 'vertical', minHeight: 72 }} />
            </QField>
          </div>
        )}

        {/* STEP 5 — Resultado */}
        {step === 5 && (
          <div>
            {!result ? (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <div style={{ fontSize: 36, marginBottom: 16 }}>⚡</div>
                <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 22, color: '#f0ece3', marginBottom: 12 }}>Generando tu diagnóstico...</div>
                <button onClick={finalize} disabled={saving} style={{ background: 'rgba(201,168,76,.15)', border: '.5px solid rgba(201,168,76,.5)', color: '#c9a84c', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                  {saving ? 'Guardando...' : 'Ver mi diagnóstico completo →'}
                </button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(201,168,76,.55)', marginBottom: 4 }}>Tu diagnóstico personalizado</div>
                <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 24, color: '#f0ece3', marginBottom: '1.5rem' }}>Motor de Identidad — {profile.nombre || 'Resultado'}</div>

                <ResultSection title="Mapa de brechas">
                  {result.gaps.map(g => {
                    const pctBar = Math.max(0, Math.abs(g.g) / 10 * 100)
                    const color = g.g >= 5 ? '#E24B4A' : g.g >= 3 ? '#BA7517' : g.g > 0 ? '#1D9E75' : '#444'
                    return (
                      <div key={g.d} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <span style={{ fontSize: 12, color: 'rgba(240,236,227,.45)', width: 110, flexShrink: 0 }}>{g.ds}</span>
                        <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,.07)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pctBar}%`, background: color, borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: 11, color: 'rgba(240,236,227,.35)', width: 40, textAlign: 'right' }}>{g.n}→{g.w}</span>
                      </div>
                    )
                  })}
                </ResultSection>

                <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
                  <canvas ref={canvas2Ref} id="mdi-rc2" width={300} height={300} />
                </div>

                <Hr />
                <ResultSection title="Diagnóstico"><ResultBox text={result.diag} /></ResultSection>
                <ResultSection title="Tus 3 prioridades"><ResultBox text={result.pri} /></ResultSection>
                <ResultSection title="Tu roadmap — primeros 90 días"><ResultBox text={result.roadmap} /></ResultSection>
                <ResultSection title="Tu línea de tiempo"><ResultBox text={result.timeline} /></ResultSection>
                <ResultSection title="Lo que te frenará — y cómo interrumpirlo"><ResultBox text={result.bloqueos} /></ResultSection>

                <div style={{ background: 'rgba(201,168,76,.07)', border: '.5px solid rgba(201,168,76,.25)', borderRadius: 12, padding: 18, fontSize: 15, fontStyle: 'italic', color: '#c9a84c', lineHeight: 1.7, textAlign: 'center', marginBottom: 16, fontFamily: '"Cormorant Garamond", serif' }}>
                  {result.identity}
                </div>

                <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => { setResult(null); goStep(1) }} style={{ background: 'transparent', border: '.5px solid rgba(240,236,227,.15)', color: 'rgba(240,236,227,.5)', borderRadius: 10, fontSize: 12, padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit' }}>← Editar respuestas</button>
                  <a href="/" style={{ background: 'rgba(201,168,76,.1)', border: '.5px solid rgba(201,168,76,.3)', color: '#c9a84c', borderRadius: 10, fontSize: 12, padding: '8px 16px', textDecoration: 'none', fontFamily: 'inherit' }}>Ir a Nutri Virtual →</a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        {step < 5 && (
          <div style={{ display: 'flex', gap: 10, marginTop: '1.5rem' }}>
            {step > 1 && <button onClick={() => goStep(step - 1)} style={backBtn}>← Atrás</button>}
            <button onClick={() => step === 4 ? goStep(5) : goStep(step + 1)} style={nextBtn}>
              {step === 4 ? 'Ver diagnóstico →' : 'Continuar →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function StepHeader({ num, title, sub }: { num: string; title: string; sub: string }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(201,168,76,.5)', marginBottom: 6 }}>Paso {num} de 4</div>
      <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 24, color: '#f0ece3', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'rgba(240,236,227,.45)', lineHeight: 1.65 }}>{sub}</div>
    </div>
  )
}
function QField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 12 }}><label style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(201,168,76,.65)', marginBottom: 5, display: 'block' }}>{label}</label>{children}</div>
}
function QInput({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={selStyle} />
}
function SliderRow({ label, color, value, onChange, gold }: { label: string; color: string; value: number; onChange: (v: number) => void; gold?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <span style={{ fontSize: 10, width: 52, flexShrink: 0, color }}>{label}</span>
      <input type="range" min={0} max={10} step={1} value={value} onChange={e => onChange(Number(e.target.value))} style={{ flex: 1, height: 4, borderRadius: 2, outline: 'none', cursor: 'pointer', accentColor: gold ? '#c9a84c' : '#888' }} />
      <span style={{ fontSize: 11, fontWeight: 500, width: 18, textAlign: 'right', color: 'rgba(240,236,227,.8)' }}>{value}</span>
    </div>
  )
}
function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(201,168,76,.55)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        {title}<div style={{ flex: 1, height: .5, background: 'rgba(201,168,76,.1)' }} />
      </div>
      {children}
    </div>
  )
}
function ResultBox({ text }: { text: string }) {
  return <div style={{ background: 'rgba(240,236,227,.03)', border: '.5px solid rgba(201,168,76,.1)', borderRadius: 12, padding: 16, fontSize: 13, color: 'rgba(240,236,227,.82)', lineHeight: 1.85, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{text}</div>
}
function Hr() { return <div style={{ height: .5, background: 'rgba(201,168,76,.1)', margin: '18px 0' }} /> }

const selStyle: React.CSSProperties = { width: '100%', background: 'rgba(240,236,227,.04)', border: '.5px solid rgba(201,168,76,.15)', borderRadius: 10, color: '#f0ece3', fontFamily: '"DM Sans", sans-serif', fontSize: 13, padding: '10px 14px' }
const backBtn: React.CSSProperties = { background: 'transparent', border: '.5px solid rgba(240,236,227,.15)', color: 'rgba(240,236,227,.5)', borderRadius: 10, fontSize: 13, padding: '10px 22px', cursor: 'pointer', fontFamily: 'inherit' }
const nextBtn: React.CSSProperties = { background: 'rgba(201,168,76,.1)', border: '.5px solid rgba(201,168,76,.35)', color: '#c9a84c', fontWeight: 500, borderRadius: 10, fontSize: 13, padding: '10px 22px', cursor: 'pointer', fontFamily: 'inherit' }
