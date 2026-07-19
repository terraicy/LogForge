import { FormEvent, useEffect, useState } from "react";
import { api, post } from "../lib/api";
import { PageHeader, Panel, PrimaryButton } from "../components/Layout";

type KeyRow = { id: string; name: string; prefix: string; created_at: string; last_used_at?: string; is_active: boolean };
type Me = { email: string; organization_id: string; full_name?: string; is_admin: boolean };
type Audit = { id: string; action: string; target_type?: string; target_id?: string; created_at: string };

export function Settings() {
  const [me, setMe] = useState<Me | null>(null);
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [newKey, setNewKey] = useState("");
  const load = () => {
    api<Me>("/me").then(setMe);
    api<KeyRow[]>("/api-keys").then(setKeys);
    api<Audit[]>("/audit-logs").then(setAudits);
  };
  useEffect(load, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await post<KeyRow & { api_key: string }>("/api-keys", data);
    setNewKey(response.api_key);
    event.currentTarget.reset();
    load();
  }
  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="mb-3 text-sm font-semibold text-white">Tenant</h2>
          <div className="space-y-2 text-sm text-slate-300">
            <div>Email: {me?.email}</div>
            <div>Organization: {me?.organization_id}</div>
            <div>Role: {me?.is_admin ? "Admin" : "User"}</div>
          </div>
        </Panel>
        <Panel>
          <h2 className="mb-3 text-sm font-semibold text-white">Create API Key</h2>
          <form onSubmit={submit} className="flex gap-3">
            <input name="name" placeholder="Key name" required />
            <PrimaryButton>Create</PrimaryButton>
          </form>
          {newKey && <pre className="mt-3 overflow-auto rounded border border-line bg-[#101722] p-3 text-xs text-accent">{newKey}</pre>}
        </Panel>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel>
          <h2 className="mb-3 text-sm font-semibold text-white">API Keys</h2>
          <div className="space-y-2">
            {keys.map((key) => (
              <div key={key.id} className="rounded border border-line bg-[#101722] p-3 text-sm">
                <div className="font-semibold text-white">{key.name}</div>
                <div className="text-slate-400">{key.prefix}...</div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel>
          <h2 className="mb-3 text-sm font-semibold text-white">Audit Logs</h2>
          <div className="max-h-96 space-y-2 overflow-auto">
            {audits.map((audit) => (
              <div key={audit.id} className="rounded border border-line bg-[#101722] p-3 text-sm">
                <div className="text-white">{audit.action}</div>
                <div className="text-xs text-slate-400">{new Date(audit.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
// Project version: LogForge V1.4







