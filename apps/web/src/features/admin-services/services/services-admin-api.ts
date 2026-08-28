import { apiDelete, apiGet, apiPatch, apiPost } from "@/shared/api/client";

export type AdminService = {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  isActive: boolean;
  sortOrder: number;
  imageUrl?: string | null;
  imageFocalX?: number;
  imageFocalY?: number;
  imageScale?: number;
};

export type ServiceInput = {
  name: string;
  description?: string;
  durationMinutes: number;
  isActive?: boolean;
  sortOrder?: number;
  imageFocalX?: number;
  imageFocalY?: number;
  imageScale?: number;
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/**
 * Sube la foto de un servicio.
 *
 * Va con `fetch` directo y no por el cliente compartido porque este fija
 * `Content-Type: application/json`, y una subida multipart necesita que el
 * navegador ponga su propio limite de partes.
 */
export async function uploadServiceImage(id: string, file: File, token: string | null) {
  const datos = new FormData();
  datos.append("file", file);

  const respuesta = await fetch(`${API_BASE_URL}/admin/services/${id}/image`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: datos,
  });

  if (!respuesta.ok) {
    const cuerpo = await respuesta.json().catch(() => null);
    throw new Error(cuerpo?.message ?? "No pudimos subir la imagen.");
  }
  return (await respuesta.json()) as AdminService;
}

export function removeServiceImage(id: string) {
  return apiDelete<AdminService>(`/admin/services/${id}/image`);
}
