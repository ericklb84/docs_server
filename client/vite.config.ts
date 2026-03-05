import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: process.env.VITE_OUT_DIR
      ? path.resolve(process.env.VITE_OUT_DIR)
      : "dist",
  },
  server: {
    port: 5173,
    host: "0.0.0.0", // aceita conexões da rede (192.168.x.x:5173)
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
});
