import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  root: "./client",
  build: {
    outDir: "../dist/public",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "./client/src"),
      "@shared": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "./shared"),
      "@assets": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "./attached_assets"),
    },
  },
});
