import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/auth": "http://localhost:8000",
      "/advisors": "http://localhost:8000",
      "/session": "http://localhost:8000",
      "/sessions": "http://localhost:8000",
      "/health": "http://localhost:8000",
      "/profiles": "http://localhost:8000",
      "/presets": "http://localhost:8000",
    },
  },
});
