import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/",
  server: {
    host: "::",
    port: 5173,
    proxy: (() => {
      const proxies: Record<string, any> = {};
      const aiTarget = process.env.VITE_AI_API_URL;
      const tokenTarget = process.env.VITE_TOKEN_SERVER_URL;

      if (aiTarget && /localhost|127\.0\.0\.1/.test(aiTarget)) {
        proxies["/api"] = {
          target: aiTarget,
          changeOrigin: true,
        };
      }
      if (tokenTarget && /localhost|127\.0\.0\.1/.test(tokenTarget)) {
        proxies["/token"] = {
          target: tokenTarget,
          changeOrigin: true,
          rewrite: (p: string) => p.replace(/^\/token/, "/token"),
        };
      }
      return proxies;
    })()
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

