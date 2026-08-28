import path from "node:path";
import { defineConfig } from "prisma/config";

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
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  },
});
