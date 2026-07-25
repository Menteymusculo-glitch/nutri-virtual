import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/auth-server'

const VALID_TIPOS = ['quiz_identidad', 'calculadora_grasa'] as const

export async function POST(req: NextRequest) {
  try {
    const { email, tipo, datos } = await req.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email inválido.' }, { status: 400 })
    }
    if (!VALID_TIPOS.includes(tipo)) {
      return NextResponse.json({ error: 'Tipo inválido.' }, { status: 400 })
    }

    await supabaseAdmin.from('leads').insert({
      email: email.trim().toLowerCase(),
      tipo,
      datos: datos ?? {},
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error al guardar.' }, { status: 500 })
  }
}
