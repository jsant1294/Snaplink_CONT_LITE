"use client";
import { useEffect, useState } from "react";
import { storedPin } from "@/components/admin/Dashboard";
import { demoTenant } from "@/lib/real-estate/fixtures";
const headers = () => ({ "Content-Type": "application/json", "x-snaplink-pin": storedPin(), "x-real-estate-tenant": demoTenant.id });
export default function OAuthAuthorize() {
  const [request, setRequest] = useState<{ clientId: string; redirectUri: string; scope: string; state: string } | null>(null);
  const [summary, setSummary] = useState<{ clientId: string; name: string; scopes: string[]; alreadyConsented: boolean } | null>(null);
  const [error, setError] = useState(""), [busy, setBusy] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRequest({ clientId: params.get("client_id") || "", redirectUri: params.get("redirect_uri") || "", scope: params.get("scope") || "", state: params.get("state") || "" });
  }, []);
  useEffect(() => {
    if (!request) return;
    const q = new URLSearchParams({ client_id: request.clientId, redirect_uri: request.redirectUri, scope: request.scope });
    fetch(`/api/real-estate/oauth/authorize?${q}`, { headers: headers() }).then(async r => { const body = await r.json(); r.ok ? setSummary(body) : setError(body.error || "Invalid authorization request"); });
  }, [request]);
  async function decide(decision: "approve" | "deny") {
    if (!summary || !request) return;
    setBusy(true);
    const r = await fetch("/api/real-estate/oauth/authorize", { method: "POST", headers: headers(), body: JSON.stringify({ clientId: request.clientId, redirectUri: request.redirectUri, scopes: summary.scopes, state: request.state, decision }) });
    const body = await r.json();
    setBusy(false);
    if (r.ok && body.redirectUrl) window.location.href = body.redirectUrl; else setError(body.error || "Unable to complete authorization");
  }
  if (error) return <div className="mx-auto max-w-md p-8 text-center"><p className="text-[#E39A9A]">{error}</p></div>;
  if (!summary) return <div className="mx-auto max-w-md p-8 text-center text-[#AAA9A2]">Loading authorization request…</div>;
  return (
    <div className="mx-auto max-w-md p-8">
      <p className="text-xs uppercase tracking-[.2em] text-[#B99A5B]">Connect an app</p>
      <h1 className="mt-2 font-display text-3xl">{summary.name}</h1>
      <p className="mt-2 text-sm text-[#AFA99E]">is requesting access to your brokerage's SnapLink data with the following permissions:</p>
      <ul className="mt-4 space-y-1 rounded-2xl border border-white/10 bg-[#1D201C] p-4 text-sm">
        {summary.scopes.map(s => <li key={s} className="text-[#D1B06A]">{s}</li>)}
      </ul>
      {summary.alreadyConsented && <p className="mt-3 text-xs text-[#AAA9A2]">You've previously approved this app for these permissions.</p>}
      <div className="mt-6 flex gap-3">
        <button disabled={busy} onClick={() => decide("approve")} className="rounded-xl bg-[#C4A25E] px-5 py-3 text-sm font-semibold text-[#171916] disabled:opacity-50">Approve</button>
        <button disabled={busy} onClick={() => decide("deny")} className="rounded-xl border border-white/15 px-5 py-3 text-sm disabled:opacity-50">Deny</button>
      </div>
    </div>
  );
}
