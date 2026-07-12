import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const proxyTarget = process.env.VITE_PROXY_TARGET ?? "http://127.0.0.1:8000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/auth": proxyTarget,
      "/me": proxyTarget,
      "/api-keys": proxyTarget,
      "/log-sources": proxyTarget,
      "/logs": proxyTarget,
      "/pipelines": proxyTarget,
      "/saved-searches": proxyTarget,
      "/alert-rules": proxyTarget,
      "/dashboards": proxyTarget,
      "/audit-logs": proxyTarget
    }
  }
});
// Project version: LogForge V1.3
