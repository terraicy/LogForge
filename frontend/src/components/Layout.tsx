import { Bell, Database, FileSearch, Gauge, KeyRound, LayoutDashboard, LogOut, Network, Settings, SlidersHorizontal } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { DEMO_MODE, clearToken } from "../lib/api";

const nav = [
  ["/dashboard", "Dashboard", Gauge],
  ["/explorer", "Explorer", FileSearch],
  ["/sources", "Sources", Network],
  ["/pipelines", "Pipelines", SlidersHorizontal],
  ["/alerts", "Alerts", Bell],
  ["/dashboards", "Dashboards", LayoutDashboard],
  ["/settings", "Settings", Settings]
] as const;

export function Layout({ children }: { children: ReactNode }) {
  const path = window.location.pathname;
  return (
    <div className="min-h-screen bg-bg text-[#e5edf6]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-surface md:block">
        <div className="flex h-16 items-center gap-3 border-b border-line px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-panel text-signal">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-wide text-white">LogForge</div>
            <div className="text-xs text-slate-400">KRYNEX Labs</div>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {nav.map(([href, label, Icon]) => (
            <a
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${path === href ? "bg-panel text-white" : "text-slate-300 hover:bg-panel/70"}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </a>
          ))}
        </nav>
        <div className="absolute bottom-4 left-3 right-3">
          {DEMO_MODE && <div className="mb-2 rounded-md border border-signal/40 bg-panel px-3 py-2 text-center text-xs font-semibold text-signal">Demo Mode</div>}
          {!DEMO_MODE && (
            <button
              className="flex w-full items-center justify-center gap-2 rounded-md border border-line bg-panel px-3 py-2 text-sm text-slate-200 hover:border-signal hover:text-white"
              onClick={() => {
                clearToken();
                window.location.href = "/login";
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          )}
        </div>
      </aside>
      <main className="md:pl-64">
        <header className="sticky top-0 z-10 border-b border-line bg-surface px-4 py-4 md:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white">LogForge</div>
              <div className="text-xs text-slate-400">SIEM log operations</div>
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-xl font-semibold text-white">{title}</h1>
      {actions}
    </div>
  );
}

export function PrimaryButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`rounded-md bg-signal px-4 py-2 text-sm font-semibold text-[#06201d] hover:bg-teal-300 ${props.className ?? ""}`} />;
}

export function Panel({ children }: { children: ReactNode }) {
  return <section className="rounded-md border border-line bg-surface p-4">{children}</section>;
}
// Project version: LogForge V1.4


