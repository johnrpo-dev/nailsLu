import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Reglas de la web. `core-web-vitals` sube a error las que afectan el
 * rendimiento percibido, que es lo que nota la clienta en el celular.
 *
 * Desde Next 16 `next lint` ya no existe: se invoca el CLI de ESLint.
 */
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "no-empty": ["error", { allowEmptyCatch: true }],

      /*
       * Aviso, no error. Los sitios que quedan son de tres formas y ninguna es
       * un fallo, pero tampoco quiero taparlas: son deuda visible.
       *
       * 1. Leer `localStorage` al montar (`admin-session-provider`). No existe
       *    durante el render en el servidor, asi que tiene que ir en un efecto.
       * 2. Recargar un formulario cuando cambian sus props
       *    (`service-form-dialog`, `weekly-hours-editor`). Se arregla con una
       *    prop `key` que remonte el componente, pero eso descarta cambios sin
       *    guardar y hay que decidirlo a conciencia.
       * 3. Marcar "cargando" al empezar a pedir datos. La solucion real es
       *    mover las peticiones a @tanstack/react-query, que ya esta declarado
       *    en package.json y sin usar.
       *
       * El coste de dejarlas es un render extra por efecto, imperceptible aqui.
       */
      "react-hooks/set-state-in-effect": "warn",

      /*
       * Las fotos de servicios las sube la duena y el API ya las reprocesa a
       * WebP de 1200px, asi que `next/image` no aportaria optimizacion. Ademas
       * su host se resuelve en tiempo de ejecucion desde `window.location`
       * para que el sitio funcione desde el celular en la red local, y eso no
       * se puede declarar en `remotePatterns`, que es estatico.
       */
      "@next/next/no-img-element": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "node_modules/**"]),
]);
