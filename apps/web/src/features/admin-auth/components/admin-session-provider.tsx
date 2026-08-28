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
import { ApiError, apiPost, setAuthTokenProvider } from "@/shared/api/client";
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
