import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // `dist` contiene la version compilada de estos mismos archivos: sin
    // excluirla, cada prueba se ejecutaria dos veces y la copia en CommonJS
    // falla al importar vitest.
    include: ["src/**/*.spec.ts"],
    exclude: ["dist/**", "node_modules/**"],
  },
});
