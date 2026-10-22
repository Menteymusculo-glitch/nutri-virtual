-- ============================================================
-- Migración: tabla leads (idempotente)
-- Ejecutar en Supabase SQL Editor.
--
-- ANTES de ejecutar, revisa las columnas reales (la tabla puede
-- existir ya con otro esquema, ver COWORK_BRIEF.md):
--   SELECT column_name, data_type, is_nullable
--   FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'leads'
--   ORDER BY ordinal_position;
--
-- El código inserta: email, nombre, telefono, tipo, datos
--   - src/app/api/leads/route.ts
--   - src/app/api/leads/calculadora-grasa/route.ts
-- Si alguna columna existente es NOT NULL y el código no la envía,
-- los inserts fallarán: avísame antes de tocarla.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.leads (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS email      text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS nombre     text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS telefono   text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS tipo       text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS datos      jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS leads_email_idx ON public.leads (email);
CREATE INDEX IF NOT EXISTS leads_tipo_created_idx ON public.leads (tipo, created_at DESC);

-- RLS activado y SIN políticas: anon/authenticated no pueden leer ni escribir.
-- Solo el service role (supabaseAdmin, que se salta RLS) accede.
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Verificar:
-- SELECT relrowsecurity FROM pg_class WHERE relname = 'leads';            -- true
-- SELECT * FROM pg_policies WHERE tablename = 'leads';                    -- 0 filas
