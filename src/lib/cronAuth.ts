// Autorización de los crons de Vercel: Authorization: Bearer <CRON_SECRET>.
// Si CRON_SECRET falta o está vacía se rechaza siempre: sin esto, la cabecera
// "Bearer undefined" coincidiría con un secreto no configurado.
export function isCronAuthorized(authHeader: string | null, secret = process.env.CRON_SECRET): boolean {
  if (!secret || !secret.trim()) return false
  return authHeader === `Bearer ${secret}`
}
