-- ============================================================
-- Fase 1b — Base de alimentos internacional: estructura (idempotente)
-- Ejecutar DESPUÉS de sql/phase-tracker.sql y sql/phase-tracker-seed.sql,
-- y ANTES de sql/phase-foods-intl-seed.sql.
--
-- No rompe nada: solo añade columnas con valor por defecto, una tabla
-- nueva y una función de búsqueda. Los alimentos existentes quedan con
-- quality = 'approx' hasta que el seed internacional los actualice.
-- ============================================================

-- ── foods: columnas nuevas ───────────────────────────────────────────────────
ALTER TABLE public.foods
  ADD COLUMN IF NOT EXISTS aliases    text[] NOT NULL DEFAULT '{}',   -- sinónimos ES/EN y regionales, normalizados
  ADD COLUMN IF NOT EXISTS regions    text[] NOT NULL DEFAULT '{}',   -- 'ES','EU','US','MX','VE','LATAM'
  ADD COLUMN IF NOT EXISTS prep_state text CHECK (prep_state IN ('crudo','cocido','frito','horneado','a_la_plancha','envasado','bebida','otro')),
  ADD COLUMN IF NOT EXISTS quality    text NOT NULL DEFAULT 'approx' CHECK (quality IN ('usda','off','bedca','approx','reviewed')),
  ADD COLUMN IF NOT EXISTS source_ref text,                           -- p. ej. 'USDA fdcId 170379'
  ADD COLUMN IF NOT EXISTS fiber_100g numeric;

CREATE INDEX IF NOT EXISTS foods_aliases_gin_idx ON public.foods USING gin (aliases);

-- ── food_portions: porciones caseras ('1 taza', '1 arepa mediana'…) ──────────
CREATE TABLE IF NOT EXISTS public.food_portions (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_id uuid NOT NULL REFERENCES public.foods ON DELETE CASCADE,
  label   text NOT NULL,
  grams   numeric NOT NULL CHECK (grams > 0 AND grams <= 3000),
  source  text NOT NULL DEFAULT 'usda'
);
CREATE INDEX IF NOT EXISTS food_portions_food_idx ON public.food_portions (food_id);

-- RLS activado y sin políticas (solo service role), igual que el resto del tracker.
ALTER TABLE public.food_portions ENABLE ROW LEVEL SECURITY;

-- ── Búsqueda: search_foods(q) ────────────────────────────────────────────────
-- q llega ya normalizado desde /api/foods/search (minúsculas, sin acentos, solo
-- [a-z0-9 ]). Devuelve los alimentos cuyo nombre + alias contienen TODAS las
-- palabras de q y, si pg_trgm está disponible, también los parecidos (errores
-- de tipeo). El orden fino (nombre exacto → alias → parecido, y a igualdad la
-- calidad del dato) se hace en src/lib/foodSearch.ts.
DO $$
DECLARE
  trgm_schema text;
  sim_expr    text := '0::real';
  fuzzy_expr  text := 'false';
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_trgm no disponible: %', SQLERRM;
  END;

  SELECT n.nspname INTO trgm_schema
  FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace
  WHERE e.extname = 'pg_trgm';

  IF trgm_schema IS NOT NULL THEN
    sim_expr := format(
      'greatest(%1$I.word_similarity(q, f.name_norm), coalesce((SELECT max(%1$I.word_similarity(q, a)) FROM unnest(f.aliases) AS a), 0))::real',
      trgm_schema);
    fuzzy_expr := sim_expr || ' >= 0.6';
  END IF;

  EXECUTE format($fn$
    CREATE OR REPLACE FUNCTION public.search_foods(q text, max_rows int DEFAULT 80)
    RETURNS TABLE (
      id uuid, name text, name_norm text, aliases text[],
      kcal_100g numeric, protein_100g numeric, carbs_100g numeric, fat_100g numeric, fiber_100g numeric,
      prep_state text, quality text, source text, sim real
    )
    LANGUAGE sql STABLE
    SET search_path = public
    AS $body$
      SELECT f.id, f.name, f.name_norm, f.aliases,
             f.kcal_100g, f.protein_100g, f.carbs_100g, f.fat_100g, f.fiber_100g,
             f.prep_state, f.quality, f.source, %1$s
      FROM public.foods AS f
      WHERE length(q) >= 2
        AND (
          NOT EXISTS (
            SELECT 1 FROM unnest(string_to_array(q, ' ')) AS t
            WHERE t <> '' AND position(t IN f.name_norm || ' ' || array_to_string(f.aliases, ' ')) = 0
          )
          OR %2$s
        )
      ORDER BY (f.name_norm = q) DESC, (q = ANY (f.aliases)) DESC, (f.name_norm LIKE q || '%%') DESC, 13 DESC, length(f.name_norm)
      LIMIT least(greatest(max_rows, 1), 200)
    $body$
  $fn$, sim_expr, fuzzy_expr);
END $$;

-- Solo el servidor (service role) puede llamarla.
REVOKE ALL ON FUNCTION public.search_foods(text, int) FROM PUBLIC;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.search_foods(text, int) FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.search_foods(text, int) FROM authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.search_foods(text, int) TO service_role';
  END IF;
END $$;

-- Verificar:
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'foods' AND column_name IN ('aliases','regions','prep_state','quality','source_ref','fiber_100g');  -- 6 filas
-- SELECT relrowsecurity FROM pg_class WHERE relname = 'food_portions';      -- true
-- SELECT * FROM pg_policies WHERE tablename = 'food_portions';              -- 0 filas
-- SELECT name, prep_state, quality FROM public.search_foods('platano');     -- tras el seed: banana y plátano macho
