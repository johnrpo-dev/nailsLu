"use client";

import { useCallback, useEffect, useState } from "react";
import type { ServiceSummary } from "@spa/shared";
import { ApiError } from "@/shared/api/client";
import { listPublicServices } from "../services/service-api";

export type ServicesStatus = "loading" | "ready" | "error";

/**
 * Carga el catalogo publico.
 *
 * No hay datos de respaldo inventados a proposito: mostrar servicios ficticios
 * lleva a la clienta a reservar algo que el backend rechazara despues.
 */
export function useServices() {
  const [services, setServices] = useState<ServiceSummary[]>([]);
  const [status, setStatus] = useState<ServicesStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");

    listPublicServices(controller.signal)
      .then((items) => {
        if (controller.signal.aborted) return;
        setServices(items);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setServices([]);
        setStatus("error");
        setErrorMessage(
          error instanceof ApiError && error.isNetworkError
            ? "No pudimos conectar con el servidor."
            : "No pudimos cargar el catálogo.",
        );
      });

    return () => controller.abort();
  }, [reloadToken]);

  const retry = useCallback(() => setReloadToken((token) => token + 1), []);

  return { services, status, errorMessage, retry };
}
