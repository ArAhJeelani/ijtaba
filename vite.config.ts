import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { cityMiddleware } from "./server/cities.mjs";
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "ijabah-timetables",
      configureServer(server) {
        server.middlewares.use(cityMiddleware);
      },
      configurePreviewServer(server) {
        server.middlewares.use(cityMiddleware);
      },
    },
  ],
});
