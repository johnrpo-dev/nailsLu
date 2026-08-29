# Secretos: qué son, dónde van y dónde guardarlos

## Qué es el secreto JWT

Cuando entras al panel, el servidor no guarda tu sesión: te entrega un pase
firmado. En cada petición tu navegador muestra ese pase y el servidor verifica
la firma. `JWT_ACCESS_SECRET` es la llave con la que firma.

**Quien conozca esa llave puede fabricarse un pase válido y entrar al panel sin
contraseña.** No es una contraseña más: es la que las respalda a todas.

## Dónde va

En un único sitio: el archivo `apps/api/.env` **del servidor**. Ese archivo está
excluido del repositorio, así que nunca se sube a GitHub. Compruébalo cuando
quieras:

```bash
git check-ignore apps/api/.env
```

Si responde con la ruta, está protegido.

## Cómo generarlo

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Uno distinto para desarrollo y para producción. Si el de tu equipo se filtra
alguna vez, producción no queda comprometida.

**No lo inventes a mano.** Una frase, por complicada que parezca, es adivinable;
este comando usa el generador aleatorio del sistema operativo.

## Dónde guardar una copia

En un gestor de contraseñas (Bitwarden, 1Password, el de Google o Apple). Ahí
mismo conviene guardar la contraseña del panel y el acceso al servidor.

**Nunca** por WhatsApp, correo, notas del teléfono ni un archivo en el
escritorio.

## Si lo pierdes, no pasa nada grave

No hay datos cifrados con él. Generas otro, reinicias el servidor y listo. El
único efecto es que las sesiones abiertas dejan de valer y hay que volver a
entrar.

De hecho eso mismo es lo que debes hacer **si sospechas que alguien lo vio**:
cambiarlo expulsa a todo el mundo de inmediato.

## Protección automática

En producción el API **se niega a arrancar** si el secreto falta, es más corto
de 32 caracteres o conserva el valor de ejemplo. También exige `WEB_ORIGIN`.

Prefiere no arrancar a arrancar inseguro: si el despliegue falla con un mensaje
sobre el secreto, es esta comprobación haciendo su trabajo.

## La contraseña del panel

Ya no está escrita en el código. Al preparar la base:

- Si defines `SEED_ADMIN_PASSWORD`, se usa esa.
- Si no, se genera una al azar y **se muestra una sola vez** por consola.
  Anótala en ese momento.

Reejecutar la preparación no pisa una contraseña ya cambiada desde el panel.

## Una aclaración sobre el historial

La contraseña de ejemplo estuvo en el repositorio y sigue en el historial de
git. Sacarla del código no la borra del pasado.

No hace falta reescribir el historial: en cuanto se cambie la contraseña desde
el panel, ese valor antiguo deja de servir para nada. Lo que importa es que la
instalación real nunca la use.
