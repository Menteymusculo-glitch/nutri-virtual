'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import type { DayReport, WeekAdjustment, DayTotal } from '@/lib/calorieReport'
import { COPY, SUPPORT_URL, dayCopy, weekCopy, fmtKcal, type AlertCopy } from '@/lib/reportCopy'
import { gramsForPortion, kcalFor, sumNutrients } from '@/lib/mealMath'
import { PREP_LABELS } from '@/lib/foodSearch'
import { createSearchCache } from '@/lib/searchCache'
import { compressPhoto, validateImageFile, PHOTO_FILE_ERRORS } from '@/lib/photoFile'
import { PHOTO_CONSENT, PHOTO_CONSENT_VERSION, PHOTO_MESSAGES, PHOTO_UI } from '@/lib/photoCopy'
import { targetRaisedToFloor, type ActivityLevel, type Goal } from '@/lib/energy'

// ── Tipos de las respuestas de la API ────────────────────────────────────────
interface Target {
  goal: Goal
  target_kcal: number
  tdee_kcal: number
  sex: 'female' | 'male' | null
  hide_calories: boolean
}
interface MealItem { id: string; name: string; grams: number; kcal: number }
interface Meal { id: string; meal_type: string | null; total_kcal: number; has_photo?: boolean; meal_items: MealItem[] }
interface DayData { date: string; today: string; closed: boolean; target: Target | null; meals: Meal[]; report: DayReport }
interface WeekData { days: DayTotal[]; adjustment: WeekAdjustment }
interface Portion { label: string; grams: number }
interface Food {
  id: string; name: string; kcal_100g: number; protein_100g: number | null; carbs_100g: number | null; fat_100g: number | null
  prep_state: string | null; quality: string; portions: Portion[]
}
type Confidence = 'alta' | 'media' | 'baja'
// portion = -1 → la cantidad está en gramos; si no, es el índice de food.portions.
// seenAs y confidence solo existen si el alimento vino de la foto.
interface DraftItem { food: Food; amount: string; portion: number; seenAs?: string; confidence?: Confidence }
// Propuesta de /api/meals/photo. food = null → no se encontró en la base de alimentos.
interface PhotoProposal {
  photo_path: string; no_food: boolean; low_confidence: boolean
  items: { name: string; grams: number; prep: string; confidence: Confidence; food: Food | null }[]
}
interface PendingItem { name: string; grams: number; confidence: Confidence }
interface ProfileForm { sex: '' | 'female' | 'male'; age: string; weightKg: string; heightCm: string; activity: ActivityLevel; bodyFatPct: string; goal: Goal }

const GRADIENT = 'linear-gradient(135deg,#FFD700,#FFA500,#FF6347,#DC143C)'
// Semáforo suave: ningún color de "alarma" para estar por encima.
const STATUS_COLORS: Record<DayReport['status'], string> = {
  en_zona: '#48bb78',
  por_debajo: '#4299e1',
  por_encima: '#ed8936',
  en_curso: '#FFA500',
  sin_registros: '#a0aec0',
  sin_objetivo: '#a0aec0',
}
const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentaria (poco o nada de ejercicio)',
  light: 'Ligera (1-2 días/semana)',
  moderate: 'Moderada (3-4 días/semana)',
  active: 'Activa (5-6 días/semana)',
  very_active: 'Muy activa (diario o trabajo físico)',
}
const PLAN_GOAL_MAP: Record<string, Goal> = {
  weight_loss: 'deficit',
  muscle_gain: 'surplus',
  recomposition: 'maintenance',
  maintenance: 'maintenance',
}

function localDate(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
function shiftDate(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number)
  return localDate(new Date(y, m - 1, d + days))
}
function prettyDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  if (date === localDate()) return 'Hoy'
  if (date === shiftDate(localDate(), -1)) return 'Ayer'
  return new Date(y, m - 1, d).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}

// Reutiliza el perfil del plan nutricional si está en esta sesión del navegador.
function profileFromPlan(): Partial<ProfileForm> {
  try {
    const raw = sessionStorage.getItem('userProfile')
    if (!raw) return {}
    const p = JSON.parse(raw)
    return {
      sex: p.sex === 'female' || p.sex === 'male' ? p.sex : '',
      age: p.age ? String(p.age) : '',
      weightKg: p.weight ? String(p.weight) : '',
      heightCm: p.height ? String(p.height) : '',
      activity: p.activityLevel in ACTIVITY_LABELS ? p.activityLevel : 'moderate',
      bodyFatPct: p.bodyFat ? String(p.bodyFat) : '',
      goal: PLAN_GOAL_MAP[p.goal] ?? 'deficit',
    }
  } catch {
    return {}
  }
}

// Resultados de búsqueda ya pedidos en esta pestaña: repetir una consulta no vuelve al servidor.
const searchCache = createSearchCache<Food[]>()

async function api<T>(url: string, init?: RequestInit): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  try {
    const res = await fetch(url, { ...init, headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) } })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, status: res.status, error: json.error ?? COPY.loadError }
    return { ok: true, data: json as T }
  } catch {
    return { ok: false, status: 0, error: COPY.loadError }
  }
}

