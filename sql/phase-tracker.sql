-- ============================================================
-- Fase 1 — Tracker de calorías (idempotente)
-- Ejecutar en Supabase SQL Editor ANTES de sql/phase-tracker-seed.sql.
--
-- Todas las tablas: RLS activado y SIN políticas → solo el service role
-- (supabaseAdmin en el servidor) puede leer/escribir. El navegador nunca
-- accede directamente: pasa siempre por /api/*.
-- ============================================================

-- gen_random_uuid() viene con pgcrypto (activado por defecto en Supabase)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── foods ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.foods (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  name_norm    text NOT NULL,             -- sin acentos, minúsculas
  kcal_100g    numeric NOT NULL CHECK (kcal_100g >= 0 AND kcal_100g <= 950),
  protein_100g numeric,
  carbs_100g   numeric,
  fat_100g     numeric,
  source       text NOT NULL DEFAULT 'seed' CHECK (source IN ('seed', 'openfoodfacts', 'custom')),
  created_at   timestamptz DEFAULT now()
);

-- Permite re-ejecutar el seed (ON CONFLICT) sin duplicar alimentos.
CREATE UNIQUE INDEX IF NOT EXISTS foods_name_norm_source_idx ON public.foods (name_norm, source);

-- Búsqueda: índice trigram si pg_trgm está disponible; si no, btree normal.
DO $$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_trgm no disponible: %', SQLERRM;
  END;

  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS foods_name_norm_trgm_idx ON public.foods USING gin (name_norm gin_trgm_ops)';
  ELSE
    EXECUTE 'CREATE INDEX IF NOT EXISTS foods_name_norm_idx ON public.foods (name_norm text_pattern_ops)';
  END IF;
END $$;

-- ── nutrition_targets ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.nutrition_targets (
  user_id       uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  goal          text NOT NULL CHECK (goal IN ('deficit', 'maintenance', 'surplus')),
  target_kcal   int NOT NULL,
  tdee_kcal     int NOT NULL,
  sex           text CHECK (sex IN ('female', 'male')),
  hide_calories boolean NOT NULL DEFAULT false,
  updated_at    timestamptz DEFAULT now()
);

-- ── meal_logs ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.meal_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  logged_at   timestamptz NOT NULL DEFAULT now(),
  log_date    date NOT NULL,              -- fecha local de la usuaria
  meal_type   text CHECK (meal_type IN ('desayuno', 'almuerzo', 'cena', 'snack')),
  source      text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'photo')),
  photo_path  text,                       -- Fase 2
  total_kcal  numeric NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS meal_logs_user_date_idx ON public.meal_logs (user_id, log_date);

-- ── meal_items ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.meal_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id     uuid NOT NULL REFERENCES public.meal_logs ON DELETE CASCADE,
  food_id     uuid REFERENCES public.foods,
  name        text NOT NULL,
  grams       numeric NOT NULL CHECK (grams > 0 AND grams <= 3000),
  kcal        numeric NOT NULL,
  protein     numeric,
  carbs       numeric,
  fat         numeric,
  confidence  text                        -- Fase 2: 'alta' | 'media' | 'baja'
);
CREATE INDEX IF NOT EXISTS meal_items_meal_id_idx ON public.meal_items (meal_id);

-- ── RLS: activado y sin políticas (solo service role) ────────────────────────
ALTER TABLE public.foods             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_items        ENABLE ROW LEVEL SECURITY;

-- Verificar:
-- SELECT relname, relrowsecurity FROM pg_class
--   WHERE relname IN ('foods','nutrition_targets','meal_logs','meal_items');   -- todas true
-- SELECT * FROM pg_policies
--   WHERE tablename IN ('foods','nutrition_targets','meal_logs','meal_items'); -- 0 filas
-- SELECT indexname FROM pg_indexes WHERE tablename = 'foods';
