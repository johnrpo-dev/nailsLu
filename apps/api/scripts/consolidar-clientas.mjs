/**
 * Une las clientas duplicadas por telefono.
 *
 * El fallo original creaba un registro nuevo en cada reserva. Este script deja
 * el mas antiguo de cada telefono, le repunta las reservas de los demas y borra
 * los sobrantes. Solo mueve referencias: no elimina ninguna reserva.
 *
 * Con --dry-run muestra lo que haria sin tocar nada.
 */
import Database from "better-sqlite3";
import path from "node:path";

const simulacion = process.argv.includes("--dry-run");
const ruta = path.resolve((process.env.DATABASE_URL ?? "file:./prisma/dev.db").replace(/^file:/, ""));
const db = new Database(ruta);

const grupos = db
  .prepare(
    `SELECT phone, COUNT(*) AS n FROM clients GROUP BY phone HAVING n > 1 ORDER BY n DESC`,
  )
  .all();

if (!grupos.length) {
  console.log("No hay clientas duplicadas.");
  db.close();
  process.exit(0);
}

console.log(`${simulacion ? "[SIMULACION] " : ""}Telefonos con duplicados: ${grupos.length}`);

const unir = db.transaction(() => {
  for (const { phone, n } of grupos) {
    const registros = db
      .prepare(`SELECT id, full_name, created_at FROM clients WHERE phone = ? ORDER BY created_at ASC`)
      .all(phone);

    const [conservada, ...sobrantes] = registros;
    const idsSobrantes = sobrantes.map((r) => r.id);
    const marcadores = idsSobrantes.map(() => "?").join(",");

    const { n: reservas } = db
      .prepare(`SELECT COUNT(*) AS n FROM bookings WHERE client_id IN (${marcadores})`)
      .get(...idsSobrantes);

    console.log(
      `  ${phone}: ${n} registros -> 1 ("${conservada.full_name}"), se repuntan ${reservas} reservas`,
    );

    if (!simulacion) {
      db.prepare(`UPDATE bookings SET client_id = ? WHERE client_id IN (${marcadores})`).run(
        conservada.id,
        ...idsSobrantes,
      );
      db.prepare(`DELETE FROM clients WHERE id IN (${marcadores})`).run(...idsSobrantes);
    }
  }
});

unir();
if (simulacion) console.log("\nNada se modifico. Ejecuta sin --dry-run para aplicarlo.");
else console.log(`\nClientas restantes: ${db.prepare("SELECT COUNT(*) AS n FROM clients").get().n}`);
db.close();
