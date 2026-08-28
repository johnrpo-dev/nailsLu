# Despliegue

Guia para publicar NAILS LU SPA en un VPS con Ubuntu. Los archivos de la
carpeta `deploy/` se copian tal cual al servidor cambiando el dominio.

## Que hace falta

- Un VPS con Ubuntu 22.04 o 24.04, acceso SSH con sudo y **disco persistente**
  (la base es un archivo: si el disco se borra al reiniciar, se pierden las
  reservas).
- Node.js 20 o superior.
- Un dominio con un registro A apuntando a la IP del servidor.
- Puertos 80 y 443 abiertos.

No hace falta servidor de base de datos: SQLite vive dentro del proyecto.

## 1. Preparar el servidor

```bash
sudo adduser --system --group --home /srv/nailslu nailslu
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs caddy
```

## 2. Traer el codigo

```bash
sudo -u nailslu git clone https://github.com/johnrpo-dev/nailsLu.git /srv/nailslu
cd /srv/nailslu
sudo -u nailslu npm ci
```

## 3. Configurar el entorno

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Generar un secreto real (uno distinto para cada variable):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

En `apps/api/.env`:

- `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET`: los valores generados. **Dejar los
  de ejemplo permitiria a cualquiera fabricarse un token y entrar al panel.**
- `WEB_ORIGIN="https://nailslu.com,https://www.nailslu.com"`
- `TRUST_PROXY="1"` porque Caddy va delante.
- `DATABASE_URL="file:./prisma/produccion.db"`

En `apps/web/.env.local`:

- `NEXT_PUBLIC_API_URL="https://nailslu.com/api"`
- `NEXT_PUBLIC_SITE_URL="https://nailslu.com"`
- `NEXT_PUBLIC_WHATSAPP_NUMBER` con el numero del spa.

## 4. Base de datos y compilacion

```bash
sudo -u nailslu npm run db:deploy   # crea el esquema. NO uses db:migrate aqui
sudo -u nailslu npm run db:seed     # solo la primera vez: crea la cuenta admin
sudo -u nailslu npm run build
```

Tras el seed, **entrar al panel y cambiar la contrasena del admin**, que en el
seed es publica (`Admin12345!`).

## 5. Servicios y servidor web

```bash
sudo cp deploy/nailslu-*.service deploy/nailslu-*.timer /etc/systemd/system/
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile   # cambiar el dominio primero
sudo systemctl daemon-reload
sudo systemctl enable --now nailslu-api nailslu-web nailslu-backup.timer
sudo systemctl reload caddy
```

Caddy pide el certificado HTTPS solo la primera vez que alguien entra.

## 6. Comprobar

```bash
systemctl status nailslu-api nailslu-web
curl -s https://nailslu.com/api/public/services | head -c 200
systemctl list-timers nailslu-backup
```

## Actualizar

```bash
cd /srv/nailslu
sudo -u nailslu npm run db:backup          # primero la copia
sudo -u nailslu git pull
sudo -u nailslu npm ci
sudo -u nailslu npm run db:deploy
sudo -u nailslu npm run build
sudo systemctl restart nailslu-api nailslu-web
```

## Copias de seguridad

El temporizador guarda una copia diaria en `/srv/nailslu/backups` y conserva las
ultimas 14. Usa `VACUUM INTO`, que produce una copia consistente aunque la
aplicacion este escribiendo; copiar el archivo con `cp` puede corromperla.

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
todo lo demas. Conviene llevarselas fuera periodicamente:

```bash
scp usuario@servidor:/srv/nailslu/backups/nailslu-*.db ./copias-locales/
```

## Si algo falla

- **502 en el navegador**: el servicio esta caido.
  `journalctl -u nailslu-api -n 50`
- **El panel devuelve 401 al entrar**: `JWT_ACCESS_SECRET` cambio; las sesiones
  abiertas dejan de valer y hay que entrar de nuevo.
- **Las clientas se bloquean entre si al reservar**: falta `TRUST_PROXY=1`, asi
  que el rate limiting las cuenta a todas como una sola IP.
- **"no such table"**: falta `npm run db:deploy`, o `DATABASE_URL` apunta a otro
  archivo. La ruta se resuelve desde `apps/api`.
