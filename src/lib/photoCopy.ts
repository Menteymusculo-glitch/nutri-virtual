// Textos de la función "Foto de mi plato" (los usan el servidor y el navegador).
import { PHOTO_RETENTION_DAYS } from '@/lib/nutritionConstants'

// Cambia la versión si cambia el texto del consentimiento: se volverá a pedir.
export const PHOTO_CONSENT_VERSION = '2026-10-23'

export const PHOTO_CONSENT = {
  title: 'Antes de usar fotos',
  points: [
    'Tu foto se envía a un servicio de inteligencia artificial en EE. UU. (Groq) solo para identificar los alimentos del plato.',
    `La foto se guarda en tu cuenta de forma privada durante ${PHOTO_RETENTION_DAYS} días y después se borra sola.`,
    'Puedes borrar cualquier foto cuando quieras y retirar este permiso en Ajustes.',
    'La app te propone alimentos y cantidades; tú revisas y decides qué se guarda. Las calorías salen siempre de nuestra base de alimentos.',
  ],
  accept: 'Acepto, usar fotos',
  decline: 'Ahora no',
} as const

export const PHOTO_MESSAGES = {
  unavailable: 'El análisis de fotos no está disponible ahora; puedes registrar tu comida buscándola.',
  timeout: 'El análisis tardó demasiado. Inténtalo de nuevo o registra tu comida buscándola.',
  busy: 'El análisis de fotos está muy solicitado ahora mismo. Inténtalo en un momento o registra tu comida buscándola.',
  failed: 'No pude analizar la foto. Inténtalo de nuevo o registra tu comida buscándola.',
  consentRequired: 'Antes de analizar fotos necesitamos tu permiso.',
  quotaUser: (n: number) => `Ya usaste tus ${n} análisis de foto de hoy. Puedes seguir registrando tus comidas buscándolas.`,
  quotaIp: 'Hay muchos análisis de foto desde esta conexión. Espera un rato o registra tu comida buscándola.',
  notJpeg: 'La foto no llegó en un formato válido. Vuelve a elegirla.',
  lowConfidence: 'No logro distinguir bien el plato; puedes ayudarme corrigiendo o buscándolo tú.',
  noFood: 'No logro distinguir comida en esta foto; puedes ayudarme buscando los alimentos tú.',
  notFound: 'No encontré este alimento: búscalo tú.',
  reviewHint: 'La foto es una ayuda: revisa los alimentos y las cantidades, y cambia lo que haga falta antes de guardar.',
} as const
