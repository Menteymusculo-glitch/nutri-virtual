/**
 * POST/DELETE /api/meals/photo: sesión, plan, consentimiento, cuotas, validación
 * del archivo, propuesta basada en foods y fallos del modelo.
 */
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { VisionResult } from '@/lib/vision'

const ME = '11111111-1111-4111-8111-111111111111'
const PHOTO = `${ME}/22222222-2222-4222-8222-222222222222.jpg`

const { state } = vi.hoisted(() => ({
  state: {
    user: null as { id: string } | null,
    access: { allowed: true, plan: 'premium' as string | null },
    consent: { consented: true, consentedAt: null as string | null, error: null as { message: string } | null },
    used: { photo_user: 0, photo_ip: 0 } as Record<string, number>,
    countError: null as { message: string } | null,
    events: [] as string[],
    uploaded: [] as string[],
    removed: [] as string[],
    deletedOwn: [] as string[],
    vision: null as unknown,
    foods: [] as Record<string, unknown>[],
    portions: [] as Record<string, unknown>[],
  },
}))

vi.mock('@/lib/auth-server', () => ({
  getServerUser: async () => state.user,
  getTrackerAccess: async () => state.access,
  supabaseAdmin: {
    rpc: async (_fn: string, args: { q: string }) => {
      state.events.push(`search:${args.q}`)
      return { data: state.foods.filter((f) => (f.name_norm as string).includes(args.q.split(' ')[0])), error: null }
    },
    from: () => {
      const c: Record<string, unknown> = {}
      Object.assign(c, {
        select: () => c,
        in: (_c: string, ids: string[]) => { (c as { ids?: string[] }).ids = ids; return c },
        order: async () => ({ data: state.portions.filter((p) => (c as { ids: string[] }).ids.includes(p.food_id as string)), error: null }),
      })
      return c
    },
  },
}))

vi.mock('@/lib/rateLimit', () => ({
  clientIp: () => '1.2.3.4',
  hashedKey: (kind: string, v: string) => `${kind}:${v}`,
  countRecentFailures: async (scope: string) => ({ count: state.used[scope] ?? 0, error: state.countError }),
  recordFailure: async (scope: string) => { state.events.push(`record:${scope}`); return null },
}))

vi.mock('@/lib/mealPhotos', () => ({
  loadPhotoConsent: async () => state.consent,
  newPhotoPath: () => PHOTO,
  uploadPhoto: async (path: string) => { state.uploaded.push(path); return null },
  removePhotos: async (paths: string[]) => { state.removed.push(...paths); return null },
  isOwnPhotoPath: (userId: string, p: unknown) => typeof p === 'string' && p.startsWith(`${userId}/`) && p.endsWith('.jpg'),
  deleteOwnPhoto: async (_u: string, p: string) => { state.deletedOwn.push(p); return null },
}))

vi.mock('@/lib/vision', () => ({
  analyzeMealPhoto: async () => { state.events.push('vision'); return state.vision },
}))

import { POST, DELETE } from '@/app/api/meals/photo/route'
import { parseVisionOutput } from '@/lib/visionSchema'
import { PHOTO_MESSAGES } from '@/lib/photoCopy'

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xda, 0x00, 0x04, 0x01, 0x02, 0x11, 0xff, 0xd9])
const send = (body: BodyInit = JPEG, type = 'image/jpeg') =>
  POST(new Request('http://x/api/meals/photo', { method: 'POST', headers: { 'content-type': type }, body }) as never)

const visionOk = (raw: unknown): VisionResult => ({ ok: true, output: parseVisionOutput(JSON.stringify(raw)) })

beforeEach(() => {
  state.user = { id: ME }
  state.access = { allowed: true, plan: 'premium' }
  state.consent = { consented: true, consentedAt: null, error: null }
  state.used = { photo_user: 0, photo_ip: 0 }
  state.countError = null
  state.events = []
  state.uploaded = []
  state.removed = []
  state.deletedOwn = []
  state.foods = [
    { id: 'f-arroz', name: 'Arroz blanco cocido', name_norm: 'arroz blanco cocido', aliases: [], kcal_100g: 130, protein_100g: 2.7, carbs_100g: 28, fat_100g: 0.3, prep_state: 'cocido', quality: 'usda', sim: 0 },
    { id: 'f-arroz-crudo', name: 'Arroz blanco crudo', name_norm: 'arroz blanco crudo', aliases: [], kcal_100g: 360, protein_100g: 7, carbs_100g: 79, fat_100g: 0.6, prep_state: 'crudo', quality: 'usda', sim: 0 },
    { id: 'f-arepa', name: 'Arepa', name_norm: 'arepa', aliases: [], kcal_100g: 220, protein_100g: 5, carbs_100g: 45, fat_100g: 2, prep_state: 'cocido', quality: 'approx', sim: 0 },
  ]
  state.portions = [{ food_id: 'f-arroz', label: '1 taza', grams: 158 }]
  state.vision = visionOk({ items: [
    { name: 'arroz blanco', grams: 150, prep: 'cocido', confidence: 'alta', kcal: 9999, kcal_100g: 9999 },
    { name: 'arepa', grams: 90, prep: 'cocido', confidence: 'media' },
    { name: 'salsa misteriosa', grams: 30, prep: 'cocido', confidence: 'baja' },
  ] })
})

