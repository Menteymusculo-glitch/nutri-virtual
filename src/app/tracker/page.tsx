'use client'

import { useEffect, useMemo, useState } from 'react'
import type { DayReport, WeekAdjustment, DayTotal } from '@/lib/calorieReport'
import { COPY, SUPPORT_URL, dayCopy, weekCopy, fmtKcal } from '@/lib/reportCopy'
import { kcalFor, sumNutrients } from '@/lib/mealMath'
import type { ActivityLevel, Goal } from '@/lib/energy'

// ── Tipos de las respuestas de la API ────────────────────────────────────────
interface Target {
  goal: Goal
  target_kcal: number
  tdee_kcal: number
  sex: 'female' | 'male' | null
  hide_calories: boolean
}
interface MealItem { id: string; name: string; grams: number; kcal: number }
interface Meal { id: string; meal_type: string | null; total_kcal: number; meal_items: MealItem[] }
interface DayData { date: string; target: Target | null; meals: Meal[]; report: DayReport }
interface WeekData { days: DayTotal[]; adjustment: WeekAdjustment }
interface Food { id: string; name: string; kcal_100g: number; protein_100g: number | null; carbs_100g: number | null; fat_100g: number | null }
interface DraftItem { food: Food; grams: string }
interface ProfileForm { sex: '' | 'female' | 'male'; age: string; weightKg: string; heightCm: string; activity: ActivityLevel; bodyFatPct: string; goal: Goal }

const GRADIENT = 'linear-gradient(135deg,#FFD700,#FFA500,#FF6347,#DC143C)'
// Semáforo suave: ningún color de "alarma" para estar por encima.
const STATUS_COLORS: Record<DayReport['status'], string> = {
  en_zona: '#48bb78',
  por_debajo: '#4299e1',
  por_encima: '#ed8936',
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
    api<DayData>(`/api/tracker/day?date=${date}`).then((r) => {
      if (cancelled) return
      if (r.ok) setDay(r.data)
      else setError(r.error)
    })
    return () => { cancelled = true }
  }, [phase, date, dayVersion])

  useEffect(() => {
    if (phase !== 'ready' || tab !== 'semana') return
    let cancelled = false
    api<WeekData>(`/api/tracker/week?end=${localDate()}`).then((r) => {
      if (cancelled) return
      if (r.ok) setWeek(r.data)
      else setError(r.error)
    })
    return () => { cancelled = true }
  }, [phase, tab, dayVersion])

  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
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
          onSaved={(t) => { setTarget(t); setPhase('ready') }}
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
      {c.deviation && <p style={{ ...pStyle, margin: '0 0 6px', fontWeight: 600 }}>{c.deviation}</p>}
      {c.balance && <p style={{ ...hintStyle, margin: '0 0 6px' }}>{c.balance}</p>}
      <p style={{ ...pStyle, margin: 0 }}>{c.encouragement}</p>
    </div>
  )
}

