import { Database } from "lucide-react";
import { FormEvent, useState } from "react";
import { post, setToken } from "../lib/api";

type Mode = "login" | "register";

export function Auth({ mode }: { mode: Mode }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const path = mode === "login" ? "/auth/login" : "/auth/register";
      const response = await post<{ access_token: string }>(path, data);
      setToken(response.access_token);
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#101722] px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-md border border-line bg-[#141c29] p-6">
        <div className="mb-6 flex items-center gap-3">
          <Database className="h-7 w-7 text-accent" />
          <div>
            <h1 className="text-lg font-semibold text-white">LogForge</h1>
            <p className="text-sm text-slate-400">{mode === "login" ? "Sign in to your tenant" : "Create your tenant"}</p>
          </div>
        </div>
        <div className="space-y-3">
          {mode === "register" && <input name="organization_name" placeholder="Organization" required />}
          {mode === "register" && <input name="full_name" placeholder="Full name" />}
          <input name="email" placeholder="Email" type="email" required />
          <input name="password" placeholder="Password" type="password" minLength={8} required />
        </div>
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        <button disabled={loading} className="mt-5 w-full bg-accent px-4 py-2 font-semibold text-[#06201d]">
          {loading ? "Working..." : mode === "login" ? "Sign in" : "Register"}
        </button>
        <a className="mt-4 block text-center text-sm text-slate-300 hover:text-white" href={mode === "login" ? "/register" : "/login"}>
          {mode === "login" ? "Create an organization" : "Already have an account"}
        </a>
      </form>
    </main>
  );
}
