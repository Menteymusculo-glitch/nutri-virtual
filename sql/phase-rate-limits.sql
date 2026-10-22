-- ============================================================
-- Limitador de intentos (idempotente)
-- Ejecutar en Supabase SQL Editor ANTES de desplegar hotfix/save-routes:
-- /api/verify-code responde 503 si esta tabla no existe (falla cerrado).
--
-- Una fila = un intento FALLIDO. key_hash = sha256(sal + IP) + email
-- normalizado, también con hash: no se guarda la IP en claro.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope       text NOT NULL,              -- p. ej. 'verify_code'
  key_hash    text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS rate_limits_lookup_idx
  ON public.rate_limits (scope, key_hash, created_at DESC);

-- RLS activado y sin políticas: solo el service role.
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Limpieza opcional (las rutas ya borran lo antiguo de cada clave):
-- DELETE FROM public.rate_limits WHERE created_at < now() - interval '1 day';
