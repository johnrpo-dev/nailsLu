import type { ServiceSummary } from "@spa/shared";
import { apiGet } from "@/shared/api/client";

export function listPublicServices(signal?: AbortSignal) {
  return apiGet<ServiceSummary[]>("/public/services", signal);
}