export default function TrackerPage() {
  const [phase, setPhase] = useState<'loading' | 'noAccess' | 'welcome' | 'ready' | 'error'>('loading')
  const [error, setError] = useState('')
  const [target, setTarget] = useState<Target | null>(null)
  const [tab, setTab] = useState<'hoy' | 'semana' | 'ajustes'>('hoy')
  const [date, setDate] = useState(localDate())
  const [day, setDay] = useState<DayData | null>(null)
  const [week, setWeek] = useState<WeekData | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [toast, setToast] = useState('')

  const hide = !!target?.hide_calories

  // Contadores para volver a pedir datos tras guardar/borrar.
  const [targetVersion, setTargetVersion] = useState(0)
  const [dayVersion, setDayVersion] = useState(0)
  const reloadDay = () => setDayVersion((v) => v + 1)

  useEffect(() => {
    let cancelled = false
    api<{ target: Target | null }>('/api/tracker/target').then((r) => {
      if (cancelled) return
      if (!r.ok) {
        if (r.status === 403) setPhase('noAccess')
        else { setError(r.error); setPhase('error') }
        return
      }
      setTarget(r.data.target)
      setPhase(r.data.target ? 'ready' : 'welcome')
    })
    return () => { cancelled = true }
  }, [targetVersion])

  useEffect(() => {
    if (phase !== 'ready') return
    let cancelled = false
    api<DayData>(`/api/tracker/day?date=${date}&today=${localDate()}`).then((r) => {
      if (cancelled) return
      if (r.ok) setDay(r.data)
      else setError(r.error)
    })
    return () => { cancelled = true }
  }, [phase, date, dayVersion])

  useEffect(() => {
    if (phase !== 'ready' || tab !== 'semana') return
    let cancelled = false
    api<WeekData>(`/api/tracker/week?today=${localDate()}`).then((r) => {
      if (cancelled) return
      if (r.ok) setWeek(r.data)
      else setError(r.error)
    })
    return () => { cancelled = true }
  }, [phase, tab, dayVersion])

  const flash = (msg: string, ms = 3000) => {
    setToast(msg)
    setTimeout(() => setToast(''), ms)
  }

  const [closing, setClosing] = useState(false)
  const closeDay = async () => {
    setClosing(true)
    const r = await api('/api/tracker/day/close', { method: 'POST', body: JSON.stringify({ date, today: localDate() }) })
    setClosing(false)
    if (!r.ok) { setError(r.error); return }
    flash(COPY.dayClosed)
    reloadDay()
  }

  const deleteMeal = async (id: string) => {
    if (!window.confirm(COPY.confirmDelete)) return
    const r = await api(`/api/meals/${id}`, { method: 'DELETE' })
    if (!r.ok) { setError(r.error); return }
    reloadDay()
  }

  // ── Pantallas ──────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return <Shell><p style={{ textAlign: 'center', color: '#718096' }}>Cargando tu registro…</p></Shell>
  }
  if (phase === 'noAccess') {
    return (
      <Shell>
        <h1 style={h1Style}>{COPY.pageTitle}</h1>
        <p style={pStyle}>{COPY.noAccess}</p>
        <a href={SUPPORT_URL} style={{ ...btnStyle, display: 'block', textAlign: 'center', textDecoration: 'none' }}>Escribir a Ray</a>
      </Shell>
    )
  }
  if (phase === 'error') {
    return (
      <Shell>
        <p style={errorStyle}>{error}</p>
        <button style={btnStyle} onClick={() => { setPhase('loading'); setTargetVersion((v) => v + 1) }}>Reintentar</button>
      </Shell>
    )
  }
  if (phase === 'welcome') {
    return (
      <Shell>
        <h1 style={h1Style}>{COPY.welcome.title}</h1>
        {COPY.welcome.paragraphs.map((p) => <p key={p} style={pStyle}>{p}</p>)}
        <ProfileEditor
          intro={COPY.welcome.formIntro}
          submitLabel={COPY.welcome.start}
          onSaved={(t) => {
            setTarget(t)
            setPhase('ready')
            if (targetRaisedToFloor(t.tdee_kcal, t.goal)) flash(COPY.targetFloorNote, 8000)
          }}
        />
        <Footer />
      </Shell>
    )
  }

  return (
    <Shell>
      <h1 style={{ ...h1Style, marginBottom: 16 }}>{COPY.pageTitle}</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['hoy', 'semana', 'ajustes'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14,
            background: tab === t ? GRADIENT : '#edf2f7', color: tab === t ? 'white' : '#4a5568', fontFamily: 'inherit',
          }}>{COPY.tabs[t]}</button>
        ))}
      </div>

      {error && <p style={errorStyle}>{error}</p>}
      {toast && <p style={{ ...pStyle, background: '#f0fff4', border: '1px solid #48bb78', borderRadius: 10, padding: '10px 14px', color: '#276749' }}>{toast}</p>}
      {hide && tab !== 'ajustes' && <p style={{ ...hintStyle, marginBottom: 12 }}>{COPY.hiddenModeNote}</p>}

      {tab === 'hoy' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <button aria-label="Día anterior" style={navBtn} onClick={() => setDate(shiftDate(date, -1))}>‹</button>
            <span style={{ fontWeight: 700, color: '#2d3748', textTransform: 'capitalize' }}>{prettyDate(date)}</span>
            <button aria-label="Día siguiente" style={{ ...navBtn, visibility: date >= localDate() ? 'hidden' : 'visible' }} onClick={() => setDate(shiftDate(date, 1))}>›</button>
          </div>

          {day ? <DayHeader report={day.report} hide={hide} /> : <p style={hintStyle}>Cargando…</p>}

          <div style={{ marginTop: 20 }}>
            {day && day.meals.length === 0 && <p style={pStyle}>{COPY.noMeals}</p>}
            {day?.meals.map((m) => (
              <div key={m.id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <strong style={{ color: '#2d3748' }}>{m.meal_type ? COPY.mealTypes[m.meal_type] : 'Comida'}</strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {!hide && <span style={{ color: '#4a5568', fontSize: 14 }}>{fmtKcal(m.total_kcal)}</span>}
                    <button onClick={() => deleteMeal(m.id)} style={linkBtn}>{COPY.deleteMeal}</button>
                  </div>
                </div>
                {m.meal_items.map((i) => (
                  <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#718096', padding: '2px 0' }}>
                    <span>{i.name} · {Number(i.grams)} g</span>
                    {!hide && <span>{Math.round(Number(i.kcal))} kcal</span>}
                  </div>
                ))}
                {m.has_photo && <MealPhoto mealId={m.id} onDeleted={reloadDay} onError={setError} />}
              </div>
            ))}
          </div>

          {showAdd ? (
            <AddMeal
              date={date}
              hide={hide}
              onCancel={() => setShowAdd(false)}
              onSaved={() => { setShowAdd(false); flash(COPY.savedMeal); reloadDay() }}
            />
          ) : (
            <button style={btnStyle} onClick={() => setShowAdd(true)}>+ {COPY.addMeal}</button>
          )}

          {day && !day.closed && day.date === day.today && day.meals.length > 0 && !showAdd && (
            <div style={{ marginTop: 12 }}>
              <button
                style={{ ...btnStyle, background: 'white', color: '#DC143C', border: '2px solid #FF6347', opacity: closing ? 0.7 : 1 }}
                disabled={closing}
                onClick={closeDay}
              >
                {closing ? 'Cerrando…' : COPY.closeDay}
              </button>
              <p style={{ ...hintStyle, textAlign: 'center', marginTop: 6 }}>{COPY.closeDayHint}</p>
            </div>
          )}
        </>
      )}

      {tab === 'semana' && (week ? <WeekView week={week} hide={hide} /> : <p style={hintStyle}>Cargando…</p>)}

      {tab === 'ajustes' && target && (
        <Settings target={target} onSaved={(t) => { setTarget(t); flash(COPY.settings.saved); reloadDay() }} />
      )}

      <Footer />
    </Shell>
  )
}

