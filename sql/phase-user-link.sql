-- ============================================================
-- Vincular clients y checkins a la usuaria (idempotente)
-- Ejecutar en Supabase SQL Editor ANTES de desplegar hotfix/save-routes:
-- las rutas /api/save-plan y /api/save-checkin escriben user_id.
--
-- Los registros antiguos quedan con user_id NULL. No se intenta
-- adivinar la dueña por nombre (podría asignar datos de salud a otra).
-- ============================================================

ALTER TABLE public.clients  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users ON DELETE SET NULL;
ALTER TABLE public.checkins ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS clients_user_id_idx  ON public.clients (user_id);
CREATE INDEX IF NOT EXISTS checkins_user_id_idx ON public.checkins (user_id);

-- Un check-in por usuaria y semana (las filas antiguas con user_id NULL no cuentan).
CREATE UNIQUE INDEX IF NOT EXISTS checkins_user_week_idx
  ON public.checkins (user_id, week) WHERE user_id IS NOT NULL;

-- RLS activado y sin políticas públicas: solo el service role accede.
ALTER TABLE public.clients  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

-- Verificar:
-- SELECT table_name, column_name FROM information_schema.columns
--   WHERE table_name IN ('clients','checkins') AND column_name = 'user_id';   -- 2 filas
-- SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('clients','checkins');
-- SELECT * FROM pg_policies WHERE tablename IN ('clients','checkins');         -- 0 filas
--   (si aparece alguna política pública antigua, avísame antes de borrarla)
