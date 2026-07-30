"use client";
import { useEffect, useState } from "react";
import { storedPin } from "@/components/admin/Dashboard";
import { demoTenant } from "@/lib/real-estate/fixtures";
const headers = () => ({ "Content-Type": "application/json", "x-snaplink-pin": storedPin(), "x-real-estate-tenant": demoTenant.id });
type ConnectedApp = { clientId: string; name: string; scopes: string[]; grantedAt: string };
export default function ConnectedApps() {
  const [apps, setApps] = useState<ConnectedApp[]>([]);
  const load = () => fetch("/api/real-estate/oauth/connected-apps", { headers: headers() }).then(r => r.json()).then(d => setApps(d.apps || []));
  useEffect(() => { load(); }, []);
  async function revoke(clientId: string) {
    if (!confirm("Revoke this app's access to your brokerage's data?")) return;
    await fetch("/api/real-estate/oauth/connected-apps", { method: "DELETE", headers: headers(), body: JSON.stringify({ clientId }) });
    load();
  }
  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="font-display text-3xl">Connected apps</h1>
      <p className="mt-2 text-sm text-[#AFA99E]">Third-party applications your brokerage has authorized to access SnapLink data via OAuth.</p>
      <div className="mt-6 space-y-3">
        {apps.length === 0 && <p className="text-sm text-[#AAA9A2]">No connected apps yet.</p>}
        {apps.map(app => (
          <article key={app.clientId} className="rounded-2xl border border-white/10 bg-[#1D201C] p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl text-[#F3EDE2]">{app.name}</h2>
                <p className="mt-1 text-xs text-[#AAA9A2]">Approved {new Date(app.grantedAt).toLocaleString()}</p>
              </div>
              <button onClick={() => revoke(app.clientId)} className="rounded-xl border border-white/15 px-4 py-2 text-sm text-[#E39A9A]">Revoke</button>
            </div>
            <p className="mt-3 text-sm text-[#D1B06A]">{app.scopes.join(", ")}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
