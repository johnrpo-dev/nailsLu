# NAILS LU SPA — estado y pendientes

Estado al 19 de septiembre de 2026. Repositorio: github.com/johnrpo-dev/nailsLu

**En producción y funcionando: https://nailslu.com**

---

## 1. El servidor

| | |
| --- | --- |
| Proveedor | Spaceship (Starlight VPS, Phoenix) |
| IP | `104.207.89.46` |
| **Puerto SSH** | **`22022`, no el 22** |
| Sistema | Ubuntu 24.04 LTS · 2 GB RAM + 4 GB de intercambio · 1 vCPU |
| Ruta | `/srv/nailslu`, usuario de sistema `nailslu` |
| Servidor web | Caddy, con HTTPS automático |
| Base de datos | SQLite en `apps/api/prisma/produccion.db` |

Entrar:

```bash
ssh -p 22022 john@104.207.89.46
```

Actualizar tras un cambio:

```bash
cd /srv/nailslu && sudo -u nailslu -H npm run db:backup -w @spa/api && sudo -u nailslu git pull && sudo -u nailslu -H npm ci && sudo -u nailslu -H npm run db:deploy && sudo -u nailslu -H npm run build && sudo systemctl restart nailslu-api nailslu-web
```

Los pasos completos, con qué esperar en cada uno, están en
[docs/despliegue.md](docs/despliegue.md).

---

## 2. Lo que falta

### Revisión legal de la política de privacidad

El texto de `/privacidad` describe con precisión lo que la aplicación hace y
tiene los datos reales de la responsable. **No lo ha revisado un abogado.**

Para un negocio de una sola persona el riesgo es bajo, pero conviene que lo lea
alguien que sepa. Es lo único de esta lista con una obligación detrás.

### Comprobaciones manuales pendientes

Todo lo de aqui esta desplegado y verificado por lectura de codigo, pero
**ninguna prueba automatica lo cubre**: `apps/web` no tiene jsdom ni
testing-library, asi que nada toca componentes. Son cambios que solo se ven
en un navegador de verdad.

#### Del review del 11/10/2026 (`c24da54`)

En `https://nailslu.com/admin/login`:

1. **Vista "lista" sin parpadeo.** Cambiar a "Lista" y recargar la pagina. El
   calendario no debe aparecer ni un instante antes de la lista.
2. **Boton "Hoy" sin recargar.** En el mes actual, elegir un dia que no sea hoy
   y pulsar "Hoy". No debe salir "Cargando citas..." ni atenuarse la
   cuadricula.
3. **Dia con solo citas canceladas.** Su casilla debe seguir mostrando los
   chips tachados. El cambio esta en lo que anuncia el lector de pantalla
   (antes decia "sin citas"), asi que sin lector basta confirmar que la casilla
   no cambio de aspecto.

Lo que si quedo verificado en produccion, con peticiones reales: una fecha con
hora (`?date=2026-09-01T12:00:00Z`) y un dia inexistente (`?date=2026-02-31`)
devuelven 400 en vez de un 500 y un rango equivocado.

#### De la card de servicio y los bloqueos (`9e0239b`)

**En el movil**, abriendo un servicio con cinco fotos (Semipermanente manos):

4. **La X se ve siempre**, arriba a la derecha y con borde. Antes la card no
   tenia limite de alto y, al estar centrada, el recorte se la comia: 94px en
   un iPhone SE, 44px en un Android de 360.
5. **Tocar arriba o abajo de la card la cierra.** Antes la card cubria todo el
   alto y a los lados solo quedaban 16px de overlay, asi que no habia donde
   tocar.
6. **Al pasar las fotos el pie no se mueve:** "Cerrar" y "Elegir este
   servicio" quedan fijos.
7. **"Elegir este servicio"** marca el servicio y pasa a "Elegido"; al cerrar,
   la tarjeta del catalogo debe quedar seleccionada.
8. **Press on y Retiro con limpieza** (sin fotos): la card debe verse bien
   igual, solo sin galeria.

**En el panel, despues de las 19:00 hora de Colombia** — antes de esa hora el
fallo no se manifiesta:

9. **Disponibilidad sigue mostrando los bloqueos de hoy.** El "hoy" por
   defecto se construia en UTC, asi que a partir de las 19:00 el filtro se
   iba a manana y los ocultaba. Esto si tiene prueba automatica
   (`availability.service.spec.ts`), pero conviene verlo una vez.

### Tareas de Yeri

1. **Cambiar la contraseña del panel.** El panel se lo recuerda hasta que lo
   haga.
