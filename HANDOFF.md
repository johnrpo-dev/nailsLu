# Pendientes de NAILS LU SPA

Estado al 29 de agosto de 2026. Repositorio: github.com/johnrpo-dev/nailsLu

**El código está terminado y publicado.** Lo que falta son decisiones, datos y
un servidor. Nada de esta lista se arregla programando.

---

## 1. Bloquea el lanzamiento

### Servidor y dominio

Lo gestiona un tercero. Sin eso la aplicación solo corre en local.

Cuando esté, los pasos están en [docs/despliegue.md](docs/despliegue.md). Los
archivos de configuración ya existen en `deploy/`: un `Caddyfile` y cuatro
unidades de systemd (API, web, backup y su temporizador).

Los puntos donde se suele fallar:

- Crear `apps/api/.env` con un `JWT_ACCESS_SECRET` propio. **El API se niega a
  arrancar en producción sin él**, o si es corto, o si conserva el de ejemplo.
- Definir `WEB_ORIGIN`. También es obligatorio: sin él, tampoco arranca.
- Correr el seed **una sola vez** y anotar la contraseña que imprime. No se
  vuelve a mostrar.
- Activar el temporizador de backups.
- La base de datos y la carpeta `uploads/` necesitan disco persistente.

### Revisión legal de la política de privacidad

El texto de `/privacidad` describe con precisión lo que la aplicación hace y ya
tiene los datos reales de la responsable. **No lo ha revisado un abogado.**

Para un negocio de una sola persona el riesgo es bajo, pero conviene que lo lea
alguien que sepa antes de recibir clientas reales.

---

## 2. Tareas de Yeri, después del despliegue

1. **Cambiar la contraseña del panel** al entrar por primera vez. El panel se lo
   recuerda hasta que lo haga.
2. **Revisar las duraciones del catálogo.** Son las que deciden qué horarios se
   ofrecen: si un servicio dice 150 minutos y en realidad son 180, la agenda le
   queda apretada. Puede ajustarlas sola desde el panel.

Todo lo que necesita saber está en [docs/guia-para-lu.md](docs/guia-para-lu.md),
escrito sin jerga.

---

## 3. Decisiones tomadas — no rehacerlas sin motivo

### El número de WhatsApp se queda en el de pruebas

`NEXT_PUBLIC_WHATSAPP_NUMBER` vale `573003024035`. Es un número de pruebas y
**sigue así también en producción**, a propósito, para poder reservar contra el
sitio real sin llenar de citas falsas el WhatsApp de Yeri.

El suyo es `573045442496`. El cambio es deliberado y lo decide John, no es un
paso obligatorio del despliegue. Cuando toque: cambiar la variable y
**recompilar la web** — las variables `NEXT_PUBLIC_` se incrustan al compilar,
no basta con reiniciar.

### La notificación la resuelve WhatsApp Business

No hay envío automático desde el servidor, y es intencional. El módulo
`notifications` del API está vacío.

Cómo funciona hoy: la clienta reserva → la cita queda guardada y aparece en el
panel → el botón "Avisarnos por WhatsApp" abre WhatsApp con el mensaje ya
escrito → ella pulsa enviar → llega como un WhatsApp normal, que notifica solo.
La respuesta automática la da el saludo configurado en WhatsApp Business.

Cubre el caso sin coste, sin código y sin la verificación de Meta, que además
exigiría un número dedicado fuera de WhatsApp normal.

**El hueco conocido:** si la clienta no pulsa enviar, no llega aviso. La cita
queda igualmente en el panel, así que no se pierde nada.

**Plan B declarado: un bot de Telegram.** Gratis, automático, llega como
notificación push y no depende de que la clienta haga nada. Serían unas dos
horas: rellenar el módulo `notifications`, que ya está esqueletado, y dispararlo
al crear la reserva. Se sumaría al botón actual, no lo reemplaza.

### La cédula no se publica

