import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

/**
 * Reglas del API. Se queda en `recommended` (sin informacion de tipos) a
 * proposito: la variante con tipos es varias veces mas lenta y aqui TypeScript
 * ya corre en cada build, asi que aportaria poco ruido util.
 */
export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**", "prisma/migrations/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Todo lo del API corre en Node, incluidos los scripts sueltos de
    // `scripts/`, asi que `process` y `console` existen en todas partes.
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
    },
    rules: {
      /*
       * Un argumento sin usar suele ser un descuido, pero en NestJS los
       * decoradores obligan a declarar parametros que no siempre se leen.
       * El prefijo `_` es la forma de decir "ya se, es intencional".
       */
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      // Los `catch {}` vacios de este proyecto siempre llevan comentario que
      // explica por que se ignora el error.
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
);
