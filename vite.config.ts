import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import viteCompression from "vite-plugin-compression";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [
      react(),
      viteCompression({
        algorithm: "brotliCompress",
        ext: ".br",
        deleteOriginFile: false,
      }),
      viteCompression({
        algorithm: "gzip",
        ext: ".gz",
        deleteOriginFile: false,
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      "process.env": {
        VITE_API_URL: JSON.stringify(env.VITE_API_URL),
        VITE_APP_TITLE: JSON.stringify(env.VITE_APP_TITLE),
      },
    },
    build: {
      minify: "terser",
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom"],
            vendor: ["react-router-dom", "he"],
          },
        },
      },
    },
  };
});
