'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { MealPlan, DayPlan, Meal, AlternativeMeal, UserProfile } from '@/types'

const DAYS_ES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export default function PlanPage() {
  const router = useRouter()
  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [activeDay, setActiveDay] = useState(0)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('mealPlan')
    const storedProfile = sessionStorage.getItem('userProfile')
    if (!stored) {
      router.push('/')
      return
    }
    setPlan(JSON.parse(stored))
    if (storedProfile) setProfile(JSON.parse(storedProfile))
  }, [router])

  if (!plan) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', color: '#888' }}>Cargando tu plan...</div>
      </div>
    )
  }

  const handlePrint = () => window.print()

  const handleNewPlan = () => {
    sessionStorage.clear()
    router.push('/')
  }

  const day = plan.days[activeDay]

  return (
    <>
      <style>{printStyles}</style>
      <div style={{ background: '#FAFAFA', minHeight: '100vh' }}>
        {/* Header */}
        <header className="brand-gradient no-print" style={{ padding: '1.25rem 1.5rem', color: 'white' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.7rem', letterSpacing: '0.15em', opacity: 0.85 }}>MASTER RAY VILORIA</p>
              <h1 style={{ fontSize: '1.1rem', fontWeight: 800 }}>NUTRI VIRTUAL · Mente y Músculo</h1>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handlePrint}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 8,
                  border: '2px solid rgba(255,255,255,0.6)',
                  background: 'transparent',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                📥 Descargar PDF
              </button>
              <button
                onClick={handleNewPlan}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 8,
                  border: '2px solid rgba(255,255,255,0.6)',
                  background: 'transparent',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                + Nuevo Plan
              </button>
            </div>
          </div>
        </header>

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
          {/* Print Header */}
          <div className="print-only" style={{ textAlign: 'center', marginBottom: '1.5rem', padding: '1rem', borderBottom: '3px solid #F5A623' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, background: 'linear-gradient(135deg, #F5A623, #B8241A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              NUTRI VIRTUAL · MENTE Y MÚSCULO
            </div>
            <div style={{ fontSize: '0.85rem', color: '#888', letterSpacing: '0.1em' }}>MASTER RAY VILORIA · PLAN DE ALIMENTACIÓN PERSONALIZADO</div>
          </div>

          {/* Summary Card */}
          <div ref={printRef} style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '1.5rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Plan de {plan.userName}</h2>
                <p style={{ fontSize: '0.82rem', color: '#888', marginTop: 4 }}>
                  Generado el {new Date(plan.generatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                {profile && (
                  <p style={{ fontSize: '0.82rem', color: '#666', marginTop: 2 }}>
                    {profile.weight}kg · {profile.height}cm · {profile.age} años · IMC {(profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1)}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <MacroBadge label="Calorías" value={`${plan.dailyCalories}`} unit="kcal" color="#F5A623" />
                <MacroBadge label="Proteína" value={`${plan.dailyProtein}g`} unit="" color="#B8241A" />
                <MacroBadge label="Carbos" value={`${plan.dailyCarbs}g`} unit="" color="#4CAF50" />
                <MacroBadge label="Grasa" value={`${plan.dailyFat}g`} unit="" color="#9C27B0" />
              </div>
            </div>

            {plan.bmr > 0 && (
              <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#FFF8EC', borderRadius: 10, fontSize: '0.8rem', color: '#7A5000' }}>
                📊 TMB: <strong>{plan.bmr} kcal</strong> · TDEE: <strong>{plan.tdee} kcal</strong> · Objetivo ajustado: <strong>{plan.dailyCalories} kcal</strong>
              </div>
            )}
          </div>

          {/* Day Navigation */}
          <div className="no-print" style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {plan.days.map((d, i) => (
              <button
                key={i}
                onClick={() => setActiveDay(i)}
                style={{
                  padding: '0.5rem 0.875rem',
                  borderRadius: 10,
                  border: 'none',
                  background: activeDay === i ? 'linear-gradient(135deg, #F5A623, #B8241A)' : 'white',
                  color: activeDay === i ? 'white' : '#555',
                  fontWeight: activeDay === i ? 700 : 400,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontSize: '0.85rem',
                  boxShadow: activeDay === i ? '0 2px 8px rgba(181,36,26,0.3)' : '0 1px 4px rgba(0,0,0,0.08)',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
              >
                {d.day.substring(0, 3)}
              </button>
            ))}
          </div>

          {/* Active Day — Screen */}
          <div className="no-print">
            <DayCard day={day} />
          </div>

          {/* All Days — Print Only */}
          <div className="print-only">
            {plan.days.map((d, i) => (
              <div key={i} style={{ pageBreakAfter: 'always' }}>
                <DayCard day={d} />
              </div>
            ))}
          </div>

          {/* Shopping List */}
          {plan.shoppingList && plan.shoppingList.length > 0 && (
            <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '1.5rem', marginTop: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>🛒 Lista de Compras Semanal</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {plan.shoppingList.map((cat, i) => (
                  <div key={i}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#B8241A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                      {cat.category}
                    </p>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      {cat.items.map((item, j) => (
                        <li key={j} style={{ fontSize: '0.85rem', color: '#555', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                          <span style={{ color: '#F5A623', flexShrink: 0, marginTop: 2 }}>●</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips + Hydration + Hormonal */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
            {plan.tips && plan.tips.length > 0 && (
              <InfoCard title="💡 Tips del Plan" color="#F5A623">
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {plan.tips.map((tip, i) => (
                    <li key={i} style={{ fontSize: '0.85rem', color: '#555', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <span style={{ color: '#F5A623', flexShrink: 0 }}>→</span> {tip}
                    </li>
                  ))}
                </ul>
              </InfoCard>
            )}

            {plan.hydration && (
              <InfoCard title="💧 Hidratación" color="#2196F3">
                <p style={{ fontSize: '0.85rem', color: '#555', lineHeight: 1.6 }}>{plan.hydration}</p>
              </InfoCard>
            )}

            {plan.supplementation && plan.supplementation.length > 0 && (
              <InfoCard title="💊 Suplementación Sugerida" color="#9C27B0">
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {plan.supplementation.map((s, i) => (
                    <li key={i} style={{ fontSize: '0.85rem', color: '#555' }}>· {s}</li>
                  ))}
                </ul>
              </InfoCard>
            )}

            {plan.hormonalNotes && (
              <InfoCard title="🌸 Notas Hormonales" color="#E91E63">
                <p style={{ fontSize: '0.85rem', color: '#555', lineHeight: 1.6 }}>{plan.hormonalNotes}</p>
              </InfoCard>
            )}
          </div>

          {/* Notes / Motivational */}
          {plan.notes && (
            <div
              style={{
                marginTop: '1.25rem',
                padding: '1.5rem',
                background: 'linear-gradient(135deg, #FFF8EC, #FFF0EE)',
                borderRadius: 16,
                border: '1px solid #F5A623',
              }}
            >
              <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#B8241A', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                MENSAJE DE RAY VILORIA
              </p>
              <p style={{ fontSize: '0.9rem', color: '#5A3000', lineHeight: 1.7, fontStyle: 'italic' }}>&ldquo;{plan.notes}&rdquo;</p>
            </div>
          )}

          {/* Check-in CTA */}
          <div className="no-print" style={{ textAlign: 'center', marginTop: '2rem' }}>
            <button
              onClick={() => router.push('/checkin')}
              style={{
                padding: '0.875rem 2rem',
                background: 'linear-gradient(135deg, #F5A623, #B8241A)',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              📊 Registrar Seguimiento Semanal
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function DayCard({ day }: { day: DayPlan }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '1.5rem', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{day.day}</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <SmallBadge label={`${day.totalCalories} kcal`} color="#F5A623" />
          <SmallBadge label={`P: ${day.totalProtein}g`} color="#B8241A" />
          <SmallBadge label={`C: ${day.totalCarbs}g`} color="#4CAF50" />
          <SmallBadge label={`G: ${day.totalFat}g`} color="#9C27B0" />
        </div>
      </div>

      {day.meals.map((meal, i) => (
        <MealCard key={i} meal={meal} />
      ))}

      {day.alternativeLunch && (
        <AlternativeLunchCard alt={day.alternativeLunch} />
      )}

      {day.notes && (
        <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#FFF8EC', borderRadius: 8, fontSize: '0.82rem', color: '#7A5000' }}>
          💡 {day.notes}
        </div>
      )}
    </div>
  )
}

function AlternativeLunchCard({ alt }: { alt: AlternativeMeal }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ border: '2px dashed #F5A623', borderRadius: 10, marginBottom: '0.75rem', overflow: 'hidden' }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', cursor: 'pointer', background: open ? '#FFF8EC' : '#FFFDF5' }}
        onClick={() => setOpen(!open)}
        className="no-print"
      >
        <div>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#B8241A' }}>🔄 {alt.name}</span>
          <span style={{ fontSize: '0.72rem', color: '#F5A623', marginLeft: '0.5rem', fontWeight: 600 }}>OPCIÓN ALTERNATIVA</span>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <SmallBadge label={`${alt.calories} kcal`} color="#F5A623" />
          <span style={{ color: '#CCC', fontSize: '0.8rem' }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>
      {open && (
        <div style={{ padding: '0 1rem 0.875rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.75rem' }}>
            {alt.foods.map((food, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem', padding: '0.3rem 0', borderBottom: '1px dashed #F0F0F0' }}>
                <span><strong>{food.name}</strong> — {food.amount}</span>
                <span style={{ color: '#888', flexShrink: 0, marginLeft: '0.5rem' }}>{food.calories}kcal · P{food.protein}g</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <SmallBadge label={`${alt.protein}g proteína`} color="#B8241A" />
            <SmallBadge label={`${alt.carbs}g carbos`} color="#4CAF50" />
            <SmallBadge label={`${alt.fat}g grasa`} color="#9C27B0" />
          </div>
          {alt.instructions && (
            <div style={{ background: '#FFF8EC', borderRadius: 8, padding: '0.625rem 0.875rem' }}>
              <p style={{ fontSize: '0.83rem', color: '#555', lineHeight: 1.6 }}>{alt.instructions}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MealCard({ meal }: { meal: Meal }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      style={{
        border: '1px solid #F0F0F0',
        borderRadius: 10,
        marginBottom: '0.75rem',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 1rem',
          cursor: 'pointer',
          background: open ? '#FFF8EC' : 'white',
          transition: 'background 0.15s',
        }}
        onClick={() => setOpen(!open)}
        className="no-print"
      >
        <div>
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{meal.name}</span>
          {meal.time && <span style={{ fontSize: '0.75rem', color: '#999', marginLeft: '0.5rem' }}>· {meal.time}</span>}
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <SmallBadge label={`${meal.calories} kcal`} color="#F5A623" />
          <span style={{ color: '#CCC', fontSize: '0.8rem' }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Print always shows full content */}
      <div className={open ? '' : 'no-print'} style={{ display: open ? 'block' : 'none' }}>
        <MealDetail meal={meal} />
      </div>
      <div className="print-only">
        <MealDetail meal={meal} />
      </div>
    </div>
  )
}

function MealDetail({ meal }: { meal: Meal }) {
  return (
    <div style={{ padding: '0 1rem 0.875rem' }}>
      {/* Foods */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.75rem' }}>
        {meal.foods.map((food, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.83rem',
              padding: '0.3rem 0',
              borderBottom: '1px dashed #F0F0F0',
            }}
          >
            <span style={{ color: '#3D3D3D' }}>
              <strong>{food.name}</strong> — {food.amount}
            </span>
            <span style={{ color: '#888', flexShrink: 0, marginLeft: '0.5rem' }}>
              {food.calories}kcal · P{food.protein}g · C{food.carbs}g · G{food.fat}g
            </span>
          </div>
        ))}
      </div>

      {/* Macros total */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <SmallBadge label={`${meal.protein}g proteína`} color="#B8241A" />
        <SmallBadge label={`${meal.carbs}g carbos`} color="#4CAF50" />
        <SmallBadge label={`${meal.fat}g grasa`} color="#9C27B0" />
      </div>

      {/* Instructions */}
      {meal.instructions && (
        <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '0.625rem 0.875rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#888', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Preparación
          </p>
          <p style={{ fontSize: '0.83rem', color: '#555', lineHeight: 1.6 }}>{meal.instructions}</p>
        </div>
      )}

      {/* Notes */}
      {meal.notes && (
        <p style={{ fontSize: '0.78rem', color: '#F5A623', marginTop: '0.5rem', fontStyle: 'italic' }}>
          💡 {meal.notes}
        </p>
      )}
    </div>
  )
}

function MacroBadge({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0.5rem 0.875rem',
        borderRadius: 10,
        background: `${color}15`,
        border: `1px solid ${color}40`,
        minWidth: 72,
      }}
    >
      <span style={{ fontSize: '1.1rem', fontWeight: 800, color }}>{value}{unit}</span>
      <span style={{ fontSize: '0.65rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
    </div>
  )
}

function SmallBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        padding: '0.2rem 0.6rem',
        borderRadius: 999,
        fontSize: '0.72rem',
        fontWeight: 600,
        background: `${color}18`,
        color,
      }}
    >
      {label}
    </span>
  )
}

function InfoCard({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        padding: '1.25rem',
        borderTop: `3px solid ${color}`,
      }}
    >
      <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.875rem', color: '#1A1A1A' }}>{title}</h3>
      {children}
    </div>
  )
}

const printStyles = `
  @media print {
    .no-print { display: none !important; }
    .print-only { display: block !important; }
    body { background: white !important; }
    @page { margin: 1.5cm; }
  }
  @media screen {
    .print-only { display: none !important; }
  }
`
