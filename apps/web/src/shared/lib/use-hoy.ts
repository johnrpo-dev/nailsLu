"use client";

import { useEffect, useState } from "react";
import { msHastaProximaMedianoche, todayIsoDate } from "./date";

/**
 * La fecha de hoy, renovada al cruzar la medianoche.
 *
 * Leerla una vez al montar y guardarla basta para una pagina que se visita y
 * se cierra, pero no para el panel: la sesion dura doce horas y una pestana
 * abierta de noche se quedaba marcando ayer como hoy, justo en la vista cuyo
 * trabajo es decir que dia es cual.
 *
 * Se vigila por dos vias porque ninguna basta sola: el temporizador cubre la
 * pestana que sigue a la vista, y `visibilitychange` cubre la que estuvo
 * suspendida, donde el navegador no garantiza disparar el temporizador a
 * tiempo.
 */
export function useHoy() {
  const [hoy, setHoy] = useState(todayIsoDate);

  useEffect(() => {
    let temporizador: ReturnType<typeof setTimeout>;

    function programar() {
      // Un segundo de margen: despertar en el limite exacto puede leer todavia
      // el dia viejo.
      temporizador = setTimeout(() => {
        setHoy(todayIsoDate());
        programar();
      }, msHastaProximaMedianoche(new Date()) + 1000);
    }

    function alVolverALaPestana() {
      if (document.visibilityState !== "visible") return;
      setHoy(todayIsoDate());
      clearTimeout(temporizador);
      programar();
    }

    programar();
    document.addEventListener("visibilitychange", alVolverALaPestana);

    return () => {
      clearTimeout(temporizador);
      document.removeEventListener("visibilitychange", alVolverALaPestana);
    };
  }, []);

  return hoy;
}
