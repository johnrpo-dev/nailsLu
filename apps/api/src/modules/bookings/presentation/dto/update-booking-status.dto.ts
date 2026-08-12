import { IsIn } from "class-validator";

export class UpdateBookingStatusDto {
  @IsIn(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"])
  status!: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
}
