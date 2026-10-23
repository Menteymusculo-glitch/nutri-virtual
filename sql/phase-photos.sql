-- ============================================================
-- Fase 2 — Fotos de comida (idempotente)
-- Ejecutar en Supabase SQL Editor ANTES de desplegar la Fase 2 de
-- feat/tracker-calorias. Requiere sql/phase-tracker.sql (meal_logs ya tiene
-- photo_path y source 'photo') y sql/phase-rate-limits.sql (cuotas).
--
-- Todo con RLS activado y SIN políticas: solo el service role (supabaseAdmin
-- en el servidor) lee o escribe. El navegador nunca accede al bucket: ve las
-- fotos con URLs firmadas de 60 s que genera el servidor.
-- ============================================================

-- ── Consentimiento explícito para el análisis de fotos ──────────────────────
-- Una fila por usuaria: versión del texto aceptado y fecha. Retirarlo pone
-- revoked_at; volver a aceptarlo sobrescribe la fila.
CREATE TABLE IF NOT EXISTS public.photo_consents (
  user_id       uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  version       text NOT NULL,
  consented_at  timestamptz NOT NULL DEFAULT now(),
  revoked_at    timestamptz
);
ALTER TABLE public.photo_consents ENABLE ROW LEVEL SECURITY;

-- ── Bucket privado meal-photos ───────────────────────────────────────────────
-- public = false: sin URL pública. Solo JPEG y como máximo 3 MB (el navegador
-- comprime a 1.280 px antes de subir; el servidor vuelve a comprobarlo).
-- Si este INSERT falla por permisos, crea el bucket a mano (ver ORDEN_SQL.md).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('meal-photos', 'meal-photos', false, 3145728, ARRAY['image/jpeg'])
ON CONFLICT (id) DO UPDATE
  SET public             = false,
      file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- storage.objects ya tiene RLS activado en Supabase. NO se crean políticas para
-- este bucket: anon y authenticated no pueden listar, leer ni subir nada.

-- ── Fotos antiguas para el cron de purga (/api/cron/purge-photos) ───────────
-- Devuelve las rutas de fotos con más antigüedad que `cutoff`, incluidas las que
-- se analizaron pero nunca se guardaron en una comida. El borrado real se hace
-- con la API de Storage (no borrando filas de storage.objects).
CREATE OR REPLACE FUNCTION public.old_meal_photos(cutoff timestamptz, max_rows int DEFAULT 500)
RETURNS TABLE (name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT o.name
  FROM storage.objects o
  WHERE o.bucket_id = 'meal-photos'
    AND o.created_at < cutoff
  ORDER BY o.created_at
  LIMIT LEAST(GREATEST(max_rows, 1), 1000);
$$;

-- Solo el servidor (service role) puede llamarla.
REVOKE ALL ON FUNCTION public.old_meal_photos(timestamptz, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.old_meal_photos(timestamptz, int) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.old_meal_photos(timestamptz, int) TO service_role;

-- Para que el cron encuentre rápido las comidas con foto.
CREATE INDEX IF NOT EXISTS meal_logs_photo_path_idx
  ON public.meal_logs (photo_path) WHERE photo_path IS NOT NULL;

-- ── Verificar ────────────────────────────────────────────────────────────────
-- SELECT id, public, file_size_limit, allowed_mime_types FROM storage.buckets WHERE id = 'meal-photos';
--   → public = false, 3145728, {image/jpeg}
-- SELECT relrowsecurity FROM pg_class WHERE relname = 'photo_consents';            -- true
-- SELECT * FROM pg_policies WHERE tablename = 'photo_consents';                    -- 0 filas
-- SELECT policyname, qual, with_check FROM pg_policies
--   WHERE schemaname = 'storage' AND tablename = 'objects'
--     AND (qual LIKE '%meal-photos%' OR with_check LIKE '%meal-photos%');          -- 0 filas
-- SELECT has_function_privilege('anon', 'public.old_meal_photos(timestamptz,int)', 'execute');  -- false
