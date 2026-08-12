"use client";

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

type StoredSession = {
  accessToken: string;
  user: AdminUser;
};

const STORAGE_KEY = "spa-admin-session";

/**
 * Sesion del panel en localStorage.
 *
 * El backend entrega el token en el cuerpo de la respuesta, asi que el cliente
 * es quien lo guarda. Una cookie httpOnly seria mas resistente a XSS, pero
 * requiere que el API la emita; queda anotado como mejora.
 */
export function readSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    return parsed?.accessToken ? parsed : null;
  } catch {
    return null;
  }
}

export function writeSession(session: StoredSession) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage bloqueado: la sesion vive solo en memoria hasta recargar.
  }
}

export function clearSession() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nada que limpiar si el storage no esta disponible.
  }
}

export function readToken() {
  return readSession()?.accessToken ?? null;
}
