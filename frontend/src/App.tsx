import { DEMO_MODE, getToken } from "./lib/api";
import type { ReactNode } from "react";
import { Layout } from "./components/Layout";
import { Auth } from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";
import { Explorer } from "./pages/Explorer";
import { Alerts, Dashboards, Pipelines, SavedSearches, Sources } from "./pages/CrudPages";
import { Settings } from "./pages/Settings";

const routes: Record<string, ReactNode> = {
  "/dashboard": <Dashboard />,
  "/explorer": <Explorer />,
  "/sources": <Sources />,
  "/pipelines": <Pipelines />,
  "/alerts": <Alerts />,
  "/dashboards": <Dashboards />,
  "/saved-searches": <SavedSearches />,
  "/settings": <Settings />
};

export function App() {
  const path = window.location.pathname;
  if (path === "/login") return <Auth mode="login" />;
  if (path === "/register") return <Auth mode="register" />;
  if (!DEMO_MODE && !getToken()) {
    window.location.href = "/login";
    return null;
  }
  return <Layout>{routes[path] ?? <Dashboard />}</Layout>;
}
// Project version: LogForge V1.4

