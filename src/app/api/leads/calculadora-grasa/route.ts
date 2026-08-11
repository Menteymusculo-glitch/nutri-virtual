import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/auth-server'

const DAX_LOCATION_ID = 'GPDmHNb3Mb2eXeXkKCaX'

async function upsertDaxContact(nombre: string, email: string, telefono: string) {
  const apiKey = process.env.DAX_API_KEY
  if (!apiKey) {
    console.warn('[leads/calculadora-grasa] DAX_API_KEY not set — skipping DAX upsert')
    return
  }

  const res = await fetch('https://services.leadconnectorhq.com/contacts/upsert', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Version: '2021-07-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      locationId: DAX_LOCATION_ID,
      email,
      phone: telefono,
      firstName: nombre,
      tags: ['lead-calculadora-grasa'],
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error(`[leads/calculadora-grasa] DAX upsert failed ${res.status}: ${body}`)
  } else {
    const data = await res.json().catch(() => null)
    console.log(`[leads/calculadora-grasa] DAX upsert OK — contact id: ${data?.contact?.id ?? 'unknown'}`)
  }
}

export async function POST(req: NextRequest) {
  let body: {
    nombre?: string
    email?: string
    telefono?: string
    consentimiento?: boolean
    datos?: Record<string, unknown>
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const { nombre, email, telefono, consentimiento, datos } = body

  // Validate required fields
  if (!nombre || nombre.trim().length < 2) {
    return NextResponse.json({ error: 'Nombre requerido (mínimo 2 caracteres).' }, { status: 400 })
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email inválido.' }, { status: 400 })
  }
  if (!telefono || !/\d{6,}/.test(telefono.replace(/[\s\-+()]/g, ''))) {
    return NextResponse.json({ error: 'Teléfono/WhatsApp inválido.' }, { status: 400 })
  }
  if (consentimiento !== true) {
    return NextResponse.json({ error: 'Debes aceptar recibir comunicaciones.' }, { status: 400 })
  }

  const normalizedEmail = email.trim().toLowerCase()
  const normalizedNombre = nombre.trim()
  const normalizedTelefono = telefono.trim()

  // 1. Save to Supabase (blocking — this must succeed for 200 OK)
  try {
    await supabaseAdmin.from('leads').insert({
      email: normalizedEmail,
      nombre: normalizedNombre,
      telefono: normalizedTelefono,
      tipo: 'calculadora_grasa',
      datos: {
        ...(datos ?? {}),
        consentimiento: true,
        captured_at: new Date().toISOString(),
      },
    })
  } catch (err) {
    console.error('[leads/calculadora-grasa] Supabase insert error:', err)
    return NextResponse.json({ error: 'Error al guardar. Intenta de nuevo.' }, { status: 500 })
  }

  // 2. Upsert contact in DAX + tag (non-blocking — DAX failure doesn't affect user)
  upsertDaxContact(normalizedNombre, normalizedEmail, normalizedTelefono).catch((err) => {
    console.error('[leads/calculadora-grasa] DAX upsert threw:', err)
  })

  return NextResponse.json({ ok: true })
}
