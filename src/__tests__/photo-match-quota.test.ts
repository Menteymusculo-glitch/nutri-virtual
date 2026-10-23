import { describe, it, expect } from 'vitest'
import { pickFoodMatch, photoSearchQuery } from '@/lib/photoMatch'
import { photoDailyQuota, checkPhotoQuota } from '@/lib/photoQuota'
import {
  PHOTO_DAILY_QUOTA_DEFAULT, PHOTO_DAILY_QUOTA_NUTRI_APP, PHOTO_IP_DAILY_MAX,
} from '@/lib/nutritionConstants'

const food = (name_norm: string, extra: Record<string, unknown> = {}) => ({
  id: name_norm, name_norm, aliases: [] as string[], quality: 'usda', sim: 0, prep_state: null as string | null, ...extra,
})

describe('pickFoodMatch', () => {
  const foods = [
    food('arroz blanco crudo', { prep_state: 'crudo' }),
    food('arroz blanco cocido', { prep_state: 'cocido' }),
    food('pollo pechuga cocida', { prep_state: 'cocido', aliases: ['pechuga de pollo'] }),
    food('cambur', { aliases: ['banana', 'platano'], prep_state: 'crudo' }),
  ]

  it('prefiere la preparación que se ve en la foto', () => {
    expect(pickFoodMatch(foods, 'arroz blanco', 'cocido')?.id).toBe('arroz blanco cocido')
    expect(pickFoodMatch(foods, 'arroz blanco', 'crudo')?.id).toBe('arroz blanco crudo')
  })

  it('usa los alias regionales', () => {
    expect(pickFoodMatch(foods, photoSearchQuery('Plátano'), 'crudo')?.id).toBe('cambur')
    expect(pickFoodMatch(foods, photoSearchQuery('Pechuga de pollo'), 'cocido')?.id).toBe('pollo pechuga cocida')
  })

  it('sin coincidencia razonable → null (no se inventan calorías)', () => {
    expect(pickFoodMatch(foods, photoSearchQuery('sushi de anguila'), 'crudo')).toBeNull()
    expect(pickFoodMatch([], 'arroz', 'cocido')).toBeNull()
    expect(pickFoodMatch(foods, 'a', 'cocido')).toBeNull()
  })

  it('un parecido por erratas solo cuenta con similitud suficiente', () => {
    expect(pickFoodMatch([food('lentejas', { sim: 0.7 })], 'lentehas', 'cocido')?.id).toBe('lentejas')
    expect(pickFoodMatch([food('lentejas', { sim: 0.3 })], 'lentehas', 'cocido')).toBeNull()
  })

  it('sin la misma preparación, devuelve la mejor coincidencia', () => {
    expect(pickFoodMatch(foods, 'arroz blanco', 'frito')?.id).toBe('arroz blanco crudo')
  })
})

describe('cuotas de fotos', () => {
  it('nutri_app 5, el resto 15', () => {
    expect(photoDailyQuota('nutri_app')).toBe(PHOTO_DAILY_QUOTA_NUTRI_APP)
    expect(PHOTO_DAILY_QUOTA_NUTRI_APP).toBe(5)
    expect(photoDailyQuota('premium')).toBe(PHOTO_DAILY_QUOTA_DEFAULT)
    expect(photoDailyQuota(null)).toBe(15)
  })

  it('bloquea al llegar a la cuota de la usuaria', () => {
    expect(checkPhotoQuota({ plan: 'nutri_app', usedByUser: 4, usedByIp: 0 })).toEqual({ ok: true })
    expect(checkPhotoQuota({ plan: 'nutri_app', usedByUser: 5, usedByIp: 0 })).toEqual({ ok: false, reason: 'user' })
    expect(checkPhotoQuota({ plan: 'training_club', usedByUser: 14, usedByIp: 0 })).toEqual({ ok: true })
    expect(checkPhotoQuota({ plan: 'training_club', usedByUser: 15, usedByIp: 0 })).toEqual({ ok: false, reason: 'user' })
  })

  it('bloquea por IP aunque la usuaria tenga cuota', () => {
    expect(checkPhotoQuota({ plan: 'premium', usedByUser: 0, usedByIp: PHOTO_IP_DAILY_MAX - 1 })).toEqual({ ok: true })
    expect(checkPhotoQuota({ plan: 'premium', usedByUser: 0, usedByIp: PHOTO_IP_DAILY_MAX })).toEqual({ ok: false, reason: 'ip' })
  })
})
