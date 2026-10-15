import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { buildVersion } from "../../scripts/version.ts";
export default defineConfig({
  define: { "import.meta.env.VITE_CUBO_VERSION": JSON.stringify(buildVersion()) },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "Cubo",
        short_name: "Cubo",
        lang: "es",
        description: "Tareas durables en la nube.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#101416",
        background_color: "#101416",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//, /^\/assets\//],
        globPatterns: ["**/*.{js,mjs,css,html,svg,png,woff2}"],
      },
    }),
  ],
  server: { proxy: { "/api": "http://127.0.0.1:8787" } },
});
