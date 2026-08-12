# NAILS LU SPA

Plataforma de agendamiento de servicios para NAILS LU SPA.

## Stack

- Web: Next.js, TypeScript, TanStack Query, React Hook Form, Zod.
- API: NestJS, TypeScript, JWT, Clean Architecture por modulo.
- DB: SQLite para desarrollo/MVP local. PostgreSQL sigue recomendado para produccion con alta concurrencia.
- ORM: Prisma.
- Seguridad publica: rate limiting, idempotency key, validacion estricta y transacciones.

## Estructura

- `apps/web`: aplicacion publica y panel administrativo.
- `apps/api`: backend modular.
- `packages/shared`: contratos, tipos y validadores compartidos.
- `packages/ui`: componentes visuales reutilizables.
- `docs`: decisiones de arquitectura, API y base de datos.

## Primeros pasos

```bash
npm install
copy apps\api\.env.example apps\api\.env
copy apps\web\.env.example apps\web\.env.local
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Web en `http://localhost:3000`, API en `http://localhost:3001`.
Credenciales del seed: `admin@spa.local` / `Admin12345!`.

## Panel de administracion

En `http://localhost:3000/admin`, con las credenciales del seed.

- **Reservas**: agenda agrupada por dia con filtros Activas, Hoy y Todas.
  Permite confirmar, marcar como atendida y cancelar. El telefono abre WhatsApp.
- **Servicios**: crear, editar nombre, descripcion y duracion, y ocultar o
  mostrar en el sitio publico. Ocultar es borrado logico: conserva el historial.

Los servicios no llevan precio: la tarifa se acuerda con cada clienta.

## Estado actual

- Flujo publico de reserva: completo y funcionando contra la API.
- Panel: reservas y servicios operativos. Falta la seccion de disponibilidad
  (horarios base y bloqueos), que hoy solo existe como endpoints en la API.
- La sesion del panel dura 12 horas (`JWT_ACCESS_TTL`). No hay refresh tokens,
  asi que al vencer hay que volver a entrar.
- Sin tests ni configuracion de ESLint todavia, asi que `npm run lint` no corre.

La app estatica inicial se conserva en la raiz como prototipo rapido: `index.html`, `styles.css`, `app.js`.
