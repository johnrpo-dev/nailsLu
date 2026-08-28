import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
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

const SERVICIOS = [
  ["Manicure clásico", "Limpieza, limado y esmaltado tradicional.", 45, 1],
  ["Semipermanente", "Esmaltado de larga duración con acabado brillante.", 60, 2],
  ["Uñas acrílicas", "Extensión y diseño de uñas acrílicas.", 120, 3],
  ["Pedicure spa", "Pedicure completo con exfoliación e hidratación.", 70, 4],
] as const;

async function main() {
  // La cuenta si se puede reclamar siempre: el upsert no pisa la contrasena
  // porque `update` va vacio, asi que reejecutarlo es inofensivo.
  await prisma.user.upsert({
    where: { email: "admin@spa.local" },
    update: {},
    create: {
      email: "admin@spa.local",
      name: "Admin Spa",
      role: UserRole.OWNER,
      passwordHash: await bcrypt.hash("Admin12345!", 12),
    },
  });

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
