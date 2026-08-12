import { apiDelete, apiGet, apiPatch, apiPost } from "@/shared/api/client";

export type AdminService = {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  isActive: boolean;
  sortOrder: number;
};

export type ServiceInput = {
  name: string;
  description?: string;
  durationMinutes: number;
  isActive?: boolean;
  sortOrder?: number;
};

export function listAdminServices(signal?: AbortSignal) {
  return apiGet<AdminService[]>("/admin/services", signal);
}

export function createService(input: ServiceInput) {
  return apiPost<AdminService>("/admin/services", input);
}

export function updateService(id: string, input: Partial<ServiceInput>) {
  return apiPatch<AdminService>(`/admin/services/${id}`, input);
}

/** Desactiva el servicio; el backend hace borrado logico para no perder historial. */
export function deactivateService(id: string) {
  return apiDelete<AdminService>(`/admin/services/${id}`);
}
