import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import legacy from "@vitejs/plugin-legacy";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    legacy({ targets: ["defaults", "not IE 11", "Chrome >= 80"] })
  ],
  server: {
    proxy: {
      "/api-hock-helpdesk": {
        target: "http://192.168.52.27:81",
        changeOrigin: true,
        secure: false
      }
    },
    port: 5173
  }
});
