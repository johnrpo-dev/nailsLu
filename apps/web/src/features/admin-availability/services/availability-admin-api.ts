import { apiDelete, apiGet, apiPost, apiPut } from "@/shared/api/client";

export type BusinessHour = {
  id: string;
  /** 0 = domingo, 6 = sabado. */
  weekday: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

export type AvailabilityBlock = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  type: "AVAILABLE" | "BLOCKED";
  reason?: string | null;
};

export type BusinessHourInput = Omit<BusinessHour, "id">;

export function listBusinessHours(signal?: AbortSignal) {
  return apiGet<BusinessHour[]>("/admin/business-hours", signal);
}

export function replaceBusinessHours(hours: BusinessHourInput[]) {
  return apiPut<BusinessHour[]>("/admin/business-hours", { hours });
}

export function listBlocks(signal?: AbortSignal) {
  return apiGet<AvailabilityBlock[]>("/admin/availability/blocks", signal);
}

export function createBlock(input: {
  date: string;
  startTime: string;
  endTime: string;
  type: "AVAILABLE" | "BLOCKED";
  reason?: string;
}) {
  return apiPost<AvailabilityBlock>("/admin/availability/blocks", input);
}

export function deleteBlock(id: string) {
  return apiDelete<AvailabilityBlock>(`/admin/availability/blocks/${id}`);
}

/** Festivo de Colombia, tal como lo calcula el API. */
export type Holiday = { date: string; name: string };

export function listHolidays(signal?: AbortSignal) {
  return apiGet<Holiday[]>("/admin/availability/holidays", signal);
}
