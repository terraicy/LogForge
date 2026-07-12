import { FormEvent, useEffect, useState } from "react";
import { api, post, patch } from "../lib/api";
import { PageHeader, Panel, PrimaryButton } from "../components/Layout";

type Item = Record<string, unknown> & { id: string; name: string; created_at?: string; is_enabled?: boolean };

function JsonBox({ value }: { value: unknown }) {
  return <pre className="overflow-auto rounded border border-line bg-[#101722] p-2 text-xs text-slate-300">{JSON.stringify(value, null, 2)}</pre>;
}

export function Sources() {
  const [items, setItems] = useState<Item[]>([]);
  const load = () => api<Item[]>("/log-sources").then(setItems);
  useEffect(() => {
    void load();
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await post("/log-sources", Object.fromEntries(new FormData(event.currentTarget).entries()));
    event.currentTarget.reset();
    load();
  }
  return (
    <>
      <PageHeader title="Log Sources" />
      <Panel>
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-[1fr_180px_120px]">
          <input name="name" placeholder="Source name" required />
          <input name="kind" placeholder="Kind" defaultValue="http" />
          <PrimaryButton>Create</PrimaryButton>
        </form>
      </Panel>
      <ItemTable items={items} columns={["name", "kind", "created_at"]} />
    </>
  );
}

export function Pipelines() {
  return <ConfigPage title="Pipelines" listPath="/pipelines" createPath="/pipelines" fields={["name", "description"]} jsonField="rules" patchable />;
}

export function Alerts() {
  return <ConfigPage title="Alert Rules" listPath="/alert-rules" createPath="/alert-rules" fields={["name", "threshold", "window_minutes"]} jsonField="query" patchable />;
}

export function Dashboards() {
  return <ConfigPage title="Dashboards" listPath="/dashboards" createPath="/dashboards" fields={["name"]} jsonField="layout" />;
}

export function SavedSearches() {
  return <ConfigPage title="Saved Searches" listPath="/saved-searches" createPath="/saved-searches" fields={["name"]} jsonField="query" />;
}

function ConfigPage({
  title,
  listPath,
  createPath,
  fields,
  jsonField,
  patchable
}: {
  title: string;
  listPath: string;
  createPath: string;
  fields: string[];
  jsonField: string;
  patchable?: boolean;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState("");
  const load = () => api<Item[]>(listPath).then(setItems);
  useEffect(() => {
    void load();
  }, [listPath]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const body: Record<string, unknown> = {};
      for (const key of fields) {
        const value = data[key];
        body[key] = key.includes("threshold") || key.includes("window") ? Number(value) : value;
      }
      body[jsonField] = JSON.parse(String(data[jsonField] || "{}"));
      await post(createPath, body);
      event.currentTarget.reset();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }
  async function toggle(item: Item) {
    await patch(`${listPath}/${item.id}`, { is_enabled: !item.is_enabled });
    load();
  }
  return (
    <>
      <PageHeader title={title} />
      <Panel>
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
          {fields.map((field) => (
            <input key={field} name={field} placeholder={field.replace("_", " ")} defaultValue={field === "threshold" ? 1 : field === "window_minutes" ? 5 : ""} required={field === "name"} />
          ))}
          <textarea name={jsonField} placeholder={`${jsonField} JSON`} defaultValue="{}" className="md:col-span-2" />
          {error && <p className="text-sm text-danger md:col-span-2">{error}</p>}
          <PrimaryButton className="md:col-span-2">Create</PrimaryButton>
        </form>
      </Panel>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <Panel key={item.id}>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="font-semibold text-white">{item.name}</div>
                <div className="text-xs text-slate-400">{item.id}</div>
              </div>
              {patchable && typeof item.is_enabled === "boolean" && (
                <button className="border border-line px-3 py-2 text-sm" onClick={() => toggle(item)}>
                  {item.is_enabled ? "Enabled" : "Disabled"}
                </button>
              )}
            </div>
            <div className="mt-3">
              <JsonBox value={item[jsonField]} />
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}

function ItemTable({ items, columns }: { items: Item[]; columns: string[] }) {
  return (
    <div className="mt-4 overflow-hidden rounded-md border border-line">
      <table className="w-full text-left text-sm">
        <thead className="bg-panel text-xs uppercase text-slate-400">
          <tr>{columns.map((column) => <th key={column} className="px-3 py-2">{column.replace("_", " ")}</th>)}</tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t border-line bg-[#141c29]">
              {columns.map((column) => <td key={column} className="px-3 py-2">{String(item[column] ?? "")}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
// Project version: LogForge V1.4
