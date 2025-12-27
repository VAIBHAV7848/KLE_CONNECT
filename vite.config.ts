import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/KLE_CONNECT/",
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash]-v3.js`,
        chunkFileNames: `assets/[name]-[hash]-v3.js`,
        assetFileNames: `assets/[name]-[hash]-v3.[ext]`
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