// ── Cabecera del día ─────────────────────────────────────────────────────────
function DayHeader({ report, hide }: { report: DayReport; hide: boolean }) {
  const c = dayCopy(report, { hideCalories: hide })
  return (
    <div style={{ padding: 20, borderRadius: 15, background: 'linear-gradient(135deg,#f7fafc,#edf2f7)', border: '2px solid #FFD700' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ width: 14, height: 14, borderRadius: '50%', background: STATUS_COLORS[report.status], flexShrink: 0 }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#2d3748' }}>{c.label}</span>
      </div>
      {c.numbers && (
        <div style={{ fontSize: 28, fontWeight: 700, background: GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 4 }}>
          {c.numbers}
        </div>
      )}
      {report.status === 'en_curso' && !hide && report.progressPct !== null && (
        <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden', margin: '6px 0 10px' }}>
          <div style={{ width: `${Math.min(report.progressPct, 100)}%`, height: '100%', background: GRADIENT }} />
        </div>
      )}
      {c.deviation && <p style={{ ...pStyle, margin: '0 0 6px', fontWeight: 600 }}>{c.deviation}</p>}
      {c.balance && <p style={{ ...hintStyle, margin: '0 0 6px' }}>{c.balance}</p>}
      <p style={{ ...pStyle, margin: 0 }}>{c.encouragement}</p>
      <Alerts alerts={c.alerts} />
    </div>
  )
}

// Alertas de suelo/techo: informan, nunca bloquean el registro.
function Alerts({ alerts }: { alerts: AlertCopy[] }) {
  if (alerts.length === 0) return null
  return (
    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {alerts.map((a) => (
        <div key={a.kind} role="note" style={{
          background: a.kind === 'suelo' ? '#fffaf0' : '#f7fafc',
          border: `1px solid ${a.kind === 'suelo' ? '#f6ad55' : '#cbd5e0'}`,
          borderRadius: 10, padding: '10px 12px', fontSize: 13, lineHeight: 1.5, color: '#4a5568',
        }}>
          {a.text}
          {a.linkLabel && (
            <> <a href={SUPPORT_URL} style={{ color: '#c05621', fontWeight: 600 }}>{a.linkLabel}</a>.</>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Añadir comida (manual) ───────────────────────────────────────────────────
function itemGrams(it: DraftItem): number {
  const amount = Number(it.amount)
  if (it.portion < 0) return isFinite(amount) && amount > 0 ? amount : 0
  return gramsForPortion(amount, it.food.portions[it.portion]?.grams ?? 0)
}

// Estado (crudo, cocido…) y aviso de valor estimado junto al nombre del alimento.
function FoodMeta({ food }: { food: Food }) {
  const prep = food.prep_state ? PREP_LABELS[food.prep_state] : null
  const approx = food.quality === 'approx'
  if (!prep && !approx) return null
  return (
    <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 4, marginLeft: 6, verticalAlign: 'middle' }}>
      {prep && <span style={tagStyle}>{prep}</span>}
      {approx && <span title={COPY.estimateHint} style={{ ...tagStyle, background: '#fffaf0', color: '#c05621', border: '1px solid #fbd38d' }}>{COPY.estimateBadge}</span>}
    </span>
  )
}

function AddMeal({ date, hide, onCancel, onSaved }: { date: string; hide: boolean; onCancel: () => void; onSaved: () => void }) {
  const [mealType, setMealType] = useState('')
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Food[]>([])
  const [searching, setSearching] = useState(false)
  const [items, setItems] = useState<DraftItem[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Foto del plato: consentimiento, foto subida, propuesta pendiente de revisar.
  const fileRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [consent, setConsent] = useState<boolean | null>(null)
  const [askConsent, setAskConsent] = useState(false)
  const [photo, setPhoto] = useState<{ path: string; preview: string } | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [photoNote, setPhotoNote] = useState('')
  const [pending, setPending] = useState<PendingItem[]>([])
  const [replacing, setReplacing] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    api<{ consented: boolean }>('/api/tracker/photo-consent').then((r) => {
      if (!cancelled) setConsent(r.ok ? r.data.consented : false)
    })
    return () => { cancelled = true }
  }, [])
  // Libera la vista previa local al cambiar de foto o al cerrar.
  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo.preview) }, [photo])

  const query = q.trim()
  const visibleResults = query.length >= 2 ? results : []

  useEffect(() => {
    if (query.length < 2) return
    const cached = searchCache.get(query)
    if (cached) {
      Promise.resolve().then(() => { setResults(cached); setSearching(false) })
      return
    }
    // Al teclear otra letra se cancela la petición anterior, así una respuesta
    // lenta y vieja nunca pisa los resultados de la consulta actual.
    const controller = new AbortController()
    const t = setTimeout(async () => {
      setSearching(true)
      const r = await api<{ foods: Food[] }>(`/api/foods/search?q=${encodeURIComponent(query)}`, { signal: controller.signal })
      if (controller.signal.aborted) return
      setSearching(false)
      if (r.ok) {
        searchCache.set(query, r.data.foods)
        setResults(r.data.foods)
      }
    }, 250)
    return () => { clearTimeout(t); controller.abort() }
  }, [query])

  // Vista previa en el navegador; las kcal definitivas se calculan en el servidor.
  const preview = useMemo(
    () => sumNutrients(items.map((i) => kcalFor(i.food, itemGrams(i)))).kcal,
    [items],
  )

  const discardPhoto = (path: string) =>
    api('/api/meals/photo', { method: 'DELETE', body: JSON.stringify({ photo_path: path }) })

  const startPhoto = () => {
    setError('')
    if (consent) fileRef.current?.click()
    else setAskConsent(true)
  }

  const acceptConsent = async () => {
    const r = await api('/api/tracker/photo-consent', { method: 'POST', body: JSON.stringify({ version: PHOTO_CONSENT_VERSION }) })
    if (!r.ok) { setError(r.error); return }
    setConsent(true)
    setAskConsent(false)
    fileRef.current?.click()
  }

  const onPhotoChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    const invalid = validateImageFile(file)
    if (invalid) { setError(invalid); return }
    let blob: Blob
    try {
      blob = await compressPhoto(file)
    } catch {
      setError(PHOTO_FILE_ERRORS.unreadable)
      return
    }
    setAnalyzing(true)
    setPhotoNote('')
    if (photo) {
      // Otra foto: se descarta la anterior y lo que propuso (lo añadido a mano se queda).
      await discardPhoto(photo.path)
      setPhoto(null)
      setItems((xs) => xs.filter((x) => !x.seenAs))
      setPending([])
    }
    const r = await api<PhotoProposal>('/api/meals/photo', { method: 'POST', body: blob, headers: { 'content-type': 'image/jpeg' } })
    setAnalyzing(false)
    if (!r.ok) {
      if (r.error === PHOTO_MESSAGES.consentRequired) { setConsent(false); setAskConsent(true) }
      setError(r.error)
      return
    }
    setPhoto({ path: r.data.photo_path, preview: URL.createObjectURL(blob) })
    const found = r.data.items.filter((i) => i.food)
    setItems((xs) => [...xs, ...found.map((i) => ({ food: i.food!, amount: String(i.grams), portion: -1, seenAs: i.name, confidence: i.confidence }))])
    setPending(r.data.items.filter((i) => !i.food).map(({ name, grams, confidence }) => ({ name, grams, confidence })))
    setPhotoNote(r.data.no_food ? PHOTO_MESSAGES.noFood : r.data.low_confidence ? PHOTO_MESSAGES.lowConfidence : '')
  }

  const removePhoto = async () => {
    if (!photo) return
    await discardPhoto(photo.path)
    setPhoto(null)
    setPhotoNote('')
  }

  // Elegir un resultado del buscador: si se está resolviendo un alimento de la
  // foto que no se encontró, se usa su cantidad estimada.
  const pickFood = (f: Food) => {
    const p = replacing !== null ? pending[replacing] : null
    setItems((xs) => [...xs, p
      ? { food: f, amount: String(p.grams), portion: -1, seenAs: p.name, confidence: p.confidence }
      : { food: f, amount: '100', portion: -1 }])
    if (p) setPending((xs) => xs.filter((_, i) => i !== replacing))
    setReplacing(null)
    setQ('')
    setResults([])
  }

  const searchPending = (idx: number) => {
    setReplacing(idx)
    setQ(pending[idx].name)
    searchRef.current?.focus()
  }

  const cancel = async () => {
    if (photo) await discardPhoto(photo.path)
    onCancel()
  }

  const save = async () => {
    setError('')
    if (items.length === 0) { setError('Añade al menos un alimento.'); return }
    if (items.some((i) => itemGrams(i) <= 0 || itemGrams(i) > 3000)) { setError('Revisa las cantidades: cada alimento debe pesar entre 1 y 3000 g.'); return }
    setSaving(true)
    const r = await api('/api/meals', {
      method: 'POST',
      body: JSON.stringify({
        log_date: date,
        meal_type: mealType || null,
        source: photo ? 'photo' : 'manual',
        photo_path: photo?.path ?? null,
        items: items.map((i) => ({ food_id: i.food.id, grams: itemGrams(i), confidence: i.confidence ?? null })),
      }),
    })
    setSaving(false)
    if (!r.ok) { setError(r.error); return }
    onSaved()
  }

  return (
    <div style={{ ...cardStyle, border: '2px solid #FFD700', marginTop: 16 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#2d3748', marginBottom: 12 }}>{COPY.addMeal}</h3>

      <input ref={fileRef} type="file" accept="image/*" onChange={onPhotoChosen} style={{ display: 'none' }} />
      {askConsent ? (
        <div style={{ background: '#fffaf0', border: '1px solid #fbd38d', borderRadius: 10, padding: 14, marginBottom: 12 }}>
          <p style={{ ...labelStyle, marginBottom: 8 }}>{PHOTO_CONSENT.title}</p>
          <ul style={{ ...hintStyle, paddingLeft: 18, margin: '0 0 8px' }}>
            {PHOTO_CONSENT.points.map((t) => <li key={t} style={{ marginBottom: 4 }}>{t}</li>)}
          </ul>
          <p style={{ ...hintStyle, fontSize: 12 }}>
            Más detalles en <Link href="/privacidad" target="_blank" style={{ color: '#c05621' }}>la política de privacidad</Link>.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ ...btnStyle, background: '#edf2f7', color: '#4a5568' }} onClick={() => setAskConsent(false)}>{PHOTO_CONSENT.decline}</button>
            <button style={btnStyle} onClick={acceptConsent}>{PHOTO_CONSENT.accept}</button>
          </div>
        </div>
      ) : (
        <button
          style={{ ...btnStyle, marginTop: 0, marginBottom: 12, background: 'white', color: '#DC143C', border: '2px solid #FF6347', opacity: analyzing || consent === null ? 0.7 : 1 }}
          disabled={analyzing || consent === null}
          onClick={startPhoto}
        >
          {analyzing ? PHOTO_UI.analyzing : `📷 ${photo ? PHOTO_UI.retake : PHOTO_UI.button}`}
        </button>
      )}
      {photo && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
          {/* Vista previa local (blob:), por eso no next/image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.preview} alt={PHOTO_UI.photoAlt} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
          <div>
            <p style={{ ...hintStyle, margin: 0 }}>{PHOTO_MESSAGES.reviewHint}</p>
            <button style={{ ...linkBtn, paddingLeft: 0 }} onClick={removePhoto}>{PHOTO_UI.removePhoto}</button>
          </div>
        </div>
      )}
      {photoNote && <p style={{ ...pStyle, background: '#fffaf0', borderRadius: 10, padding: '8px 12px' }}>{photoNote}</p>}
      {pending.map((p, idx) => (
        <div key={`${p.name}-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', marginBottom: 8, border: '1px dashed #fbd38d', borderRadius: 10 }}>
          <span style={{ flex: 1, fontSize: 13, color: '#4a5568' }}>
            <strong>{p.name}</strong> · {PHOTO_MESSAGES.notFound}
          </span>
          <button style={{ ...linkBtn, color: '#c05621', fontWeight: 600 }} onClick={() => searchPending(idx)}>{PHOTO_UI.searchIt}</button>
          <button style={linkBtn} aria-label="Quitar" onClick={() => setPending((xs) => xs.filter((_, i) => i !== idx))}>✕</button>
        </div>
      ))}

      <label style={labelStyle}>Momento del día</label>
      <select value={mealType} onChange={(e) => setMealType(e.target.value)} style={{ ...inputStyle, marginBottom: 12 }}>
        <option value="">Sin especificar</option>
        {Object.entries(COPY.mealTypes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>

      <input
        ref={searchRef}
        style={inputStyle}
        placeholder={COPY.searchPlaceholder}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus
      />
      {searching && query.length >= 2 && <p style={hintStyle}>Buscando…</p>}
      {!searching && query.length >= 2 && visibleResults.length === 0 && <p style={hintStyle}>{COPY.noResults}</p>}
      {visibleResults.length > 0 && (
        <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 10, marginTop: 6 }}>
          {visibleResults.map((f) => (
            <button key={f.id} onClick={() => pickFood(f)} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '10px 12px', border: 'none',
              borderBottom: '1px solid #edf2f7', background: 'white', cursor: 'pointer', fontSize: 14, color: '#2d3748', textAlign: 'left', fontFamily: 'inherit',
            }}>
              <span>{f.name}<FoodMeta food={f} /></span>
              {!hide && <span style={{ color: '#a0aec0', fontSize: 12, flexShrink: 0, marginLeft: 8 }}>{Math.round(f.kcal_100g)} kcal/100 g</span>}
            </button>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div style={{ marginTop: 14 }}>
          {items.map((it, idx) => {
            const update = (patch: Partial<DraftItem>) => setItems((xs) => xs.map((x, i) => i === idx ? { ...x, ...patch } : x))
            return (
              <div key={idx} style={{ marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #edf2f7' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                  <span style={{ flex: 1, fontSize: 14, color: '#2d3748' }}>
                    {it.food.name}<FoodMeta food={it.food} />
                    {it.seenAs && (
                      <span style={{ display: 'block', fontSize: 12, color: '#a0aec0' }}>
                        {PHOTO_UI.seenAs} {it.seenAs}
                        {it.confidence === 'baja' && <span style={{ ...tagStyle, marginLeft: 6, background: '#fffaf0', color: '#c05621' }}>{PHOTO_UI.lowConfidenceTag}</span>}
                      </span>
                    )}
                  </span>
                  <button onClick={() => setItems((xs) => xs.filter((_, i) => i !== idx))} style={linkBtn} aria-label="Quitar alimento">✕</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    aria-label={it.portion < 0 ? COPY.gramsLabel : COPY.quantityLabel}
                    type="number" inputMode="decimal" min={0} max={3000} step={it.portion < 0 ? 1 : 0.5}
                    value={it.amount}
                    onChange={(e) => update({ amount: e.target.value })}
                    style={{ ...inputStyle, width: 80, padding: '8px 10px' }}
                  />
                  <select
                    aria-label={COPY.unitLabel}
                    value={it.portion}
                    onChange={(e) => {
                      const portion = Number(e.target.value)
                      update({ portion, amount: portion < 0 ? String(Math.round(itemGrams(it)) || 100) : '1' })
                    }}
                    style={{ ...inputStyle, flex: 1, minWidth: 0, padding: '8px 10px' }}
                  >
                    <option value={-1}>{COPY.unitGrams}</option>
                    {it.food.portions.map((p, i) => <option key={i} value={i}>{p.label} ({Math.round(p.grams)} g)</option>)}
                  </select>
                </div>
                {it.portion >= 0 && <p style={{ ...hintStyle, margin: '4px 0 0' }}>= {itemGrams(it)} g</p>}
              </div>
            )
          })}
          {!hide && <p style={hintStyle}>Total estimado: {fmtKcal(preview)}</p>}
        </div>
      )}

      <p style={{ ...hintStyle, fontSize: 12 }}>
        {COPY.sourcesNote} <Link href="/fuentes" target="_blank" style={{ color: '#c05621' }}>{COPY.sourcesLink}</Link>
      </p>
      {error && <p style={errorStyle}>{error}</p>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button style={{ ...btnStyle, background: '#edf2f7', color: '#4a5568' }} onClick={cancel}>Cancelar</button>
        <button style={{ ...btnStyle, opacity: saving || analyzing ? 0.7 : 1 }} disabled={saving || analyzing} onClick={save}>
          {saving ? 'Guardando…' : photo ? PHOTO_UI.confirmSave : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

// ── Semana ───────────────────────────────────────────────────────────────────
function WeekView({ week, hide }: { week: WeekData; hide: boolean }) {
  const c = weekCopy(week.adjustment, { hideCalories: hide })
  const target = 'target' in week.adjustment ? week.adjustment.target : null
  const max = Math.max(...week.days.map((d) => d.consumed), target ?? 0, 1)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 140, padding: '0 4px', marginBottom: 6, position: 'relative' }}>
        {week.days.map((d) => (
          <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
            <div title={hide ? undefined : fmtKcal(d.consumed)} style={{
              height: d.consumed ? `${Math.max((d.consumed / max) * 100, 4)}%` : 4,
              background: d.consumed ? GRADIENT : '#edf2f7', borderRadius: 6,
            }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, padding: '0 4px', marginBottom: 20 }}>
        {week.days.map((d) => {
          const [y, m, dd] = d.date.split('-').map(Number)
          return (
            <span key={d.date} style={{ flex: 1, textAlign: 'center', fontSize: 11, color: '#a0aec0', textTransform: 'capitalize' }}>
              {new Date(y, m - 1, dd).toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')}
            </span>
          )
        })}
      </div>
      <div style={{ ...cardStyle, borderLeft: '4px solid #FF6347' }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: '#2d3748', marginBottom: 8 }}>{c.headline}</h3>
        {c.detail.map((line) => <p key={line} style={{ ...pStyle, margin: '0 0 6px' }}>{line}</p>)}
        <Alerts alerts={c.alerts} />
      </div>
    </div>
  )
}

// ── Ajustes ──────────────────────────────────────────────────────────────────
function Settings({ target, onSaved }: { target: Target; onSaved: (t: Target) => void }) {
  const [goal, setGoal] = useState<Goal>(target.goal)
  const [hideCalories, setHideCalories] = useState(target.hide_calories)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editProfile, setEditProfile] = useState(false)

  const save = async () => {
    setSaving(true)
    setError('')
    const r = await api<{ target: Target }>('/api/tracker/target', {
      method: 'PUT',
      body: JSON.stringify({ goal, hide_calories: hideCalories }),
    })
    setSaving(false)
    if (!r.ok) { setError(r.error); return }
    onSaved(r.data.target)
  }

  if (editProfile) {
    return (
      <ProfileEditor
        initialGoal={goal}
        submitLabel={COPY.settings.save}
        onCancel={() => setEditProfile(false)}
        onSaved={(t) => { setEditProfile(false); onSaved(t) }}
      />
    )
  }

  return (
    <div>
      <label style={labelStyle}>{COPY.settings.goalLabel}</label>
      <select value={goal} onChange={(e) => setGoal(e.target.value as Goal)} style={{ ...inputStyle, marginBottom: 16 }}>
        {Object.entries(COPY.goals).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>

      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', marginBottom: 4 }}>
        <input type="checkbox" checked={hideCalories} onChange={(e) => setHideCalories(e.target.checked)} style={{ width: 20, height: 20, marginTop: 2, flexShrink: 0 }} />
        <span style={{ fontWeight: 600, color: '#2d3748', fontSize: 15 }}>{COPY.settings.hideLabel}</span>
      </label>
      <p style={{ ...hintStyle, marginLeft: 32 }}>{COPY.settings.hideHint}</p>

      {!target.hide_calories && (
        <p style={{ ...hintStyle, marginTop: 12 }}>
          Objetivo actual: {fmtKcal(target.target_kcal)} · Gasto estimado: {fmtKcal(target.tdee_kcal)}
        </p>
      )}
      {targetRaisedToFloor(target.tdee_kcal, target.goal) && (
        <p style={{ ...hintStyle, marginTop: 8 }}>
          {COPY.targetFloorNote} <a href={SUPPORT_URL} style={{ color: '#c05621' }}>soporte@menteymusculo.com</a>
        </p>
      )}

      {error && <p style={errorStyle}>{error}</p>}
      <button style={{ ...btnStyle, opacity: saving ? 0.7 : 1 }} disabled={saving} onClick={save}>{saving ? 'Guardando…' : COPY.settings.save}</button>
      <button style={{ ...btnStyle, background: '#edf2f7', color: '#4a5568' }} onClick={() => setEditProfile(true)}>{COPY.settings.recalc}</button>
      <PhotoConsentSettings />
    </div>
  )
}

// Estado del permiso para analizar fotos y opción de retirarlo.
function PhotoConsentSettings() {
  const [consented, setConsented] = useState<boolean | null>(null)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    api<{ consented: boolean }>('/api/tracker/photo-consent').then((r) => {
      if (!cancelled) setConsented(r.ok ? r.data.consented : false)
    })
    return () => { cancelled = true }
  }, [])

  const withdraw = async () => {
    setError('')
    const r = await api('/api/tracker/photo-consent', { method: 'DELETE' })
    if (!r.ok) { setError(r.error); return }
    setConsented(false)
    setNote(PHOTO_UI.withdrawn)
  }

  if (consented === null) return null
  return (
    <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #edf2f7' }}>
      <p style={labelStyle}>{PHOTO_UI.settingsTitle}</p>
      <p style={hintStyle}>{note || (consented ? PHOTO_UI.settingsOn : PHOTO_UI.settingsOff)}</p>
      {error && <p style={errorStyle}>{error}</p>}
      {consented && (
        <button style={{ ...btnStyle, background: 'white', color: '#4a5568', border: '2px solid #e2e8f0' }} onClick={withdraw}>{PHOTO_UI.withdraw}</button>
      )}
    </div>
  )
}

// Foto de una comida guardada: se pide una URL firmada (60 s) solo al pulsar "Ver foto".
function MealPhoto({ mealId, onDeleted, onError }: { mealId: string; onDeleted: () => void; onError: (msg: string) => void }) {
  const [url, setUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const toggle = async () => {
    if (url) { setUrl(null); return }
    setBusy(true)
    const r = await api<{ url: string }>(`/api/meals/${mealId}/photo`)
    setBusy(false)
    if (!r.ok) { onError(r.error); return }
    setUrl(r.data.url)
  }

  const remove = async () => {
    if (!window.confirm(PHOTO_UI.confirmDeletePhoto)) return
    setBusy(true)
    const r = await api(`/api/meals/${mealId}/photo`, { method: 'DELETE' })
    setBusy(false)
    if (!r.ok) { onError(r.error); return }
    setUrl(null)
    onDeleted()
  }

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <button style={{ ...linkBtn, paddingLeft: 0, color: '#718096' }} disabled={busy} onClick={toggle}>📷 {url ? PHOTO_UI.hidePhoto : PHOTO_UI.viewPhoto}</button>
        <button style={linkBtn} disabled={busy} onClick={remove}>{PHOTO_UI.deletePhoto}</button>
      </div>
      {/* URL firmada temporal de Supabase Storage, por eso no next/image. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url && <img src={url} alt={PHOTO_UI.photoAlt} style={{ width: '100%', borderRadius: 10, marginTop: 6 }} />}
    </div>
  )
}

// ── Formulario de datos (alta y "actualizar mis datos") ──────────────────────
function ProfileEditor({ intro, submitLabel, initialGoal, onSaved, onCancel }: {
  intro?: string
  submitLabel: string
  initialGoal?: Goal
  onSaved: (t: Target) => void
  onCancel?: () => void
}) {
  const [form, setForm] = useState<ProfileForm>({
    sex: '', age: '', weightKg: '', heightCm: '', activity: 'moderate', bodyFatPct: '', goal: initialGoal ?? 'deficit',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fromPlan = profileFromPlan()
    // Prefill desde sessionStorage solo existe en el navegador, tras montar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm((f) => ({ ...f, ...fromPlan, goal: initialGoal ?? fromPlan.goal ?? f.goal }))
  }, [initialGoal])

  const set = (k: keyof ProfileForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    const r = await api<{ target: Target }>('/api/tracker/target', {
      method: 'PUT',
      body: JSON.stringify({
        goal: form.goal,
        profile: {
          sex: form.sex, age: form.age, weightKg: form.weightKg, heightCm: form.heightCm,
          activity: form.activity, bodyFatPct: form.bodyFatPct,
        },
      }),
    })
    setSaving(false)
    if (!r.ok) { setError(r.error); return }
    onSaved(r.data.target)
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
      {intro && <p style={hintStyle}>{intro}</p>}
      <div>
        <label style={labelStyle}>Sexo biológico</label>
        <select value={form.sex} onChange={set('sex')} required style={inputStyle}>
          <option value="">Selecciona…</option>
          <option value="female">Mujer</option>
          <option value="male">Hombre</option>
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label style={labelStyle}>Edad</label><input style={inputStyle} type="number" inputMode="numeric" min={16} max={100} value={form.age} onChange={set('age')} required /></div>
        <div><label style={labelStyle}>Peso (kg)</label><input style={inputStyle} type="number" inputMode="decimal" step="0.1" min={30} max={300} value={form.weightKg} onChange={set('weightKg')} required /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label style={labelStyle}>Altura (cm)</label><input style={inputStyle} type="number" inputMode="numeric" min={120} max={230} value={form.heightCm} onChange={set('heightCm')} required /></div>
        <div><label style={labelStyle}>% grasa (opcional)</label><input style={inputStyle} type="number" inputMode="decimal" step="0.1" min={3} max={70} value={form.bodyFatPct} onChange={set('bodyFatPct')} /></div>
      </div>
      <p style={{ ...hintStyle, marginTop: -6 }}>
        Si no lo sabes, puedes calcularlo con la <a href="/calculadora-grasa" style={{ color: '#DC143C' }}>calculadora de grasa corporal</a>.
      </p>
      <div>
        <label style={labelStyle}>Actividad</label>
        <select value={form.activity} onChange={set('activity')} style={inputStyle}>
          {Object.entries(ACTIVITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div>
        <label style={labelStyle}>{COPY.settings.goalLabel}</label>
        <select value={form.goal} onChange={set('goal')} style={inputStyle}>
          {Object.entries(COPY.goals).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      {error && <p style={errorStyle}>{error}</p>}
      <button type="submit" style={{ ...btnStyle, opacity: saving ? 0.7 : 1 }} disabled={saving}>{saving ? 'Calculando…' : submitLabel}</button>
      {onCancel && <button type="button" style={{ ...btnStyle, background: '#edf2f7', color: '#4a5568', marginTop: 0 }} onClick={onCancel}>Cancelar</button>}
    </form>
  )
}

// ── Layout ───────────────────────────────────────────────────────────────────
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', padding: '16px 12px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ padding: '10px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10, maxWidth: 560, width: '100%', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: 'white', textTransform: 'uppercase' }}>MENTE Y MÚSCULO</span>
        <span style={{ color: '#666', fontWeight: 300 }}>|</span>
        <span style={{ fontSize: 14, fontWeight: 600, background: GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Nutri Virtual</span>
      </div>
      <div style={{ background: 'white', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', maxWidth: 560, width: '100%', padding: '24px 18px' }}>
        {children}
      </div>
    </div>
  )
}

function Footer() {
  return (
    <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #edf2f7', textAlign: 'center' }}>
      <p style={{ ...hintStyle, marginBottom: 8 }}>{COPY.guideNote}</p>
      <a href={SUPPORT_URL} style={{ fontSize: 13, color: '#718096', textDecoration: 'underline' }}>{COPY.supportLink}</a>
    </div>
  )
}

// ── Estilos ──────────────────────────────────────────────────────────────────
const h1Style: React.CSSProperties = { color: '#2d3748', fontSize: 22, fontWeight: 700, marginBottom: 12, textAlign: 'center' }
const pStyle: React.CSSProperties = { color: '#4a5568', fontSize: 14, lineHeight: 1.6, marginBottom: 10 }
const hintStyle: React.CSSProperties = { color: '#718096', fontSize: 13, lineHeight: 1.5 }
const labelStyle: React.CSSProperties = { display: 'block', color: '#4a5568', fontWeight: 600, marginBottom: 6, fontSize: 14 }
const errorStyle: React.CSSProperties = { color: '#c05621', fontSize: 13, background: '#fffaf0', padding: '8px 12px', borderRadius: 8, margin: '10px 0' }
const cardStyle: React.CSSProperties = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, marginBottom: 10 }
const navBtn: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', fontSize: 22, cursor: 'pointer', color: '#4a5568' }
const linkBtn: React.CSSProperties = { background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', fontSize: 13, padding: 4, fontFamily: 'inherit' }
const tagStyle: React.CSSProperties = { fontSize: 11, lineHeight: '16px', padding: '0 6px', borderRadius: 999, background: '#edf2f7', color: '#4a5568', whiteSpace: 'nowrap' }
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', border: '2px solid #e2e8f0', borderRadius: 10,
  fontSize: 16, background: '#f7fafc', fontFamily: 'inherit', color: '#2d3748',
}
const btnStyle: React.CSSProperties = {
  width: '100%', padding: 14, background: GRADIENT, color: 'white', border: 'none', borderRadius: 10,
  fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 10, letterSpacing: 0.5, fontFamily: 'inherit',
}
