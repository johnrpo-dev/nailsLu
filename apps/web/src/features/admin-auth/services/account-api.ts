import { apiPatch } from "@/shared/api/client";

export function changePassword(currentPassword: string, newPassword: string) {
  return apiPatch<{ ok: true }>("/auth/password", { currentPassword, newPassword });
}
