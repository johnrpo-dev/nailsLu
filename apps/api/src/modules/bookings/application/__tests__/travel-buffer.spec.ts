import { BadRequestException, ConflictException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { BookingsService } from "../bookings.service";
import type { PrismaService } from "../../../../prisma/prisma.service";
import type { AvailabilityService } from "../../../availability/application/availability.service";
import type { ServicesService } from "../../../services/application/services.service";

type Cita = { startTime: string; endTime: string; travelBufferMinutes: number };

/**
 * Prisma falso centrado en `updateTravelBuffer`.
 *
 * `update` guarda lo recibido para poder comprobar que se escribio, en vez de
 * dar por hecho que la llamada ocurrio.
 */
function prismaFalso(cita: Record<string, unknown> | null, otras: Cita[] = []) {
  const escrito: Record<string, unknown>[] = [];
  return {
    escrito,
    prisma: {
      booking: {
        findUnique: async () => cita,
        findMany: async () => otras,
        update: async ({ data }: { data: Record<string, unknown> }) => {
          escrito.push(data);
          return { ...cita, ...data };
        },
      },
    } as unknown as PrismaService,
  };
}

function servicio(prisma: PrismaService) {
  return new BookingsService(prisma, {} as AvailabilityService, {} as ServicesService);
}

const DOMICILIO = {
  id: "b1",
  scheduledDate: new Date("2026-09-08T00:00:00.000Z"),
  startTime: "16:00",
  endTime: "17:00",
  staffId: null,
  serviceLocation: "DOMICILIO",
};

describe("updateTravelBuffer", () => {
  it("guarda el margen nuevo", async () => {
    const { prisma, escrito } = prismaFalso(DOMICILIO);
    await servicio(prisma).updateTravelBuffer("b1", 15);

    expect(escrito[0]?.travelBufferMinutes).toBe(15);
  });

  it("acepta cero, para una clienta que vive al lado", async () => {
    const { prisma, escrito } = prismaFalso(DOMICILIO);
    await servicio(prisma).updateTravelBuffer("b1", 0);

    expect(escrito[0]?.travelBufferMinutes).toBe(0);
  });

  it("rechaza una cita que no es a domicilio", async () => {
    const { prisma } = prismaFalso({ ...DOMICILIO, serviceLocation: "SPA" });
    await expect(servicio(prisma).updateTravelBuffer("b1", 15)).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rechaza una reserva que ya no existe", async () => {
    const { prisma } = prismaFalso(null);
    await expect(servicio(prisma).updateTravelBuffer("b1", 15)).rejects.toBeInstanceOf(BadRequestException);
  });

  it("no deja subir el margen si pisa la cita siguiente", async () => {
    // La cita va de 16:00 a 17:00 y hay otra a las 17:30. Con 50 minutos de
    // vuelta terminaria ocupando hasta las 17:50 y se cruzarian.
    const { prisma } = prismaFalso(DOMICILIO, [
      { startTime: "17:30", endTime: "18:30", travelBufferMinutes: 0 },
    ]);

    await expect(servicio(prisma).updateTravelBuffer("b1", 50)).rejects.toBeInstanceOf(ConflictException);
  });

  it("permite bajarlo aunque haya una cita cerca", async () => {
    // Con 15 minutos la vuelta termina a las 17:15 y la de las 17:30 cabe.
    const { prisma, escrito } = prismaFalso(DOMICILIO, [
      { startTime: "17:30", endTime: "18:30", travelBufferMinutes: 0 },
    ]);

    await servicio(prisma).updateTravelBuffer("b1", 15);
    expect(escrito[0]?.travelBufferMinutes).toBe(15);
  });

  it("tiene en cuenta el traslado de la otra cita, no solo el suyo", async () => {
    // La otra es tambien a domicilio y sale a las 17:30 menos 50: desde las
    // 16:40 ya esta viajando, asi que ni siquiera 0 minutos evita el cruce.
    const { prisma } = prismaFalso(DOMICILIO, [
      { startTime: "17:30", endTime: "18:30", travelBufferMinutes: 50 },
    ]);

    await expect(servicio(prisma).updateTravelBuffer("b1", 0)).rejects.toBeInstanceOf(ConflictException);
  });
});
