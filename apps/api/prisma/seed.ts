import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { UserRole } from "../src/common/enums";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin12345!", 12);

  await prisma.user.upsert({
    where: { email: "admin@spa.local" },
    update: {},
    create: {
      email: "admin@spa.local",
      name: "Admin Spa",
      role: UserRole.OWNER,
      passwordHash,
    },
  });

  const services = [
    ["Manicure clásico", "Limpieza, limado y esmaltado tradicional.", 45, 1],
    ["Semipermanente", "Esmaltado de larga duración con acabado brillante.", 60, 2],
    ["Uñas acrílicas", "Extensión y diseño de uñas acrílicas.", 120, 3],
    ["Pedicure spa", "Pedicure completo con exfoliación e hidratación.", 70, 4],
  ] as const;

  for (const [name, description, durationMinutes, sortOrder] of services) {
    await prisma.service.upsert({
      where: { name },
      update: {},
      create: { name, description, durationMinutes, sortOrder },
    });
  }

  for (const weekday of [1, 2, 3, 4, 5, 6]) {
    await prisma.businessHour.upsert({
      where: {
        weekday_startTime_endTime: {
          weekday,
          startTime: "09:00",
          endTime: "19:00",
        },
      },
      update: {},
      create: {
        weekday,
        startTime: "09:00",
        endTime: "19:00",
      },
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