// ── Añadir comida (manual) ───────────────────────────────────────────────────
function AddMeal({ date, hide, onCancel, onSaved }: { date: string; hide: boolean; onCancel: () => void; onSaved: () => void }) {
  const [mealType, setMealType] = useState('')
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Food[]>([])
  const [searching, setSearching] = useState(false)
  const [items, setItems] = useState<DraftItem[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const query = q.trim()
  const visibleResults = query.length >= 2 ? results : []

  useEffect(() => {
    if (query.length < 2) return
    const t = setTimeout(async () => {
      setSearching(true)
      const r = await api<{ foods: Food[] }>(`/api/foods/search?q=${encodeURIComponent(query)}`)
      setSearching(false)
      if (r.ok) setResults(r.data.foods)
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  // Vista previa en el navegador; las kcal definitivas se calculan en el servidor.
  const preview = useMemo(
    () => sumNutrients(items.map((i) => kcalFor(i.food, Number(i.grams)))).kcal,
    [items],
  )

  const save = async () => {
    setError('')
    if (items.length === 0) { setError('Añade al menos un alimento.'); return }
    setSaving(true)
    const r = await api('/api/meals', {
      method: 'POST',
      body: JSON.stringify({
        log_date: date,
        meal_type: mealType || null,
        source: 'manual',
        items: items.map((i) => ({ food_id: i.food.id, grams: Number(i.grams) })),
      }),
    })
    setSaving(false)
    if (!r.ok) { setError(r.error); return }
    onSaved()
  }

  return (
    <div style={{ ...cardStyle, border: '2px solid #FFD700', marginTop: 16 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#2d3748', marginBottom: 12 }}>{COPY.addMeal}</h3>

      <label style={labelStyle}>Momento del día</label>
      <select value={mealType} onChange={(e) => setMealType(e.target.value)} style={{ ...inputStyle, marginBottom: 12 }}>
        <option value="">Sin especificar</option>
        {Object.entries(COPY.mealTypes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>

      <input
        style={inputStyle}
        placeholder={COPY.searchPlaceholder}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus
      />
      {searching && <p style={hintStyle}>Buscando…</p>}
      {!searching && query.length >= 2 && visibleResults.length === 0 && <p style={hintStyle}>{COPY.noResults}</p>}
      {visibleResults.length > 0 && (
        <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 10, marginTop: 6 }}>
          {visibleResults.map((f) => (
            <button key={f.id} onClick={() => { setItems((xs) => [...xs, { food: f, grams: '100' }]); setQ(''); setResults([]) }} style={{
              display: 'flex', justifyContent: 'space-between', width: '100%', padding: '10px 12px', border: 'none',
              borderBottom: '1px solid #edf2f7', background: 'white', cursor: 'pointer', fontSize: 14, color: '#2d3748', textAlign: 'left', fontFamily: 'inherit',
            }}>
              <span>{f.name}</span>
              {!hide && <span style={{ color: '#a0aec0', fontSize: 12, flexShrink: 0, marginLeft: 8 }}>{Math.round(f.kcal_100g)} kcal/100 g</span>}
            </button>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div style={{ marginTop: 14 }}>
          {items.map((it, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ flex: 1, fontSize: 14, color: '#2d3748' }}>{it.food.name}</span>
              <input
                aria-label={COPY.gramsLabel}
                type="number" inputMode="decimal" min={1} max={3000}
                value={it.grams}
                onChange={(e) => setItems((xs) => xs.map((x, i) => i === idx ? { ...x, grams: e.target.value } : x))}
                style={{ ...inputStyle, width: 90, padding: '8px 10px' }}
              />
              <span style={{ fontSize: 13, color: '#718096' }}>g</span>
              <button onClick={() => setItems((xs) => xs.filter((_, i) => i !== idx))} style={linkBtn} aria-label="Quitar alimento">✕</button>
            </div>
          ))}
          {!hide && <p style={hintStyle}>Total estimado: {fmtKcal(preview)}</p>}
        </div>
      )}

      {error && <p style={errorStyle}>{error}</p>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button style={{ ...btnStyle, background: '#edf2f7', color: '#4a5568' }} onClick={onCancel}>Cancelar</button>
        <button style={{ ...btnStyle, opacity: saving ? 0.7 : 1 }} disabled={saving} onClick={save}>{saving ? 'Guardando…' : 'Guardar'}</button>
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

      {error && <p style={errorStyle}>{error}</p>}
      <button style={{ ...btnStyle, opacity: saving ? 0.7 : 1 }} disabled={saving} onClick={save}>{saving ? 'Guardando…' : COPY.settings.save}</button>
      <button style={{ ...btnStyle, background: '#edf2f7', color: '#4a5568' }} onClick={() => setEditProfile(true)}>{COPY.settings.recalc}</button>
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
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', border: '2px solid #e2e8f0', borderRadius: 10,
  fontSize: 16, background: '#f7fafc', fontFamily: 'inherit', color: '#2d3748',
}
const btnStyle: React.CSSProperties = {
  width: '100%', padding: 14, background: GRADIENT, color: 'white', border: 'none', borderRadius: 10,
  fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 10, letterSpacing: 0.5, fontFamily: 'inherit',
}
