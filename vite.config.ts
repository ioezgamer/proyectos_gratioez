import path from "path";
import { defineConfig, loadEnv } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    plugins: [
      nodePolyfills({
        // Para que better-sqlite3 funcione correctamente
        include: ["path", "fs", "util", "crypto"],
      }),
    ],
    optimizeDeps: {
      exclude: ["better-sqlite3"],
    },
   // server: {
   //   host: true, // 🔑 permite acceder desde otra PC en la red
   //   port: 5174, // 🔑 puerto fijo
  //  },
  };
});
