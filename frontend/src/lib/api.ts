export type Json = Record<string, unknown>;

const API_BASE = import.meta.env.VITE_API_BASE ?? "";
const TOKEN_KEY = "logforge_token";
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

const now = new Date().toISOString();
const demoStore: Record<string, unknown> = {
  "/log-sources": [
    { id: "src-demo-1", name: "edge-nginx", kind: "http", created_at: now },
    { id: "src-demo-2", name: "windows-endpoints", kind: "agent", created_at: now }
  ],
  "/alert-rules": [
    { id: "rule-demo-1", name: "Auth failure spike", threshold: 12, window_minutes: 5, is_enabled: true, query: { level: "warn", service: "auth" } }
  ],
  "/saved-searches": [
    { id: "search-demo-1", name: "Payment errors", query: { service: "billing", level: "error" } }
  ],
  "/dashboards": [
    { id: "dash-demo-1", name: "SOC operations", layout: { widgets: ["events", "alerts", "sources"] } }
  ],
  "/pipelines": [
    { id: "pipe-demo-1", name: "Normalize auth logs", description: "Demo enrichment pipeline", rules: { parse: "json", enrich: ["geo", "asset"] }, is_enabled: true }
  ],
  "/api-keys": [
    { id: "key-demo-1", name: "demo-ingest", prefix: "lf_demo", created_at: now, is_active: true }
  ],
  "/audit-logs": [
    { id: "audit-demo-1", action: "demo.dashboard.opened", target_type: "dashboard", target_id: "public-demo", created_at: now },
    { id: "audit-demo-2", action: "demo.alert.rule.enabled", target_type: "alert_rule", target_id: "rule-demo-1", created_at: now }
  ],
  "/me": { email: "demo@krynex.local", organization_id: "org-demo", full_name: "KRYNEX Demo", is_admin: true }
};

function demoResponse<T>(path: string, options: RequestInit): T {
  if (path === "/logs/search") {
    return {
      events: [
        { event_id: "evt-1", timestamp: now, level: "warn", service: "auth", host: "edge-01", message: "Multiple failed login attempts", fields_json: "{\"source\":\"demo\"}" },
        { event_id: "evt-2", timestamp: now, level: "error", service: "billing", host: "api-02", message: "Payment provider timeout", fields_json: "{\"source\":\"demo\"}" }
      ]
    } as T;
  }

  if (options.method === "POST") {
    const body = options.body ? JSON.parse(String(options.body)) : {};
    const created = { id: `demo-${Date.now()}`, created_at: now, ...body };
    if (path === "/api-keys") return { ...created, prefix: "lf_new", is_active: true, api_key: "demo_lf_key_public_preview" } as T;
    const list = Array.isArray(demoStore[path]) ? demoStore[path] as unknown[] : [];
    demoStore[path] = [created, ...list];
    return created as T;
  }

  if (options.method === "PATCH") {
    const basePath = path.split("/").slice(0, -1).join("/");
    return (demoStore[basePath] ?? {}) as T;
  }

  return (demoStore[path] ?? []) as T;
}

export function getToken() {
  if (DEMO_MODE) return localStorage.getItem(TOKEN_KEY) || "demo-token";
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (DEMO_MODE) return demoResponse<T>(path, options);

  const token = getToken();
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(body.detail ?? "Request failed");
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export function post<T>(path: string, body: unknown) {
  return api<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export function patch<T>(path: string, body: unknown) {
  return api<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}
// Project version: LogForge V1.4