describe('POST /api/meals/photo: acceso', () => {
  it('401 sin sesión', async () => {
    state.user = null
    expect((await send()).status).toBe(401)
    expect(state.events).toEqual([])
  })

  it('403 sin plan', async () => {
    state.access = { allowed: false, plan: null }
    const res = await send()
    expect(res.status).toBe(403)
    expect((await res.json()).code).toBe('no_plan')
    expect(state.uploaded).toEqual([])
  })

  it('403 sin consentimiento: no se sube nada', async () => {
    state.consent = { consented: false, consentedAt: null, error: null }
    const res = await send()
    expect(res.status).toBe(403)
    expect((await res.json()).code).toBe('consent_required')
    expect(state.uploaded).toEqual([])
    expect(state.events).not.toContain('vision')
  })

  it('429 con la cuota diaria agotada (nutri_app = 5)', async () => {
    state.access = { allowed: true, plan: 'nutri_app' }
    state.used.photo_user = 5
    const res = await send()
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('86400')
    const body = await res.json()
    expect(body.code).toBe('quota_user')
    expect(body.error).toBe(PHOTO_MESSAGES.quotaUser(5))
    expect(state.events).toEqual([])
  })

  it('429 por IP aunque la usuaria tenga cuota', async () => {
    state.used.photo_ip = 40
    const res = await send()
    expect(res.status).toBe(429)
    expect((await res.json()).code).toBe('quota_ip')
  })

  it('503 si el limitador no responde (falla cerrado)', async () => {
    state.countError = { message: 'relation "rate_limits" does not exist' }
    const err = vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await send()
    expect(res.status).toBe(503)
    expect((await res.json()).error).toBe(PHOTO_MESSAGES.unavailable)
    err.mockRestore()
  })
})

describe('POST /api/meals/photo: archivo', () => {
  it('415 si no es JPEG (por cabecera o por contenido) y no cuenta como intento', async () => {
    expect((await send(JPEG, 'image/png')).status).toBe(415)
    expect((await send(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]))).status).toBe(415)
    expect(state.events).toEqual([])
  })

  it('413 si pasa de 3 MB', async () => {
    const big = new Uint8Array(3 * 1024 * 1024 + 1)
    big.set(JPEG)
    expect((await send(big)).status).toBe(413)
  })
})

describe('POST /api/meals/photo: propuesta', () => {
  it('cuenta el intento antes de llamar al modelo y sube la foto al bucket privado', async () => {
    const res = await send()
    expect(res.status).toBe(200)
    expect(state.events.indexOf('record:photo_user')).toBeLessThan(state.events.indexOf('vision'))
    expect(state.events).toContain('record:photo_ip')
    expect(state.uploaded).toEqual([PHOTO])
    expect(state.removed).toEqual([])
  })

  it('asocia cada elemento a foods; sin coincidencia → food null', async () => {
    const body = await (await send()).json()
    expect(body.photo_path).toBe(PHOTO)
    expect(body.items).toHaveLength(3)
    expect(body.items[0]).toMatchObject({ name: 'arroz blanco', grams: 150, food: { id: 'f-arroz', kcal_100g: 130, portions: [{ label: '1 taza', grams: 158 }] } })
    expect(body.items[1].food).toMatchObject({ id: 'f-arepa', quality: 'approx' })
    expect(body.items[2]).toMatchObject({ name: 'salsa misteriosa', food: null })
  })

  it('ningún número de kcal del modelo llega a la respuesta', async () => {
    const body = await (await send()).json()
    const text = JSON.stringify(body)
    expect(text).not.toContain('9999')
    for (const it of body.items) {
      expect(it).not.toHaveProperty('kcal')
      expect(it).not.toHaveProperty('kcal_100g')
    }
    // Las kcal por 100 g que llegan son las de foods.
    expect(body.items[0].food.kcal_100g).toBe(130)
  })

  it('sin comida o con baja confianza lo indica', async () => {
    state.vision = visionOk({ items: [], no_food: true })
    const empty = await (await send()).json()
    expect(empty).toMatchObject({ no_food: true, low_confidence: true, items: [] })

    state.vision = visionOk({ items: [
      { name: 'arroz blanco', grams: 100, confidence: 'baja' },
      { name: 'arepa', grams: 100, confidence: 'baja' },
      { name: 'arroz blanco crudo', grams: 100, confidence: 'alta' },
    ] })
    const low = await (await send()).json()
    expect(low).toMatchObject({ no_food: false, low_confidence: true })
  })
})

describe('POST /api/meals/photo: fallos del modelo', () => {
  it('modelo retirado → 503 con mensaje claro y la foto se borra', async () => {
    state.vision = { ok: false, reason: 'unavailable' }
    const res = await send()
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ error: PHOTO_MESSAGES.unavailable, code: 'vision_unavailable' })
    expect(state.removed).toEqual([PHOTO])
  })

  it('timeout → 504 con mensaje claro', async () => {
    state.vision = { ok: false, reason: 'timeout' }
    const res = await send()
    expect(res.status).toBe(504)
    expect((await res.json()).error).toBe(PHOTO_MESSAGES.timeout)
    expect(state.removed).toEqual([PHOTO])
  })
})

describe('DELETE /api/meals/photo', () => {
  const del = (body: unknown) => DELETE(new Request('http://x/api/meals/photo', { method: 'DELETE', body: JSON.stringify(body) }) as never)

  it('borra una foto propia', async () => {
    expect((await del({ photo_path: PHOTO })).status).toBe(200)
    expect(state.deletedOwn).toEqual([PHOTO])
  })

  it('404 con la foto de otra usuaria; 401 sin sesión', async () => {
    expect((await del({ photo_path: '99999999-9999-4999-8999-999999999999/x.jpg' })).status).toBe(404)
    state.user = null
    expect((await del({ photo_path: PHOTO })).status).toBe(401)
    expect(state.deletedOwn).toEqual([])
  })
})
