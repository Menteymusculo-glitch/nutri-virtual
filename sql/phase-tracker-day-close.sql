-- ============================================================
-- Tracker — días cerrados (idempotente)
-- Ejecutar DESPUÉS de sql/phase-tracker.sql.
--
-- Una fila = la usuaria pulsó "Cerrar mi día" para esa fecha local.
-- Los días anteriores a hoy se tratan como cerrados en el código
-- aunque no tengan fila; esta tabla solo hace falta para el día actual.
-- RLS activado y sin políticas → solo el service role.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.day_closures (
  user_id    uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  log_date   date NOT NULL,              -- fecha local de la usuaria
  closed_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, log_date)
);

ALTER TABLE public.day_closures ENABLE ROW LEVEL SECURITY;

-- Verificar:
-- SELECT relrowsecurity FROM pg_class WHERE relname = 'day_closures';   -- true
-- SELECT * FROM pg_policies WHERE tablename = 'day_closures';           -- 0 filas
