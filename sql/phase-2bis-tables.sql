-- ============================================================
-- Phase 2bis — 3 tablas nuevas
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- 1. DAX events idempotency
-- Igual a stripe_events_processed pero para el webhook de DAX Engine
CREATE TABLE IF NOT EXISTS dax_events_processed (
  event_id    TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Usage log — registra cada uso de las herramientas
CREATE TABLE IF NOT EXISTS usage_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email       TEXT NOT NULL,
  tool        TEXT NOT NULL,   -- 'nutri_virtual' | 'motor_identidad'
  plan        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS usage_log_user_id_idx ON usage_log(user_id);
CREATE INDEX IF NOT EXISTS usage_log_tool_idx    ON usage_log(tool);
CREATE INDEX IF NOT EXISTS usage_log_created_at_idx ON usage_log(created_at DESC);

-- 3. Identity diagnostics — guarda cada resultado del Motor de Identidad
CREATE TABLE IF NOT EXISTS identity_diagnostics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email       TEXT NOT NULL,
  profile     JSONB,   -- { nombre, apellido, edad, pais, sexo, reto, tiempo }
  now_values  JSONB,   -- number[10] — sliders "hoy"
  want_values JSONB,   -- number[10] — sliders "12 meses"
  desires     JSONB,   -- { peso, grasa, energia, cuerpo, trabajo, ingresos, relaciones, palabras, chips }
  horizons    JSONB,   -- { h1donde, h1logro, h1feel, h5donde, h5logro, h5feel, h10donde, h10logro, declaracion }
  result      JSONB,   -- { diag, pri, roadmap, timeline, bloqueos, identity, gaps }
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS identity_diagnostics_user_id_idx  ON identity_diagnostics(user_id);
CREATE INDEX IF NOT EXISTS identity_diagnostics_created_at_idx ON identity_diagnostics(created_at DESC);

-- RLS: estas tablas son de escritura server-side únicamente (service key)
-- No necesitan políticas RLS si accedemos siempre con la service key de Supabase.
-- Por seguridad habilitamos RLS sin políticas públicas (denegar por defecto).
ALTER TABLE dax_events_processed ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_log             ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_diagnostics  ENABLE ROW LEVEL SECURITY;
