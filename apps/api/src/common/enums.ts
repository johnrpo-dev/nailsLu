/**
 * Enumeraciones de dominio.
 *
 * SQLite no soporta `enum` nativo en Prisma, asi que las columnas se guardan
 * como texto y la lista de valores validos vive aqui. Al migrar a PostgreSQL
 * se pueden reintroducir como enums en el schema sin tocar estos nombres.
 */

export const UserRole = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  STAFF: "STAFF",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const BookingStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
  NO_SHOW: "NO_SHOW",
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const BookingSource = {
  PUBLIC_WEB: "PUBLIC_WEB",
  ADMIN: "ADMIN",
  MOBILE: "MOBILE",
} as const;
export type BookingSource = (typeof BookingSource)[keyof typeof BookingSource];

export const AvailabilityBlockType = {
  AVAILABLE: "AVAILABLE",
  BLOCKED: "BLOCKED",
} as const;
export type AvailabilityBlockType = (typeof AvailabilityBlockType)[keyof typeof AvailabilityBlockType];

export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [BookingStatus.PENDING, BookingStatus.CONFIRMED];
