import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { SECURITY_HEADERS } from "./security-headers";

export default defineConfig({
  base: "/",
  plugins: [react()],
  // Not applied to the dev server, which relies on inline scripts for HMR.
  preview: {
    headers: { ...SECURITY_HEADERS },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});
