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
  /** Falso hasta que se lee el almacenamiento, para no parpadear al login. */
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AdminSessionContext = createContext<SessionState>({
  user: null,
  ready: false,
  login: async () => undefined,
  logout: () => undefined,
});

// El cliente HTTP lee el token de aqui en cada peticion, asi no hay que pasarlo
// a mano por cada llamada del panel.
setAuthTokenProvider(readToken);

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setUser(readSession()?.user ?? null);
    setReady(true);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiPost<{ accessToken: string; user: AdminUser }>("/auth/login", {
      email,
      password,
    });
    writeSession(result);
    setUser(result.user);
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

  const value = useMemo(() => ({ user, ready, login, logout }), [login, logout, ready, user]);

  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>;
}

export function useAdminSession() {
  return useContext(AdminSessionContext);
}
