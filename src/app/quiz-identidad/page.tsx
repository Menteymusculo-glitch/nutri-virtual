'use client'

import { useState, useEffect, useRef } from 'react'

type Sex = 'mujer' | 'hombre'

const DOMAINS = ['Salud','Pareja','Familia','Relaciones','Ocio','Educación','Finanzas','Rol','Evolución','Espiritualidad']
const DOMAIN_KEYS = ['Salud','Pareja','Familia','Relaciones','Ocio','Educacion','Finanzas','Rol','Evolucion','Espiritualidad']
const CHIPS = ['Libre','Fuerte','Serene','Auténtico/a','Poderoso/a','Seguro/a','Luminoso/a','Enraizado/a','Elegante','Natural','Constante','Valiente','Enfocado/a','En paz']

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

const RECOGNITION: Record<number, (name: string, sex: Sex) => string> = {
  1: (name) => `Gracias, ${name}. Ya tienes tu punto de partida. Ahora vamos a mapear dónde estás realmente.`,
  2: (name, sex) => {
    const art = sex === 'mujer' ? 'una mujer' : 'un hombre'
    return `${name}, este mapa lo que muestra es que eres ${art} con mucho más potencial del que estás usando ahora mismo. Eso es lo importante.`
  },
  3: (name) => `${name}, esto es clave: la distancia entre dónde estás y dónde quieres estar no es un problema de voluntad — es un problema de sistema. Y eso tiene solución.`,
  4: (name) => `Esos horizontes que describes, ${name}, son posibles. Lo que los separa del presente es estructura y acompañamiento — no capacidad.`,
}

const TESTIMONIAL = {
  texto: '"Hice el quiz pensando que solo era un test más. Al final tenía un mapa de mi vida que nunca había visto con tanta claridad. Ese día decidí trabajar con Ray. Han pasado 6 meses y la persona del quiz ya no me reconocería."',
  nombre: 'Alejandra M.',
  resultado: 'Perdió 14 kg · De 4/10 a 8/10 en Salud',
}

interface Profile {
  nombre: string; apellido: string; edad: string; pais: string; sexo: Sex | ''
  email: string; tel: string; reto: string; tiempo: string
}
interface Horizons {
  h1donde: string; h1logro: string; h1feel: string
  h5donde: string; h5logro: string; h5feel: string
  h10donde: string; h10logro: string
  declaracion: string
}
interface Desires {
  peso: string; grasa: string; energia: string; cuerpo: string
  trabajo: string; ingresos: string; relaciones: string
  palabras: string; chips: string[]
}

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

