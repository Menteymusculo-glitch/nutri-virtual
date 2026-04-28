import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateMealPlan } from '@/lib/gemini'
import { calculateShoppingList } from '@/lib/shoppingList'
import { UserProfile } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const profile: UserProfile = await req.json()

    if (!profile.name || !profile.age || !profile.weight || !profile.height) {
      return NextResponse.json(
        { error: 'Datos incompletos. Por favor completa todos los campos.' },
        { status: 400 }
      )
    }

    // Check if this person already generated a plan in the last 7 days
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: recent } = await supabase
      .from('clients')
      .select('created_at')
      .ilike('name', profile.name.trim())
      .gte('created_at', sevenDaysAgo)
      .limit(1)

    if (recent && recent.length > 0) {
      const planDate = new Date(recent[0].created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
      return NextResponse.json(
        { error: `Ya generaste un plan el ${planDate}. Tu próximo plan estará disponible 7 días después. Si necesitas cambios, contacta a tu coach. 💪` },
        { status: 429 }
      )
    }

    const plan = await generateMealPlan(profile)
    plan.shoppingList = calculateShoppingList(plan)

    // Auto-save to Supabase (non-blocking — don't fail if DB is unavailable)
    try {
      await supabase.from('clients').insert([{ name: profile.name, profile, plan }])
    } catch (dbErr) {
      console.warn('Supabase save skipped:', dbErr)
    }

    return NextResponse.json(plan)
  } catch (err) {
    console.error('generate-plan error:', err)
    const raw = err instanceof Error ? err.message : ''
    const isRateLimit = raw === 'RATE_LIMIT' || raw.includes('429') || raw.includes('rate_limit')
    const message = isRateLimit
      ? 'La app está generando muchos planes en este momento. Intenta de nuevo en unos minutos. 🙏'
      : 'Error al generar el plan. Intenta de nuevo.'
    return NextResponse.json({ error: message }, { status: isRateLimit ? 429 : 500 })
  }
}
