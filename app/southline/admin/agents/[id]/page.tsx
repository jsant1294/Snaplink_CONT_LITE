"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PinGate } from "@/components/admin/Dashboard";
import AgentForm, { buildPayload, valuesFromProfile } from "@/components/agent-profiles/AgentForm";
import type { AgentFormValues } from "@/components/agent-profiles/AgentForm";
import type { AgentProfile } from "@/lib/agent-profiles/types";

export default function EditAgentPage() {
  return (
    <PinGate title="Edit Agent">
      {(pin) => <EditAgentForm pin={pin} />}
    </PinGate>
  );
}

function EditAgentForm({ pin }: { pin: string }) {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [values, setValues] = useState<AgentFormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/agent-profiles/${id}`, { headers: { "x-snaplink-pin": pin } });
      const data = await r.json();
      if (r.ok && data.profile) {
        setProfile(data.profile);
        setValues(valuesFromProfile(data.profile));
      } else {
        setError(data.error || "Agent not found");
      }
      setLoading(false);
    })();
  }, [id, pin]);

  async function submit() {
    if (!values) return;
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const r = await fetch(`/api/agent-profiles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-snaplink-pin": pin },
        body: JSON.stringify(buildPayload(values)),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed to save");
      setProfile(data.profile);
      setValues(valuesFromProfile(data.profile));
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="px-6 py-16 text-center text-sm text-muted">Loading…</main>;
  if (!profile || !values) return <main className="px-6 py-16 text-center text-sm text-danger">{error || "Agent not found"}</main>;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-bone">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-gold">Edit Agent — {profile.name}</h1>
        <Link href="/southline/admin" className="text-xs text-muted underline">Back to Agent Management</Link>
      </div>
      <div className="mb-6 flex flex-wrap gap-2 text-xs">
        {profile.username && <a href={`/p/${profile.username}`} target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 px-3 py-1.5 text-bone">Preview SnapLink</a>}
        <a href={`/agents/${profile.slug}`} target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 px-3 py-1.5 text-bone">Preview Southline</a>
      </div>
      <AgentForm pin={pin} values={values} onChange={setValues} excludeId={id} mode="edit" />
      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      {saved && <p className="mt-4 text-sm text-success">Saved.</p>}
      <div className="mt-8">
        <button onClick={submit} disabled={saving} className="rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-obsidian disabled:opacity-50">
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </main>
  );
}
