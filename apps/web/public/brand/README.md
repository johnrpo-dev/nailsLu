# Assets de marca

`logo.png` es el logo de NAILS LU SPA con fondo transparente, 490x490.

Se obtuvo del original `logoAct.jpeg`, que venia con el fondo aplanado a negro.
Como el arte es dorado y rosa (y no negro, a diferencia de una version anterior
del logo), se pudo separar del fondo por umbral de luminancia conservando el
color original: transparente por debajo de 10, opaco por encima de 45 y rampa
suave entre medias para los bordes.

Si en algun momento aparece el vectorial, guardalo como `logo.svg`: `BrandLogo`
lo prefiere sobre los rasters y se ve nitido a cualquier tamano.

## Donde se usa

- Cabecera publica, via `BrandLogo` (busca `logo.svg`, `logo.png`, `logo.webp`
  en ese orden y cae en el logotipo tipografico si no hay ninguno).
- `src/app/icon.png` es el favicon, 256x256.
- `src/app/opengraph-image.png` es la vista previa al compartir el enlace,
  1200x630 sobre el crema del tema claro.

Los dos ultimos son copias derivadas: si cambia el logo, hay que regenerarlos.
