/**
 * Copia de seguridad de la base SQLite.
 *
 * Usa `VACUUM INTO`, que produce una copia consistente aunque la aplicacion
 * este escribiendo. Copiar el archivo con `cp` mientras hay transacciones en
 * vuelo puede dejar una copia corrupta; esto no.
 *
 *   node scripts/backup.mjs [carpeta-destino]
 *
 * Conserva las ultimas COPIAS_A_CONSERVAR y borra las mas antiguas.
 */
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
/*
 * Cargar `.env` a mano. La unidad de systemd si pasa las variables, pero al
 * ejecutar la copia desde la terminal no habia ninguna: el script caia a la
 * base de desarrollo y fallaba con "unable to open database file" en un
 * servidor donde esa base no existe. Justo antes de una actualizacion, que es
 * cuando mas falta hace la copia.
 */
import "dotenv/config";

const COPIAS_A_CONSERVAR = 14;

const urlBase = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const origen = path.resolve(urlBase.replace(/^file:/, ""));

if (!existsSync(origen)) {
  console.error(
    [
      "",
      `  No se encontro la base en ${origen}.`,
      "",
      "  Si esto es un servidor, revisa que apps/api/.env tenga DATABASE_URL",
      "  y que el comando se ejecute desde apps/api.",
      "",
    ].join("\n"),
  );
  process.exit(1);
}
const destino = path.resolve(process.argv[2] ?? process.env.BACKUP_DIR ?? "./backups");

mkdirSync(destino, { recursive: true });

// Marca de tiempo ordenable alfabeticamente: 2026-08-28T15-40-12
const sello = new Date().toISOString().replace(/\..+$/, "").replace(/:/g, "-");
const salida = path.join(destino, `nailslu-${sello}.db`);

const db = new Database(origen, { readonly: true });
try {
  // La ruta va entre comillas simples y se escapan las que pueda contener.
  db.exec(`VACUUM INTO '${salida.replace(/'/g, "''")}'`);
} finally {
  db.close();
}

const tam = (statSync(salida).size / 1024).toFixed(0);
console.log(`Copia creada: ${salida} (${tam} KB)`);

const copias = readdirSync(destino)
  .filter((f) => f.startsWith("nailslu-") && f.endsWith(".db"))
  .sort()
  .reverse();

for (const vieja of copias.slice(COPIAS_A_CONSERVAR)) {
  rmSync(path.join(destino, vieja));
  console.log(`Copia antigua eliminada: ${vieja}`);
}
console.log(`Copias conservadas: ${Math.min(copias.length, COPIAS_A_CONSERVAR)}`);
