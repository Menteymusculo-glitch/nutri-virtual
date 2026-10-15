-- ============================================================
-- Migración: índice único (email, plan) en dax_subscriptions
-- Ejecutar en Supabase SQL Editor ANTES del siguiente deploy.
--
-- Por qué: UNIQUE(user_id, plan) no protege filas con user_id=NULL
-- porque en Postgres NULL != NULL en restricciones únicas.
-- user_id queda NULL cuando se elimina un usuario de auth.users
-- (la FK tiene ON DELETE SET NULL).
-- Con este índice, (email, plan) es siempre único, incluso si
-- user_id es NULL, y el upsert puede usar email+plan como target.
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS dax_subs_email_plan_idx
  ON dax_subscriptions(email, plan);

-- Verificar:
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'dax_subscriptions';