2. **Terminar las fotos de los servicios.** Al 11/10/2026 hay **36 fotos
   subidas** sobre 10 servicios publicados, comprobado contra
   `/api/public/services`: siete servicios con cinco fotos cada uno, Dipping
   con una sola, y **Press on y Retiro con limpieza todavia sin ninguna**. Esos
   tres son los que quedan.
3. **Borrar las reservas de prueba** que quedaron del despliegue.

Lo que necesita saber está en [docs/guia-para-lu.md](docs/guia-para-lu.md),
escrito sin jerga.

El horario semanal ya está configurado: lunes a viernes 8:00–18:00 y sábados
8:00–14:00.

---

## 3. Decisiones tomadas — no rehacerlas sin motivo

### El WhatsApp de los avisos

`NEXT_PUBLIC_WHATSAPP_NUMBER` vale `573045442496`, el de Yeri. Durante las
pruebas apuntó a otro número a propósito.

Si vuelve a cambiar: **el valor real vive en `apps/web/.env.local` del
servidor**, que está fuera de git. Y no basta con editarlo y reiniciar — las
`NEXT_PUBLIC_` se incrustan al compilar, así que hay que rehacer el build.

### La notificación la resuelve WhatsApp Business

No hay envío automático desde el servidor, y es intencional. El módulo
`notifications` del API está vacío.

La clienta reserva → la cita queda en el panel → el botón "Avisarnos por
WhatsApp" abre el chat con el mensaje escrito → ella pulsa enviar → llega como
un WhatsApp normal, que ya notifica solo. La respuesta automática la da el
saludo de WhatsApp Business.

**El hueco conocido:** si no pulsa enviar, no llega aviso. La cita queda
igualmente en el panel.

**Plan B declarado: un bot de Telegram.** Gratis, automático, no depende de que
la clienta haga nada. Unas dos horas de trabajo. Se sumaría al botón, no lo
reemplaza.

### Fotos: carrusel por servicio

Cada servicio tiene una portada más hasta 5 fotos, **seis en total**. Se ven en
la tarjeta del catálogo —se pasan con el dedo, con puntos que avisan de cuántas
hay— y más grandes al abrir el detalle. Si hay menos, se muestran las que haya.

**Todas llenan el marco con `object-fit: cover`, y cada una tiene su propio
punto focal y escala.** Se probó con `contain` y reaparecían franjas vacías y
esquinas cuadradas según la proporción de cada foto: el mismo defecto que se
corrigió en su día para la portada.

El carrusel **no avanza solo**, a propósito: aparta la foto justo cuando la
clienta la está mirando para decidir, e incumpliría la pauta que exige poder
detener cualquier movimiento.

Planteado como muestra curada que se refresca un par de veces al año, no como
portafolio al día — si se toma como algo semanal, se abandona.

**Sin enlaces a Instagram**, aunque el negocio tenga: sacan a la clienta del
flujo de reserva, y muchas llegan justo desde ahí.

### Foto de referencia de la clienta: pendiente, después

La pidió Yeri, porque siempre pregunta el diseño. Queda **para después del
carrusel**: con ejemplos a la vista puede que se use menos.

Si se hace: **una sola regla de borrado, por fecha de la cita**, nunca por
cambio de estado. Ella no va a marcar las citas como atendidas, y una regla que
depende de eso deja fotos acumulándose para siempre.

### Reservas: calendario de mes

La pestaña Reservas abre en una vista de mes al estilo de Google Calendar:
semana de domingo a sábado, seis filas fijas y cada cita como una etiqueta
con la hora y el primer nombre. Al tocar un día se abre debajo su agenda con
las mismas tarjetas de la lista, así que desde ahí también se confirma, se
cancela y se ajusta el traslado.

- **Colores:** confirmada rellena, pendiente con borde, atendida apagada,
  cancelada tachada. Las canceladas **se muestran**, no se esconden: si no,
  un día parece libre justo cuando una clienta acaba de cancelar.
- **Máximo 3 por casilla** y después "+N más"; el detalle completo está en la
  agenda del día.
- **La lista sigue existiendo** (botón "Lista"), con sus filtros. El navegador
  recuerda cuál se usó por última vez.
- Pide al API las 42 casillas visibles (`?scope=all&from=…&to=…`), no solo el
  mes, para que los días de los meses vecinos no aparezcan vacíos.

### Citas a domicilio y traslado

La clienta elige spa o domicilio; a domicilio la dirección es obligatoria y
solo se guarda en ese caso.