export default function QuizIdentidad() {
  const [step, setStep] = useState(1)
  const [recognition, setRecognition] = useState('')

  // Step 1 — profile
  const [profile, setProfile] = useState<Profile>({ nombre: '', apellido: '', edad: '', pais: '', sexo: '', email: '', tel: '', reto: '', tiempo: '' })

  // Step 2 — radar sliders
  const [nowV, setNowV] = useState<number[]>(Array(10).fill(5))
  const [wantV, setWantV] = useState<number[]>(Array(10).fill(7))
  const canvas1Ref = useRef<HTMLCanvasElement>(null)

  // Step 3 — desires
  const [desires, setDesires] = useState<Desires>({ peso: '', grasa: '', energia: '', cuerpo: '', trabajo: '', ingresos: '', relaciones: '', palabras: '', chips: [] })

  // Step 4 — horizons
  const [horizons, setHorizons] = useState<Horizons>({ h1donde: '', h1logro: '', h1feel: '', h5donde: '', h5logro: '', h5feel: '', h10donde: '', h10logro: '', declaracion: '' })

  // Email gate (before step 5 result)
  const [email, setEmail] = useState(profile.email)
  const [emailSubmitting, setEmailSubmitting] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailDone, setEmailDone] = useState(false)

  // Step 5 — result
  const [result, setResult] = useState<null | {
    diag: string; pri: string; roadmap: string; timeline: string; bloqueos: string; identity: string
    gaps: { d: string; ds: string; n: number; w: number; g: number }[]
  }>(null)
  const canvas2Ref = useRef<HTMLCanvasElement>(null)

  // Keep email in sync with profile.email
  useEffect(() => { if (profile.email) setEmail(profile.email) }, [profile.email])

  useEffect(() => {
    if (step === 2 || step === 4) setTimeout(() => drawRadar('rc1', nowV, wantV), 50)
  }, [step, nowV, wantV])

  useEffect(() => {
    if (result) setTimeout(() => drawRadar('rc2', nowV, wantV), 100)
  }, [result, nowV, wantV])

  const goStep = (n: number) => {
    if (n > step) {
      const msg = RECOGNITION[step]
      if (msg) setRecognition(msg(profile.nombre || 'tú', profile.sexo || 'mujer'))
    }
    setStep(n)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const sex = (profile.sexo as Sex) || 'mujer'
  const proName = profile.nombre || 'tú'

  const genderWord = (fem: string, masc: string) => sex === 'mujer' ? fem : masc
  const iAmPhrase = sex === 'mujer' ? 'Soy una mujer que' : 'Soy alguien que'

  const toggleChip = (w: string) => {
    setDesires(d => ({
      ...d,
      chips: d.chips.includes(w) ? d.chips.filter(c => c !== w) : [...d.chips, w],
    }))
  }

  const buildResult = () => {
    const gaps = DOMAIN_KEYS.map((d, i) => ({ d, ds: DOMAINS[i], n: nowV[i], w: wantV[i], g: wantV[i] - nowV[i] }))
      .sort((a, b) => b.g - a.g)
    const top3 = gaps.filter(g => g.g > 0).slice(0, 3)
    if (top3.length === 0) top3.push(gaps[0])
    const [p1, p2, p3] = [top3[0], top3[1] || top3[0], top3[2] || top3[1] || top3[0]]
    const avgN = Math.round(nowV.reduce((a, b) => a + b, 0) / 10 * 10) / 10
    const avgW = Math.round(wantV.reduce((a, b) => a + b, 0) / 10 * 10) / 10
    const palabras = [desires.chips.join(', '), desires.palabras].filter(Boolean).join(', ') || 'fuerte y libre'

    const diag = [
      `${proName}, tu decágrama muestra un promedio actual de ${avgN}/10 con un objetivo de ${avgW}/10 en los próximos 12 meses. Eso no es una brecha pequeña — es un trabajo de transformación real.`,
      p1.g >= 4 ? `El dominio que más te está pesando es ${p1.ds} — con una brecha de ${p1.g} puntos. No es casualidad que sea este. ${CASCADE[p1.d]}` : '',
      profile.reto ? `Lo que describes como tu mayor reto — "${profile.reto}" — está directamente conectado con tu mapa. No es un problema de voluntad. Es un problema de sistema.` : '',
      nowV[0] <= 5 ? `Tu puntuación en Salud (${nowV[0]}/10) me dice que el cuerpo está cargando más de lo que debería. El cuerpo es el sistema operativo de todo lo demás.` : '',
      nowV[6] <= 4 ? `Las Finanzas en ${nowV[6]}/10 generan un cortisol de fondo que lo contamina todo. El estrés económico crónico es también un problema hormonal.` : '',
      nowV[4] <= 4 ? `El Ocio en ${nowV[4]}/10 revela que no estás descansando de verdad. Sin descanso real, el ciclo de transformación no se completa.` : '',
      profile.tiempo ? `Llevas ${profile.tiempo.toLowerCase()} intentando cambiar esto. Eso no es fracaso — es evidencia de que el sistema no tenía la estructura correcta hasta ahora.` : '',
    ].filter(Boolean).join('\n\n')

    const pri = `Las 3 prioridades para ${proName} en orden de impacto cascada:\n\n` + top3.map((g, i) =>
      `${i + 1}. ${g.ds.toUpperCase()} (${g.n} → ${g.w})\n${CASCADE[g.d]}\nConsecuencia de no trabajarlo: el resto del sistema seguirá compensando su ausencia.`
    ).join('\n\n')

    const a1 = ACCIONES[p1.d] || ACCIONES['Salud']
    const a2 = ACCIONES[p2.d] || ACCIONES['Finanzas']
    const a3 = ACCIONES[p3.d] || ACCIONES['Evolucion']
    const t1 = Math.min(10, Math.round((p1.n + 1.5) * 2) / 2)
    const roadmap = `SEMANAS 1-2 — Instalar la base en ${p1.ds}\n${a1[0]}\n${a1[1]}\nMétrica: medir ${p1.ds} al final de la semana 2. Objetivo: pasar de ${p1.n} a ${t1}.\n\nSEMANAS 3-4 — Añadir ${p2.ds}\n${a1[2]}\n${a2[0]}\n${a2[1]}\nMétrica: dos hábitos activos simultáneamente.\n\nMES 2 (SEMANAS 5-8) — Consolidar y añadir ${p3.ds}\n${a2[2]}\n${a3[0]}\n${a3[1]}\nEvaluación semana 8: ¿dónde están tus puntuaciones ahora?\n\nMES 3 (SEMANAS 9-12) — Siguiente nivel\n${a1[3]}\n${a2[3]}\n${a3[2]}\nEvaluación semana 12: completa de nuevo el decágrama. Diseña el siguiente ciclo de 90 días.`

    const h1 = horizons.h1feel || horizons.h1logro || `tu puntuación en ${p1.ds} llega a ${Math.min(10, p1.n + 2)}`
    const h5 = horizons.h5feel || horizons.h5logro || `los 3 dominios prioritarios superan el 7/10`
    const h10 = horizons.h10logro || `eres ${genderWord('la mujer', 'la persona')} que declaraste ser: ${palabras}`
    const timeline = `HOY\nPunto de partida real de ${proName}: ${avgN}/10. El sistema no tenía la estructura correcta.\n\n4 SEMANAS\nPrimer hábito en ${p1.ds} instalado y medible. El sistema nervioso empieza a registrar evidencia de cambio.\n\nFINAL DE ESTE AÑO\n${h1}. Las palabras "${palabras}" ya no son aspiración — son evidencia.\n\nEN 5 AÑOS\n${h5}. ${proName} ya no busca motivación — actúa desde la identidad.\n\nEN 10 AÑOS\n${h10}. El legado no es lo que acumuló — es quién se convirtió.`

    const bloqueos = `Los patrones que más probablemente van a frenar a ${proName}:\n\n1. EL REGRESO AL ESTADO CONOCIDO\nCómo se manifestará: después de 10-14 días de avance real, un disparador externo lleva al sistema de vuelta al estado familiar.\nSeñal de alerta: "estaba yendo bien pero..."\nIntervención: Protocolo 90 segundos — nombra el disparador, respiración 4-7-8, una acción física inmediata.\n\n2. LA PERFECCIÓN COMO EXCUSA\nCómo se manifestará: si un día falla, la mentalidad todo-o-nada convierte un traspié en abandono total.\nSeñal de alerta: "ya lo arruiné, mañana empiezo de nuevo."\nIntervención: el estándar no es la perfección — es la constancia.\n\n3. HACER EL CAMINO ${genderWord('SOLA', 'SOLO')}\nCómo se manifestará: sin accountability, sin comunidad — cuando flaquee no habrá nadie que vea su mejor versión.\nSeñal de alerta: "no quiero molestar a nadie con esto."\nIntervención: el progreso sin testigo se vuelve invisible. Comparte tu roadmap.`

    const decl = horizons.declaracion
    const identity = decl
      ? `"${iAmPhrase} ${decl}"`
      : `"${iAmPhrase} elige el bienestar aunque no lo sienta todavía, que construye su nueva identidad un día a la vez, con ganas, sin ganas, y a pesar de las ganas."`

    setResult({ diag, pri, roadmap, timeline, bloqueos, identity, gaps })
  }

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError('')
    setEmailSubmitting(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          tipo: 'quiz_identidad',
          datos: { profile, nowV, wantV, desires, horizons },
        }),
      })
      if (!res.ok) throw new Error()
      setEmailDone(true)
      buildResult()
    } catch {
      setEmailError('Error al guardar. Intenta de nuevo.')
    } finally {
      setEmailSubmitting(false)
    }
  }

  const pct = [20, 40, 60, 80, 100][step - 1]
  const stepLabels = ['Perfil', 'Decágrama', 'Identidad', 'Horizontes', 'Tu roadmap']

  return (
    <div style={{ minHeight: '100vh', background: '#080d1a', color: '#f0ece3', fontFamily: '"DM Sans", sans-serif' }}>
      {/* Gold glow */}
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(201,168,76,.07) 0%, transparent 60%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 20px 80px', position: 'relative', zIndex: 1 }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', padding: '44px 24px 32px' }}>
          <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 26, fontWeight: 400, letterSpacing: 3, textTransform: 'uppercase', color: '#f0ece3', marginBottom: 6 }}>Ray Viloria</div>
          <div style={{ fontSize: 11, letterSpacing: 2.5, textTransform: 'uppercase', color: '#c9a84c', marginBottom: 12, opacity: 0.8 }}>Motor de Identidad</div>
          <p style={{ fontSize: 13, color: 'rgba(240,236,227,.45)', lineHeight: 1.75, maxWidth: 360, margin: '0 auto' }}>Diagnóstico Ontológico · Diseño de Nueva Identidad · Roadmap personalizado</p>
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

        {/* Recognition banner */}
        {recognition && step > 1 && step < 5 && (
          <div style={{ background: 'rgba(201,168,76,.08)', border: '.5px solid rgba(201,168,76,.25)', borderRadius: 12, padding: '12px 16px', marginBottom: '1.5rem', fontSize: 13, color: 'rgba(240,236,227,.75)', lineHeight: 1.7, fontStyle: 'italic' }}>
            {recognition}
          </div>
        )}

        {/* STEP 1 — Profile */}
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <QField label="Email"><QInput type="email" value={profile.email} onChange={v => setProfile(p => ({ ...p, email: v }))} placeholder="tu@email.com" /></QField>
              <QField label="WhatsApp"><QInput value={profile.tel} onChange={v => setProfile(p => ({ ...p, tel: v }))} placeholder="+__ ___ ___" /></QField>
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

        {/* STEP 2 — Radar sliders */}
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
              <canvas ref={canvas1Ref} id="rc1" width={300} height={300} />
            </div>
          </div>
        )}

        {/* STEP 3 — Desires */}
        {step === 3 && (
          <div>
            <StepHeader num="3" title={`El cuerpo y la vida que ${genderWord('quieres', 'quieres')}`} sub="Cuanto más específic@ seas, más preciso será tu roadmap." />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
              {[['Peso Ideal', 'peso', '__ kg'], ['% Grasa Ideal', 'grasa', '__%'], ['Energía /10', 'energia', '__/10']].map(([lbl, key, ph]) => (
                <div key={key} style={{ background: 'rgba(240,236,227,.04)', border: '.5px solid rgba(201,168,76,.12)', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(201,168,76,.5)', marginBottom: 4 }}>{lbl}</div>
                  <input value={(desires as Record<string, string>)[key]} onChange={e => setDesires(d => ({ ...d, [key]: e.target.value }))} placeholder={ph} style={{ background: 'transparent', border: 'none', borderBottom: '.5px solid rgba(201,168,76,.15)', color: '#f0ece3', fontFamily: 'inherit', fontSize: 14, fontWeight: 500, width: '100%', padding: '2px 0' }} />
                </div>
              ))}
            </div>
            <QField label={`¿Cómo se siente ese cuerpo por dentro?`}>
              <textarea value={desires.cuerpo} onChange={e => setDesires(d => ({ ...d, cuerpo: e.target.value }))} placeholder="Fuerte, ágil, sin inflamación, descansad@..." style={{ ...selStyle, resize: 'vertical', minHeight: 72 }} />
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
            <div style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(201,168,76,.65)', marginBottom: 8 }}>Palabras que {genderWord('describen a esa persona', 'te describen')}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {CHIPS.map(w => (
                <button key={w} onClick={() => toggleChip(w)} style={{ background: desires.chips.includes(w) ? 'rgba(201,168,76,.12)' : 'rgba(240,236,227,.04)', border: `.5px solid ${desires.chips.includes(w) ? 'rgba(201,168,76,.4)' : 'rgba(201,168,76,.12)'}`, borderRadius: 20, padding: '5px 12px', fontSize: 11, color: desires.chips.includes(w) ? '#c9a84c' : 'rgba(240,236,227,.5)', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {w}
                </button>
              ))}
            </div>
            <QField label="O escribe las tuyas"><QInput value={desires.palabras} onChange={v => setDesires(d => ({ ...d, palabras: v }))} placeholder="Ej: auténtic@, libre, podeross@..." /></QField>
          </div>
        )}

        {/* Testimonial between step 3→4 */}
        {step === 3 && (
          <div style={{ background: 'rgba(201,168,76,.06)', border: '.5px solid rgba(201,168,76,.2)', borderRadius: 14, padding: '20px 20px 16px', marginTop: '1.5rem' }}>
            <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(201,168,76,.5)', marginBottom: 12 }}>Lo que dicen quienes ya lo hicieron</div>
            <p style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 16, fontStyle: 'italic', color: 'rgba(240,236,227,.8)', lineHeight: 1.7, marginBottom: 12 }}>{TESTIMONIAL.texto}</p>
            <div style={{ fontSize: 12, color: 'rgba(240,236,227,.5)' }}><strong style={{ color: '#c9a84c' }}>{TESTIMONIAL.nombre}</strong> · {TESTIMONIAL.resultado}</div>
          </div>
        )}

        {/* STEP 4 — Horizons */}
        {step === 4 && (
          <div>
            <StepHeader num="4" title="Tus horizontes de vida" sub="El cerebro necesita imágenes vívidas del futuro para moverse hacia él. Sé específic@." />
            {([['A final de este año', 'h1donde', 'h1logro', 'h1feel'], ['En 5 años', 'h5donde', 'h5logro', 'h5feel'], ['En 10 años', 'h10donde', 'h10logro', null]] as const).map(([title, f1, f2, f3]) => (
              <div key={title} style={{ background: 'rgba(240,236,227,.03)', border: '.5px solid rgba(201,168,76,.1)', borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
                <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#c9a84c', marginBottom: 10, opacity: 0.7 }}>{title}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: f3 ? 8 : 0 }}>
                  <QField label="¿Dónde está?"><QInput value={horizons[f1]} onChange={v => setHorizons(h => ({ ...h, [f1]: v }))} placeholder="Ciudad, situación..." /></QField>
                  <QField label={f2 === 'h10logro' ? '¿Cuál es su legado?' : f2 === 'h5logro' ? '¿Qué construyó?' : '¿Qué logró?'}><QInput value={horizons[f2]} onChange={v => setHorizons(h => ({ ...h, [f2]: v }))} placeholder={f2 === 'h10logro' ? 'Lo que dejó...' : 'Un logro concreto...'} /></QField>
                </div>
                {f3 && (
                  <QField label={f3 === 'h1feel' ? '¿Cómo se siente?' : '¿Quién es?'}>
                    <textarea value={horizons[f3]} onChange={e => setHorizons(h => ({ ...h, [f3!]: e.target.value }))} placeholder="Descríbelo con detalle..." style={{ ...selStyle, resize: 'vertical', minHeight: 56 }} />
                  </QField>
                )}
              </div>
            ))}
            <Hr />
            <QField label={`"${iAmPhrase}..."`}>
              <textarea value={horizons.declaracion} onChange={e => setHorizons(h => ({ ...h, declaracion: e.target.value }))} placeholder={`No lo que quieres ser. Lo que ya estás eligiendo ser...`} style={{ ...selStyle, resize: 'vertical', minHeight: 72 }} />
            </QField>
          </div>
        )}

        {/* STEP 5 — Email gate + Result */}
        {step === 5 && (
          <div>
            {!emailDone ? (
              <div style={{ background: 'rgba(201,168,76,.07)', border: '.5px solid rgba(201,168,76,.25)', borderRadius: 16, padding: 28, textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
                <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 22, color: '#f0ece3', marginBottom: 8 }}>Tu diagnóstico está listo{profile.nombre ? `, ${profile.nombre}` : ''}</div>
                <p style={{ fontSize: 13, color: 'rgba(240,236,227,.55)', lineHeight: 1.7, marginBottom: 20 }}>Ingresa tu email para ver tu Roadmap completo de 90 días y tu declaración de identidad personalizada.</p>
                <form onSubmit={submitEmail} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 380, margin: '0 auto' }}>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required style={selStyle} />
                  {emailError && <p style={{ color: '#E24B4A', fontSize: 13 }}>{emailError}</p>}
                  <button type="submit" disabled={emailSubmitting} style={{ background: 'rgba(201,168,76,.15)', border: '.5px solid rgba(201,168,76,.5)', color: '#c9a84c', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {emailSubmitting ? 'Un momento...' : 'Ver mi diagnóstico y roadmap →'}
                  </button>
                </form>
              </div>
            ) : result ? (
              <div>
                <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(201,168,76,.55)', marginBottom: 4 }}>Tu diagnóstico personalizado{profile.nombre ? `, ${profile.nombre}` : ''}</div>
                <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 24, color: '#f0ece3', marginBottom: '1.5rem' }}>Tu diagnóstico y roadmap personalizado</div>

                {/* Gaps */}
                <ResultSection title="Mapa de brechas">
                  <div>
                    {result.gaps.map(g => {
                      const pct = Math.max(0, Math.abs(g.g) / 10 * 100)
                      const color = g.g >= 5 ? '#E24B4A' : g.g >= 3 ? '#BA7517' : g.g > 0 ? '#1D9E75' : '#444'
                      return (
                        <div key={g.d} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                          <span style={{ fontSize: 12, color: 'rgba(240,236,227,.45)', width: 110, flexShrink: 0 }}>{g.ds}</span>
                          <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,.07)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: 11, color: 'rgba(240,236,227,.35)', width: 40, textAlign: 'right' }}>{g.n}→{g.w}</span>
                        </div>
                      )
                    })}
                  </div>
                </ResultSection>

                <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
                  <canvas ref={canvas2Ref} id="rc2" width={300} height={300} />
                </div>

                <Hr />
                <ResultSection title="Diagnóstico personalizado"><ResultBox text={result.diag} /></ResultSection>
                <ResultSection title="Tus 3 prioridades — en orden de impacto"><ResultBox text={result.pri} /></ResultSection>
                <ResultSection title="Tu roadmap — primeros 90 días"><ResultBox text={result.roadmap} /></ResultSection>
                <ResultSection title="Tu línea de tiempo"><ResultBox text={result.timeline} /></ResultSection>
                <ResultSection title="Lo que te frenará — y cómo interrumpirlo"><ResultBox text={result.bloqueos} /></ResultSection>

                <div style={{ background: 'rgba(201,168,76,.07)', border: '.5px solid rgba(201,168,76,.25)', borderRadius: 12, padding: 18, fontSize: 15, fontStyle: 'italic', color: '#c9a84c', lineHeight: 1.7, textAlign: 'center', marginBottom: 16, fontFamily: '"Cormorant Garamond", serif' }}>
                  {result.identity}
                </div>

                <div style={{ background: 'rgba(201,168,76,.04)', border: '.5px solid rgba(201,168,76,.18)', borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(201,168,76,.6)', marginBottom: 8 }}>Compromiso y accountability</div>
                  <p style={{ fontSize: 13, color: 'rgba(240,236,227,.5)', lineHeight: 1.6, marginBottom: 12 }}>Tu roadmap está listo. El siguiente paso es enviárselo a Ray para que sea tu Pigmalión — el que ve tu Galatea cuando tú todavía no puedes.</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => sendWhatsApp(profile, result!)} style={shareBtn}>Enviar a Ray por WhatsApp ↗</button>
                    <button onClick={() => sendEmail(profile, result!)} style={shareBtn}>Enviar por Email ↗</button>
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <button onClick={() => goStep(1)} style={{ background: 'transparent', border: '.5px solid rgba(240,236,227,.15)', color: 'rgba(240,236,227,.5)', borderRadius: 10, fontSize: 12, padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit' }}>← Editar respuestas</button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Navigation */}
        {step < 5 && (
          <div style={{ display: 'flex', gap: 10, marginTop: '1.5rem', flexWrap: 'wrap' }}>
            {step > 1 && <button onClick={() => goStep(step - 1)} style={backBtn}>← Atrás</button>}
            <button onClick={() => goStep(step + 1)} style={nextBtn}>Continuar →</button>
          </div>
        )}
      </div>
    </div>
  )
}

function sendWhatsApp(profile: Profile, result: { identity: string; pri: string }) {
  const msg = encodeURIComponent(`Hola Ray, aquí está mi perfil Motor de Identidad:\n\n${profile.nombre} ${profile.apellido} | ${profile.email}\n\n${result.identity}\n\nMis 3 prioridades:\n${result.pri.split('\n').slice(0, 6).join('\n')}`)
  window.open(`https://wa.me/34614112557?text=${msg}`, '_blank')
}

function sendEmail(profile: Profile, result: { identity: string; pri: string; roadmap: string }) {
  const s = encodeURIComponent(`Mi perfil Motor de Identidad — ${profile.nombre}`)
  const b = encodeURIComponent(`${result.identity}\n\n${result.pri}\n\n${result.roadmap}`)
  window.open(`mailto:dentrodelyoga@gmail.com?subject=${s}&body=${b}`, '_blank')
}

function StepHeader({ num, title, sub }: { num: string; title: string; sub: string }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(201,168,76,.5)', marginBottom: 6 }}>Paso {num} de 5</div>
      <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 24, color: '#f0ece3', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'rgba(240,236,227,.45)', lineHeight: 1.65 }}>{sub}</div>
    </div>
  )
}

