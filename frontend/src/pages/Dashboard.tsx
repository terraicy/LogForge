import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { PageHeader, Panel } from "../components/Layout";

export function Dashboard() {
  const [stats, setStats] = useState({ sources: 0, alerts: 0, saved: 0, audits: 0 });
  useEffect(() => {
    Promise.all([
      api<unknown[]>("/log-sources"),
      api<unknown[]>("/alert-rules"),
      api<unknown[]>("/saved-searches"),
      api<unknown[]>("/audit-logs")
    ]).then(([sources, alerts, saved, audits]) => setStats({ sources: sources.length, alerts: alerts.length, saved: saved.length, audits: audits.length }));
  }, []);
  return (
    <>
      <PageHeader title="Operations Dashboard" />
      <div className="grid gap-4 md:grid-cols-4">
        {Object.entries(stats).map(([label, value]) => (
          <Panel key={label}>
            <div className="text-xs uppercase text-slate-400">{label}</div>
            <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
          </Panel>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="mb-3 text-sm font-semibold text-white">Ingestion posture</h2>
          <div className="h-48 rounded border border-line bg-[#101722] p-4 text-sm text-slate-300">Configure sources and API keys, then send events to `/logs/ingest` with `X-API-Key`.</div>
        </Panel>
        <Panel>
          <h2 className="mb-3 text-sm font-semibold text-white">Search readiness</h2>
          <div className="h-48 rounded border border-line bg-[#101722] p-4 text-sm text-slate-300">Use Explorer to filter by time, level, service, host, text and structured fields.</div>
        </Panel>
      </div>
    </>
  );
}
// Project version: LogForge V1.4

