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

    const plan = await generateMealPlan(profile)
    plan.shoppingList = calculateShoppingList(plan)

    // Auto-save to Supabase (non-blocking — don't fail if DB is unavailable)
    try {
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      )
      await supabase.from('clients').insert([{ name: profile.name, profile, plan }])
    } catch (dbErr) {
      console.warn('Supabase save skipped:', dbErr)
    }

    return NextResponse.json(plan)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al generar el plan'
    console.error('generate-plan error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
