"use client";

import { useState } from "react";
import Link from "next/link";
import { PinGate } from "@/components/admin/Dashboard";
import AgentForm, { buildPayload, valuesFromProfile } from "@/components/agent-profiles/AgentForm";
import type { AgentFormValues } from "@/components/agent-profiles/AgentForm";

interface CreateResult {
  profile: { id: string; name: string; email: string; username?: string; slug: string; tier?: string; snaplinkStatus: string; southlineStatus: string; status: string };
  urls: { snaplink: string; southline: string };
}

export default function NewAgentPage() {
  return (
    <PinGate title="New Agent">
      {(pin) => <NewAgentForm pin={pin} />}
    </PinGate>
  );
}

function NewAgentForm({ pin }: { pin: string }) {
  const [values, setValues] = useState<AgentFormValues>(valuesFromProfile());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<CreateResult | null>(null);

  async function submit() {
    setError(null);
    if (!values.firstName.trim() || !values.lastName.trim()) return setError("First and last name are required.");
    if (!values.email.trim()) return setError("Email is required.");
    if (!values.phone.trim()) return setError("Phone is required.");
    if (!/^\d{6}$/.test(values.pin)) return setError("A 6-digit PIN is required.");
    setSaving(true);
    try {
      const r = await fetch("/api/agent-profiles/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-snaplink-pin": pin },
        body: JSON.stringify(buildPayload(values)),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed to create agent");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create agent");
    } finally {
      setSaving(false);
    }
  }

  function copy(text: string) {
    navigator.clipboard?.writeText(`${window.location.origin}${text}`);
  }

  if (result) {
    const { profile, urls } = result;
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-bone">
        <h1 className="font-display text-2xl text-gold">Agent created</h1>
        <div className="mt-6 space-y-2 rounded-xl border border-white/10 bg-obsidian p-5 text-sm">
          <p><span className="text-muted">Name:</span> {profile.name}</p>
          <p><span className="text-muted">Email:</span> {profile.email}</p>
          <p><span className="text-muted">Status:</span> {profile.status} · SnapLink {profile.snaplinkStatus} · Southline {profile.southlineStatus}</p>
          <p><span className="text-muted">Plan:</span> {profile.tier ?? "no tier"}</p>
          <p><span className="text-muted">SnapLink URL:</span> {urls.snaplink}</p>
          <p><span className="text-muted">Southline URL:</span> {urls.southline}</p>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={() => copy(urls.snaplink)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-bone">Copy SnapLink URL</button>
          <button onClick={() => copy(urls.southline)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-bone">Copy Southline URL</button>
          <a href={urls.snaplink} target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 px-3 py-2 text-xs text-bone">Preview SnapLink</a>
          <a href={urls.southline} target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 px-3 py-2 text-xs text-bone">Preview Southline</a>
          <Link href={`/southline/admin/agents/${profile.id}`} className="rounded-lg bg-gold px-3 py-2 text-xs font-semibold text-obsidian">Edit Agent</Link>
          <button onClick={() => { setResult(null); setValues(valuesFromProfile()); }} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-bone">Create Another</button>
          <Link href="/southline/admin" className="rounded-lg border border-white/10 px-3 py-2 text-xs text-bone">Back to Agent Management</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-bone">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-gold">New Agent</h1>
        <Link href="/southline/admin" className="text-xs text-muted underline">Back to Agent Management</Link>
      </div>
      <AgentForm pin={pin} values={values} onChange={setValues} mode="create" />
      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      <div className="mt-8">
        <button onClick={submit} disabled={saving} className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-obsidian disabled:opacity-50">
          {saving ? "Creating…" : "Create Agent"}
        </button>
      </div>
    </main>
  );
}
