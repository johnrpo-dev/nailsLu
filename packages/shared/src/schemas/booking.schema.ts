import { z } from "zod";

/**
 * Contrato de la reserva publica, compartido entre web y API.
 *
 * En Zod 4 los validadores de formato son funciones de primer nivel
 * (`z.uuid()`, `z.iso.date()`) en lugar de metodos encadenados sobre
 * `z.string()`, que quedaron obsoletos.
 */
export const publicBookingSchema = z.object({
  clientName: z.string().min(2).max(80),
  phone: z.string().min(7).max(25),
  serviceIds: z.array(z.uuid()).min(1),
  date: z.iso.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  staffId: z.uuid().optional(),
  notes: z.string().max(500).optional(),
  idempotencyKey: z.string().min(10),
  /** Autorizacion de tratamiento de datos. Obligatoria (Ley 1581 de 2012). */
  dataConsent: z.literal(true),
  /** Honeypot: debe llegar vacio. Si trae contenido, es un bot. */
  website: z.string().optional(),
});

export type PublicBookingInput = z.infer<typeof publicBookingSchema>;
