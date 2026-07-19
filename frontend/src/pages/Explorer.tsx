import { Search } from "lucide-react";
import { FormEvent, useState } from "react";
import { post } from "../lib/api";
import { PageHeader, Panel, PrimaryButton } from "../components/Layout";

type EventRow = { event_id: string; timestamp: string; level: string; service: string; host: string; message: string; fields_json: string };

export function Explorer() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const body = Object.fromEntries(Object.entries(data).filter(([, value]) => value));
    try {
      const response = await post<{ events: EventRow[] }>("/logs/search", { ...body, limit: Number(body.limit ?? 100), fields: {} });
      setEvents(response.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    }
  }
  return (
    <>
      <PageHeader title="Log Explorer" />
      <Panel>
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-6">
          <input name="text" placeholder="Text query" className="md:col-span-2" />
          <input name="level" placeholder="Level" />
          <input name="service" placeholder="Service" />
          <input name="host" placeholder="Host" />
          <input name="limit" placeholder="Limit" type="number" defaultValue={100} />
          <PrimaryButton className="flex items-center justify-center gap-2 md:col-span-6">
            <Search className="h-4 w-4" />
            Search
          </PrimaryButton>
        </form>
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      </Panel>
      <div className="mt-4 overflow-hidden rounded-md border border-line">
        <table className="w-full min-w-[860px] border-collapse text-left text-sm">
          <thead className="bg-panel text-xs uppercase text-slate-400">
            <tr>
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2">Level</th>
              <th className="px-3 py-2">Service</th>
              <th className="px-3 py-2">Host</th>
              <th className="px-3 py-2">Message</th>
            </tr>
          </thead>
          <tbody>
            {events.map((row) => (
              <tr key={row.event_id} className="border-t border-line bg-[#141c29]">
                <td className="px-3 py-2 text-slate-300">{new Date(row.timestamp).toLocaleString()}</td>
                <td className="px-3 py-2 text-accent">{row.level}</td>
                <td className="px-3 py-2">{row.service}</td>
                <td className="px-3 py-2">{row.host}</td>
                <td className="px-3 py-2 font-mono text-xs text-slate-200">{row.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
// Project version: LogForge V1.4







