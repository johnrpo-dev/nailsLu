const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  readonly status: number;
  readonly isNetworkError: boolean;

  constructor(message: string, status: number, isNetworkError = false) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.isNetworkError = isNetworkError;
  }

  /** El horario se ocupo entre que se pinto la grilla y se envio la reserva. */
  get isSlotTaken() {
    return this.status === 409;
  }
}

/**
 * Proveedor del token del panel. Lo inyecta la capa de admin para que este
 * modulo no dependa del almacenamiento ni se cargue en el flujo publico.
 */
let tokenProvider: (() => string | null) | null = null;

export function setAuthTokenProvider(provider: () => string | null) {
  tokenProvider = provider;
}

async function request<T>(path: string, init?: RequestInit & { signal?: AbortSignal }): Promise<T> {
  let response: Response;
  const token = tokenProvider?.() ?? null;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  } catch (error) {
    // Un abort es intencional: se propaga tal cual para que quien llama lo ignore.
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError("No pudimos conectar con el servidor.", 0, true);
  }

  if (!response.ok) {
    const error = new ApiError(await readErrorMessage(response), response.status);
    // El panel escucha este evento para devolver al login cuando caduca la
    // sesion, sin que cada pantalla tenga que manejar el 401 por su cuenta.
    if (response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("api-unauthorized", { detail: error }));
    }
    throw error;
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

async function readErrorMessage(response: Response) {
  try {
    const body = await response.json();
    const message = body?.message;
    if (Array.isArray(message)) return message.join(". ");
    if (typeof message === "string") return message;
  } catch {
    // Respuesta sin cuerpo JSON: se usa el fallback por codigo.
  }

  if (response.status === 401) return "Tu sesión expiró. Vuelve a entrar.";
  if (response.status === 409) return "Ese horario acaba de ser reservado.";
  if (response.status === 404) return "El recurso solicitado ya no está disponible.";
  if (response.status === 429) return "Demasiadas solicitudes. Espera un momento.";
  return "No pudimos completar la solicitud.";
}

export function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  return request<T>(path, { method: "GET", cache: "no-store", signal });
}

export function apiPost<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  return request<T>(path, { method: "POST", body: JSON.stringify(body), signal });
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}

export function apiPut<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: "PUT", body: JSON.stringify(body) });
}

export function apiDelete<T>(path: string): Promise<T> {
  return request<T>(path, { method: "DELETE" });
}
