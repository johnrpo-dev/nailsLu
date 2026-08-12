import { z } from "zod";

export const publicBookingSchema = z.object({
  clientName: z.string().min(2).max(80),
  phone: z.string().min(7).max(25),
  serviceIds: z.array(z.string().uuid()).min(1),
  date: z.string().date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  staffId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
  idempotencyKey: z.string().min(10),
  website: z.string().optional(),
});

export type PublicBookingInput = z.infer<typeof publicBookingSchema>;
