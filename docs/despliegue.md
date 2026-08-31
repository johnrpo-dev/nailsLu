# Despliegue paso a paso

Guía para publicar NAILS LU SPA desde cero, sin haberlo hecho antes. Cada paso
dice qué se espera ver; si ves otra cosa, para y revisa antes de seguir.

**Tiempo aproximado:** entre una y dos horas, más lo que tarde el DNS en
propagarse (de minutos a unas horas).

---

## Itinerario

1. Comprar el dominio en Spaceship
2. Contratar el VPS
3. Entrar por SSH y asegurar el servidor
4. Instalar Node y Caddy
5. Apuntar el dominio a la IP
6. Traer el código
7. Configurar las variables de entorno
8. Crear la base de datos y compilar
9. Levantar los servicios y el HTTPS
10. Comprobar que todo responde
11. Entregarle el panel a Yeri

---

## 1. Comprar el dominio en Spaceship

Elige el dominio y págalo. Nada más por ahora: la configuración del DNS es el
paso 5, cuando ya tengas la IP del servidor.

Un `.com` cuesta del orden de 10–15 USD al año.

**Deja activada la privacidad del WHOIS** (Spaceship la incluye gratis). Sin
ella, el nombre, la dirección y el teléfono del titular quedan en una base
pública que rastrean los spammers.

---

## 2. Contratar el VPS

El dominio y el servidor son cosas distintas: uno es el nombre, el otro es la
máquina. Spaceship vende hosting, pero para esto hace falta un **VPS** con
acceso root, no un hosting compartido.

Opciones habituales, todas equivalentes para este proyecto:

| Proveedor | Plan mínimo suficiente | Precio aprox. |
| --- | --- | --- |
| Hetzner | CX22 · 2 vCPU · 4 GB | ~4 €/mes |
| DigitalOcean | Basic · 1 vCPU · 2 GB | ~12 USD/mes |
| Vultr | Regular · 1 vCPU · 2 GB | ~10 USD/mes |

Al crearlo:

- **Sistema:** Ubuntu 24.04 LTS.
- **Disco:** cualquiera sirve, pero tiene que ser **persistente**. La base de
  datos es un archivo dentro del servidor; si el disco se borra al reiniciar, se
  pierden todas las reservas.
- **Ubicación:** la más cercana a Colombia que ofrezcan (Miami, Nueva York o São
  Paulo). Más cerca es más rápido para las clientas.
- **Clave SSH:** si te la ofrece, súbela. Es más seguro que una contraseña.

Al terminar tendrás una **IP pública**, algo como `203.0.113.45`. Apúntala.

> Con 1 GB no alcanza para compilar Next.js. Con 2 GB tampoco va holgado: sale
> adelante, pero conviene añadir memoria de intercambio (paso 3.5).

---

## 3. Entrar por SSH y asegurar el servidor

Desde tu equipo:

```bash
ssh -p TU_PUERTO_SSH root@TU_IP
```

Si no sabes el puerto, míralo en el panel del proveedor. Con Spaceship es el
`22022`, no el 22.

Actualiza el sistema:

```bash
apt update && apt upgrade -y
```

Crea un usuario para ti, con sudo, y deja de usar root a diario:

```bash
adduser john
usermod -aG sudo john
```

Copia tu clave SSH al usuario nuevo (desde **tu equipo**, en otra terminal):

```bash
ssh-copy-id -p TU_PUERTO_SSH john@TU_IP
```

Comprueba que entras como `john` **antes** de cerrar la sesión de root. Si te
equivocas aquí, te quedas fuera del servidor.

### Memoria de intercambio