function QField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(201,168,76,.65)', marginBottom: 5, display: 'block' }}>{label}</label>
      {children}
    </div>
  )
}

function QInput({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={selStyle}
    />
  )
}

function SliderRow({ label, color, value, onChange, gold }: { label: string; color: string; value: number; onChange: (v: number) => void; gold?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <span style={{ fontSize: 10, width: 52, flexShrink: 0, color }}>{label}</span>
      <input
        type="range" min={0} max={10} step={1} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, height: 4, borderRadius: 2, outline: 'none', cursor: 'pointer', accentColor: gold ? '#c9a84c' : '#888', background: gold ? 'rgba(201,168,76,.18)' : 'rgba(255,255,255,.12)' }}
      />
      <span style={{ fontSize: 11, fontWeight: 500, width: 18, textAlign: 'right', color: 'rgba(240,236,227,.8)' }}>{value}</span>
    </div>
  )
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(201,168,76,.55)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        {title}
        <div style={{ flex: 1, height: .5, background: 'rgba(201,168,76,.1)' }} />
      </div>
      {children}
    </div>
  )
}

function ResultBox({ text }: { text: string }) {
  return (
    <div style={{ background: 'rgba(240,236,227,.03)', border: '.5px solid rgba(201,168,76,.1)', borderRadius: 12, padding: 16, fontSize: 13, color: 'rgba(240,236,227,.82)', lineHeight: 1.85, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {text}
    </div>
  )
}

function Hr() {
  return <div style={{ height: .5, background: 'rgba(201,168,76,.1)', margin: '18px 0' }} />
}

const selStyle: React.CSSProperties = {
  width: '100%', background: 'rgba(240,236,227,.04)', border: '.5px solid rgba(201,168,76,.15)',
  borderRadius: 10, color: '#f0ece3', fontFamily: '"DM Sans", sans-serif', fontSize: 13,
  padding: '10px 14px', marginBottom: 0,
}

const backBtn: React.CSSProperties = {
  background: 'transparent', border: '.5px solid rgba(240,236,227,.15)', color: 'rgba(240,236,227,.5)',
  borderRadius: 10, fontSize: 13, padding: '10px 22px', cursor: 'pointer', fontFamily: 'inherit',
}

const nextBtn: React.CSSProperties = {
  background: 'rgba(201,168,76,.1)', border: '.5px solid rgba(201,168,76,.35)', color: '#c9a84c',
  fontWeight: 500, borderRadius: 10, fontSize: 13, padding: '10px 22px', cursor: 'pointer', fontFamily: 'inherit',
}

const shareBtn: React.CSSProperties = {
  background: 'rgba(201,168,76,.15)', border: '.5px solid rgba(201,168,76,.5)', color: '#e2c46a',
  fontWeight: 500, borderRadius: 10, fontSize: 13, padding: '10px 22px', cursor: 'pointer', fontFamily: 'inherit',
}
