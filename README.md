# NAILS LU SPA

Plataforma de agendamiento de servicios para NAILS LU SPA.

## Puesta en produccion

```bash
npm run build       # compila web y API
npm run db:deploy   # aplica migraciones (no interactivo, para servidores)
npm start           # arranca ambos en modo produccion
```

`db:migrate` usa `prisma migrate dev` y es solo para desarrollo: es interactivo
y puede reescribir el historial. En el servidor va `db:deploy`.

Antes del primer despliegue hay que cambiar `JWT_ACCESS_SECRET` por un valor
aleatorio, apuntar `NEXT_PUBLIC_API_URL` y `NEXT_PUBLIC_SITE_URL` al dominio
real, y definir `WEB_ORIGIN` para que el API solo acepte peticiones del sitio.

## Stack

- Web: Next.js 16, React 19, TypeScript, Tailwind 4, Zod 4.
- API: NestJS 11 sobre Express 5, TypeScript, JWT, Clean Architecture por modulo.
- DB: SQLite para desarrollo/MVP local. PostgreSQL sigue recomendado para produccion con alta concurrencia.
- ORM: Prisma 7 con adaptador de controlador para SQLite.
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

**Esa contrasena esta en `prisma/seed.ts`, que es publico.** Al entrar, el panel
avisa y enlaza a "Tu cuenta" para cambiarla. El aviso desaparece solo cuando se
cambia. Hasta entonces, cualquiera que lea el repositorio puede entrar.

## Panel de administracion

En `http://localhost:3000/admin`, con las credenciales del seed.

- **Reservas**: agenda agrupada por dia con filtros Activas, Hoy y Todas.
  Permite confirmar, marcar como atendida y cancelar. El telefono abre WhatsApp.
- **Servicios**: crear, editar nombre, descripcion y duracion, y ocultar o
  mostrar en el sitio publico. Ocultar es borrado logico: conserva el historial.
- **Fotos**: cada servicio puede llevar una foto, que se sube desde su ficha.
  Al subirla se reprocesa a WebP con un lado maximo de 1200px, y se puede
  reencuadrar arrastrando la imagen y ajustando el zoom sin volver a subirla:
  se guardan el punto focal y la escala, no se toca el archivo. Las fotos viven
  en `apps/api/uploads`, que debe estar en disco persistente.
- **Disponibilidad**: horario base semanal (que dias se abre y a que horas) y
  excepciones por fecha para cerrar un festivo o una tarde suelta, o para abrir
  un dia que normalmente no se atiende. Las excepciones mandan sobre el horario
  base.

Los servicios no llevan precio: la tarifa se acuerda con cada clienta.

## Aviso por WhatsApp

Al terminar la reserva, la clienta ve un boton que abre WhatsApp con el mensaje
ya redactado hacia el numero del spa. No requiere API, tramites con Meta ni
numero dedicado, y el aviso llega al WhatsApp de siempre.

Se configura con `NEXT_PUBLIC_WHATSAPP_NUMBER` en `apps/web/.env.local`, con
indicativo de pais y sin signos (por ejemplo `573001234567`). Si la variable
falta, el boton simplemente no aparece.

Es una comodidad, no la fuente de verdad: la reserva queda guardada aunque la
clienta nunca pulse el boton, y el panel siempre la muestra. Para envio
automatico sin depender de la clienta hace falta la API oficial de WhatsApp
Business, que exige verificacion del negocio, plantillas aprobadas y un numero
que no pueda usarse en la aplicacion normal.

## Estado actual

- Flujo publico de reserva: completo y funcionando contra la API.
- Panel: reservas, servicios y disponibilidad operativos.
- La sesion del panel dura 12 horas (`JWT_ACCESS_TTL`). No hay refresh tokens,
  asi que al vencer hay que volver a entrar.
- Sin tests ni configuracion de ESLint todavia, asi que `npm run lint` no corre.

La app estatica inicial se conserva en la raiz como prototipo rapido: `index.html`, `styles.css`, `app.js`.
