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
- `docs`: arquitectura, API, base de datos, despliegue, secretos y la guia de
  uso para la duena (`guia-para-lu.md`).

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

Para abrirlo desde el celular, en la misma red Wi-Fi, se usa la IP del equipo:
`http://TU-IP:3000`. No hay que cambiar nada: cuando `NEXT_PUBLIC_API_URL`
apunta a `localhost` pero la pagina llega desde otro host, el sitio resuelve el
API contra ese mismo host. En Windows la IP se ve con `ipconfig`.
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
  Pensado para subir desde el celular: el navegador reduce la foto a 2000px
  antes de enviarla, asi que una de 12 MB viaja como poco mas de un mega y la
  subida no depende de la señal. El servidor la reprocesa a WebP con un lado
  maximo de 1200px y acepta hasta 30 MB, incluidos HEIC y HEIF de iPhone, por si
  el navegador no supo decodificarla.

  La foto siempre llena la tarjeta; se reencuadra arrastrandola y con el zoom,
  sin volver a subirla: se guardan el punto focal y la escala, no se toca el
  archivo. Las fotos viven en `apps/api/uploads`, que debe estar en disco
  persistente.
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
- 32 pruebas automaticas sobre la logica de agenda, fechas y claves: `npm test`.
- `npm run lint` revisa ambos workspaces con ESLint 9 (configuracion plana).
  La web usa `eslint-config-next`; desde Next 16 `next lint` ya no existe.

La app estatica inicial se conserva en la raiz como prototipo rapido: `index.html`, `styles.css`, `app.js`.