Con 2 GB de RAM el build de Next.js se queda al límite. Cuatro gigas de
intercambio lo resuelven y no cuestan nada:

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
sudo sysctl -w vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
```

`free -h` debe mostrar `Swap: 4.0Gi`.

### Cortafuegos

**Comprueba primero en qué puerto escucha SSH.** Muchos proveedores no usan el
22; Spaceship, por ejemplo, usa el 22022. Si abres el puerto equivocado y
activas el cortafuegos, **te quedas fuera del servidor** y solo se recupera por
la consola web del panel.

```bash
sudo ufw allow TU_PUERTO_SSH/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw show added        # comprobar ANTES de activar
sudo ufw enable
```

Deja la sesión abierta y comprueba desde otra ventana que puedes entrar antes
de cerrarla.

**Solo esos tres puertos.** El 3000 y el 3001 son internos: Caddy habla con
ellos desde dentro. Si los abres, cualquiera puede saltarse el HTTPS.

---

## 4. Instalar Node y Caddy

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs git

sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

Comprueba:

```bash
node --version    # v22.x
caddy version
```

---

## 5. Apuntar el dominio a la IP

En Spaceship: **Domains → tu dominio → Advanced DNS**.

Borra los registros de aparcamiento que trae por defecto y crea dos:

| Tipo | Host | Valor | TTL |
| --- | --- | --- | --- |
| A | `@` | `TU_IP` | Automático |
| A | `www` | `TU_IP` | Automático |

Espera y comprueba desde tu equipo:

```bash
nslookup tudominio.com
```

Cuando devuelva tu IP, sigue. **No continúes al paso 9 antes de esto**: Caddy
pide el certificado HTTPS validando el dominio, y si aún no apunta al servidor,
falla y queda esperando.

---

## 6. Traer el código

```bash
sudo adduser --system --group --no-create-home --home /srv/nailslu nailslu
sudo git clone https://github.com/johnrpo-dev/nailsLu.git /srv/nailslu
sudo chown -R nailslu:nailslu /srv/nailslu
cd /srv/nailslu
sudo -u nailslu -H npm ci
```

`npm ci` instala también las herramientas de compilación y genera el cliente de
Prisma, que hace falta antes de sembrar la base.

El `-H` importa: sin él `sudo` conserva el home de root y npm intenta escribir
su caché donde no debe.

Crea las carpetas donde el servicio va a escribir:

```bash
sudo -u nailslu mkdir -p /srv/nailslu/apps/api/uploads /srv/nailslu/backups
```

---

## 7. Configurar las variables de entorno

```bash
cd /srv/nailslu
sudo -u nailslu cp apps/api/.env.example apps/api/.env
sudo -u nailslu cp apps/web/.env.example apps/web/.env.local
```

Genera el secreto de sesión:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Edita `apps/api/.env` (`sudo -u nailslu nano apps/api/.env`):

```
DATABASE_URL="file:./prisma/produccion.db"
JWT_ACCESS_SECRET="EL_VALOR_QUE_ACABAS_DE_GENERAR"
WEB_ORIGIN="https://tudominio.com,https://www.tudominio.com"
TRUST_PROXY="1"
UPLOADS_DIR="/srv/nailslu/apps/api/uploads"
BACKUP_DIR="/srv/nailslu/backups"
```

Sobre cada uno:

- **`JWT_ACCESS_SECRET`** firma las sesiones del panel. Quien lo conozca puede
  entrar sin contraseña. Tiene que ser distinto del que uses en local, y el API
  **se niega a arrancar** si falta, es corto o conserva el de ejemplo.
- **`WEB_ORIGIN`** también es obligatorio: sin él tampoco arranca.
- **`TRUST_PROXY=1`** porque Caddy va delante. Sin esto el límite de peticiones
  ve a todas las clientas como una sola IP y se bloquean entre sí.
- **`SALON_TIMEZONE`** no hace falta tocarlo: por defecto es `America/Bogota`, y
  es lo que decide qué horas ya pasaron.

Edita `apps/web/.env.local`:

```
NEXT_PUBLIC_API_URL="https://tudominio.com/api"
NEXT_PUBLIC_SITE_URL="https://tudominio.com"
NEXT_PUBLIC_WHATSAPP_NUMBER="573045442496"
```

Ese es el número de Yeri, al que llegan los avisos de reserva.

Si en algún momento hay que cambiarlo, ten en cuenta que **no basta con editar
la variable y reiniciar**: las `NEXT_PUBLIC_` se incrustan al compilar, así que
hay que volver a ejecutar `npm run build`.

---

## 8. Crear la base de datos y compilar

```bash
cd /srv/nailslu
sudo -u nailslu -H npm run db:deploy
sudo -u nailslu -H npm run db:seed
sudo -u nailslu -H npm run build
```

Si el seed falla con `Cannot find module '.prisma/client/default'`, el cliente
de Prisma no se genero. Se arregla con `sudo -u nailslu -H npm run db:generate`
y se repite el seed.

**Comprueba que la base se creo donde toca antes de seguir:**

```bash
ls -la /srv/nailslu/apps/api/prisma/*.db
```

`produccion.db` tiene que pesar mas de 100 KB. Si pesa 0 y aparece un `dev.db`
con el peso real, los comandos escribieron en la base de desarrollo: falta
`DATABASE_URL` en el entorno. Revisa `apps/api/.env` y repite los dos comandos.

- `db:deploy` crea las tablas. **No uses `db:migrate` en el servidor**: eso es
  para desarrollo y puede pedir borrar datos.
- `db:seed` crea la cuenta del panel y el catálogo inicial. Solo la primera vez;
  si se vuelve a ejecutar no pisa nada de lo que ya haya.
- `build` compila web y API. Tarda unos minutos.

El seed imprime la contraseña **una sola vez**:

```
  Cuenta creada
  Correo:     admin@spa.local
  Contrasena: Ow6KoZV6gb-f7YAU
```

**Anótala en ese momento.** No se vuelve a mostrar y no está guardada en ningún
sitio en texto plano. Si se pierde, hay que borrar la cuenta y volver a sembrar.

---

## 9. Levantar los servicios y el HTTPS

```bash
sudo cp deploy/nailslu-*.service deploy/nailslu-*.timer /etc/systemd/system/
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
sudo nano /etc/caddy/Caddyfile     # cambiar nailslu.com por tu dominio
sudo systemctl daemon-reload
sudo systemctl enable --now nailslu-api nailslu-web nailslu-backup.timer
sudo systemctl reload caddy
```

Caddy pide y renueva el certificado HTTPS solo. La primera visita puede tardar
unos segundos de más mientras lo consigue.

---

## 10. Comprobar que todo responde

```bash
systemctl status nailslu-api nailslu-web        # los dos en "active (running)"
curl -s https://tudominio.com/api/public/services | head -c 200
systemctl list-timers nailslu-backup            # la copia diaria programada
```

Y desde el navegador, en el móvil y en el ordenador:

1. Abre `https://tudominio.com` y comprueba el candado.
2. Reserva una cita de prueba de principio a fin.
3. Entra al panel en `/admin/login` y comprueba que la cita aparece.
4. **Cancela la cita de prueba** para no dejarla en la agenda.

---

## 11. Entregarle el panel a Yeri

1. Pásale la dirección `https://tudominio.com/admin/login` y las credenciales
   **por un canal privado**, no por WhatsApp normal si puedes evitarlo.
2. Que **cambie la contraseña** al entrar, en "Tu cuenta". El panel se lo avisa
   hasta que lo haga.
3. Que **revise las duraciones** del catálogo: son las que deciden qué horarios
   se ofrecen.
4. Pásale [guia-para-lu.md](guia-para-lu.md), que explica el panel sin jerga.

---

## Actualizar cuando haya cambios

```bash
cd /srv/nailslu
sudo -u nailslu -H npm run db:backup -w @spa/api   # primero la copia
sudo -u nailslu git pull
sudo -u nailslu -H npm ci
sudo -u nailslu -H npm run db:deploy
sudo -u nailslu -H npm run build
sudo systemctl restart nailslu-api nailslu-web
```

---

## Copias de seguridad

El temporizador guarda una copia diaria a las 3:30 en `/srv/nailslu/backups` y
conserva las últimas 14. Usa `VACUUM INTO`, que produce una copia consistente
aunque la aplicación esté escribiendo; copiar el archivo con `cp` puede
corromperla.

Copia manual:

```bash
sudo -u nailslu npm run db:backup -w @spa/api
```

Restaurar:

```bash
sudo systemctl stop nailslu-api
sudo -u nailslu cp /srv/nailslu/backups/nailslu-FECHA.db /srv/nailslu/apps/api/prisma/produccion.db
sudo systemctl start nailslu-api
```

**Las copias viven en el mismo servidor.** Si el disco falla, se pierden con
todo lo demás. Llévatelas fuera de vez en cuando:

```bash
scp -P TU_PUERTO_SSH john@TU_IP:/srv/nailslu/backups/nailslu-*.db ./copias-locales/
```

---

## Si algo falla

| Síntoma | Causa habitual |
| --- | --- |
| El API no arranca | Falta `JWT_ACCESS_SECRET` o `WEB_ORIGIN`. El propio error lo dice: `journalctl -u nailslu-api -n 50` |
| 502 en el navegador | El servicio está caído. Mismo comando de arriba |
| Caddy no consigue el certificado | El dominio todavía no apunta a la IP, o el puerto 80 está cerrado |
| "no such table" | Falta `npm run db:deploy`, o `DATABASE_URL` apunta a otro archivo |
| Las clientas se bloquean entre sí | Falta `TRUST_PROXY=1` |
| El panel devuelve 401 al entrar | Cambió `JWT_ACCESS_SECRET`; hay que entrar de nuevo |
| Error al subir una foto | La carpeta `uploads` no existe o no está en `ReadWritePaths` del servicio |
| El build muere sin explicación | Falta memoria. Ver la nota de memoria de intercambio abajo |
| `Cannot find module '.prisma/client/default'` | Falta `npm run db:generate` |
| El sitio carga pero el API devuelve 500 | La base esta vacia: el seed escribio en `dev.db`. Comprobar tamaños con `ls -la apps/api/prisma/*.db` |

---

## Datos personales

La app pide autorización de tratamiento (Ley 1581 de 2012) antes de guardar la
reserva y registra la evidencia con cada cita: fecha, hora y versión de la
política aceptada. Sin eso no se puede demostrar que la clienta autorizó.

Los datos de la responsable ya están completos en
`apps/web/src/shared/lib/privacidad.ts`. Lo que **falta antes de abrir al
público**:

1. **Que un abogado revise `/privacidad`.** El texto describe con precisión lo
   que la app hace, pero no está validado jurídicamente.
2. Consultar si aplica el registro ante la SIC (Registro Nacional de Bases de
   Datos); depende del tipo y tamaño del responsable.

Al cambiar el texto de la política hay que subir la versión en dos sitios a la
vez, porque deben coincidir:

- `apps/api/src/common/privacy.ts` → `POLITICA_DATOS_VERSION`
- `apps/web/src/shared/lib/privacidad.ts` → `POLITICA_VERSION`

Las autorizaciones anteriores siguen siendo válidas para la versión que
aceptaron, no para la nueva.

El sitio **no usa cookies** ni analítica ni rastreadores. El `localStorage` solo
guarda la preferencia de tema, la sesión del panel y el enlace a la última cita
de la clienta. Si algún día se agrega analítica o píxel publicitario, hay que
revisar el aviso.
