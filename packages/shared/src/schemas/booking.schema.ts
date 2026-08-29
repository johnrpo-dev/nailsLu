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
  /** Donde se presta el servicio. */
  serviceLocation: z.enum(["SPA", "DOMICILIO"]),
  /** Direccion de la clienta. Solo tiene sentido a domicilio. */
  address: z.string().max(200).optional(),
  idempotencyKey: z.string().min(10),
  /** Autorizacion de tratamiento de datos. Obligatoria (Ley 1581 de 2012). */
  dataConsent: z.literal(true),
  /** Honeypot: debe llegar vacio. Si trae contenido, es un bot. */
  website: z.string().optional(),
})
  /*
   * A domicilio la direccion es obligatoria: sin ella la cita no sirve, hay que
   * perseguirla por WhatsApp. Se valida aqui, en el contrato compartido, para
   * que web y API apliquen la misma regla y no puedan discrepar.
   */
  .refine((datos) => datos.serviceLocation !== "DOMICILIO" || (datos.address?.trim().length ?? 0) >= 10, {
    message: "Necesitamos la dirección para ir a domicilio",
    path: ["address"],
  })
  /*
   * En el spa no se guarda direccion aunque llegue: es un dato sensible que
   * nadie pidio, y aceptarlo en silencio lo dejaria en la base para siempre.
   */
  .refine((datos) => datos.serviceLocation !== "SPA" || !datos.address, {
    message: "No hace falta dirección para atenderte en el spa",
    path: ["address"],
  });

export type PublicBookingInput = z.infer<typeof publicBookingSchema>;
