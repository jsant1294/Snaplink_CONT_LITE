"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { storedPin } from "@/components/admin/Dashboard";
import { demoTenant } from "@/lib/real-estate/fixtures";
import { CRM_CONFIG } from "@/lib/real-estate/crm-config";
import type { CrmRecord, CrmResource } from "@/lib/real-estate/crm-repositories";
import { CrmInput } from "./CrmSurface";

const headers = () => ({ "Content-Type": "application/json", "x-snaplink-pin": storedPin(), "x-real-estate-tenant": demoTenant.id });

export default function CrmDedicatedForm({ resource, id }: { resource: "brokerages" | "agents"; id?: string }) {
  const router = useRouter();
  const config = CRM_CONFIG[resource];
  const [form, setForm] = useState<CrmRecord>(resource === "brokerages" ? { organizationId: "re-demo-organization", country: "US" } : { organizationId: "re-demo-organization", isActive: true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(Boolean(id));
  useEffect(() => {
    if (!id) return;
    fetch(`/api/real-estate/crm/${resource}/${id}`, { headers: headers() }).then((response) => response.json()).then((data) => { setForm(data.record ?? {}); setBusy(false); }).catch(() => setBusy(false));
  }, [id, resource]);
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true);
    const response = await fetch(id ? `/api/real-estate/crm/${resource}/${id}` : `/api/real-estate/crm/${resource}`, { method: id ? "PATCH" : "POST", headers: headers(), body: JSON.stringify(form) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) setErrors(data.errors ?? { form: data.error }); else router.push(`/real-estate/${resource}`);
  }
  return <form onSubmit={save} className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8"><p className="text-xs uppercase tracking-[0.22em] text-[#B99A5B]">Management</p><h1 className="mt-2 font-display text-3xl sm:text-4xl">{id ? "Edit" : "New"} {config.singular}</h1>{busy && id && Object.keys(form).length <= 2 ? <p className="mt-8 text-[#8F928A]">Loading…</p> : <><section className="mt-7 rounded-2xl border border-white/[0.08] bg-[#20231F] p-5 sm:p-6"><div className="grid gap-4 sm:grid-cols-2">{config.fields.map((field) => <CrmInput key={field.key} field={field} value={form[field.key]} error={errors[field.key]} onChange={(value) => setForm((current) => ({ ...current, [field.key]: value }))} />)}</div>{errors.form && <p className="mt-4 text-danger">{errors.form}</p>}</section><div className="mt-5 flex justify-end gap-3"><button type="button" onClick={() => router.back()} className="rounded-xl border border-white/10 px-5 py-3 text-sm">Cancel</button><button disabled={busy} className="rounded-xl bg-[#B99A5B] px-6 py-3 text-sm font-semibold text-[#1A1C18]">{busy ? "Saving…" : "Save"}</button></div></>}</form>;
}