Cada cita a domicilio bloquea 50 minutos **antes y después**. El margen se
guarda en cada reserva y no se recalcula: si mañana cambia la regla, las citas
ya agendadas conservan el hueco con el que se aceptaron.

Los 50 son el peor caso. Yeri puede bajarlo por cita desde el panel y eso
devuelve franjas libres. El valor por defecto está en
`apps/api/src/common/booking-rules.ts`.

El margen separa citas entre sí, pero **no recorta la jornada**: a la primera
del día se puede salir de casa directamente.

### Los festivos se cierran solos

Los 18 festivos de Colombia se calculan, no se listan: traslados de la Ley
Emiliani y los cinco que dependen de la Pascua. No hay tabla que caduque.

Se puede abrir un festivo concreto con una excepción `AVAILABLE`, y entonces
valen solo esas horas, no la jornada entera.

En algunos años dos celebraciones caen el mismo lunes (2030, San Pedro y
Sagrado Corazón el 1 de julio): es un solo día no laborable, así que ese año
hay 17 fechas y no 18.

### La clienta puede consultar y cancelar sola

`/reserva/[token]` muestra el estado y permite cancelar. Cancelar libera la
franja automáticamente, así que **Yeri verá citas desaparecer del panel sin
haberlas tocado**.

El enlace va en el mensaje de WhatsApp y queda guardado en el navegador de la
clienta. La página no expone dirección ni teléfono: solo fecha, hora y
modalidad.

### La cédula no se publica

La política identifica a la responsable con nombre, ciudad, correo y WhatsApp.
La cédula se dejó fuera: la ley pide identificar y dar un canal de contacto, no
publicar el documento, y en Colombia sirve para verificar identidad.

La dirección tampoco, por lo mismo: si atiende en casa, publicarla expone su
domicilio. Ambos campos aparecen solos si algún día se rellenan.

### Los servicios no llevan precio

A varias clientas no se les cobra lo mismo.

---

## 4. Seis fallos que solo aparecieron en el servidor

Todos corregidos. Se listan porque explican decisiones del código que si no
parecerían arbitrarias.

| Fallo | Corrección |
| --- | --- |
| El seed no encontraba el cliente de Prisma | `postinstall` que lo genera |
| Turbopack no encontraba `next` | `turbopack.root` fijado; el home del usuario era la raíz del proyecto |
| Prisma sembró `dev.db` en vez de la de producción | `prisma.config.ts` carga `.env` y avisa si falta |
| La web llamaba al API sin el `/api` | La dirección base conserva la ruta; `url.origin` la descartaba |
| El script de copia no encontraba la base | También carga `.env` |
| El panel no compilaba tras añadir el carrusel | `AdminService` deriva del tipo compartido en vez de repetirlo |

El cuarto llevaba semanas en el código y ninguna prueba lo veía: en desarrollo
la dirección del API no tiene ruta que perder.

---

## 5. Deuda técnica — nada de esto bloquea

| Qué | Estado |
| --- | --- |
| 12 avisos de `react-hooks/set-state-in-effect` en la web (y uno de `exhaustive-deps`) | Dejados como aviso a propósito. El arreglo de fondo es mover las peticiones a `react-query`. |
| `@tanstack/react-query`, `react-hook-form`, `@spa/ui` | Declarados y sin usar. |
| Sesión del panel en `localStorage`, sin refresh token | 12 h y a volver a entrar. Aceptable para una sola usuaria. |
| `staffId` sin filtro | Con varias manicuristas, la reserva de una bloquearía a todas. Hoy es un solo puesto. |
| Contador del rate limit en memoria | Sirve con una sola instancia. |
| Las fotos del carrusel no se pueden reordenar | Salen en el orden en que se suben. |
| `npm audit`: 3 vulnerabilidades altas | En `prisma` → `@prisma/config` → `deepmerge-ts`. Herramienta de línea de comandos, no alcanzable desde internet. `audit fix --force` cambiaría la versión de Prisma. |
| Las copias viven en el mismo servidor | Si falla el disco se pierden con todo. Conviene bajarlas de vez en cuando. |

---

## Estado de la verificación

`npm run lint` pasa en ambos workspaces, **106 pruebas automáticas** en verde
(61 del API, 45 de la web) y el build compila incluyendo el chequeo de tipos.

Comprobado contra el sitio en producción: HTTPS con certificado válido, el
catálogo carga, el panel exige sesión, los festivos cierran la agenda, y las
reglas de horario responden con los datos reales.
