import path from "node:path";
import { defineConfig } from "prisma/config";
/*
 * Cargar `.env` a mano.
 *
 * Prisma solo lo hacia solo mientras no existia este archivo. Desde que hay un
 * `prisma.config.ts`, las herramientas de linea de comandos ya no lo leen, y
 * eso provoco un fallo silencioso en el primer despliegue real: `migrate
 * deploy` y `db seed` no encontraban `DATABASE_URL`, caian al valor de reserva
 * y sembraban `dev.db`, mientras el servicio arrancaba contra la base de
 * produccion, vacia y sin tablas. Ningun comando fallo; el sitio devolvia 500.
 */
import "dotenv/config";

/** Ruta de la base cuando no hay `.env`. Solo tiene sentido en desarrollo. */
const BASE_DE_DESARROLLO = "file:./prisma/dev.db";

/*
 * Si falta la variable se avisa en vez de callar. Una base equivocada no da
 * error al escribir: da error mucho despues, en otro sitio y sin relacion
 * aparente.
 */
if (!process.env.DATABASE_URL) {
  console.warn(
    [
      "",
      "  AVISO: DATABASE_URL no esta definida.",
      `  Se usara ${BASE_DE_DESARROLLO}, que es la base de desarrollo.`,
      "  En un servidor esto casi siempre significa que falta apps/api/.env.",
      "",
    ].join("\n"),
  );
}

/**
 * Configuracion de Prisma 7.
 *
 * Desde la version 7 la URL de conexion ya no vive en `schema.prisma`: las
 * herramientas de linea de comandos (migrate, db seed) la leen de aqui, y el
 * cliente en tiempo de ejecucion la recibe por medio de un adaptador.
 */
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? BASE_DE_DESARROLLO,
  },
});
