"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";

/**
 * Roving tabindex para grillas de opciones (dias, franjas horarias).
 *
 * El grupo completo ocupa una sola parada de Tab y por dentro se navega con
 * flechas, Home y End, que es lo que esperan lectores de pantalla en un
 * listbox o radiogroup (WAI-ARIA Authoring Practices).
 */
export function useRovingFocus({
  count,
  columns,
  selectedIndex,
}: {
  count: number;
  columns: number;
  selectedIndex: number;
}) {
  const [focusGuardado, setFocusIndex] = useState(() => Math.max(selectedIndex, 0));
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  // Solo se mueve el foco del DOM cuando la navegacion vino del teclado, para
  // no robarle el foco a la clienta mientras la lista se recarga sola.
  const shouldFocus = useRef(false);

  /*
   * Seguir la seleccion se hace durante el render, no en un efecto. React
   * documenta este patron para el estado derivado de props: al detectar el
   * cambio se actualiza y React reinicia el render antes de pintar, sin el
   * fotograma intermedio con el valor viejo que produce hacerlo en un efecto.
   */
  const [selectedVisto, setSelectedVisto] = useState(selectedIndex);
  if (selectedIndex !== selectedVisto) {
    setSelectedVisto(selectedIndex);
    if (selectedIndex >= 0) setFocusIndex(selectedIndex);
  }

  /*
   * Si la lista se encoge (menos franjas al cambiar de dia), el indice
   * guardado puede quedar fuera de rango. Se acota al leerlo en vez de
   * guardarlo corregido: no hace falta estado nuevo ni un render extra.
   */
  const focusIndex = count > 0 ? Math.min(focusGuardado, count - 1) : 0;

  useEffect(() => {
    if (!shouldFocus.current) return;
    shouldFocus.current = false;
    itemRefs.current[focusIndex]?.focus();
  }, [focusIndex]);

  const move = useCallback(
    (next: number) => {
      if (count === 0) return;
      shouldFocus.current = true;
      setFocusIndex(Math.min(Math.max(next, 0), count - 1));
    },
    [count],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>, index: number) => {
      switch (event.key) {
        case "ArrowRight":
          move(index + 1);
          break;
        case "ArrowLeft":
          move(index - 1);
          break;
        case "ArrowDown":
          move(index + columns);
          break;
        case "ArrowUp":
          move(index - columns);
          break;
        case "Home":
          move(0);
          break;
        case "End":
          move(count - 1);
          break;
        default:
          return;
      }
      event.preventDefault();
    },
    [columns, count, move],
  );

  const registerRef = useCallback(
    (index: number) => (node: HTMLElement | null) => {
      itemRefs.current[index] = node;
    },
    [],
  );

  return {
    /** -1 en todos salvo el activo: el grupo es una sola parada de Tab. */
    getTabIndex: (index: number) => (index === focusIndex ? 0 : -1),
    onKeyDown,
    registerRef,
    onFocusItem: (index: number) => setFocusIndex(index),
  };
}
