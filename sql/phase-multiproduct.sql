-- ============================================================
-- Migración multi-producto DAX
-- Ejecutar en Supabase SQL Editor ANTES de deployar el código.
-- Es solo aditiva: no modifica ni borra filas existentes.
-- ============================================================

-- 1. Nueva tabla: una fila por alumna + producto DAX
CREATE TABLE IF NOT EXISTS dax_subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email      TEXT NOT NULL,
  plan       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'revoked'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, plan)
);

CREATE INDEX IF NOT EXISTS dax_subs_email_idx   ON dax_subscriptions(email);
CREATE INDEX IF NOT EXISTS dax_subs_userid_idx  ON dax_subscriptions(user_id);

ALTER TABLE dax_subscriptions ENABLE ROW LEVEL SECURITY;
-- Solo el service-role (backend) escribe; ningún cliente anon/autenticado accede directamente.

-- 2. Backfill: copiar filas DAX actuales de 'access' → nueva tabla
--    ON CONFLICT DO NOTHING por si se re-ejecuta.
INSERT INTO dax_subscriptions (user_id, email, plan, status, created_at)
SELECT user_id, email, plan, status, created_at
FROM access
WHERE source = 'dax'
ON CONFLICT (user_id, plan) DO NOTHING;

-- ============================================================
-- Verificar resultado:
-- SELECT * FROM dax_subscriptions ORDER BY created_at;
-- ============================================================
