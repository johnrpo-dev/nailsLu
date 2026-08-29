import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import { UserRole } from "../src/common/enums";

/**
 * Desde Prisma 7 el cliente necesita un adaptador de controlador: la conexion
 * ya no se declara en `schema.prisma`. La ruta se resuelve contra el directorio
 * desde el que se ejecuta, que para `prisma db seed` es `apps/api`.
 */
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  }),
});

/**
 * Catalogo real de NAILS LU SPA.
 *
 * Las duraciones definen que franjas se ofrecen, asi que conviene revisarlas
 * contra el tiempo real de cada servicio y ajustarlas desde el panel.
 */
const SERVICIOS = [
  ["Semipermanente manos", "Esmaltado semipermanente en manos.", 90, 1],
  ["Semipermanente pies", "Esmaltado semipermanente en pies.", 60, 2],
  ["Base rubber", "Base niveladora rubber para dar resistencia a la uña natural.", 90, 3],
  ["Builder gel", "Refuerzo con gel constructor sobre uña natural.", 120, 4],
  ["Acrílicas", "Extensión con acrílico y diseño a elección.", 150, 5],
  ["Forrado acrílico", "Forrado de la uña natural con acrílico.", 120, 6],
  ["Poly gel esculpido", "Esculpido completo en poly gel.", 150, 7],
  ["Forrado poly gel", "Forrado de la uña natural con poly gel.", 120, 8],
  ["Dipping", "Sistema de inmersión en polvo.", 90, 9],
  ["Press on", "Uñas postizas preparadas y colocadas.", 60, 10],
  ["Retiro con limpieza", "Retiro de producto con limpieza y cuidado de cutícula.", 45, 11],
] as const;

/**
 * Contrasena inicial del panel.
 *
 * No se escribe en el codigo: el repositorio es publico y cualquiera podria
 * leerla y entrar. Se toma de `SEED_ADMIN_PASSWORD` y, si no esta, se genera
 * una aleatoria que se imprime una sola vez por consola.
 */
function contrasenaInicial() {
  const delEntorno = process.env.SEED_ADMIN_PASSWORD;
  if (delEntorno && delEntorno.length >= 10) return { valor: delEntorno, generada: false };

  if (delEntorno) {
    throw new Error("SEED_ADMIN_PASSWORD debe tener al menos 10 caracteres.");
  }
  return { valor: crypto.randomBytes(12).toString("base64url"), generada: true };
}

const EMAIL_ADMIN = process.env.SEED_ADMIN_EMAIL ?? "admin@spa.local";

async function main() {
  // La cuenta se reclama siempre, pero `update` va vacio: reejecutar el seed no
  // pisa una contrasena ya cambiada desde el panel.
  const yaExiste = await prisma.user.findUnique({ where: { email: EMAIL_ADMIN }, select: { id: true } });
  const { valor, generada } = contrasenaInicial();

  await prisma.user.upsert({
    where: { email: EMAIL_ADMIN },
    update: {},
    create: {
      email: EMAIL_ADMIN,
      // El panel saluda con este nombre: "Hola, Yeri".
      name: process.env.SEED_ADMIN_NAME ?? "Yeri",
      role: UserRole.OWNER,
      passwordHash: await bcrypt.hash(valor, 12),
    },
  });

  if (yaExiste) {
    console.log(`La cuenta ${EMAIL_ADMIN} ya existia: su contrasena no se toco.`);
  } else {
    console.log("");
    console.log("  Cuenta creada");
    console.log(`  Correo:     ${EMAIL_ADMIN}`);
    console.log(`  Contrasena: ${valor}`);
    if (generada) console.log("  (generada al azar; anotala ahora, no se vuelve a mostrar)");
    console.log("  Cambiala al entrar al panel, en Tu cuenta.");
    console.log("");
  }

  /**
   * Catalogo y horario solo se crean si la base esta vacia.
   *
   * Antes se hacia upsert y eso rompia instalaciones ya configuradas: la clave
   * unica del horario incluye las horas, asi que si el salon cambiaba su
   * jornada el seed no reconocia sus filas y anadia las de ejemplo encima. La
   * agenda quedaba con dos horarios superpuestos ofreciendo turnos fuera de
   * hora. Un archivo de datos iniciales debe poblar, no reescribir.
   */
  const yaConfigurada = (await prisma.service.count()) > 0 || (await prisma.businessHour.count()) > 0;
  if (yaConfigurada) {
    console.log("La base ya tiene catalogo u horario: no se toca nada.");
    return;
  }

  for (const [name, description, durationMinutes, sortOrder] of SERVICIOS) {
    await prisma.service.create({ data: { name, description, durationMinutes, sortOrder } });
  }

  // Lunes a sabado, 9 a 19. Se ajusta despues desde el panel.
  for (const weekday of [1, 2, 3, 4, 5, 6]) {
    await prisma.businessHour.create({ data: { weekday, startTime: "09:00", endTime: "19:00" } });
  }

  console.log("Datos iniciales creados.");
}

main().finally(async () => {
  await prisma.$disconnect();
});
