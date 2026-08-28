# Arquitectura

## Objetivo

Separar claramente experiencia publica, panel administrativo, reglas de negocio e infraestructura. El backend es la fuente de verdad de disponibilidad y reservas.

## Capas por modulo API

- `domain`: entidades, value objects, errores de dominio y contratos de repositorio.
- `application`: casos de uso, comandos, queries y reglas de orquestacion.
- `infrastructure`: Prisma, proveedores externos, persistencia y adaptadores.
- `presentation`: controladores REST, DTOs, guards y mappers HTTP.

## Modulos principales

- `auth`: login admin, refresh tokens, hashing y JWT.
- `users`: administradores y personal.
- `clients`: clientas publicas sin cuenta obligatoria.
- `services`: catalogo, precios, duraciones y estado activo.
- `availability`: horarios base, bloqueos y excepciones.
- `bookings`: reservas, estados, colisiones y auditoria.
- `notifications`: WhatsApp, SMS o email.

## Principios

- El calendario del frontend nunca decide disponibilidad final.
- Crear una reserva siempre recalcula disponibilidad en backend.
- Las reservas guardan snapshot de servicios para preservar historico.
- Endpoints publicos aceptan datos minimos y se protegen con rate limit, honeypot e idempotencia.

## Rate limiting

`ThrottlerGuard` se registra como `APP_GUARD` en `app.module.ts`. Sin ese
proveedor los decoradores `@Throttle` de los controladores no hacen nada, que
es justo lo que pasaba antes: el endpoint publico aceptaba peticiones
ilimitadas.

- General: 120 peticiones por minuto. Holgado para navegacion y para el panel,
  que consulta la agenda seguido.
- `POST /public/bookings`: 5 por minuto, configurable con
  `PUBLIC_BOOKING_RATE_LIMIT_MAX` y `PUBLIC_BOOKING_RATE_LIMIT_TTL_SECONDS`.
- `POST /auth/login`: 10 cada 5 minutos, contra fuerza bruta.

El conteo es por IP y vive en memoria: si algun dia se corren varias instancias
hara falta un almacen compartido. Detras de un proxy hay que habilitar
`trust proxy` en Express o todas las peticiones contaran como una sola IP.

## Dependencias y seguridad

El proyecto se mantiene en las versiones mayores actuales: Next 16, React 19,
NestJS 11 (Express 5), Prisma 7 y Zod 4.

Dos decisiones deliberadas:

- **NestJS se queda en 11, no 12.** `@nestjs/throttler` 6 declara compatibilidad
  hasta la 11; subir a la 12 romperia el rate limiting.
- **`npm audit` reporta 3 vulnerabilidades altas en `prisma`.** La cadena es
  `prisma` -> `@prisma/config` -> `deepmerge-ts`, y entra unicamente por el CLI,
  que es dependencia de desarrollo. El runtime usa `@prisma/client` y el
  adaptador, que no la arrastran. El unico "arreglo" que ofrece npm es bajar a
  Prisma 6, es decir deshacer la actualizacion sin ganancia real.
