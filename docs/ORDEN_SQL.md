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

## Pendientes, en este orden

| # | Archivo | Rama | Debe ejecutarse antes de… | Depende de |
|---|---|---|---|---|
| 1 | `sql/phase-user-link.sql` | `hotfix/save-routes` | **Desplegar `hotfix/save-routes`** (save-plan y save-checkin escriben `user_id`; sin la columna fallan) | — |
| 2 | `sql/phase-rate-limits.sql` | `hotfix/save-routes` | **Desplegar `hotfix/save-routes`** (sin la tabla, `/api/verify-code` responde 503) | — |
| 3 | `sql/phase-leads.sql` | `feat/tracker-calorias` | Desplegar `feat/tracker-calorias`. Se puede ejecutar ya: el código de `main` ya inserta `tipo` y `datos` en `leads` | — |
| 4 | `sql/phase-tracker.sql` | `feat/tracker-calorias` | **Desplegar `feat/tracker-calorias`** (tablas `foods`, `nutrition_targets`, `meal_logs`, `meal_items`) | — |
| 5 | `sql/phase-tracker-seed.sql` | `feat/tracker-calorias` | **Desplegar `feat/tracker-calorias`** (sin alimentos, el buscador sale vacío) | #4 (tabla `foods`) |
| 6 | `sql/phase-tracker-day-close.sql` | `feat/tracker-calorias` | **Desplegar `feat/tracker-calorias`** (tabla `day_closures`; sin ella fallan `/api/tracker/day`, `/week` y "Cerrar mi día") | #4 (por orden lógico; técnicamente solo necesita `auth.users`) |

### Antes de cada despliegue

- **Antes de desplegar `hotfix/save-routes`:** #1 y #2.
- **Antes de desplegar `feat/tracker-calorias`:** #3, #4, #5 y #6. Además, #1 y #2 si para entonces la rama ya incluye el hotfix (al fusionar `main` con el hotfix dentro, su código llega también a esta rama).

### Notas por archivo

- **#1 `phase-user-link.sql`:** al final hay una consulta de políticas. Si aparece alguna política pública antigua en `clients` o `checkins`, avísame antes de borrarla. Los registros antiguos quedan con `user_id` NULL (no se asignan por nombre).
- **#2 `phase-rate-limits.sql`:** recomendable añadir también la variable `RATE_LIMIT_SALT` en Vercel (texto aleatorio largo).
- **#3 `phase-leads.sql`:** antes de ejecutarla, revisa las columnas reales de `leads` con la consulta del encabezado. Si alguna columna existente es `NOT NULL` y el código no la envía, avísame antes de ejecutar.
- **#5 `phase-tracker-seed.sql`:** 168 alimentos; 36 marcados `APROX`/`REVISAR` para revisión. Volver a ejecutarla actualiza los valores de los alimentos `seed`.

## ¿PROMPT_02 (cerrar el día) añadió alguna migración?

**Sí, una:** `sql/phase-tracker-day-close.sql` (commit `544dd8f`, rama `feat/tracker-calorias`).
Crea la tabla `day_closures (user_id, log_date, closed_at)` con clave primaria `(user_id, log_date)`, RLS activado y sin políticas. Es la #6 de la tabla.

PROMPT_03 (suelo y techo) y el cambio de correo de soporte **no** añadieron migraciones.
