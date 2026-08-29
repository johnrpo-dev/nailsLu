"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError, apiGet, apiPost, setAuthTokenProvider } from "@/shared/api/client";
import { clearSession, readSession, readToken, writeSession, type AdminUser } from "../services/auth-storage";

type SessionState = {
  user: AdminUser | null;
  /** Cierto mientras siga en uso la contrasena publicada del seed. */
  usingDefaultPassword: boolean;
  /** Lo llama la pantalla de cuenta al cambiarla, para retirar el aviso. */
  markPasswordChanged: () => void;
  /** Falso hasta que se lee el almacenamiento, para no parpadear al login. */
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AdminSessionContext = createContext<SessionState>({
  user: null,
  usingDefaultPassword: false,
  markPasswordChanged: () => undefined,
  ready: false,
  login: async () => undefined,
  logout: () => undefined,
});

// El cliente HTTP lee el token de aqui en cada peticion, asi no hay que pasarlo
// a mano por cada llamada del panel.
setAuthTokenProvider(readToken);

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [usingDefaultPassword, setUsingDefault] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const sesion = readSession();
    setUser(sesion?.user ?? null);
    setUsingDefault(Boolean(sesion?.usingDefaultPassword));
    setReady(true);
    if (!sesion) return;

    /*
     * La copia de localStorage se escribio al entrar y puede tener meses. Se
     * pinta primero para que el panel no parpadee, y en paralelo se le pide al
     * API la version vigente: asi un cambio en la cuenta se refleja sin esperar
     * a que caduque la sesion.
     *
     * De paso valida el token al cargar. Si esta vencido, el cliente HTTP
     * emite `api-unauthorized` y el efecto de abajo devuelve al login, en vez
     * de descubrirlo en el primer clic.
     */
    const controller = new AbortController();
    apiGet<AdminUser>("/auth/me", controller.signal)
      .then((vigente) => {
        if (controller.signal.aborted) return;
        setUser(vigente);
        const guardada = readSession();
        if (guardada) writeSession({ ...guardada, user: vigente });
      })
      .catch(() => {
        // Un 401 ya lo maneja el listener de abajo; si fue un fallo de red, se
        // sigue con la copia guardada en lugar de echar a nadie del panel.
      });

    return () => controller.abort();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiPost<{
      accessToken: string;
      user: AdminUser;
      usingDefaultPassword?: boolean;
    }>("/auth/login", { email, password });
    writeSession(result);
    setUser(result.user);
    setUsingDefault(Boolean(result.usingDefaultPassword));
  }, []);

  const markPasswordChanged = useCallback(() => {
    const sesion = readSession();
    if (sesion) writeSession({ ...sesion, usingDefaultPassword: false });
    setUsingDefault(false);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    router.push("/admin/login");
  }, [router]);

  // Si el token caduca a mitad de jornada, cualquier 401 devuelve al login en
  // lugar de dejar la pantalla llena de errores sueltos.
  useEffect(() => {
    const onUnauthorized = (event: Event) => {
      if ((event as CustomEvent<ApiError>).detail?.status === 401) logout();
    };
    window.addEventListener("api-unauthorized", onUnauthorized);
    return () => window.removeEventListener("api-unauthorized", onUnauthorized);
  }, [logout]);

  const value = useMemo(
    () => ({ user, usingDefaultPassword, markPasswordChanged, ready, login, logout }),
    [login, logout, markPasswordChanged, ready, user, usingDefaultPassword],
  );

  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>;
}

export function useAdminSession() {
  return useContext(AdminSessionContext);
}
