# Modelo de Datos

La base configurada para el MVP es SQLite mediante Prisma. Esto simplifica desarrollo local, demos y despliegues pequenos porque no requiere levantar un servidor de base de datos.

Para produccion con alta concurrencia, multiples sedes o muchas reservas simultaneas, PostgreSQL sigue siendo la opcion recomendada.

## Limitaciones de SQLite que afectan al schema

El conector SQLite de Prisma no soporta `enum` ni el tipo `Json`. El schema
original estaba escrito para PostgreSQL y por eso `prisma generate` fallaba.
La adaptacion fue:

- Los cuatro enums (`UserRole`, `BookingStatus`, `BookingSource`,
  `AvailabilityBlockType`) son columnas `String`. Los valores validos viven en
  `apps/api/src/common/enums.ts` como objetos `as const`, que dan el mismo
  autocompletado y chequeo de tipos que daba el enum generado.
- `BookingEvent.payload` es `String?` y guarda JSON serializado.

Al migrar a PostgreSQL se pueden reintroducir como enums nativos y `Json` sin
cambiar ningun nombre de valor.

## Decisiones importantes

- `BookingService` guarda snapshot de nombre, precio y duracion.
- `BookingEvent` permite auditoria de cambios.
- `PublicBookingAttempt` registra abuso potencial sin bloquear usuarias reales.
- En SQLite, la proteccion contra solapamientos vive en la transaccion de la aplicacion.
- Para produccion en PostgreSQL, se recomienda agregar una exclusion constraint para evitar rangos solapados por staff directamente en base de datos.

## Restriccion recomendada si migras a PostgreSQL

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE bookings
ADD CONSTRAINT no_overlapping_active_bookings
EXCLUDE USING gist (
  staff_id WITH =,
  tstzrange(start_at, end_at) WITH &&
)
WHERE (status IN ('PENDING', 'CONFIRMED'));
```