La política identifica a la responsable con nombre completo, ciudad, correo y
WhatsApp. El número de cédula se dejó fuera: la ley pide identificar y dar un
canal de contacto, no publicar el documento, y en Colombia la cédula sirve para
verificar identidad. Publicarla invita a la suplantación sin darle nada a la
clienta.

La dirección tampoco se muestra, por lo mismo: si atiende en casa, publicarla
expone su domicilio. Ambos campos se muestran solos si algún día se rellenan.

### Los festivos se cierran solos

Los 18 festivos de Colombia se calculan, no se listan: traslados de la Ley
Emiliani al lunes y los cinco que dependen de la Pascua. No hay tabla que
caduque cada diciembre.

En festivo el horario semanal no cuenta. Se puede abrir un festivo concreto con
una excepción `AVAILABLE`, y entonces valen solo esas horas, no la jornada
entera.

Un detalle real: en algunos años dos celebraciones caen el mismo lunes (2030,
San Pedro y Sagrado Corazón el 1 de julio). Es un solo día no laborable, así
que ese año hay 17 fechas y no 18.

### Citas a domicilio y tiempo de traslado

La clienta elige spa o domicilio al reservar; a domicilio la dirección es
obligatoria y solo se guarda en ese caso.

Cada cita a domicilio bloquea 50 minutos **antes y después** del servicio. El
margen se guarda en cada reserva, no se recalcula: si mañana cambia la regla,
las citas ya agendadas conservan el hueco con el que se aceptaron.

Los 50 son el peor caso, porque al reservar no se sabe dónde vive la clienta.
Yeri puede bajarlo por cita desde el panel, y eso devuelve franjas libres. El
valor por defecto está en `apps/api/src/common/booking-rules.ts`.

El margen separa citas entre sí, pero **no recorta la jornada**: a la primera
cita del día se puede salir de casa directamente.

### La clienta puede consultar y cancelar sola

`/reserva/[token]` muestra el estado de la cita y permite cancelarla. Cancelar
libera la franja automáticamente, sin que Yeri tenga que hacer nada — así que
verá citas desaparecer del panel sin haberlas tocado.

El enlace va en el mensaje de WhatsApp y queda guardado en el navegador de la
clienta. La página no expone la dirección ni el teléfono, solo fecha, hora y
modalidad.

### Los servicios no llevan precio

A varias clientas no se les cobra lo mismo. Ver la nota en el repositorio.

---

## 4. Deuda técnica — nada de esto bloquea

| Qué | Estado |
| --- | --- |
| 8 avisos de `react-hooks/set-state-in-effect` | Dejados como aviso a propósito. El arreglo de fondo es mover las peticiones a `react-query`. |
| `@tanstack/react-query`, `react-hook-form`, `@spa/ui` | Declarados y sin usar. |
| Sesión del panel en `localStorage`, sin refresh token | 12 h y a volver a entrar. Aceptable para una sola usuaria. |
| `staffId` sin filtro | Con varias manicuristas, la reserva de una bloquearía a todas. Hoy es un solo puesto. |
| Contador del rate limit en memoria | Sirve con una sola instancia. |
| `npm audit`: 3 vulnerabilidades altas | Todas en `prisma` → `@prisma/config` → `deepmerge-ts`. Es herramienta de línea de comandos, no código que corra en el servidor, y no es alcanzable desde internet. `audit fix --force` cambiaría la versión de Prisma. |

---

## 5. Suelto

En la base local hay una **excepción de disponibilidad de pruebas** que abre el
lunes 31 de agosto entero (00:00–23:59) y bloquea de 03:00 a 15:30. Por eso ese
día ofrece citas de madrugada. Se borra desde el panel, en Disponibilidad.

---

## Estado de la verificación

Al cierre: `npm run lint` pasa en ambos workspaces, 91 pruebas automáticas en
verde (61 del API, 30 de la web), y el build compila.

Comprobado contra datos reales: última cita a las 18:00 de lunes a viernes y a
las 14:00 los sábados; no se ofrecen horas ya pasadas; y una cita a domicilio
de 10:00 a 11:30 deja la siguiente franja libre en las 12:30.
