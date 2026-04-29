import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { code } = await req.json()
  const valid = process.env.ACCESS_CODE
  if (!valid || code?.trim().toUpperCase() !== valid.trim().toUpperCase()) {
    return NextResponse.json({ error: 'Código incorrecto' }, { status: 401 })
  }
  return NextResponse.json({ ok: true })
}
