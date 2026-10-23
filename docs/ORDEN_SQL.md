# Orden de ejecución de las migraciones SQL

Todas se ejecutan a mano en **Supabase → SQL Editor**, en el orden de esta tabla.
Todas son idempotentes: si una se ejecuta dos veces no pasa nada.
Al final de cada archivo hay consultas de verificación (comentadas).

## Ya ejecutadas (en `main`, según COWORK_BRIEF.md)

| Archivo | Qué hace |
|---|---|
| `sql/phase-2bis-tables.sql` | `dax_events_processed`, `usage_log`, `identity_diagnostics` |
| `sql/phase-multiproduct.sql` | `dax_subscriptions` + backfill desde `access` |
| `sql/phase-multiproduct-v2.sql` | Índice único `(email, plan)` en `dax_subscriptions` |
| `sql/phase-user-link.sql` | `user_id` en `clients` y `checkins` (hotfix save-routes, confirmado por Ray) |
| `sql/phase-rate-limits.sql` | Tabla `rate_limits` (hotfix save-routes, confirmado por Ray) |

## Pendientes, en este orden

| # | Archivo | Rama | Debe ejecutarse antes de… | Depende de |
|---|---|---|---|---|
| ~~1~~ | ~~`sql/phase-user-link.sql`~~ | ya ejecutada | — | — |
| ~~2~~ | ~~`sql/phase-rate-limits.sql`~~ | ya ejecutada | — | — |
| 3 | `sql/phase-leads.sql` | `feat/tracker-calorias` | Desplegar `feat/tracker-calorias`. Se puede ejecutar ya: el código de `main` ya inserta `tipo` y `datos` en `leads` | — |
| 4 | `sql/phase-tracker.sql` | `feat/tracker-calorias` | **Desplegar `feat/tracker-calorias`** (tablas `foods`, `nutrition_targets`, `meal_logs`, `meal_items`) | — |
| 5 | `sql/phase-tracker-seed.sql` | `feat/tracker-calorias` | **Desplegar `feat/tracker-calorias`** (sin alimentos, el buscador sale vacío) | #4 (tabla `foods`) |
| 6 | `sql/phase-tracker-day-close.sql` | `feat/tracker-calorias` | **Desplegar `feat/tracker-calorias`** (tabla `day_closures`; sin ella fallan `/api/tracker/day`, `/week` y "Cerrar mi día") | #4 (por orden lógico; técnicamente solo necesita `auth.users`) |
| 7 | `sql/phase-foods-intl.sql` | `feat/tracker-calorias` | **Desplegar `feat/tracker-calorias`** (columnas nuevas en `foods`, tabla `food_portions` y función `search_foods`; sin ella el buscador responde 500) | #4 |
| 8 | `sql/phase-foods-intl-seed.sql` | `feat/tracker-calorias` | **Desplegar `feat/tracker-calorias`** (349 alimentos y 387 porciones; sustituye al seed #5) | #7 |
| 9 | `sql/phase-photos.sql` | `feat/tracker-calorias` | **Desplegar la Fase 2 (fotos)**: tabla `photo_consents`, bucket privado `meal-photos` y función `old_meal_photos` para el cron. Sin ella, "Foto de mi plato" responde error y el cron de purga falla; el registro manual sigue funcionando | #4 y `phase-rate-limits.sql` (ya ejecutada) |

### Antes de cada despliegue

- **Antes de desplegar `hotfix/save-routes`:** #1 y #2.
- **Antes de desplegar `feat/tracker-calorias`:** #3, #4, #5, #6, #7 y #8 (#1 y #2 ya están ejecutadas).
- **Antes de desplegar la Fase 2 (fotos), también en `feat/tracker-calorias`:** #9, más el bucket (ver nota de #9) y `CRON_SECRET` en Preview si quieres probar el cron allí.

### Notas por archivo

- **#1 `phase-user-link.sql`:** al final hay una consulta de políticas. Si aparece alguna política pública antigua en `clients` o `checkins`, avísame antes de borrarla. Los registros antiguos quedan con `user_id` NULL (no se asignan por nombre).
- **#2 `phase-rate-limits.sql`:** recomendable añadir también la variable `RATE_LIMIT_SALT` en Vercel (texto aleatorio largo).
- **#3 `phase-leads.sql`:** antes de ejecutarla, revisa las columnas reales de `leads` con la consulta del encabezado. Si alguna columna existente es `NOT NULL` y el código no la envía, avísame antes de ejecutar.
- **#5 `phase-tracker-seed.sql`:** 168 alimentos; 36 marcados `APROX`/`REVISAR` para revisión. Volver a ejecutarla actualiza los valores de los alimentos `seed`. **Queda sustituido por #8**: si se ejecutan #7 y #8 se puede saltar #5 (y si ya se ejecutó, #8 renombra o fusiona sus filas sin perder las comidas registradas). Si alguna vez se vuelve a ejecutar #5 después de #8, hay que volver a ejecutar #8.
- **#7 `phase-foods-intl.sql`:** intenta activar `pg_trgm` (búsqueda tolerante a erratas). Si no se puede, la búsqueda sigue funcionando sin esa tolerancia.
- **#8 `phase-foods-intl-seed.sql`:** generado por `scripts/import-usda.mjs` (no editar a mano). Es una transacción: o se aplica entero o no se aplica nada. Al final hay consultas de verificación con los recuentos esperados.
- **#9 `phase-photos.sql`:** crea el bucket `meal-photos` con un `INSERT` en `storage.buckets`. Si el SQL Editor no te deja (error de permisos en `storage`), créalo a mano: **Storage → New bucket** → nombre `meal-photos`, **Public bucket desactivado**, *Restrict file size* 3 MB, *Allowed MIME types* `image/jpeg`. No añadas ninguna política en **Storage → Policies** para ese bucket: el servidor usa el service role y el navegador nunca accede directamente. Después vuelve a ejecutar el archivo entero (el resto no depende del bucket). Al final hay consultas de verificación: la de políticas de `storage.objects` debe devolver 0 filas.

## ¿PROMPT_02 (cerrar el día) añadió alguna migración?

**Sí, una:** `sql/phase-tracker-day-close.sql` (commit `544dd8f`, rama `feat/tracker-calorias`).
Crea la tabla `day_closures (user_id, log_date, closed_at)` con clave primaria `(user_id, log_date)`, RLS activado y sin políticas. Es la #6 de la tabla.

PROMPT_03 (suelo y techo) y el cambio de correo de soporte **no** añadieron migraciones.
